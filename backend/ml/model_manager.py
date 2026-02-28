"""
ml/model_manager.py
-------------------
Singleton manager that:
  1. Trains the model on synthetic data at startup
  2. Provides prediction / matching / alert methods
  3. Can be retrained on real Supabase data when available
"""

import joblib
import os
from pathlib import Path
from datetime import datetime

from ml.transfusion_predictor import (
    TransfusionFeatureEngineer,
    TransfusionTimingModel,
    DonorMatchingEngine,
    PatientAlertSystem,
    generate_synthetic_data,
)

MODEL_DIR = Path(__file__).parent / "saved_models"
MODEL_PATH = MODEL_DIR / "thal_model.joblib"


class ThalModelManager:
    """
    Manages the lifecycle of the ML prediction system.
    Call .ensure_ready() before making predictions.
    """

    def __init__(self):
        self.engineer = TransfusionFeatureEngineer()
        self.model = TransfusionTimingModel()
        self.matcher = None
        self.alert_system = None
        self._is_ready = False

        # Keep synthetic data around for batch alerts
        self._patients_df = None
        self._donors_df = None
        self._tx_df = None
        self._hb_df = None
        self._features_df = None

    @property
    def is_ready(self):
        return self._is_ready

    def ensure_ready(self):
        """Train on synthetic data if not already trained."""
        if self._is_ready:
            return

        # Try loading a saved model first
        if MODEL_PATH.exists():
            try:
                saved = joblib.load(MODEL_PATH)
                self.model = saved["model"]
                self.matcher = saved["matcher"]
                self._patients_df = saved["patients_df"]
                self._donors_df = saved["donors_df"]
                self._tx_df = saved["tx_df"]
                self._hb_df = saved["hb_df"]
                self._features_df = saved["features_df"]
                self.alert_system = PatientAlertSystem(
                    self.model, self.matcher, self.engineer
                )
                self._is_ready = True
                print("[ThalML] Loaded saved model from disk.")
                return
            except Exception as e:
                print(f"[ThalML] Could not load saved model: {e}. Retraining...")

        self.train_on_synthetic()

    def train_on_synthetic(self, n_patients=80, n_donors=300):
        """Train on synthetic data for demonstration."""
        print("[ThalML] Generating synthetic training data...")
        patients_df, donors_df, tx_df, hb_df = generate_synthetic_data(
            n_patients=n_patients, n_donors=n_donors
        )

        self._patients_df = patients_df
        self._donors_df = donors_df
        self._tx_df = tx_df
        self._hb_df = hb_df

        print("[ThalML] Building features...")
        self._features_df = self.engineer.build_features(patients_df, tx_df, hb_df)

        print("[ThalML] Training ensemble model...")
        self.model.fit(self._features_df, verbose=True)

        print("[ThalML] Initializing donor matching engine...")
        self.matcher = DonorMatchingEngine(tx_df)

        self.alert_system = PatientAlertSystem(
            self.model, self.matcher, self.engineer
        )

        # Save to disk
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        joblib.dump({
            "model": self.model,
            "matcher": self.matcher,
            "patients_df": patients_df,
            "donors_df": donors_df,
            "tx_df": tx_df,
            "hb_df": hb_df,
            "features_df": self._features_df,
            "trained_at": datetime.now().isoformat(),
        }, MODEL_PATH)

        self._is_ready = True
        print("[ThalML] Model ready!")

    def predict_for_patient(self, patient_id: str) -> dict:
        """Predict next transfusion for a specific patient."""
        self.ensure_ready()

        features = self.engineer.build_features_for_prediction(
            patient_id, self._patients_df, self._tx_df, self._hb_df
        )
        return self.model.predict(features)

    def predict_from_params(
        self,
        age: int,
        weight_kg: float,
        splenectomy: bool,
        chelation_therapy: bool,
        baseline_hb: float,
        hb_pre: float,
        hb_post: float,
        days_since_last_tx: int,
        avg_interval: float = 21.0,
        hb_decay_rate: float = -0.07,
    ) -> dict:
        """Predict from raw clinical parameters (for real patients)."""
        self.ensure_ready()

        import pandas as pd
        from ml.transfusion_predictor import FEATURE_COLS

        features = pd.DataFrame([{
            "age": age,
            "weight_kg": weight_kg,
            "splenectomy": int(splenectomy),
            "chelation_therapy": int(chelation_therapy),
            "baseline_hb": baseline_hb,
            "hb_pre_transfusion": hb_pre,
            "hb_post_transfusion": hb_post,
            "hb_rise": hb_post - hb_pre,
            "units_transfused": 2,
            "reaction_occurred": 0,
            "tx_number": 10,
            "month_of_year": datetime.now().month,
            "days_since_prev_tx": days_since_last_tx,
            "hb_decay_rate": hb_decay_rate,
            "predicted_hb_at_14d": hb_post + (hb_decay_rate * 14),
            "predicted_hb_at_21d": hb_post + (hb_decay_rate * 21),
            "avg_interval_last3": avg_interval,
            "min_interval_last3": max(14, avg_interval - 3),
            "std_interval_last3": 2.5,
        }])

        return self.model.predict(features)

    def match_donors(self, patient_id: str, blood_type: str, top_n: int = 5) -> dict:
        """Find eligible donors for a patient."""
        self.ensure_ready()

        excluded = self.matcher.get_excluded_donors(patient_id)
        matches = self.matcher.match(
            patient_id, blood_type, self._donors_df, top_n=top_n
        )

        donors_list = []
        if not matches.empty:
            for _, row in matches.iterrows():
                donors_list.append({
                    "donor_id": row["donor_id"],
                    "blood_type": row["blood_type"],
                    "score": round(row["score"], 3),
                    "total_donations": int(row["total_donations"]),
                    "last_donation_date": row["last_donation_date"].strftime("%Y-%m-%d") if not pd.isna(row["last_donation_date"]) else None,
                })

        return {
            "patient_id": patient_id,
            "eligible_donors": donors_list,
            "excluded_count": len(excluded),
        }

    def get_daily_alerts(self, limit: int = 20) -> dict:
        """Run batch predictions for all patients."""
        self.ensure_ready()

        sample = self._patients_df.head(limit)
        alerts = self.alert_system.run_daily_batch(
            sample, self._tx_df, self._hb_df, self._donors_df
        )

        alert_list = alerts.to_dict(orient="records") if not alerts.empty else []

        urgent = [a for a in alert_list if a["urgency"] == "URGENT"]
        soon   = [a for a in alert_list if a["urgency"] == "SOON"]
        stable = [a for a in alert_list if a["urgency"] == "STABLE"]

        return {
            "generated_at": datetime.now().isoformat(),
            "total_patients": len(alert_list),
            "urgent_count": len(urgent),
            "soon_count": len(soon),
            "stable_count": len(stable),
            "urgent": urgent,
            "soon": soon,
            "stable": stable,
        }

    def get_model_metrics(self) -> dict:
        """Return training metrics."""
        self.ensure_ready()
        return self.model.training_metrics or {}

    def get_patient_history(self, patient_id: str) -> dict:
        """Return full transfusion history + exclusions for a patient."""
        self.ensure_ready()

        tx = self._tx_df[self._tx_df["patient_id"] == patient_id]
        excluded = self.matcher.get_excluded_donors(patient_id)

        history = []
        for _, row in tx.iterrows():
            history.append({
                "transfusion_date": row["transfusion_date"].strftime("%Y-%m-%d"),
                "donor_id": row["donor_id"],
                "hb_pre": round(row["hb_pre_transfusion"], 1),
                "hb_post": round(row["hb_post_transfusion"], 1),
                "units": int(row["units_transfused"]),
                "reaction": bool(row["reaction_occurred"]),
            })

        return {
            "patient_id": patient_id,
            "transfusions": history,
            "excluded_donors": list(excluded),
            "total_transfusions": len(history),
        }


# Global singleton
import pandas as pd  # noqa
_manager = ThalModelManager()


def get_model_manager() -> ThalModelManager:
    return _manager
