"""
routes/thal.py
--------------
Endpoints consumed by ThalCare.tsx:
  GET  /thal/patients             → patient cards list with countdown labels
  GET  /thal/calendar             → 7-day transfusion calendar widget
  GET  /thal/patients/{id}/matches → find eligible donors for upcoming transfusion
  POST /thal/patients             → register a new thal patient
  POST /thal/transfusion-done     → update last transfusion date, recalc next
  POST /thal/assign-donor         → assign a donor to a patient (blocks re-use)

Rules enforced:
  1. A donor CANNOT donate to the same thal patient twice.
  2. 7 days (1 week) before the next transfusion date the system auto-surfaces
     compatible donors who have NEVER donated to that patient before.
"""

from datetime import date, timedelta
from typing import Optional, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.db import supabase
from utils.matching import days_until, countdown_label, blood_compatible

router = APIRouter()

# When to start surfacing donor matches before the transfusion date
MATCH_WINDOW_DAYS = 7   # 1 week before


# ── GET /thal/patients ────────────────────────────────────────────────────────

@router.get("/patients")
def get_thal_patients(hospital_id: Optional[str] = None):
    """
    Powers the 'Active Patients' list on ThalCare.tsx.
    Returns patients with:
      - countdown       ("3 days", "OVERDUE", "Today")
      - is_urgent       (days <= 2)
      - needs_match_now (days <= 7  → time to find a donor)
      - freq label      ("Every 21 days")
      - donor           ("Priya M." or "Unmatched")
      - past_donor_ids  (IDs already used — frontend can dim them)
    """
    query = supabase.table("thal_patients") \
        .select("*, hospitals(name, city)")

    if hospital_id:
        query = query.eq("hospital_id", hospital_id)

    res = query.execute()
    patients = res.data or []

    result = []
    for p in patients:
        hospital  = p.get("hospitals") or {}
        next_date = p.get("next_transfusion_date")
        due_days  = days_until(next_date)
        freq      = p.get("transfusion_frequency_days") or 21

        # ── Current assigned / fulfilled donor ───────────────────────────────
        match = supabase.table("matches") \
            .select("donor_id, donors(name)") \
            .eq("request_id", p["id"]) \
            .eq("module", "thal") \
            .eq("status", "fulfilled") \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()

        donor_name = "Unmatched"
        if match.data:
            donor_info = match.data[0].get("donors")
            if donor_info:
                donor_name = donor_info.get("name", "Unmatched")

        # ── Collect ALL past donors for this patient (no-repeat rule) ────────
        past = supabase.table("matches") \
            .select("donor_id") \
            .eq("request_id", p["id"]) \
            .eq("module", "thal") \
            .execute()

        past_donor_ids = list({row["donor_id"] for row in (past.data or []) if row.get("donor_id")})

        # ── needs_match_now: 7 days or less until next transfusion ───────────
        needs_match_now = (
            due_days is not None and 0 <= due_days <= MATCH_WINDOW_DAYS
        )

        result.append({
            "id":              p["id"],
            "name":            p["name"],
            "age":             _calc_age(p.get("dob")),
            "group":           p.get("blood_group") or "—",
            "hospital":        f"{hospital.get('name', '')}, {hospital.get('city', '')}",
            "freq":            f"Every {freq} days",
            "nextDate":        next_date or "—",
            "donor":           donor_name,
            "countdown":       countdown_label(due_days),
            "days_until":      due_days,
            "is_urgent":       due_days is not None and due_days <= 2,
            "needs_match_now": needs_match_now,
            "past_donor_ids":  past_donor_ids,
        })

    result.sort(key=lambda x: (x["days_until"] if x["days_until"] is not None else 999))
    return result


# ── GET /thal/patients/{patient_id}/matches ───────────────────────────────────

