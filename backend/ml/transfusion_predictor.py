"""
Thalassemia Transfusion Timing Predictor
=========================================
Predicts WHEN a patient will need their next blood transfusion
using a combination of regression models trained on patient history,
hemoglobin trends, and clinical factors.

Architecture:
  1. Feature Engineering  → extract temporal + clinical features
  2. Transfusion Interval Predictor (RF + GBM ensemble)
  3. Urgency Classifier (flags patients needing transfusion < 7 days)
  4. Donor Matching Engine (rule-based hard filter + ranking)
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import warnings
warnings.filterwarnings("ignore")


# ─────────────────────────────────────────────────────────────────────────────
# 1.  FEATURE ENGINEERING
# ─────────────────────────────────────────────────────────────────────────────

class TransfusionFeatureEngineer:
    """
    Builds feature vectors for each patient from their transfusion history.
    Each row = one transfusion event, target = days until NEXT transfusion.
    """

    def build_features(
        self,
        patients_df: pd.DataFrame,
        transfusion_history_df: pd.DataFrame,
        hb_readings_df: pd.DataFrame
    ) -> pd.DataFrame:

        records = []

        for patient_id in transfusion_history_df["patient_id"].unique():
            pt_info = patients_df[patients_df["patient_id"] == patient_id]
            if pt_info.empty:
                continue
            pt_info = pt_info.iloc[0]

            pt_tx = (
                transfusion_history_df[transfusion_history_df["patient_id"] == patient_id]
                .sort_values("transfusion_date")
                .reset_index(drop=True)
            )

            pt_hb = hb_readings_df[hb_readings_df["patient_id"] == patient_id].copy()
            pt_hb = pt_hb.sort_values("reading_date")

            if len(pt_tx) < 2:
                continue

            for i in range(len(pt_tx) - 1):
                current_tx = pt_tx.iloc[i]
                next_tx    = pt_tx.iloc[i + 1]

                days_to_next = (
                    next_tx["transfusion_date"] - current_tx["transfusion_date"]
                ).days

                if days_to_next < 5 or days_to_next > 120:
                    continue

                hb_slope = self._calc_hb_slope(
                    pt_hb,
                    current_tx["transfusion_date"],
                    next_tx["transfusion_date"]
                )

                past_intervals = []
                for j in range(max(0, i - 3), i):
                    d = (pt_tx.iloc[j + 1]["transfusion_date"] - pt_tx.iloc[j]["transfusion_date"]).days
                    past_intervals.append(d)

                record = {
                    "patient_id"            : patient_id,
                    "age"                   : pt_info["age"],
                    "weight_kg"             : pt_info["weight_kg"],
                    "splenectomy"           : int(pt_info["splenectomy"]),
                    "chelation_therapy"     : int(pt_info["chelation_therapy"]),
                    "baseline_hb"           : pt_info["baseline_hb"],
                    "hb_pre_transfusion"    : current_tx["hb_pre_transfusion"],
                    "hb_post_transfusion"   : current_tx["hb_post_transfusion"],
                    "hb_rise"               : current_tx["hb_post_transfusion"] - current_tx["hb_pre_transfusion"],
                    "units_transfused"      : current_tx["units_transfused"],
                    "reaction_occurred"     : int(current_tx["reaction_occurred"]),
                    "tx_number"             : i + 1,
                    "month_of_year"         : current_tx["transfusion_date"].month,
                    "days_since_prev_tx"    : (
                        current_tx["transfusion_date"] - pt_tx.iloc[max(0, i-1)]["transfusion_date"]
                    ).days if i > 0 else 21,
                    "hb_decay_rate"         : hb_slope,
                    "predicted_hb_at_14d"   : current_tx["hb_post_transfusion"] + (hb_slope * 14),
                    "predicted_hb_at_21d"   : current_tx["hb_post_transfusion"] + (hb_slope * 21),
                    "avg_interval_last3"    : np.mean(past_intervals) if past_intervals else 21,
                    "min_interval_last3"    : np.min(past_intervals) if past_intervals else 14,
                    "std_interval_last3"    : np.std(past_intervals) if past_intervals else 0,
                    "days_to_next_tx"       : days_to_next,
                }
                records.append(record)

        df = pd.DataFrame(records)
        return df

    def _calc_hb_slope(self, hb_df, start_date, end_date):
        mask = (hb_df["reading_date"] > start_date) & (hb_df["reading_date"] < end_date)
        window = hb_df[mask]

        if len(window) < 2:
            return -0.07

        days = [(d - start_date).days for d in window["reading_date"]]
        hbs  = window["hb_value"].tolist()
        slope = np.polyfit(days, hbs, 1)[0]
        return float(slope)

    def build_features_for_prediction(
        self,
        patient_id: str,
        patients_df: pd.DataFrame,
        transfusion_history_df: pd.DataFrame,
        hb_readings_df: pd.DataFrame
    ) -> pd.DataFrame:
        full_df = self.build_features(
            patients_df,
            transfusion_history_df,
            hb_readings_df
        )
        pt_features = full_df[full_df["patient_id"] == patient_id]
        if pt_features.empty:
            raise ValueError(f"Could not build features for patient {patient_id}")

        return pt_features.iloc[[-1]]


# ─────────────────────────────────────────────────────────────────────────────
# 2.  TRANSFUSION TIMING MODEL
# ─────────────────────────────────────────────────────────────────────────────

FEATURE_COLS = [
    "age", "weight_kg", "splenectomy", "chelation_therapy", "baseline_hb",
    "hb_pre_transfusion", "hb_post_transfusion", "hb_rise",
    "units_transfused", "reaction_occurred", "tx_number",
    "month_of_year", "days_since_prev_tx",
    "hb_decay_rate", "predicted_hb_at_14d", "predicted_hb_at_21d",
    "avg_interval_last3", "min_interval_last3", "std_interval_last3",
]

TARGET_COL = "days_to_next_tx"


class TransfusionTimingModel:
    """
    Ensemble model predicting days until next transfusion.
    Uses Random Forest (60%) + Gradient Boosting (40%).
    """

    def __init__(self):
        self.rf_model = RandomForestRegressor(
            n_estimators=200,
            max_depth=10,
            min_samples_leaf=3,
            random_state=42,
            n_jobs=-1
        )
        self.gb_model = GradientBoostingRegressor(
            n_estimators=200,
            learning_rate=0.05,
            max_depth=5,
            subsample=0.8,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_fitted = False
        self.feature_importance = None
        self.training_metrics = None

    def fit(self, features_df: pd.DataFrame, verbose: bool = True):
        X = features_df[FEATURE_COLS].fillna(features_df[FEATURE_COLS].median())
        y = features_df[TARGET_COL]

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_val_scaled   = self.scaler.transform(X_val)

        self.rf_model.fit(X_train_scaled, y_train)
        self.gb_model.fit(X_train_scaled, y_train)

        rf_pred  = self.rf_model.predict(X_val_scaled)
        gb_pred  = self.gb_model.predict(X_val_scaled)
        ensemble = 0.6 * rf_pred + 0.4 * gb_pred

        self.feature_importance = pd.Series(
            self.rf_model.feature_importances_,
            index=FEATURE_COLS
        ).sort_values(ascending=False)

        mae  = mean_absolute_error(y_val, ensemble)
        rmse = np.sqrt(mean_squared_error(y_val, ensemble))
        r2   = r2_score(y_val, ensemble)

        self.training_metrics = {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "r2": round(r2, 4),
            "train_samples": len(X_train),
            "val_samples": len(X_val),
            "top_features": {
                feat: round(imp, 4) for feat, imp in self.feature_importance.head(5).items()
            }
        }

        if verbose:
            print(f"  Model trained: MAE={mae:.1f}d, RMSE={rmse:.1f}d, R²={r2:.3f}")

        self.is_fitted = True

    def predict(self, X: pd.DataFrame) -> dict:
        if not self.is_fitted:
            raise RuntimeError("Model not fitted. Call .fit() first.")

        X_input = X[FEATURE_COLS].fillna(0)
        X_scaled = self.scaler.transform(X_input)

        rf_pred = self.rf_model.predict(X_scaled)[0]
        gb_pred = self.gb_model.predict(X_scaled)[0]

        predicted_days = max(5, round(0.6 * rf_pred + 0.4 * gb_pred))

        tree_preds = np.array([t.predict(X_scaled) for t in self.rf_model.estimators_])
        std_dev = tree_preds.std()
        low  = max(5, round(predicted_days - std_dev))
        high = round(predicted_days + std_dev)

        if predicted_days <= 7:
            urgency = "URGENT"
        elif predicted_days <= 14:
            urgency = "SOON"
        else:
            urgency = "STABLE"

        return {
            "predicted_days"   : predicted_days,
            "next_date"        : datetime.now() + timedelta(days=predicted_days),
            "urgency"          : urgency,
            "confidence_range" : (low, high),
            "rf_prediction"    : round(rf_pred),
            "gb_prediction"    : round(gb_pred),
        }


# ─────────────────────────────────────────────────────────────────────────────
# 3.  DONOR MATCHING ENGINE
# ─────────────────────────────────────────────────────────────────────────────

BLOOD_TYPE_COMPATIBILITY = {
    "O-": ["O-"],
    "O+": ["O-", "O+"],
    "A-": ["O-", "A-"],
    "A+": ["O-", "O+", "A-", "A+"],
    "B-": ["O-", "B-"],
    "B+": ["O-", "O+", "B-", "B+"],
    "AB-": ["O-", "A-", "B-", "AB-"],
    "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
}


class DonorMatchingEngine:
    """
    Matches patients with eligible donors while enforcing
    the alloimmunization exclusion rule.
    """

    def __init__(self, transfusion_history_df: pd.DataFrame):
        self.exclusion_map = (
            transfusion_history_df
            .groupby("patient_id")["donor_id"]
            .apply(set)
            .to_dict()
        )

    def get_excluded_donors(self, patient_id: str) -> set:
        return self.exclusion_map.get(patient_id, set())

    def match(
        self,
        patient_id: str,
        patient_blood_type: str,
        donors_df: pd.DataFrame,
        top_n: int = 5
    ) -> pd.DataFrame:
        excluded = self.get_excluded_donors(patient_id)
        compatible_types = BLOOD_TYPE_COMPATIBILITY.get(patient_blood_type, [])

        eligible = donors_df[
            (donors_df["blood_type"].isin(compatible_types)) &
            (~donors_df["donor_id"].isin(excluded)) &
            (donors_df["is_available"] == True) &
            (
                donors_df["last_donation_date"].isna() |
                (datetime.now() - donors_df["last_donation_date"]).dt.days >= 56
            )
        ].copy()

        if eligible.empty:
            return pd.DataFrame()

        now = datetime.now()
        eligible["days_since_last_donation"] = (
            now - eligible["last_donation_date"]
        ).dt.days.fillna(999)

        max_donations = eligible["total_donations"].max()
        if max_donations > 0:
            eligible["score"] = (
                0.4 * (eligible["total_donations"] / max_donations) +
                0.3 * (eligible["days_since_last_donation"].clip(56, 365) / 365) +
                0.3 * 1.0
            )
        else:
            eligible["score"] = 0.5

        ranked = eligible.sort_values("score", ascending=False).head(top_n)
        return ranked[["donor_id", "blood_type", "score", "is_available",
                        "last_donation_date", "total_donations"]]


# ─────────────────────────────────────────────────────────────────────────────
# 4.  PATIENT ALERT SYSTEM
# ─────────────────────────────────────────────────────────────────────────────

class PatientAlertSystem:
    """Runs batch predictions for all active patients."""

    def __init__(
        self,
        timing_model: TransfusionTimingModel,
        matching_engine: DonorMatchingEngine,
        feature_engineer: TransfusionFeatureEngineer
    ):
        self.model    = timing_model
        self.matcher  = matching_engine
        self.engineer = feature_engineer

    def run_daily_batch(
        self,
        patients_df: pd.DataFrame,
        transfusion_history_df: pd.DataFrame,
        hb_readings_df: pd.DataFrame,
        donors_df: pd.DataFrame
    ) -> pd.DataFrame:
        results = []

        for _, patient in patients_df.iterrows():
            pid = patient["patient_id"]

            try:
                features = self.engineer.build_features_for_prediction(
                    pid, patients_df, transfusion_history_df, hb_readings_df
                )
                prediction = self.model.predict(features)

                matched_donors = self.matcher.match(
                    pid,
                    patient["blood_type"],
                    donors_df,
                    top_n=3
                )

                results.append({
                    "patient_id"          : pid,
                    "blood_type"          : patient["blood_type"],
                    "predicted_days"      : prediction["predicted_days"],
                    "predicted_date"      : prediction["next_date"].strftime("%Y-%m-%d"),
                    "urgency"             : prediction["urgency"],
                    "confidence_low"      : prediction["confidence_range"][0],
                    "confidence_high"     : prediction["confidence_range"][1],
                    "eligible_donors"     : len(matched_donors),
                    "top_donor_id"        : matched_donors.iloc[0]["donor_id"] if not matched_donors.empty else "NONE",
                    "excluded_donors"     : len(self.matcher.get_excluded_donors(pid)),
                })
            except Exception as e:
                print(f"  Warning: Could not process patient {pid}: {e}")

        alerts_df = pd.DataFrame(results)

        if not alerts_df.empty:
            urgency_order = {"URGENT": 0, "SOON": 1, "STABLE": 2}
            alerts_df["urgency_rank"] = alerts_df["urgency"].map(urgency_order)
            alerts_df = alerts_df.sort_values(["urgency_rank", "predicted_days"]).drop("urgency_rank", axis=1)

        return alerts_df


# ─────────────────────────────────────────────────────────────────────────────
# 5.  SYNTHETIC DATA GENERATOR
# ─────────────────────────────────────────────────────────────────────────────

def generate_synthetic_data(n_patients=50, n_donors=200, seed=42):
    """Generate realistic synthetic data for training."""
    np.random.seed(seed)
    blood_types = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]
    bt_weights  = [0.07, 0.38, 0.06, 0.34, 0.02, 0.09, 0.01, 0.03]

    patients = []
    for i in range(n_patients):
        patients.append({
            "patient_id"        : f"PT{i:04d}",
            "blood_type"        : np.random.choice(blood_types, p=bt_weights),
            "age"               : np.random.randint(5, 40),
            "weight_kg"         : np.random.uniform(20, 80),
            "thalassemia_type"  : "major",
            "splenectomy"       : np.random.choice([True, False], p=[0.4, 0.6]),
            "chelation_therapy" : np.random.choice([True, False], p=[0.8, 0.2]),
            "baseline_hb"       : np.random.uniform(6.0, 9.0),
        })
    patients_df = pd.DataFrame(patients)

    donors = []
    for i in range(n_donors):
        last_donated = datetime.now() - timedelta(days=np.random.randint(0, 300))
        donors.append({
            "donor_id"           : f"DN{i:04d}",
            "blood_type"         : np.random.choice(blood_types, p=bt_weights),
            "is_available"       : np.random.choice([True, False], p=[0.7, 0.3]),
            "last_donation_date" : last_donated,
            "location"           : f"Zone{np.random.randint(1,5)}",
            "total_donations"    : np.random.randint(1, 50),
        })
    donors_df = pd.DataFrame(donors)

    tx_records = []
    hb_records = []
    donor_ids  = donors_df["donor_id"].tolist()

    for _, pt in patients_df.iterrows():
        pid = pt["patient_id"]
        n_tx = np.random.randint(10, 30)
        current_date = datetime.now() - timedelta(days=n_tx * 21)
        used_donors  = set()

        for j in range(n_tx):
            interval = int(np.random.normal(21, 4))
            interval = max(14, min(35, interval))
            tx_date  = current_date

            available = [d for d in donor_ids if d not in used_donors]
            donor = np.random.choice(available) if available else np.random.choice(donor_ids)
            used_donors.add(donor)

            hb_pre  = np.random.uniform(6.5, 8.5)
            hb_post = hb_pre + np.random.uniform(2.0, 3.5)

            tx_records.append({
                "patient_id"          : pid,
                "transfusion_date"    : tx_date,
                "hb_pre_transfusion"  : round(hb_pre, 1),
                "hb_post_transfusion" : round(hb_post, 1),
                "units_transfused"    : np.random.randint(2, 4),
                "donor_id"            : donor,
                "reaction_occurred"   : np.random.choice([True, False], p=[0.05, 0.95]),
            })

            for _ in range(np.random.randint(3, 6)):
                read_day = tx_date + timedelta(days=np.random.randint(1, interval - 1))
                days_elapsed = (read_day - tx_date).days
                decay = np.random.uniform(0.05, 0.1)
                hb_records.append({
                    "patient_id"   : pid,
                    "reading_date" : read_day,
                    "hb_value"     : round(hb_post - (decay * days_elapsed), 1),
                    "reading_type" : "routine",
                })

            current_date += timedelta(days=interval)

    tx_df = pd.DataFrame(tx_records)
    hb_df = pd.DataFrame(hb_records)

    return patients_df, donors_df, tx_df, hb_df
