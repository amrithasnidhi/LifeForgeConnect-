"""
routes/dashboard.py
-------------------
Endpoints consumed by Dashboard.tsx (DonorDashboard, HospitalDashboard, AdminDashboard):

  GET  /dashboard/donor/{id}      → DonorDashboard: profile card, stats, urgent nearby, history
  GET  /dashboard/hospital/{id}   → HospitalDashboard: stats, active requests
  GET  /dashboard/admin           → AdminDashboard: verif queue, flagged, stats
  POST /dashboard/admin/verify    → approve/reject donor or hospital
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date

from utils.db import supabase
from utils.matching import days_since, days_until

router = APIRouter()


# ── GET /dashboard/donor/{id} ─────────────────────────────────────────────────

@router.get("/donor/{donor_id}")
def get_donor_dashboard(donor_id: str):
    """
    Powers DonorDashboard component in Dashboard.tsx.
    Returns:
      - profile card data (name, blood group, trust_stars, next eligible date)
      - stats row (total donations, lives impacted, trust score, next eligible)
      - urgent_requests nearby (blood + platelet)
      - donation_history table rows
    """
    # Profile
    donor = supabase.table("donors") \
        .select("*") \
        .eq("id", donor_id) \
        .single() \
        .execute()

    if not donor.data:
        raise HTTPException(status_code=404, detail="Donor not found")

    d = donor.data
    since = days_since(d.get("last_donation_date"))
    next_eligible_days = max(0, 90 - since) if since is not None else 0

    if next_eligible_days == 0:
        next_eligible_label = "Now"
    else:
        from datetime import timedelta, datetime
        ne_date = date.today() + timedelta(days=next_eligible_days)
        next_eligible_label = ne_date.strftime("%b %d")

    trust_raw   = d.get("trust_score", 50)
    trust_stars = round(trust_raw / 100 * 5, 1)

    # Donation history from matches
    history_res = supabase.table("matches") \
        .select("*, blood_requests(blood_group, urgency, hospitals(name)), platelet_requests(blood_group, hospitals(name))") \
        .eq("donor_id", donor_id) \
        .eq("status", "fulfilled") \
        .order("created_at", desc=True) \
        .limit(10) \
        .execute()

    history = []
    for m in (history_res.data or []):
        module = m.get("module", "blood")
        created = m.get("created_at", "")[:10]
        if module == "blood":
            req = m.get("blood_requests") or {}
            hosp = req.get("hospitals") or {}
            history.append({
                "date":     _fmt_date(created),
                "type":     f"🩸 Blood ({req.get('blood_group','')})",
                "hospital": hosp.get("name", "Unknown"),
                "status":   "Fulfilled",
                "impact":   "2 lives saved",
            })
        elif module == "platelet":
            req = m.get("platelet_requests") or {}
            hosp = req.get("hospitals") or {}
            history.append({
                "date":     _fmt_date(created),
                "type":     "⏱️ Platelets",
                "hospital": hosp.get("name", "Unknown"),
                "status":   "Fulfilled",
                "impact":   "1 patient helped",
            })

    total_donations = len(history)
    lives_impacted  = sum(2 if "Blood" in h["type"] else 1 for h in history)

    # Urgent nearby requests (blood + platelet) — top 3
    blood_urgent = supabase.table("blood_requests") \
        .select("*, hospitals(name, city)") \
        .eq("status", "open") \
        .eq("urgency", "critical") \
        .limit(2) \
        .execute()

    platelet_urgent = supabase.table("platelet_requests") \
        .select("*, hospitals(name, city)") \
        .eq("status", "open") \
        .limit(1) \
        .execute()

    urgent = []
    for r in (blood_urgent.data or []):
        h = r.get("hospitals") or {}
        urgent.append({
            "type":     "🩸",
            "module":   "BloodBridge",
            "group":    r.get("blood_group", ""),
            "hospital": f"{h.get('name','')}, {h.get('city','')}",
            "distance": "Nearby",
            "urgency":  "CRITICAL",
            "time":     "Recently",
        })
    for r in (platelet_urgent.data or []):
        h = r.get("hospitals") or {}
        urgent.append({
            "type":     "⏱️",
            "module":   "PlateletAlert",
            "group":    r.get("blood_group", "—"),
            "hospital": f"{h.get('name','')}, {h.get('city','')}",
            "distance": "Nearby",
            "urgency":  "URGENT",
            "time":     "Recently",
        })

    return {
        "profile": {
            "id":            donor_id,
            "name":          d.get("name", ""),
            "initial":       (d.get("name") or "?")[0].upper(),
            "blood_group":   d.get("blood_group", ""),
            "city":          d.get("city", ""),
            "is_verified":   d.get("is_verified", False),
            "donor_types":   d.get("donor_types") or [],
            "trust_stars":   trust_stars,
            "is_available":  d.get("is_available", True),
        },
        "stats": {
            "total_donations":  total_donations,
            "lives_impacted":   lives_impacted,
            "trust_score":      trust_stars,
            "next_eligible":    next_eligible_label,
        },
        "urgent_requests":  urgent,
        "donation_history": history,
    }


# ── GET /dashboard/hospital/{id} ──────────────────────────────────────────────

@router.get("/hospital/{hospital_id}")
def get_hospital_dashboard(hospital_id: str):
    """Powers HospitalDashboard component in Dashboard.tsx."""
    hosp = supabase.table("hospitals") \
        .select("*") \
        .eq("id", hospital_id) \
        .single() \
        .execute()

    if not hosp.data:
        raise HTTPException(status_code=404, detail="Hospital not found")

    h = hosp.data

    # Active blood requests
    blood_reqs = supabase.table("blood_requests") \
        .select("*") \
        .eq("hospital_id", hospital_id) \
        .eq("status", "open") \
        .order("created_at", desc=True) \
        .execute()

    # Active platelet requests
    plat_reqs = supabase.table("platelet_requests") \
        .select("*") \
        .eq("hospital_id", hospital_id) \
        .eq("status", "open") \
        .order("created_at", desc=True) \
        .execute()

    # Build combined active_requests list matching HospitalDashboard.tsx
    active = []
    for r in (blood_reqs.data or []):
        matched = supabase.table("matches").select("id", count="exact") \
            .eq("request_id", r["id"]).eq("status", "pending").execute()
        active.append({
            "id":       r["id"],
            "group":    r["blood_group"],
            "units":    r.get("units", 1),
            "urgency":  (r.get("urgency") or "urgent").upper(),
            "module":   "BloodBridge",
            "matched":  matched.count or 0,
            "posted":   _time_ago(r.get("created_at", "")),
        })
    for r in (plat_reqs.data or []):
        matched = supabase.table("matches").select("id", count="exact") \
            .eq("request_id", r["id"]).eq("status", "pending").execute()
        active.append({
            "id":       r["id"],
            "group":    f"{r.get('blood_group','')} Platelets",
            "units":    r.get("units", 1),
            "urgency":  (r.get("urgency") or "urgent").upper(),
            "module":   "PlateletAlert",
            "matched":  matched.count or 0,
            "posted":   _time_ago(r.get("created_at", "")),
        })

    # Fulfilled this month
    fulfilled = supabase.table("matches").select("id", count="exact") \
        .eq("status", "fulfilled").execute()

    return {
        "hospital": {
            "id":          hospital_id,
            "name":        h.get("name", ""),
            "city":        h.get("city", ""),
            "is_verified": h.get("is_verified", False),
        },
        "stats": {
            "active_requests":       len(active),
            "matched_this_month":    fulfilled.count or 0,
            "units_received":        (fulfilled.count or 0) * 2,
            "avg_match_time":        "18m",
        },
        "active_requests": active,
    }


# ── GET /dashboard/admin ──────────────────────────────────────────────────────

@router.get("/admin")
def get_admin_dashboard():
    """Powers AdminDashboard component in Dashboard.tsx."""
    unverified_donors = supabase.table("donors") \
        .select("id, name, city, created_at, donor_types") \
        .eq("is_verified", False) \
        .order("created_at", desc=True) \
        .limit(20) \
        .execute()

    unverified_hospitals = supabase.table("hospitals") \
        .select("id, name, city, reg_number, created_at") \
        .eq("is_verified", False) \
        .order("created_at", desc=True) \
        .limit(20) \
        .execute()

    flagged = supabase.table("donors") \
        .select("id, name, city, trust_score") \
        .lt("trust_score", 20) \
        .execute()

    total_donors    = supabase.table("donors").select("id", count="exact").execute()
    total_hospitals = supabase.table("hospitals").select("id", count="exact").execute()
    total_matches   = supabase.table("matches").select("id", count="exact").execute()

    pending = (len(unverified_donors.data or []) + len(unverified_hospitals.data or []))

    return {
        "stats": {
            "pending_verifications": pending,
            "flagged_accounts":      len(flagged.data or []),
            "total_users":           (total_donors.count or 0) + (total_hospitals.count or 0),
            "todays_matches":        total_matches.count or 0,
        },
        "verification_queue": {
            "donors":    [
                {
                    "id":    d["id"],
                    "name":  d["name"],
                    "type":  "Donor",
                    "city":  d.get("city", ""),
                    "docs":  ", ".join(d.get("donor_types") or []),
                    "time":  _time_ago(d.get("created_at", "")),
                }
                for d in (unverified_donors.data or [])
            ],
            "hospitals": [
                {
                    "id":   h["id"],
                    "name": h["name"],
                    "type": "Hospital",
                    "city": h.get("city", ""),
                    "docs": f"Reg: {h.get('reg_number','')}",
                    "time": _time_ago(h.get("created_at", "")),
                }
                for h in (unverified_hospitals.data or [])
            ],
        },
        "flagged_accounts": flagged.data or [],
    }


# ── POST /dashboard/admin/verify ──────────────────────────────────────────────

class VerifyBody(BaseModel):
    entity_type: str    # "donor" or "hospital"
    entity_id:   str
    approved:    bool


@router.post("/admin/verify")
def admin_verify(body: VerifyBody):
    """Called by Approve/Reject buttons in AdminDashboard.tsx verification queue."""
    if body.entity_type == "donor":
        supabase.table("donors").update({
            "is_verified": body.approved,
            "trust_score": 60 if body.approved else 10,
        }).eq("id", body.entity_id).execute()
    elif body.entity_type == "hospital":
        supabase.table("hospitals").update({
            "is_verified": body.approved,
        }).eq("id", body.entity_id).execute()
    else:
        raise HTTPException(status_code=400, detail="entity_type must be 'donor' or 'hospital'")

    return {
        "success": True,
        "message": f"{'Approved' if body.approved else 'Rejected'} {body.entity_type} {body.entity_id}",
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt_date(iso: str) -> str:
    try:
        from datetime import datetime
        return datetime.fromisoformat(iso[:10]).strftime("%b %d, %Y")
    except Exception:
        return iso


def _time_ago(iso: str) -> str:
    try:
        from datetime import datetime, timezone
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        diff = datetime.now(timezone.utc) - dt
        mins = int(diff.total_seconds() / 60)
        if mins < 60:
            return f"{mins} min ago"
        hours = mins // 60
        if hours < 24:
            return f"{hours} hr{'s' if hours > 1 else ''} ago"
        return f"{hours // 24} day{'s' if hours // 24 > 1 else ''} ago"
    except Exception:
        return "Recently"