@router.get("/patients/{patient_id}/matches")
def get_thal_matches(patient_id: str):
    """
    Returns compatible, available donors who have NEVER donated to this patient
    before (no-repeat rule). Only callable when ≤ 7 days remain until
    next transfusion (enforced on frontend; backend also returns a warning).

    Sorted by trust_score desc, then city proximity (if lat/lng stored).
    """
    # 1. Load the patient
    patient_res = supabase.table("thal_patients") \
        .select("blood_group, next_transfusion_date, name") \
        .eq("id", patient_id) \
        .single() \
        .execute()

    if not patient_res.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient        = patient_res.data
    blood_group    = patient["blood_group"]
    next_date      = patient.get("next_transfusion_date")
    due_days       = days_until(next_date)

    # 2. Warn if called too early (> 7 days away) — doesn't block, just informs
    early_warning = None
    if due_days is not None and due_days > MATCH_WINDOW_DAYS:
        early_warning = (
            f"Transfusion is {due_days} days away. "
            f"Matches are normally surfaced {MATCH_WINDOW_DAYS} days before."
        )

    # 3. Collect IDs of donors who have already donated to this patient
    past_res = supabase.table("matches") \
        .select("donor_id") \
        .eq("request_id", patient_id) \
        .eq("module", "thal") \
        .execute()

    used_donor_ids: set[str] = {
        row["donor_id"] for row in (past_res.data or []) if row.get("donor_id")
    }

    # 4. Pull all available, verified donors
    donors_res = supabase.table("donors") \
        .select("id, name, blood_group, city, trust_score, is_verified, lat, lng") \
        .eq("is_available", True) \
        .eq("is_verified", True) \
        .execute()

    donors = donors_res.data or []

    # 5. Filter: blood compatible AND not previously used for THIS patient
    eligible = []
    for d in donors:
        donor_id = d["id"]
        if donor_id in used_donor_ids:
            continue                          # ← no-repeat rule
        if not blood_compatible(d.get("blood_group", ""), blood_group):
            continue
        eligible.append({
            "donor_id":    donor_id,
            "name":        d["name"],
            "blood_group": d["blood_group"],
            "city":        d["city"],
            "trust_score": d.get("trust_score") or 0,
            "is_verified": d.get("is_verified", False),
            "previously_donated_to_patient": False,   # always False here
        })

    # Sort best trust first
    eligible.sort(key=lambda x: x["trust_score"], reverse=True)

    return {
        "patient_id":       patient_id,
        "patient_name":     patient["name"],
        "blood_group":      blood_group,
        "next_transfusion": next_date,
        "days_until":       due_days,
        "needs_match_now":  due_days is not None and 0 <= due_days <= MATCH_WINDOW_DAYS,
        "early_warning":    early_warning,
        "excluded_donors":  len(used_donor_ids),      # how many were skipped
        "matches":          eligible,
    }


# ── GET /thal/calendar ────────────────────────────────────────────────────────

