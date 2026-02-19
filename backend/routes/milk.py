"""
routes/milk.py
--------------
Endpoints consumed by MilkBridge.tsx:
  GET  /milk/donors           → Active donor cards
  GET  /milk/bank             → Milk Bank pasteurization log table
  GET  /milk/shortage-alerts  → shortage alert cards
  POST /milk/register-donor   → register as milk donor
  POST /milk/requests         → hospital posts a shortage alert
"""

from datetime import date
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.db import supabase

router = APIRouter()


# ── GET /milk/donors ──────────────────────────────────────────────────────────

@router.get("/donors")
def get_milk_donors():
    """
    Powers the 'Active Donors' card grid on MilkBridge.tsx.
    Returns shape:
      { name, babyAge, qty, area, verified, impact }
    """
    res = supabase.table("milk_donors") \
        .select("*, donors(name, city, is_verified, trust_score)") \
        .eq("is_available", True) \
        .execute()

    results = []
    for md in (res.data or []):
        donor = md.get("donors") or {}
        age_m = md.get("baby_age_months")
        qty   = md.get("quantity_ml_per_day")

        # Calculate impact from matches table
        impact_res = supabase.table("matches") \
            .select("id", count="exact") \
            .eq("donor_id", md.get("donor_id")) \
            .eq("module", "milk") \
            .eq("status", "fulfilled") \
            .execute()
        babies_helped = impact_res.count or 0
        impact_label  = f"{babies_helped} {'babies' if babies_helped != 1 else 'baby'} fed" if babies_helped else "0 babies fed"

        results.append({
            "id":       md["id"],
            "donor_id": md.get("donor_id"),
            "name":     donor.get("name", "Anonymous"),
            "babyAge":  f"{age_m} months" if age_m is not None else "—",
            "qty":      f"{qty}ml/day" if qty else "—",
            "area":     donor.get("city", "—"),
            "verified": donor.get("is_verified", False),
            "impact":   impact_label,
        })

    return results


# ── GET /milk/bank ────────────────────────────────────────────────────────────

@router.get("/bank")
def get_milk_bank():
    """
    Powers the 'Milk Bank — Pasteurization Log' table on MilkBridge.tsx.
    Returns shape matching the table columns:
      { id, from, pasteurized, expiry, qty, status }
    """
    res = supabase.table("milk_bank") \
        .select("*, donors(name)") \
        .order("pasteurized_date", desc=True) \
        .execute()

    today = date.today()
    results = []

    for row in (res.data or []):
        donor = row.get("donors") or {}

        # Auto-expire if past expiry date
        expiry_str = row.get("expiry_date")
        status = row.get("status", "Available")
        if expiry_str:
            expiry_date = date.fromisoformat(expiry_str[:10])
            days_left = (expiry_date - today).days
            if days_left < 0:
                status = "Expired"
            elif days_left <= 2:
                status = "Low Stock"

        def fmt_date(d):
            if not d:
                return "—"
            try:
                return date.fromisoformat(d[:10]).strftime("%b %d")
            except Exception:
                return d

        results.append({
            "id":          row.get("passport_id", "—"),
            "from":        donor.get("name", "Anonymous"),
            "pasteurized": fmt_date(row.get("pasteurized_date")),
            "expiry":      fmt_date(row.get("expiry_date")),
            "qty":         f"{row.get('quantity_liters', '—')}L",
            "status":      status,
        })

    return results


# ── GET /milk/shortage-alerts ─────────────────────────────────────────────────

@router.get("/shortage-alerts")
def get_milk_shortage_alerts():
    """
    Powers the 'Shortage Alert' cards on MilkBridge.tsx.
    Returns open milk requests from hospitals/NICUs.
    """
    res = supabase.table("milk_requests") \
        .select("*, hospitals(name, city)") \
        .eq("status", "open") \
        .order("created_at", desc=True) \
        .execute()

    results = []
    for r in (res.data or []):
        hospital = r.get("hospitals") or {}
        qty = r.get("daily_quantity_ml")
        results.append({
            "id":           r["id"],
            "hospital":     hospital.get("name", "Unknown Hospital"),
            "city":         hospital.get("city", ""),
            "infant_name":  r.get("infant_name"),
            "quantity_needed": f"{qty}ml/day" if qty else "—",
            "message":      f"NICU at {hospital.get('name','')}, {hospital.get('city','')} needs "
                            f"<strong>{qty}ml/day</strong> for premature infants."
                            if qty else "NICU needs donor milk for premature infants.",
        })

    return results


# ── POST /milk/register-donor ─────────────────────────────────────────────────

class MilkDonorBody(BaseModel):
    donor_id:            str
    baby_age_months:     int
    quantity_ml_per_day: int
    pickup_location:     Optional[str] = None
    test_doc_url:        Optional[str] = None
    health_score:        int = 70


@router.post("/register-donor")
def register_milk_donor(body: MilkDonorBody):
    """Called by 'Register as Donor' form on MilkBridge.tsx."""
    # Insert milk donor record
    res = supabase.table("milk_donors").insert({
        "donor_id":            body.donor_id,
        "baby_age_months":     body.baby_age_months,
        "quantity_ml_per_day": body.quantity_ml_per_day,
        "health_score":        body.health_score,
        "test_doc_url":        body.test_doc_url,
        "is_available":        True,
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to register milk donor")

    # Add 'milk' to donor_types + optionally update city
    donor = supabase.table("donors").select("donor_types").eq("id", body.donor_id).single().execute()
    if donor.data:
        types = donor.data.get("donor_types") or []
        update = {"donor_types": list(set(types + ["milk"]))}
        if body.pickup_location:
            update["city"] = body.pickup_location
        supabase.table("donors").update(update).eq("id", body.donor_id).execute()

    return {
        "success": True,
        "message": "Registered as milk donor! You'll be notified when NICUs need your milk.",
    }


# ── POST /milk/requests ───────────────────────────────────────────────────────

class MilkRequestBody(BaseModel):
    hospital_id:        str
    infant_name:        Optional[str] = None
    daily_quantity_ml:  int


@router.post("/requests")
def post_milk_request(body: MilkRequestBody):
    """Called by 'Respond to Alert' / 'Post Shortage' button on MilkBridge.tsx."""
    res = supabase.table("milk_requests").insert({
        "hospital_id":       body.hospital_id,
        "infant_name":       body.infant_name,
        "daily_quantity_ml": body.daily_quantity_ml,
        "status":            "open",
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to post milk request")

    return {
        "success":    True,
        "request_id": res.data[0]["id"],
        "message":    "Shortage alert posted. Matching donors are being contacted.",
    }