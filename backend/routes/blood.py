"""
routes/blood.py
---------------
Endpoints consumed by BloodBridge.tsx:
  GET  /blood/donors              → donor cards grid
  GET  /blood/requests/open       → Live Urgent Requests list
  POST /blood/requests            → hospitals post a new blood need
  POST /blood/donors/request      → hospital targets a specific donor
  GET  /blood/requests/for-donor  → donor dashboard urgent requests
  GET  /blood/shortage            → shortage prediction widget
"""

from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from utils.db import supabase
from utils.matching import blood_compatible, haversine, days_since
from utils.sms import alert_donors

router = APIRouter()


# ── Notification helper ───────────────────────────────────────────────────────

def _create_notification(user_id: str, title: str, message: str, notif_type: str):
    """Insert a row into the notifications table. Never raises — non-critical."""
    try:
        supabase.table("notifications").insert({
            "user_id":  user_id,
            "title":    title,
            "message":  message,
            "type":     notif_type,
            "is_read":  False,
        }).execute()
    except Exception:
        pass


# ── GET /blood/donors ─────────────────────────────────────────────────────────

@router.get("/donors")
def get_blood_donors(
    blood_group: Optional[str] = Query(None),
    city:        Optional[str] = Query(None),
    pincode:     Optional[str] = Query(None),
    lat:         Optional[float] = Query(None),
    lng:         Optional[float] = Query(None),
    limit:       int = Query(20, le=50),
):
    query = supabase.table("donors") \
        .select("id, name, city, pincode, blood_group, trust_score, is_available, is_verified, lat, lng, last_donation_date, donor_types") \
        .eq("is_available", True)

    if pincode:
        query = query.eq("pincode", pincode)

    res = query.limit(200).execute()
    donors = res.data or []

    results = []

    for d in donors:
        if city:
            donor_city = (d.get("city") or "").lower()
            if city.lower() not in donor_city:
                continue

        if blood_group and d.get("blood_group"):
            if not blood_compatible(d["blood_group"], blood_group):
                continue

        dtypes = d.get("donor_types") or []
        has_blood_type = "blood" in dtypes
        if dtypes and not has_blood_type:
            continue

        last = d.get("last_donation_date")
        since = days_since(last)
        eligible = since is None or since >= 90

        trust_raw   = d.get("trust_score", 50)
        trust_stars = round(trust_raw / 100 * 5, 1)

        distance_km = None
        if lat and lng and d.get("lat") and d.get("lng"):
            distance_km = haversine(lat, lng, d["lat"], d["lng"])

        results.append({
            "id":                d["id"],
            "name":              d["name"],
            "city":              d["city"] or "",
            "group":             d["blood_group"] or "—",
            "trust":             trust_stars,
            "trust_score":       trust_raw,
            "is_verified":       d.get("is_verified", False),
            "available":         d["is_available"],
            "eligible_to_donate": eligible,
            "last_donated":      f"{since} days ago" if since is not None else "No record",
            "distance_km":       distance_km,
            "distance":          f"{distance_km} km" if distance_km is not None else "—",
        })

    results.sort(key=lambda x: (-int(x["eligible_to_donate"]), -x["trust_score"]))
    return results[:limit]


# ── GET /blood/requests/open ──────────────────────────────────────────────────

@router.get("/requests/open")
def get_open_blood_requests():
    try:
        res = supabase.table("blood_requests") \
            .select("*, hospitals(name, city)") \
            .eq("status", "open") \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Database error: {e}")

    results = []
    now = datetime.now(timezone.utc)

    for r in (res.data or []):
        hospital = r.get("hospitals") or {}
        raw_ts   = r["created_at"].replace("Z", "+00:00")
        created  = datetime.fromisoformat(raw_ts)
        elapsed  = now - created
        hours_elapsed = elapsed.total_seconds() / 3600

        urgency   = (r.get("urgency") or "normal").upper()
        max_hours = {"CRITICAL": 6, "URGENT": 12, "NORMAL": 24}.get(urgency, 12)
        time_left_hours = max(0, max_hours - hours_elapsed)
        h = int(time_left_hours)
        m = int((time_left_hours - h) * 60)

        results.append({
            "id":         r["id"],
            "hospital":   hospital.get("name", "Unknown Hospital"),
            "group":      r["blood_group"],
            "units":      r.get("units", 1),
            "urgency":    urgency,
            "timeLeft":   f"{h}h {m:02d}m",
            "hours_left": time_left_hours,
            "city":       hospital.get("city", ""),
            "posted":     f"{int(elapsed.total_seconds() / 60)} min ago"
                          if elapsed.total_seconds() < 3600
                          else f"{int(hours_elapsed)}h ago",
        })

    return results