@router.get("/calendar")
def get_thal_calendar(days_ahead: int = 7):
    """
    Powers the 7-day Transfusion Calendar widget on ThalCare.tsx.
    Days where a patient is due in ≤ 7 days are auto-flagged so staff
    know to start searching for donors.
    """
    today  = date.today()
    cutoff = today + timedelta(days=days_ahead - 1)

    res = supabase.table("thal_patients") \
        .select("name, blood_group, next_transfusion_date") \
        .gte("next_transfusion_date", today.isoformat()) \
        .lte("next_transfusion_date", cutoff.isoformat()) \
        .execute()

    by_date: dict[str, list[str]] = {}
    for p in (res.data or []):
        d     = p.get("next_transfusion_date", "")[:10]
        label = f"{p['name'].split()[0]} ({p['blood_group']})"
        by_date.setdefault(d, []).append(label)

    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    calendar  = []
    for i in range(days_ahead):
        day      = today + timedelta(days=i)
        dstr     = day.isoformat()
        patients = by_date.get(dstr, [])
        calendar.append({
            "day":              day_names[day.weekday()],
            "date":             str(day.day),
            "has":              len(patients) > 0,
            "label":            patients[0] if patients else None,
            "patients":         patients,
            "needs_match_now":  len(patients) > 0,   # within the 7-day window
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
    freq = body.transfusion_frequency_days

    if body.last_transfusion_date:
        last = date.fromisoformat(body.last_transfusion_date)
    else:
        last = date.today()

    next_date = last + timedelta(days=freq)

    try:
        res = supabase.table("thal_patients").insert({
            "name":                       body.name,
            "blood_group":                body.blood_group,
            "hospital_id":                body.hospital_id,
            "transfusion_frequency_days": freq,
            "last_transfusion_date":      last.isoformat(),
            "next_transfusion_date":      next_date.isoformat(),
            "dob":                        body.dob,
        }).execute()
    except Exception as e:
        # Catch UUID errors or foreign key violations
        err_msg = str(e)
        if "22P02" in err_msg:
            raise HTTPException(status_code=400, detail="Invalid Hospital ID format (must be a valid UUID)")
        raise HTTPException(status_code=500, detail=f"Database error: {err_msg}")

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to register patient")

    days_away = (next_date - date.today()).days
    match_notice = (
        f"Donor matching will begin {MATCH_WINDOW_DAYS} days before "
        f"the transfusion date ({next_date.strftime('%b %d, %Y')})."
    )

    return {
        "success":      True,
        "patient_id":   res.data[0]["id"],
        "next_date":    next_date.isoformat(),
        "message":      f"Patient registered. Next transfusion: {next_date.strftime('%b %d, %Y')}",
        "match_notice": match_notice,
        "days_away":    days_away,
    }


# ── POST /thal/transfusion-done ───────────────────────────────────────────────

class TransfusionDoneBody(BaseModel):
    patient_id: str
    transfusion_date: str   # "YYYY-MM-DD"


@router.post("/transfusion-done")
def mark_transfusion_done(body: TransfusionDoneBody):
    """Updates last transfusion date and recalculates next date."""
    patient = supabase.table("thal_patients") \
        .select("transfusion_frequency_days") \
        .eq("id", body.patient_id) \
        .single() \
        .execute()

    if not patient.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    freq      = patient.data["transfusion_frequency_days"] or 21
    last      = date.fromisoformat(body.transfusion_date)
    next_date = last + timedelta(days=freq)

    supabase.table("thal_patients").update({
        "last_transfusion_date": last.isoformat(),
        "next_transfusion_date": next_date.isoformat(),
    }).eq("id", body.patient_id).execute()

    return {
        "success":   True,
        "next_date": next_date.isoformat(),
        "message":   f"Transfusion recorded. Next session: {next_date.strftime('%b %d, %Y')}",
        "match_window_starts": (next_date - timedelta(days=MATCH_WINDOW_DAYS)).isoformat(),
    }


# ── POST /thal/assign-donor ───────────────────────────────────────────────────

class AssignDonorBody(BaseModel):
    patient_id: str
    donor_id: str


@router.post("/assign-donor")
def assign_thal_donor(body: AssignDonorBody):
    """
    Assigns a donor to an upcoming thal transfusion.

    Enforces the NO-REPEAT rule:
      → If this donor has already fulfilled a transfusion for this patient
        in ANY previous cycle, the request is rejected with 409 Conflict.
    """
    # 1. Check no-repeat: same donor × same patient in 'matches' table
    existing = supabase.table("matches") \
        .select("id") \
        .eq("request_id", body.patient_id) \
        .eq("donor_id",   body.donor_id) \
        .eq("module",     "thal") \
        .execute()

    if existing.data:
        raise HTTPException(
            status_code=409,
            detail=(
                "This donor has already donated to this patient in a previous cycle. "
                "Please choose a different donor to ensure donor diversity and patient safety."
            )
        )

    # 2. Insert the match record (only columns that exist in schema)
    res = supabase.table("matches").insert({
        "request_id":  body.patient_id,
        "donor_id":    body.donor_id,
        "module":      "thal",
        "status":      "pending",
        "match_score": 1.0,   # 1.0 = manually assigned
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to assign donor")

    return {
        "success":  True,
        "match_id": res.data[0]["id"],
        "message":  "Donor assigned successfully. No previous donation history with this patient.",
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