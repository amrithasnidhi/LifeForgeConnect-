import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, Plus, ChevronRight,
  X, UserCheck, AlertTriangle, CheckCircle, Loader2, RefreshCw,
  Brain, Activity, BarChart3, TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import type { ThalPatient, CalendarDay } from "@/lib/api";

// ── Types for new endpoints ───────────────────────────────────────────────────
interface ThalPatientExt extends ThalPatient {
  needs_match_now: boolean;
  past_donor_ids: string[];
}

interface ThalMatch {
  donor_id: string;
  name: string;
  blood_group: string;
  city: string;
  trust_score: number;
  is_verified: boolean;
}

interface MatchResult {
  patient_name: string;
  blood_group: string;
  next_transfusion: string;
  days_until: number | null;
  early_warning: string | null;
  excluded_donors: number;
  matches: ThalMatch[];
}

const BASE = import.meta.env.VITE_API_URL ?? "";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem("lf_token");
  // Use relative path when BASE is empty (for Vite proxy), otherwise use absolute URL
  const url = BASE ? BASE + path : path;
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

// ── Register Patient Modal ────────────────────────────────────────────────────
function RegisterModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "", blood_group: "", hospital_id: "",
    transfusion_frequency_days: 21, last_transfusion_date: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.thal.registerPatient({
        name: form.name,
        blood_group: form.blood_group,
        hospital_id: form.hospital_id,
        transfusion_frequency_days: Number(form.transfusion_frequency_days),
        last_transfusion_date: form.last_transfusion_date || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-card border-2 border-thal/30 rounded-2xl p-7 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold text-foreground">Register Patient</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Patient Name *</label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Full name"
              required
              className="rounded-xl border-thal/20 focus:border-thal"
            />
          </div>
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Blood Group *</label>
            <select
              value={form.blood_group}
              onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}
              required
              className="w-full rounded-xl border border-thal/20 bg-background px-3 py-2 text-sm font-body focus:border-thal outline-none"
            >
              <option value="">Select blood group</option>
              {bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Hospital ID *</label>
            <Input
              value={form.hospital_id}
              onChange={e => setForm(f => ({ ...f, hospital_id: e.target.value }))}
              placeholder="Hospital UUID"
              required
              className="rounded-xl border-thal/20 focus:border-thal"
            />
          </div>
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">
              Transfusion Frequency (days)
            </label>
            <Input
              type="number"
              value={form.transfusion_frequency_days}
              onChange={e => setForm(f => ({ ...f, transfusion_frequency_days: parseInt(e.target.value) }))}
              min={7} max={60}
              className="rounded-xl border-thal/20 focus:border-thal"
            />
          </div>
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Last Transfusion Date</label>
            <Input
              type="date"
              value={form.last_transfusion_date}
              onChange={e => setForm(f => ({ ...f, last_transfusion_date: e.target.value }))}
              className="rounded-xl border-thal/20 focus:border-thal"
            />
          </div>

          {error && (
            <div className="bg-blood/10 border border-blood/30 rounded-xl px-4 py-2 text-blood font-body text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-thal text-primary-foreground font-body font-bold rounded-xl mt-1"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            {loading ? "Registering…" : "Register Patient"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Find Donor Modal ──────────────────────────────────────────────────────────
function FindDonorModal({
  patient,
  onClose,
  onAssigned,
}: {
  patient: ThalPatientExt;
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    apiFetch<MatchResult>(`/thal/patients/${patient.id}/matches`)
      .then(setResult)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [patient.id]);

  async function assignDonor(donorId: string) {
    setAssigning(donorId);
    setError("");
    try {
      await apiFetch("/thal/assign-donor", {
        method: "POST",
        body: JSON.stringify({ patient_id: patient.id, donor_id: donorId }),
      });
      setSuccess("Donor assigned successfully!");
      setTimeout(() => { onAssigned(); onClose(); }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAssigning(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-card border-2 border-thal/30 rounded-2xl p-7 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Find Donor</h2>
            <p className="font-body text-xs text-muted-foreground mt-0.5">
              for <span className="text-thal font-semibold">{patient.name}</span> · {patient.group}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-10 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-thal" />
            <p className="font-body text-sm">Finding compatible donors…</p>
          </div>
        )}

        {!loading && result && (
          <>
            {result.early_warning && (
              <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-amber-600 font-body text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" /> {result.early_warning}
              </div>
            )}
            {result.excluded_donors > 0 && (
              <div className="mb-4 bg-thal/8 border border-thal/20 rounded-xl px-4 py-2 font-body text-xs text-thal flex items-center gap-2">
                <UserCheck className="w-4 h-4 shrink-0" />
                {result.excluded_donors} donor(s) excluded — already donated to this patient before
              </div>
            )}
            {result.matches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground font-body text-sm">
                No eligible new donors found for {patient.group}.
              </div>
            ) : (
              <div className="space-y-3">
                {result.matches.map(d => (
                  <div
                    key={d.donor_id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-thal/20 bg-thal/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-thal/15 flex items-center justify-center font-display font-bold text-thal text-sm">
                        {d.blood_group}
                      </div>
                      <div>
                        <div className="font-body font-semibold text-sm text-foreground">{d.name}</div>
                        <div className="font-body text-xs text-muted-foreground">{d.city} · Trust {d.trust_score}%</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => assignDonor(d.donor_id)}
                      disabled={assigning === d.donor_id || !!success}
                      className="bg-thal text-primary-foreground font-body text-xs rounded-lg shrink-0"
                    >
                      {assigning === d.donor_id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Assign"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 bg-blood/10 border border-blood/30 rounded-xl px-4 py-2 text-blood font-body text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2 text-green-600 font-body text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Mark Transfusion Done Modal ───────────────────────────────────────────────
function MarkDoneModal({
  patient,
  onClose,
  onDone,
}: {
  patient: ThalPatientExt;
  onClose: () => void;
  onDone: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [transDate, setTransDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.thal.markDone(patient.id, transDate);
      onDone();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-card border-2 border-thal/30 rounded-2xl p-7 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold">Mark Transfusion Done</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="font-body text-sm text-muted-foreground mb-4">
          Recording transfusion for <span className="text-foreground font-semibold">{patient.name}</span>. This will reset the cycle.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Transfusion Date</label>
            <Input
              type="date"
              value={transDate}
              max={today}
              onChange={e => setTransDate(e.target.value)}
              className="rounded-xl border-thal/20 focus:border-thal"
            />
          </div>
          {error && (
            <div className="bg-blood/10 border border-blood/30 rounded-xl px-4 py-2 text-blood font-body text-xs">
              {error}
            </div>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-thal text-primary-foreground font-body font-bold rounded-xl"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            {loading ? "Saving…" : "Mark as Done"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ThalCare() {
  const [patients, setPatients] = useState<ThalPatientExt[]>([]);
  const [calendar, setCalendar] = useState<CalendarDay[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState(false);

  const [showRegister, setShowRegister] = useState(false);
  const [findDonorFor, setFindDonorFor] = useState<ThalPatientExt | null>(null);
  const [markDoneFor, setMarkDoneFor] = useState<ThalPatientExt | null>(null);

  // ML Prediction state
  const [mlAlerts, setMlAlerts] = useState<any>(null);
  const [mlMetrics, setMlMetrics] = useState<any>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlPrediction, setMlPrediction] = useState<any>(null);
  const [predicting, setPredicting] = useState(false);
  const [predForm, setPredForm] = useState({
    age: 20, weight_kg: 45, splenectomy: false, chelation_therapy: true,
    baseline_hb: 7.5, last_hb_pre: 7.0, last_hb_post: 10.5,
    days_since_last_tx: 18, avg_interval_last3: 21, hb_decay_rate: -0.07,
  });

  function fetchData() {
    setLoadingData(true);
    setErrorData(false);
    Promise.all([
      apiFetch<ThalPatientExt[]>("/thal/patients"),
      api.thal.getCalendar(7),
    ])
      .then(([p, c]) => {
        setPatients(p);
        setCalendar(c);
      })
      .catch(() => setErrorData(true))
      .finally(() => setLoadingData(false));
  }

  useEffect(() => { fetchData(); }, []);

  // Fetch ML data
  function fetchMLData() {
    setMlLoading(true);
    Promise.all([
      api.thalML.getAlerts(20),
      api.thalML.getModelInfo(),
    ])
      .then(([alerts, info]) => {
        setMlAlerts(alerts);
        setMlMetrics(info);
      })
      .catch((e) => console.warn("ML data fetch error:", e))
      .finally(() => setMlLoading(false));
  }

  async function runPrediction() {
    setPredicting(true);
    setMlPrediction(null);
    try {
      const result = await api.thalML.predict(predForm);
      setMlPrediction(result);
    } catch (e: any) {
      console.error("Prediction error:", e);
    } finally {
      setPredicting(false);
    }
  }

  const urgentCount = patients.filter(p => p.is_urgent).length;
  const needMatch = patients.filter(p => p.needs_match_now && p.donor === "Unmatched").length;

  const now = new Date();
  const monthLabel = now.toLocaleString("en-US", { month: "short", year: "numeric" });

  // ── Skeleton ──
  const PatientSkeleton = () => (
    <div className="rounded-2xl border-2 border-thal/20 bg-card p-5 shadow-card space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-thal/90 to-thal/50 text-primary-foreground py-16 px-4">
          <div className="container mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground font-body text-sm mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">💉</div>
              <div>
                <h1 className="font-display text-5xl font-black">ThalCare</h1>
                <p className="font-body text-primary-foreground/70 text-lg">
                  Recurring transfusion support for Thalassemia patients
                </p>
              </div>
            </div>
            <div className="flex gap-6 mt-6 flex-wrap">
              {[
                { label: "Active Patients", value: patients.length || "—" },
                { label: "Urgent (≤2 days)", value: urgentCount || "—" },
                { label: "Need Donor Now", value: needMatch || "—" },
              ].map(({ label, value }) => (
                <div key={label} className="glass rounded-xl px-5 py-3">
                  <div className="font-display text-2xl font-bold">{value}</div>
                  <div className="font-body text-xs text-primary-foreground/70">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ── Sidebar: Calendar + Register ── */}
            <div className="space-y-5">
              {/* Calendar */}
              <div className="rounded-2xl border-2 border-thal/20 bg-card p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-thal" /> Transfusion Calendar
                  </h3>
                  <span className="font-body text-xs text-muted-foreground">{monthLabel}</span>
                </div>

                {loadingData ? (
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-lg" />
                    ))}
                  </div>
                ) : calendar.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="font-body text-xs text-muted-foreground">No calendar data.</p>
                    <Button variant="ghost" size="sm" className="mt-1 text-thal font-body text-xs" onClick={fetchData}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-7 gap-1.5">
                      {calendar.map((d) => (
                        <div
                          key={d.day}
                          className={`rounded-lg p-1.5 text-center transition-all ${d.has ? "bg-thal/15 border-2 border-thal/30" : "bg-muted/50"
                            }`}
                        >
                          <div className="font-body text-xs text-muted-foreground">{d.day}</div>
                          <div className={`font-display font-bold text-sm ${d.has ? "text-thal" : "text-foreground"}`}>
                            {d.date}
                          </div>
                          {d.has && <div className="w-1.5 h-1.5 rounded-full bg-thal mx-auto mt-0.5" />}
                        </div>
                      ))}
                    </div>
                    {calendar.filter(d => d.has).map(d => (
                      <div key={d.date} className="mt-3 p-2.5 rounded-lg bg-thal/8 border border-thal/20">
                        <span className="font-body text-xs font-semibold text-thal">
                          {d.day} {d.date}: {d.label}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Register Patient */}
              <div className="rounded-2xl border-2 border-thal/20 bg-thal/5 p-5">
                <h3 className="font-display text-base font-bold mb-2">Add Patient</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">
                  Register a Thalassemia patient and find a dedicated recurring donor.
                </p>
                <Button
                  onClick={() => setShowRegister(true)}
                  className="w-full bg-thal text-primary-foreground font-body font-bold rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Register Patient
                </Button>
              </div>

              {/* ML Prediction Card */}
              <div className="rounded-2xl border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-purple-500" />
                  <h3 className="font-display text-base font-bold">ML Prediction</h3>
                </div>
                <p className="font-body text-xs text-muted-foreground mb-4">
                  Predict when a patient will next need transfusion using our RF + GBM ensemble model.
                </p>

                <div className="space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-body text-[10px] text-muted-foreground">Age</label>
                      <Input type="number" value={predForm.age} onChange={e => setPredForm(f => ({ ...f, age: +e.target.value }))} className="h-8 text-xs rounded-lg border-purple-500/20" />
                    </div>
                    <div>
                      <label className="font-body text-[10px] text-muted-foreground">Weight (kg)</label>
                      <Input type="number" value={predForm.weight_kg} onChange={e => setPredForm(f => ({ ...f, weight_kg: +e.target.value }))} className="h-8 text-xs rounded-lg border-purple-500/20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-body text-[10px] text-muted-foreground">Hb Pre (g/dL)</label>
                      <Input type="number" step="0.1" value={predForm.last_hb_pre} onChange={e => setPredForm(f => ({ ...f, last_hb_pre: +e.target.value }))} className="h-8 text-xs rounded-lg border-purple-500/20" />
                    </div>
                    <div>
                      <label className="font-body text-[10px] text-muted-foreground">Hb Post (g/dL)</label>
                      <Input type="number" step="0.1" value={predForm.last_hb_post} onChange={e => setPredForm(f => ({ ...f, last_hb_post: +e.target.value }))} className="h-8 text-xs rounded-lg border-purple-500/20" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-body text-[10px] text-muted-foreground">Days Since Last Tx</label>
                      <Input type="number" value={predForm.days_since_last_tx} onChange={e => setPredForm(f => ({ ...f, days_since_last_tx: +e.target.value }))} className="h-8 text-xs rounded-lg border-purple-500/20" />
                    </div>
                    <div>
                      <label className="font-body text-[10px] text-muted-foreground">Avg Interval</label>
                      <Input type="number" value={predForm.avg_interval_last3} onChange={e => setPredForm(f => ({ ...f, avg_interval_last3: +e.target.value }))} className="h-8 text-xs rounded-lg border-purple-500/20" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <label className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                      <input type="checkbox" checked={predForm.splenectomy} onChange={e => setPredForm(f => ({ ...f, splenectomy: e.target.checked }))} className="rounded" />
                      Splenectomy
                    </label>
                    <label className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
                      <input type="checkbox" checked={predForm.chelation_therapy} onChange={e => setPredForm(f => ({ ...f, chelation_therapy: e.target.checked }))} className="rounded" />
                      Chelation
                    </label>
                  </div>
                </div>

                <Button
                  onClick={runPrediction}
                  disabled={predicting}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-body font-bold rounded-xl text-xs"
                >
                  {predicting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Activity className="w-4 h-4 mr-1.5" />}
                  {predicting ? "Predicting…" : "Run Prediction"}
                </Button>

                {mlPrediction && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-xl border-2 border-purple-500/20 p-4 bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-body text-xs text-muted-foreground">Predicted Next Tx</span>
                      <Badge className={`font-body text-xs border-0 ${mlPrediction.urgency === "URGENT" ? "bg-blood/15 text-blood"
                          : mlPrediction.urgency === "SOON" ? "bg-amber-500/15 text-amber-600"
                            : "bg-secondary/15 text-secondary"
                        }`}>
                        {mlPrediction.urgency}
                      </Badge>
                    </div>
                    <div className="font-display text-3xl font-black text-purple-600">
                      {mlPrediction.predicted_days} <span className="text-base font-normal text-muted-foreground">days</span>
                    </div>
                    <div className="font-body text-xs text-muted-foreground mt-1">
                      {mlPrediction.predicted_date} · Range: {mlPrediction.confidence_low}–{mlPrediction.confidence_high} days
                    </div>
                    <div className="flex gap-3 mt-3 text-[10px] font-body text-muted-foreground">
                      <span>🌲 RF: {mlPrediction.rf_prediction}d</span>
                      <span>📈 GBM: {mlPrediction.gb_prediction}d</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* ML Alerts Button */}
              <Button
                variant="outline"
                onClick={fetchMLData}
                disabled={mlLoading}
                className="w-full border-purple-500/30 text-purple-600 hover:bg-purple-500/10 font-body text-xs rounded-xl"
              >
                {mlLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-1.5" />}
                {mlLoading ? "Loading ML Dashboard…" : "Load ML Patient Alerts"}
              </Button>
            </div>

            {/* ── Patient List ── */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-foreground">Active Patients</h3>
                {errorData && (
                  <Button variant="ghost" size="sm" onClick={fetchData} className="text-thal font-body text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {loadingData ? (
                  Array.from({ length: 3 }).map((_, i) => <PatientSkeleton key={i} />)
                ) : patients.length === 0 ? (
                  <div className="text-center py-10 rounded-xl border-2 border-dashed border-border">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="font-body text-sm text-muted-foreground">No patients registered yet.</p>
                    <Button
                      variant="ghost" size="sm"
                      className="mt-3 text-thal font-body"
                      onClick={() => setShowRegister(true)}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Register the first patient
                    </Button>
                  </div>
                ) : (
                  patients.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className={`rounded-2xl border-2 bg-card p-5 shadow-card transition-all ${p.is_urgent
                        ? "border-blood/40 shadow-blood/10"
                        : p.needs_match_now
                          ? "border-amber-400/40"
                          : "border-thal/20"
                        }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-thal/10 flex items-center justify-center text-xl font-display font-bold text-thal">
                            {p.age != null ? `${p.age}y` : "—"}
                          </div>
                          <div>
                            <div className="font-body font-bold text-foreground">{p.name}</div>
                            <div className="font-body text-xs text-muted-foreground">{p.hospital}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            className={`font-body text-xs border-0 ${p.is_urgent
                              ? "bg-blood/15 text-blood"
                              : p.needs_match_now
                                ? "bg-amber-500/15 text-amber-600"
                                : "bg-thal/15 text-thal"
                              }`}
                          >
                            <Clock className="w-3 h-3 mr-1" /> {p.countdown}
                          </Badge>
                          {p.needs_match_now && (
                            <span className="font-body text-[10px] text-amber-600 font-semibold">
                              ⚡ Match window open
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details grid */}
                      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                        <div>
                          <div className="font-body text-xs text-muted-foreground">Blood Group</div>
                          <div className="font-display font-bold text-blood text-sm">{p.group}</div>
                        </div>
                        <div>
                          <div className="font-body text-xs text-muted-foreground">Frequency</div>
                          <div className="font-body font-semibold text-xs text-foreground">{p.freq}</div>
                        </div>
                        <div>
                          <div className="font-body text-xs text-muted-foreground">Dedicated Donor</div>
                          <div className={`font-body font-semibold text-xs ${p.donor === "Unmatched" ? "text-blood" : "text-secondary"}`}>
                            {p.donor === "Unmatched" ? "⚠️ Unmatched" : `✓ ${p.donor}`}
                          </div>
                        </div>
                      </div>

                      {/* Next date */}
                      <div className="mt-3 font-body text-xs text-muted-foreground">
                        Next transfusion:{" "}
                        <span className="text-foreground font-semibold">{p.nextDate}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMarkDoneFor(p)}
                          className="flex-1 border-thal text-thal font-body text-xs rounded-lg hover:bg-thal hover:text-primary-foreground"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Mark Transfusion Done
                        </Button>

                        {(p.donor === "Unmatched" || p.needs_match_now) && (
                          <Button
                            size="sm"
                            onClick={() => setFindDonorFor(p)}
                            className="flex-1 bg-thal text-primary-foreground font-body text-xs rounded-lg"
                          >
                            Find Donor <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>

                      {/* No-repeat info */}
                      {p.past_donor_ids.length > 0 && (
                        <div className="mt-2 font-body text-[10px] text-muted-foreground">
                          🔒 {p.past_donor_ids.length} donor(s) already used — excluded from future matches
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── ML Alerts Dashboard ── */}
        {mlAlerts && (
          <div className="container mx-auto px-4 pb-10">
            <div className="rounded-2xl border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Brain className="w-6 h-6 text-purple-500" />
                  <div>
                    <h2 className="font-display text-xl font-bold">ML Prediction Dashboard</h2>
                    <p className="font-body text-xs text-muted-foreground">
                      {mlMetrics?.model_type} · Generated {new Date(mlAlerts.generated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {mlMetrics?.metrics && (
                  <div className="flex gap-4">
                    {[{ label: "MAE", value: `${mlMetrics.metrics.mae}d`, color: "text-purple-600" },
                    { label: "RMSE", value: `${mlMetrics.metrics.rmse}d`, color: "text-indigo-600" },
                    { label: "R²", value: mlMetrics.metrics.r2, color: "text-blue-600" },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <div className={`font-display font-bold text-lg ${m.color}`}>{m.value}</div>
                        <div className="font-body text-[10px] text-muted-foreground">{m.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Urgency Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { tier: "URGENT", count: mlAlerts.urgent_count, items: mlAlerts.urgent, color: "blood", icon: "🚨" },
                  { tier: "SOON", count: mlAlerts.soon_count, items: mlAlerts.soon, color: "amber-500", icon: "⚡" },
                  { tier: "STABLE", count: mlAlerts.stable_count, items: mlAlerts.stable, color: "secondary", icon: "✅" },
                ].map(t => (
                  <div key={t.tier} className={`rounded-xl border-2 border-${t.color}/20 bg-${t.color}/5 p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{t.icon}</span>
                      <span className="font-display font-bold text-sm">{t.tier}</span>
                    </div>
                    <div className={`font-display text-3xl font-black text-${t.color}`}>{t.count}</div>
                    <div className="font-body text-xs text-muted-foreground">patients</div>
                  </div>
                ))}
              </div>

              {/* Patient Alerts Table */}
              {mlAlerts.urgent.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-display text-sm font-bold text-blood mb-3 flex items-center gap-2">
                    🚨 Urgent — Transfusion needed within 7 days
                  </h3>
                  <div className="space-y-2">
                    {mlAlerts.urgent.map((a: any) => (
                      <div key={a.patient_id} className="flex items-center justify-between p-3 rounded-xl bg-blood/5 border border-blood/20">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blood/15 flex items-center justify-center font-display text-xs font-bold text-blood">
                            {a.blood_type}
                          </div>
                          <div>
                            <div className="font-body font-semibold text-sm">{a.patient_id}</div>
                            <div className="font-body text-xs text-muted-foreground">
                              {a.eligible_donors} eligible donors · {a.excluded_donors} excluded
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display font-bold text-blood">{a.predicted_days}d</div>
                          <div className="font-body text-[10px] text-muted-foreground">
                            {a.confidence_low}–{a.confidence_high}d range
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mlAlerts.soon.length > 0 && (
                <div>
                  <h3 className="font-display text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
                    ⚡ Soon — Transfusion needed within 8–14 days
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mlAlerts.soon.slice(0, 6).map((a: any) => (
                      <div key={a.patient_id} className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                        <div className="font-body font-semibold text-xs">{a.patient_id}</div>
                        <div className="font-display font-bold text-amber-600">{a.predicted_days}d</div>
                        <div className="font-body text-[10px] text-muted-foreground">{a.predicted_date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
      <Footer />

      {/* Modals */}
      <AnimatePresence>
        {showRegister && (
          <RegisterModal
            onClose={() => setShowRegister(false)}
            onSuccess={fetchData}
          />
        )}
        {findDonorFor && (
          <FindDonorModal
            patient={findDonorFor}
            onClose={() => setFindDonorFor(null)}
            onAssigned={fetchData}
          />
        )}
        {markDoneFor && (
          <MarkDoneModal
            patient={markDoneFor}
            onClose={() => setMarkDoneFor(null)}
            onDone={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}