# ── POST /blood/requests ──────────────────────────────────────────────────────

class BloodRequestBody(BaseModel):
    hospital_id: str
    blood_group: str
    units:       int = 1
    urgency:     str = "urgent"
    lat:         Optional[float] = None
    lng:         Optional[float] = None


@router.post("/requests")
def post_blood_request(body: BloodRequestBody):
    """Hospital posts a general blood request — notifies all compatible donors."""
    # 1. Create the request
    res = supabase.table("blood_requests").insert({
        "hospital_id": body.hospital_id,
        "blood_group": body.blood_group,
        "units":       body.units,
        "urgency":     body.urgency,
        "status":      "open",
        "lat":         body.lat,
        "lng":         body.lng,
    }).execute()

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create blood request")

    request_id = res.data[0]["id"]

    # 2. Get hospital name for notifications + SMS
    hosp = supabase.table("hospitals") \
        .select("name, city") \
        .eq("id", body.hospital_id) \
        .single() \
        .execute()
    hosp_name = hosp.data["name"] if hosp.data else "A hospital"
    hosp_city = hosp.data.get("city", "") if hosp.data else ""

    # 3. Find all compatible, available donors
    donors_res = supabase.table("donors") \
        .select("id, mobile, blood_group, name") \
        .eq("is_available", True) \
        .execute()

    alerted_mobiles = []

    for d in (donors_res.data or []):
        if not blood_compatible(d.get("blood_group", ""), body.blood_group):
            continue

        # In-app notification for every compatible donor
        _create_notification(
            user_id    = d["id"],
            title      = f"🩸 Urgent: {body.blood_group} blood needed",
            message    = f"{hosp_name}, {hosp_city} needs {body.units} unit(s). Can you help?",
            notif_type = "blood_request",
        )

        if d.get("mobile"):
            alerted_mobiles.append(d["mobile"])

    # 4. SMS top 5
    sms_msg = (
        f"🩸 URGENT: {body.blood_group} blood needed ({body.units} unit/s) at "
        f"{hosp_name}, {hosp_city}. "
        f"Reply YES or visit lifeforge.in. LifeForge Connect."
    )
    sms_count = alert_donors(alerted_mobiles[:5], sms_msg)

    return {
        "success":        True,
        "request_id":     request_id,
        "donors_alerted": sms_count,
        "message":        f"Request posted. {sms_count} donor(s) alerted via SMS.",
    }


# ── POST /blood/donors/request ────────────────────────────────────────────────

class DonorRequestBody(BaseModel):
    hospital_id: str
    donor_id:    str
    blood_group: str
    units:       int = 1
    urgency:     str = "urgent"


@router.post("/donors/request")
def request_specific_donor(body: DonorRequestBody):
    """Hospital targets a specific donor — notifies that donor directly."""
    # 1. Validate hospital
    try:
        hosp = supabase.table("hospitals") \
            .select("id, name, city") \
            .eq("id", body.hospital_id) \
            .single() \
            .execute()
    except Exception:
        hosp = None

    if not hosp or not hosp.data:
        raise HTTPException(status_code=400, detail=f"Hospital ID not found: {body.hospital_id}")

    hosp_name   = hosp.data["name"]
    hosp_city   = hosp.data.get("city", "")
    hospital_id = hosp.data["id"]

    # 2. Create the blood request
    try:
        res = supabase.table("blood_requests").insert({
            "hospital_id": hospital_id,
            "blood_group": body.blood_group,
            "units":       body.units,
            "urgency":     body.urgency,
            "status":      "open",
        }).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create blood request: {str(e)}")

    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create blood request")

    request_id = res.data[0]["id"]

    # 3. Create match record linking this request to the specific donor
    try:
        supabase.table("matches").insert({
            "request_id":  request_id,
            "donor_id":    body.donor_id,
            "status":      "pending",
            "module":      "blood",
        }).execute()
    except Exception:
        pass

    # 4. In-app notification to the specific donor
    _create_notification(
        user_id    = body.donor_id,
        title      = f"🩸 {hosp_name} requested you specifically!",
        message    = f"They need {body.blood_group} blood ({body.units} unit(s)). Please respond on LifeForge.",
        notif_type = "blood_request",
    )

    # 5. Also notify the hospital that their request was sent
    _create_notification(
        user_id    = hospital_id,
        title      = f"✅ Donor request sent",
        message    = f"Your request for {body.blood_group} blood has been sent to the donor.",
        notif_type = "blood_response",
    )

    # 6. SMS the donor
    try:
        donor = supabase.table("donors") \
            .select("name, mobile") \
            .eq("id", body.donor_id) \
            .single() \
            .execute()
        donor_name   = donor.data["name"] if donor.data else "Donor"
        donor_mobile = donor.data.get("mobile") if donor.data else None
    except Exception:
        donor_name   = "Donor"
        donor_mobile = None

    sms_count = 0
    if donor_mobile:
        sms_msg = (
            f"🩸 {hosp_name}, {hosp_city} needs {body.blood_group} blood ({body.units} unit/s). "
            f"You were specifically requested! Reply YES or visit lifeforge.in. LifeForge Connect."
        )
        sms_count = alert_donors([donor_mobile], sms_msg)

    return {
        "success":    True,
        "request_id": request_id,
        "donor_name": donor_name,
        "sms_sent":   sms_count > 0,
        "message":    f"Request sent to {donor_name}. {'SMS alert sent!' if sms_count else 'SMS not configured.'}",
    }


