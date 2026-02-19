"""
routes/platelet.py
------------------
Endpoints consumed by PlateletAlert.tsx:
  GET  /platelet/requests/open  → "Urgent Platelet Requests" list + viability clocks
  GET  /platelet/donors         → "Compatible Apheresis Donors" cards
  POST /platelet/requests       → post a new platelet request (Add Patient)
"""

from datetime import datetime, timedelta, date
from typing import Optional

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from utils.db import supabase
from utils.matching import blood_compatible, days_since

router = APIRouter()

PLATELET_VIABILITY_DAYS = 5   # platelets expire in 5 days


# ── GET /platelet/requests/open ───────────────────────────────────────────────

@router.get("/requests/open")
def get_open_platelet_requests():
    """
    Powers 'Urgent Platelet Requests' list AND the Viability Clocks sidebar
    on PlateletAlert.tsx.
    Returns shape matching frontend:
      { patient, cancer, group, units, expiry, urgency, hospital,
        days_left, hours_left, is_critical }
    """
    res = supabase.table("platelet_requests") \
        .select("*, hospitals(name, city)") \
        .eq("status", "open") \
        .order("created_at", desc=True) \
        .execute()

    today = date.today()
    results = []

    for r in (res.data or []):
        hospital = r.get("hospitals") or {}
        created  = datetime.fromisoformat(r["created_at"].replace("Z", ""))
        expiry   = created + timedelta(days=PLATELET_VIABILITY_DAYS)
        now      = datetime.utcnow()
        delta    = expiry - now
        days_left  = max(0, delta.days)
        hours_left = max(0, int(delta.total_seconds() / 3600))

        # e.g. "4d 12h" label matching ExpiryTimer component
        d, h = divmod(hours_left, 24)
        expiry_label = f"{d}d {h}h"

        results.append({
            "id":          r["id"],
            "patient":     r.get("patient_name") or "Anonymous",
            "cancer":      r.get("cancer_type") or "—",
            "group":       r.get("blood_group") or "—",
            "units":       r.get("units", 1),
            "expiry":      expiry_label,
            "urgency":     (r.get("urgency") or "urgent").upper(),
            "hospital":    hospital.get("name", "Unknown"),
            "hospital_city": hospital.get("city", ""),
            "days_left":   days_left,
            "hours_left":  hours_left,
            "is_critical": days_left <= 1,
        })

    return results


# ── GET /platelet/donors ──────────────────────────────────────────────────────

@router.get("/donors")
def get_platelet_donors(
    blood_group: Optional[str] = Query(None),
    city:        Optional[str] = Query(None),
    limit:       int = Query(10, le=30),
):
    """
    Powers 'Compatible Apheresis Donors' cards on PlateletAlert.tsx.
    Returns shape:
      { name, group, compat, trust, lastApheresis, nextAvail, city }
    """
    res = supabase.table("donors") \
        .select("id, name, city, blood_group, trust_score, is_available, last_donation_date, donor_types") \
        .eq("is_available", True) \
        .execute()

    results = []
    today = date.today()

    for d in (res.data or []):
        # Must be registered as platelet/apheresis donor
        if "platelet" not in (d.get("donor_types") or []):
            continue

        # Blood group compatibility
        if blood_group and d.get("blood_group"):
            if not blood_compatible(d["blood_group"], blood_group):
                continue

        if city and d.get("city"):
            if city.lower() not in d["city"].lower():
                continue

        since = days_since(d.get("last_donation_date"))
        # 14-day gap required for apheresis
        days_unavail = max(0, 14 - since) if since is not None else 0
        if days_unavail == 0:
            next_avail = "Today"
        elif days_unavail == 1:
            next_avail = "Tomorrow"
        else:
            avail_date = today + __import__('datetime').timedelta(days=days_unavail)
            next_avail = avail_date.strftime("%b %d")

        trust_raw = d.get("trust_score", 50)
        # Compat score: blood match + trust bonus
        compat = min(99, 85 + int(trust_raw / 100 * 14)) if not blood_group or blood_compatible(d.get("blood_group",""), blood_group) else 0

        results.append({
            "id":            d["id"],
            "name":          d["name"],
            "group":         d.get("blood_group") or "—",
            "compat":        compat,
            "trust":         round(trust_raw / 100 * 5, 1),
            "lastApheresis": f"{since} days ago" if since is not None else "No record",
            "nextAvail":     next_avail,
            "city":          d.get("city") or "",
        })

    results.sort(key=lambda x: -x["compat"])
    return results[:limit]


# ── POST /platelet/requests ───────────────────────────────────────────────────

class PlateletRequestBody(BaseModel):
    patient_name: str
    cancer_type:  Optional[str] = None
    blood_group:  Optional[str] = None
    units:        int = 1
    urgency:      str = "urgent"
    hospital_id:  str


@router.post("/requests")
def post_platelet_request(body: PlateletRequestBody):
    """Called by 'Add Patient' button on PlateletAlert.tsx."""
    res = supabase.table("platelet_requests").insert({
        "patient_name": body.patient_name,
        "cancer_type":  body.cancer_type,
        "blood_group":  body.blood_group,
        "units":        body.units,
        "urgency":      body.urgency,
        "hospital_id":  body.hospital_id,
        "status":       "open",
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create platelet request")

    return {
        "success":    True,
        "request_id": res.data[0]["id"],
        "message":    "Patient registered. Compatible donors will be alerted.",
    }