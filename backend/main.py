"""
LifeForge Connect — FastAPI Backend
------------------------------------
Architecture: FastAPI → Supabase (PostgreSQL via supabase-py)

Run locally:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import auth, blood, thal, platelet, marrow, organ, milk, dashboard

app = FastAPI(
    title="LifeForge Connect API",
    description="Backend for the LifeForge Connect donation platform",
    version="2.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://localhost:8082",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.(vercel|netlify)\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,       prefix="/auth",      tags=["Auth"])
app.include_router(blood.router,      prefix="/blood",     tags=["BloodBridge"])
app.include_router(thal.router,       prefix="/thal",      tags=["ThalCare"])
app.include_router(platelet.router,   prefix="/platelet",  tags=["PlateletAlert"])
app.include_router(marrow.router,     prefix="/marrow",    tags=["MarrowMatch"])
app.include_router(organ.router,      prefix="/organ",     tags=["LastGift"])
app.include_router(milk.router,       prefix="/milk",      tags=["MilkBridge"])
app.include_router(dashboard.router,  prefix="/dashboard", tags=["Dashboard"])


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "LifeForge Connect API v2.0"}


@app.get("/stats", tags=["Health"])
def platform_stats():
    """
    Live platform stats used by Index.tsx LiveCounter widgets.
    """
    from utils.db import supabase

    donors = supabase.table("donors").select("id", count="exact").eq(
        "is_available", True
    ).execute()

    hospitals = supabase.table("hospitals").select(
        "id", count="exact"
    ).execute()

    matches = supabase.table("matches").select(
        "id", count="exact"
    ).execute()

    total_matches = matches.count or 0

    return {
        "matches_today":        total_matches,
        "lives_impacted":       total_matches * 2,
        "active_donors_online": donors.count or 0,
        "hospitals_connected":  hospitals.count or 0,
    }
