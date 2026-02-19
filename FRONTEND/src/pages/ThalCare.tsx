import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, Clock, Plus, ChevronRight,
  Loader2, RefreshCw, CheckCircle2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, ThalPatient, CalendarDay, getCurrentUserId, isLoggedIn } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ThalCare() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ── Data state ──
  const [patients, setPatients] = useState<ThalPatient[]>([]);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // ── Loading / error ──
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [errorPatients, setErrorPatients] = useState(false);
  const [errorCalendar, setErrorCalendar] = useState(false);

  // ── Register form ──
  const [showRegForm, setShowRegForm] = useState(false);
  const [regName, setRegName] = useState("");
  const [regGroup, setRegGroup] = useState("B+");
  const [regFreq, setRegFreq] = useState("21");
  const [regLastDate, setRegLastDate] = useState("");
  const [registering, setRegistering] = useState(false);

  // ── Mark done state ──
  const [markingDoneId, setMarkingDoneId] = useState<string | null>(null);

  // ── Fetch patients ──
  const fetchPatients = async () => {
    setLoadingPatients(true);
    setErrorPatients(false);
    try {
      const data = await api.thal.getPatients();
      setPatients(data || []);
    } catch {
      setPatients([]);
      setErrorPatients(true);
    } finally {
      setLoadingPatients(false);
    }
  };

  // ── Fetch calendar ──
  const fetchCalendar = async () => {
    setLoadingCalendar(true);
    setErrorCalendar(false);
    try {
      const data = await api.thal.getCalendar(7);
      setCalendarDays(data || []);
    } catch {
      setCalendarDays([]);
      setErrorCalendar(true);
    } finally {
      setLoadingCalendar(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchCalendar();
  }, []);

  // ── Register patient ──
  const handleRegister = async () => {
    if (!isLoggedIn()) {
      toast({ title: "Login Required", description: "Please log in to register patients.", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!regName.trim()) {
      toast({ title: "Name Required", description: "Please enter the patient's name.", variant: "destructive" });
      return;
    }
    setRegistering(true);
    try {
      const result = await api.thal.registerPatient({
        name: regName,
        blood_group: regGroup,
        hospital_id: getCurrentUserId(),
        transfusion_frequency_days: parseInt(regFreq) || 21,
        last_transfusion_date: regLastDate || undefined,
      });
      toast({
        title: "✅ Patient Registered!",
        description: (result as any).message || "Patient added successfully.",
      });
      setShowRegForm(false);
      setRegName("");
      setRegLastDate("");
      fetchPatients();
      fetchCalendar();
    } catch (err: any) {
      toast({ title: "Registration Failed", description: err.message || "Could not register patient.", variant: "destructive" });
    } finally {
      setRegistering(false);
    }
  };

  // ── Mark transfusion done ──
  const handleMarkDone = async (patientId: string, patientName: string) => {
    if (!isLoggedIn()) {
      toast({ title: "Login Required", description: "Please log in first.", variant: "destructive" });
      navigate("/login");
      return;
    }
    setMarkingDoneId(patientId);
    try {
      const today = new Date().toISOString().split("T")[0];
      const result = await api.thal.markDone(patientId, today);
      toast({
        title: `✅ Transfusion Recorded`,
        description: (result as any).message || `${patientName}'s transfusion marked complete.`,
      });
      fetchPatients();
      fetchCalendar();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Could not mark transfusion.", variant: "destructive" });
    } finally {
      setMarkingDoneId(null);
    }
  };

  // ── View Schedule / Find Donor ──
  const handleViewSchedule = (p: ThalPatient) => {
    toast({
      title: `Schedule: ${p.name}`,
      description: `Next: ${p.nextDate} · Frequency: ${p.freq} · Blood: ${p.group} · Hospital: ${p.hospital}`,
    });
  };

  const handleFindDonor = (p: ThalPatient) => {
    if (!isLoggedIn()) {
      toast({ title: "Login Required", description: "Please log in to find donors.", variant: "destructive" });
      navigate("/login");
      return;
    }
    toast({
      title: `Finding Donor for ${p.name}`,
      description: `Searching for ${p.group} donors near ${p.hospital}. You'll be notified when a match is found.`,
    });
  };

  // ── Skeletons ──
  const PatientSkeleton = () => (
    <div className="rounded-2xl border-2 border-thal/20 bg-card p-5 shadow-card space-y-4">
      <div className="flex items-center gap-3"><Skeleton className="w-12 h-12 rounded-2xl" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-40" /></div></div>
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
        <Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" />
      </div>
    </div>
  );

  // current month/year
  const now = new Date();
  const monthLabel = now.toLocaleString("en-US", { month: "short", year: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-thal/90 to-thal/50 text-primary-foreground py-16 px-4">
          <div className="container mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground font-body text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">💉</div>
              <div>
                <h1 className="font-display text-5xl font-black">ThalCare</h1>
                <p className="font-body text-primary-foreground/70 text-lg">Recurring transfusion support for Thalassemia patients</p>
              </div>
            </div>
            <div className="flex gap-6 mt-6 flex-wrap">
              {[
                { label: "Active Patients", value: String(patients.length || "—") },
                { label: "Urgent (≤2 days)", value: String(patients.filter(p => p.is_urgent).length) },
                { label: "This Week", value: String(calendarDays.filter(d => d.has).length) + " sessions" },
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
            {/* ── LEFT: Calendar + Add Patient ────────────────────────── */}
            <div className="space-y-5">
              {/* Calendar */}
              <div className="rounded-2xl border-2 border-thal/20 bg-card p-5 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-thal" /> Transfusion Calendar
                  </h3>
                  <span className="font-body text-xs text-muted-foreground">{monthLabel}</span>
                </div>
                {loadingCalendar ? (
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
                  </div>
                ) : calendarDays.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="font-body text-xs text-muted-foreground">No calendar data.</p>
                    <Button variant="ghost" size="sm" className="mt-1 text-thal font-body text-xs" onClick={fetchCalendar}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-7 gap-1.5">
                      {calendarDays.map((d, i) => (
                        <div
                          key={i}
                          className={`rounded-lg p-1.5 text-center transition-all cursor-pointer hover:ring-2 hover:ring-thal/30 ${d.has ? "bg-thal/15 border-2 border-thal/30" : "bg-muted/50"
                            }`}
                          onClick={() => {
                            if (d.has && d.patients?.length) {
                              toast({ title: `${d.day} ${d.date}`, description: `Patients: ${d.patients.join(", ")}` });
                            }
                          }}
                        >
                          <div className="font-body text-xs text-muted-foreground">{d.day}</div>
                          <div className={`font-display font-bold text-sm ${d.has ? "text-thal" : "text-foreground"}`}>{d.date}</div>
                          {d.has && <div className="w-1.5 h-1.5 rounded-full bg-thal mx-auto mt-0.5" />}
                        </div>
                      ))}
                    </div>
                    {calendarDays.filter(d => d.has).map((d, i) => (
                      <div key={i} className="mt-3 p-2.5 rounded-lg bg-thal/8 border border-thal/20 cursor-pointer hover:bg-thal/15 transition-all"
                        onClick={() => d.patients?.length && toast({ title: `${d.day} ${d.date}`, description: `Patients: ${d.patients.join(", ")}` })}
                      >
                        <span className="font-body text-xs font-semibold text-thal">{d.day} {d.date}: {d.label}</span>
                        {(d.patients?.length || 0) > 1 && (
                          <span className="font-body text-xs text-muted-foreground ml-1">+{d.patients!.length - 1} more</span>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Add Patient */}
              <div className="rounded-2xl border-2 border-thal/20 bg-thal/5 p-5">
                <h3 className="font-display text-base font-bold mb-2">Add Patient</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">Register a Thalassemia patient and find a dedicated recurring donor.</p>

                <AnimatePresence>
                  {showRegForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 mb-3 overflow-hidden"
                    >
                      <div>
                        <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Patient Name</label>
                        <Input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="Full name" className="h-9 rounded-lg font-body text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Blood Group</label>
                          <div className="grid grid-cols-4 gap-1">
                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                              <button
                                key={g}
                                onClick={() => setRegGroup(g)}
                                className={`h-7 rounded text-xs font-bold transition-all ${regGroup === g ? "bg-thal text-white border border-thal" : "border border-border hover:border-thal"
                                  }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Frequency (days)</label>
                          <Input type="number" value={regFreq} onChange={(e) => setRegFreq(e.target.value)} className="h-9 rounded-lg font-body text-sm" min={7} />
                        </div>
                        <div className="flex-1">
                          <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Last Transfusion</label>
                          <Input type="date" value={regLastDate} onChange={(e) => setRegLastDate(e.target.value)} className="h-9 rounded-lg font-body text-sm" />
                        </div>
                      </div>
                      <Button
                        className="w-full bg-thal text-primary-foreground font-body font-bold rounded-xl"
                        onClick={handleRegister}
                        disabled={registering}
                      >
                        {registering ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                        {registering ? "Registering..." : "Submit Registration"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  className={`w-full font-body font-bold rounded-xl ${showRegForm ? "bg-muted text-foreground" : "bg-thal text-primary-foreground"}`}
                  onClick={() => setShowRegForm(!showRegForm)}
                >
                  {showRegForm ? <><X className="w-4 h-4 mr-1.5" /> Cancel</> : <><Plus className="w-4 h-4 mr-1.5" /> Register Patient</>}
                </Button>
              </div>
            </div>

            {/* ── RIGHT: Patients list ─────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-xl font-bold text-foreground">Active Patients</h3>
                {errorPatients && (
                  <Button variant="ghost" size="sm" onClick={fetchPatients} className="text-thal font-body text-xs">
                    <RefreshCw className="w-3 h-3 mr-1" /> Retry
                  </Button>
                )}
              </div>
              <div className="space-y-4">
                {loadingPatients ? (
                  Array.from({ length: 3 }).map((_, i) => <PatientSkeleton key={i} />)
                ) : patients.length === 0 ? (
                  <div className="text-center py-10 rounded-xl border-2 border-dashed border-border">
                    <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <p className="font-body text-sm text-muted-foreground">No patients registered yet.</p>
                    <Button variant="ghost" size="sm" className="mt-3 text-thal font-body" onClick={fetchPatients}>
                      <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                    </Button>
                  </div>
                ) : (
                  patients.map((p, i) => (
                    <motion.div
                      key={p.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-2xl border-2 border-thal/20 bg-card p-5 shadow-card"
                    >
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
                        <div className="text-right">
                          <Badge className={`font-body text-xs border-0 ${p.is_urgent ? "bg-blood/15 text-blood" : "bg-thal/15 text-thal"}`}>
                            <Clock className="w-3 h-3 mr-1" /> {p.countdown}
                          </Badge>
                          <div className="font-body text-xs text-muted-foreground mt-1">until transfusion</div>
                        </div>
                      </div>
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
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-thal text-thal font-body text-xs rounded-lg hover:bg-thal hover:text-primary-foreground"
                          onClick={() => handleViewSchedule(p)}
                        >
                          View Schedule
                        </Button>
                        {p.donor === "Unmatched" && (
                          <Button
                            size="sm"
                            className="flex-1 bg-thal text-primary-foreground font-body text-xs rounded-lg"
                            onClick={() => handleFindDonor(p)}
                          >
                            Find Donor Now <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        {p.countdown !== "OVERDUE" && p.is_urgent && (
                          <Button
                            size="sm"
                            className="bg-secondary text-primary-foreground font-body text-xs rounded-lg"
                            onClick={() => handleMarkDone(p.id, p.name)}
                            disabled={markingDoneId === p.id}
                          >
                            {markingDoneId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3 mr-1" /> Done</>}
                          </Button>
                        )}
                        {p.countdown === "OVERDUE" && (
                          <Button
                            size="sm"
                            className="bg-blood text-primary-foreground font-body text-xs rounded-lg animate-pulse"
                            onClick={() => handleMarkDone(p.id, p.name)}
                            disabled={markingDoneId === p.id}
                          >
                            {markingDoneId === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3 mr-1" /> Mark Done</>}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
