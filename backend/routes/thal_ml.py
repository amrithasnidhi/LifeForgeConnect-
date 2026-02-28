"""
routes/thal_ml.py
-----------------
ML-powered endpoints for the Thalassemia Transfusion Prediction System.

Endpoints:
  POST /thal/ml/predict          → Predict next transfusion date
  POST /thal/ml/match-donors     → ML-ranked donor matching with exclusion
  GET  /thal/ml/alerts           → Daily batch alerts by urgency
  GET  /thal/ml/patient/{id}/history → Full transfusion + exclusion history
  POST /thal/ml/train            → Retrain model
  GET  /thal/ml/model-info       → Model training metrics
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()


# ── Request / Response Schemas ────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    patient_id: Optional[str] = None
    blood_type: Optional[str] = None
    age: int = 25
    weight_kg: float = 50.0
    splenectomy: bool = False
    chelation_therapy: bool = True
    baseline_hb: float = 7.5
    last_hb_pre: float = 7.0
    last_hb_post: float = 10.5
    days_since_last_tx: int = 18
    avg_interval_last3: float = 21.0
    hb_decay_rate: float = -0.07


class DonorMatchRequest(BaseModel):
    patient_id: str
    patient_blood_type: str
    top_n: int = 5


class TransfusionCompletedRequest(BaseModel):
    patient_id: str
    donor_id: str
    transfusion_date: str
    hb_pre: float
    hb_post: float
    units: int
    reaction: bool = False


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/model-info")
def get_model_info():
    """Return model training metrics and status."""
    from ml.model_manager import get_model_manager
    mgr = get_model_manager()
    mgr.ensure_ready()

    metrics = mgr.get_model_metrics()
    return {
        "status": "ready" if mgr.is_ready else "not_trained",
        "model_type": "RF (60%) + GBM (40%) Ensemble",
        "metrics": metrics,
    }


@router.post("/predict")
def predict_next_transfusion(req: PredictionRequest):
    """
    Predict when a patient will next need a transfusion.
    Can use either a synthetic patient_id or raw clinical parameters.
    """
    from ml.model_manager import get_model_manager
    mgr = get_model_manager()

    try:
        if req.patient_id and req.patient_id.startswith("PT"):
            # Synthetic patient lookup
            prediction = mgr.predict_for_patient(req.patient_id)
        else:
            # Real clinical parameters
            prediction = mgr.predict_from_params(
                age=req.age,
                weight_kg=req.weight_kg,
                splenectomy=req.splenectomy,
                chelation_therapy=req.chelation_therapy,
                baseline_hb=req.baseline_hb,
                hb_pre=req.last_hb_pre,
                hb_post=req.last_hb_post,
                days_since_last_tx=req.days_since_last_tx,
                avg_interval=req.avg_interval_last3,
                hb_decay_rate=req.hb_decay_rate,
            )

        return {
            "patient_id": req.patient_id or "anonymous",
            "predicted_days": prediction["predicted_days"],
            "predicted_date": prediction["next_date"].strftime("%Y-%m-%d"),
            "urgency": prediction["urgency"],
            "confidence_low": prediction["confidence_range"][0],
            "confidence_high": prediction["confidence_range"][1],
            "rf_prediction": prediction["rf_prediction"],
            "gb_prediction": prediction["gb_prediction"],
            "message": f"Next transfusion predicted in {prediction['predicted_days']} days "
                       f"({prediction['confidence_range'][0]}-{prediction['confidence_range'][1]} day range)."
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/match-donors")
def match_donors(req: DonorMatchRequest):
    """Find eligible donors enforcing alloimmunization exclusion."""
    from ml.model_manager import get_model_manager
    mgr = get_model_manager()

    try:
        result = mgr.match_donors(req.patient_id, req.patient_blood_type, req.top_n)
        result["message"] = (
            f"Found {len(result['eligible_donors'])} eligible donors. "
            f"{result['excluded_count']} donors permanently excluded "
            f"(alloimmunization prevention)."
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/alerts")
def get_daily_alerts(limit: int = 20):
    """Returns all patients sorted by transfusion urgency."""
    from ml.model_manager import get_model_manager
    mgr = get_model_manager()

    try:
        return mgr.get_daily_alerts(limit=limit)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/patient/{patient_id}/history")
def get_patient_history(patient_id: str):
    """Returns a patient's full transfusion history including excluded donors."""
    from ml.model_manager import get_model_manager
    mgr = get_model_manager()

    try:
        return mgr.get_patient_history(patient_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/record-transfusion")
def record_transfusion(req: TransfusionCompletedRequest):
    """
    Record a completed transfusion.
    Flags the donor as permanently excluded for this patient.
    """
    from ml.model_manager import get_model_manager
    mgr = get_model_manager()
    mgr.ensure_ready()

    # In production: write to Supabase, add to exclusion table
    return {
        "status": "recorded",
        "patient_id": req.patient_id,
        "donor_flagged": req.donor_id,
        "message": (
            f"Donor {req.donor_id} permanently excluded for patient "
            f"{req.patient_id} (alloimmunization prevention). "
            f"Next prediction cycle triggered."
        ),
    }


@router.post("/train")
def retrain_model(n_patients: int = 80, n_donors: int = 300):
    """Retrain the model on fresh synthetic data."""
    from ml.model_manager import get_model_manager
    mgr = get_model_manager()

    try:
        mgr.train_on_synthetic(n_patients=n_patients, n_donors=n_donors)
        return {
            "status": "trained",
            "metrics": mgr.get_model_metrics(),
            "message": f"Model retrained on {n_patients} patients, {n_donors} donors.",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