# ── GET /blood/requests/for-donor ─────────────────────────────────────────────

@router.get("/requests/for-donor")
def get_requests_for_donor(
    donor_id: str = Query(..., description="The donor's user ID"),
):
    # 1. Get donor profile
    donor_res = supabase.table("donors") \
        .select("blood_group, city") \
        .eq("id", donor_id) \
        .single() \
        .execute()

    if not donor_res.data:
        raise HTTPException(status_code=404, detail="Donor not found")

    donor_group = donor_res.data.get("blood_group")
    if not donor_group:
        return []

    # 2. Fetch all open requests
    req_res = supabase.table("blood_requests") \
        .select("*, hospitals(name, city)") \
        .eq("status", "open") \
        .order("created_at", desc=True) \
        .limit(30) \
        .execute()

    now = datetime.now(timezone.utc)
    results = []

    for r in (req_res.data or []):
        req_group = r.get("blood_group")
        if req_group and not blood_compatible(donor_group, req_group):
            continue

        hospital      = r.get("hospitals") or {}
        raw_ts        = r["created_at"].replace("Z", "+00:00")
        created       = datetime.fromisoformat(raw_ts)
        elapsed       = now - created
        hours_elapsed = elapsed.total_seconds() / 3600

        urgency         = (r.get("urgency") or "normal").upper()
        max_hours       = {"CRITICAL": 6, "URGENT": 12, "NORMAL": 24}.get(urgency, 12)
        time_left_hours = max(0, max_hours - hours_elapsed)
        h = int(time_left_hours)
        m = int((time_left_hours - h) * 60)

        results.append({
            "id":         r["id"],
            "hospital":   hospital.get("name", "Unknown Hospital"),
            "group":      req_group,
            "units":      r.get("units", 1),
            "urgency":    urgency,
            "timeLeft":   f"{h}h {m:02d}m",
            "hours_left": time_left_hours,
            "city":       hospital.get("city", ""),
            "posted":     f"{int(elapsed.total_seconds() / 60)} min ago"
                          if elapsed.total_seconds() < 3600
                          else f"{int(hours_elapsed)}h ago",
        })

    return results


# ── GET /blood/shortage ───────────────────────────────────────────────────────

@router.get("/shortage")
def get_blood_shortage():
    req_res   = supabase.table("blood_requests").select("blood_group").eq("status", "open").execute()
    donor_res = supabase.table("donors").select("blood_group").eq("is_available", True).execute()

    req_count:   dict[str, int] = {}
    donor_count: dict[str, int] = {}

    for r in (req_res.data or []):
        g = r["blood_group"]
        req_count[g] = req_count.get(g, 0) + 1

    for d in (donor_res.data or []):
        g = d.get("blood_group") or ""
        if g:
            donor_count[g] = donor_count.get(g, 0) + 1

    all_groups = set(req_count) | set(donor_count)
    shortages  = []

    for g in all_groups:
        reqs   = req_count.get(g, 0)
        donors = donor_count.get(g, 0)
        deficit = reqs - donors
        shortages.append({
            "blood_group":      g,
            "requests":         reqs,
            "donors_available": donors,
            "deficit":          deficit,
            "severity":         "critical" if deficit >= 3 else "urgent" if deficit > 0 else "ok",
        })

    shortages.sort(key=lambda x: -x["deficit"])
    return shortages