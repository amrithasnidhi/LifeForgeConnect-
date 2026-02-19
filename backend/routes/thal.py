"""
routes/thal.py
--------------
Endpoints consumed by ThalCare.tsx:
  GET  /thal/patients         → patient cards list with countdown labels
  GET  /thal/calendar         → 7-day transfusion calendar widget
  POST /thal/patients         → register a new thal patient
  POST /thal/transfusion-done → update last transfusion date, recalc next
"""

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.db import supabase
from utils.matching import days_until, countdown_label

router = APIRouter()


# ── GET /thal/patients ────────────────────────────────────────────────────────

@router.get("/patients")
def get_thal_patients(hospital_id: Optional[str] = None):
    """
    Powers the 'Active Patients' list on ThalCare.tsx.
    Returns patients with:
      - countdown  ("3 days", "OVERDUE", "Today")
      - is_urgent  (days <= 2)
      - freq label ("Every 21 days")
      - donor      ("Priya M." or "Unmatched")
    """
    query = supabase.table("thal_patients") \
        .select("*, hospitals(name, city)")

    if hospital_id:
        query = query.eq("hospital_id", hospital_id)

    res = query.execute()
    patients = res.data or []

    # Enrich each patient
    result = []
    for p in patients:
        hospital = p.get("hospitals") or {}
        next_date = p.get("next_transfusion_date")
        due_days  = days_until(next_date)
        freq      = p.get("transfusion_frequency_days") or 21

        # Lookup dedicated donor from matches table
        match = supabase.table("matches") \
            .select("donor_id, donors(name)") \
            .eq("request_id", p["id"]) \
            .eq("module", "thal") \
            .eq("status", "fulfilled") \
            .limit(1) \
            .execute()

        donor_name = "Unmatched"
        if match.data:
            donor_info = match.data[0].get("donors")
            if donor_info:
                donor_name = donor_info.get("name", "Unmatched")

        result.append({
            "id":           p["id"],
            "name":         p["name"],
            "age":          _calc_age(p.get("dob")),
            "group":        p.get("blood_group") or "—",
            "hospital":     f"{hospital.get('name','')}, {hospital.get('city','')}",
            "freq":         f"Every {freq} days",
            "nextDate":     next_date or "—",
            "donor":        donor_name,
            "countdown":    countdown_label(due_days),
            "days_until":   due_days,
            "is_urgent":    due_days is not None and due_days <= 2,
        })

    result.sort(key=lambda x: (x["days_until"] or 999))
    return result


# ── GET /thal/calendar ────────────────────────────────────────────────────────

@router.get("/calendar")
def get_thal_calendar(days_ahead: int = 7):
    """
    Powers the 7-day Transfusion Calendar widget on ThalCare.tsx.
    Returns array of 7 days with:
      { day, date, has, label }
    where 'has' = True if any patient is due that day.
    """
    today   = date.today()
    cutoff  = today + timedelta(days=days_ahead - 1)

    res = supabase.table("thal_patients") \
        .select("name, blood_group, next_transfusion_date") \
        .gte("next_transfusion_date", today.isoformat()) \
        .lte("next_transfusion_date", cutoff.isoformat()) \
        .execute()

    # Group patients by date
    by_date: dict[str, list[str]] = {}
    for p in (res.data or []):
        d = p.get("next_transfusion_date", "")[:10]
        label = f"{p['name'].split()[0]} ({p['blood_group']})"
        by_date.setdefault(d, []).append(label)

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    calendar  = []
    for i in range(days_ahead):
        day   = today + timedelta(days=i)
        dstr  = day.isoformat()
        patients = by_date.get(dstr, [])
        calendar.append({
            "day":   day_names[day.weekday()],
            "date":  str(day.day),
            "has":   len(patients) > 0,
            "label": patients[0] if patients else None,
            "patients": patients,
        })

    return calendar


# ── POST /thal/patients ───────────────────────────────────────────────────────

class ThalPatientBody(BaseModel):
    name: str
    blood_group: str
    hospital_id: str
    transfusion_frequency_days: int = 21
    last_transfusion_date: Optional[str] = None   # "YYYY-MM-DD"
    dob: Optional[str] = None


@router.post("/patients")
def register_thal_patient(body: ThalPatientBody):
    """Called by 'Register Patient' button on ThalCare.tsx."""
    from datetime import datetime
    freq = body.transfusion_frequency_days

    if body.last_transfusion_date:
        last = date.fromisoformat(body.last_transfusion_date)
    else:
        last = date.today()

    next_date = last + timedelta(days=freq)

    res = supabase.table("thal_patients").insert({
        "name":                        body.name,
        "blood_group":                 body.blood_group,
        "hospital_id":                 body.hospital_id,
        "transfusion_frequency_days":  freq,
        "last_transfusion_date":       last.isoformat(),
        "next_transfusion_date":       next_date.isoformat(),
        "dob":                         body.dob,
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to register patient")

    return {
        "success":    True,
        "patient_id": res.data[0]["id"],
        "next_date":  next_date.isoformat(),
        "message":    f"Patient registered. Next transfusion: {next_date.strftime('%b %d, %Y')}",
    }


# ── POST /thal/transfusion-done ───────────────────────────────────────────────

class TransfusionDoneBody(BaseModel):
    patient_id: str
    transfusion_date: str   # "YYYY-MM-DD"


@router.post("/transfusion-done")
def mark_transfusion_done(body: TransfusionDoneBody):
    """Updates last transfusion date and recalculates next date."""
    # Get patient's frequency
    patient = supabase.table("thal_patients") \
        .select("transfusion_frequency_days") \
        .eq("id", body.patient_id) \
        .single() \
        .execute()

    if not patient.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    freq = patient.data["transfusion_frequency_days"] or 21
    last = date.fromisoformat(body.transfusion_date)
    next_date = last + timedelta(days=freq)

    supabase.table("thal_patients").update({
        "last_transfusion_date": last.isoformat(),
        "next_transfusion_date": next_date.isoformat(),
    }).eq("id", body.patient_id).execute()

    return {
        "success":   True,
        "next_date": next_date.isoformat(),
        "message":   f"Transfusion recorded. Next session: {next_date.strftime('%b %d, %Y')}",
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _calc_age(dob: Optional[str]) -> Optional[int]:
    if not dob:
        return None
    try:
        d = date.fromisoformat(dob[:10])
        return (date.today() - d).days // 365
    except Exception:
        return None