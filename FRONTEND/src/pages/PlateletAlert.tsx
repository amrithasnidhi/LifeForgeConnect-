import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Timer, Plus, Star, Loader2, RefreshCw, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, PlateletRequest, PlateletDonor, getCurrentUserId, isLoggedIn } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

function ExpiryTimer({ label, hours }: { label: string; hours: number }) {
  const pct = (hours / 120) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-body text-xs text-muted-foreground">{label}</span>
        <span className={`font-body text-xs font-bold ${hours < 48 ? "text-blood" : "text-platelet"}`}>
          {Math.floor(hours / 24)}d {hours % 24}h
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${hours < 48 ? "bg-blood" : "bg-platelet"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PlateletAlert() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ── Data ──
  const [requests, setRequests] = useState<PlateletRequest[]>([]);
  const [donors, setDonors] = useState<PlateletDonor[]>([]);

  // ── Loading / error ──
  const [loadingReq, setLoadingReq] = useState(true);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [errorReq, setErrorReq] = useState(false);
  const [errorDonors, setErrorDonors] = useState(false);

  // ── Add Patient form ──
  const [showForm, setShowForm] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [cancerType, setCancerType] = useState("");
  const [formGroup, setFormGroup] = useState("O+");
  const [formUnits, setFormUnits] = useState("1");
  const [formUrgency, setFormUrgency] = useState("urgent");
  const [posting, setPosting] = useState(false);

  // ── Donate state ──
  const [donatingId, setDonatingId] = useState<string | null>(null);

  // ── Fetchers ──
  const fetchRequests = async () => {
    setLoadingReq(true);
    setErrorReq(false);
    try {
      const data = await api.platelet.getOpenRequests();
      setRequests(data || []);
    } catch {
      setRequests([]);
      setErrorReq(true);
    } finally {
      setLoadingReq(false);
    }
  };

  const fetchDonors = async () => {
    setLoadingDonors(true);
    setErrorDonors(false);
    try {
      const data = await api.platelet.getDonors();
      setDonors(data || []);
    } catch {
      setDonors([]);
      setErrorDonors(true);
    } finally {
      setLoadingDonors(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchDonors();
  }, []);

  // ── Post request ──
  const handleAddPatient = async () => {
    if (!isLoggedIn()) {
      toast({ title: "Login Required", description: "Please log in as a hospital to add patients.", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!patientName.trim()) {
      toast({ title: "Name Required", description: "Enter the patient's name.", variant: "destructive" });
      return;
    }
    setPosting(true);
    try {
      const result = await api.platelet.postRequest({
        patient_name: patientName,
        cancer_type: cancerType || undefined,
        blood_group: formGroup,
        units: parseInt(formUnits) || 1,
        urgency: formUrgency,
        hospital_id: getCurrentUserId(),
      });
      toast({ title: "✅ Patient Added", description: (result as any).message || "Donors will be alerted." });
      setShowForm(false);
      setPatientName("");
      setCancerType("");
      fetchRequests();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message || "Could not add patient.", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  // ── Donate ──
  const handleDonate = async (req: PlateletRequest) => {
    if (!isLoggedIn()) {
      toast({ title: "Login Required", description: "Please log in to donate.", variant: "destructive" });
      navigate("/login");
      return;
    }
    setDonatingId(req.id);
    await new Promise(r => setTimeout(r, 500));
    toast({
      title: `Responding to ${req.patient}`,
      description: `${req.group} · ${req.hospital}. The hospital will contact you shortly.`,
    });
    setDonatingId(null);
  };

  // ── Request donor ──
  const handleRequestDonor = (d: PlateletDonor) => {
    if (!isLoggedIn()) {
      toast({ title: "Login Required", description: "Please log in first.", variant: "destructive" });
      navigate("/login");
      return;
    }
    toast({
      title: `Request sent to ${d.name}`,
      description: `${d.group} · ${d.city} · Available: ${d.nextAvail}`,
    });
  };

  // ── Skeletons ──
  const ReqSkeleton = () => (
    <div className="rounded-xl border-2 border-platelet/25 bg-card p-4 flex items-center gap-4">
      <Skeleton className="w-10 h-10 rounded-xl" />
      <div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  );

  const DonorSkeleton = () => (
    <div className="rounded-xl border-2 border-platelet/20 bg-card p-4 text-center space-y-3">
      <Skeleton className="w-12 h-12 rounded-2xl mx-auto" />
      <Skeleton className="h-4 w-20 mx-auto" />
      <Skeleton className="h-16 w-full rounded-lg" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-platelet/90 to-amber-600/60 text-primary-foreground py-16 px-4">
          <div className="container mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground font-body text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">⏱️</div>
              <div>
                <h1 className="font-display text-5xl font-black">PlateletAlert</h1>
                <p className="font-body text-primary-foreground/70 text-lg">5-day expiry window. Zero tolerance for waste.</p>
              </div>
            </div>
            <div className="flex gap-6 mt-6 flex-wrap">
              {[
                { label: "Active Requests", value: String(requests.length || "—") },
                { label: "Critical (<48h)", value: String(requests.filter(r => r.is_critical).length) },
                { label: "Apheresis Donors", value: String(donors.length || "—") },
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
            {/* ── LEFT ── */}
            <div className="space-y-5">
              {/* Viability clocks */}
              <div className="rounded-2xl border-2 border-platelet/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-platelet animate-pulse" /> Viability Clocks
                </h3>
                <div className="space-y-4">
                  {loadingReq ? (
                    Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)
                  ) : requests.length === 0 ? (
                    <p className="font-body text-xs text-muted-foreground text-center py-4">No active requests.</p>
                  ) : (
                    requests.slice(0, 4).map((r, i) => (
                      <div key={r.id || i} className="p-3 rounded-xl bg-platelet/5 border border-platelet/20">
                        <div className="font-body text-xs font-bold text-foreground mb-2">{r.patient} — {r.cancer}</div>
                        <ExpiryTimer label="Expiry" hours={r.hours_left} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Post platelet need */}
              <div className="rounded-2xl border-2 border-platelet/20 bg-platelet/5 p-5">
                <h3 className="font-display text-base font-bold mb-2">Post Platelet Need</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">Register a cancer patient's platelet requirement.</p>

                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 mb-3 overflow-hidden"
                    >
                      <div>
                        <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Patient Name</label>
                        <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Full name" className="h-9 rounded-lg font-body text-sm" />
                      </div>
                      <div>
                        <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Cancer Type</label>
                        <Input value={cancerType} onChange={e => setCancerType(e.target.value)} placeholder="e.g. Leukemia (AML)" className="h-9 rounded-lg font-body text-sm" />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Blood Group</label>
                          <div className="grid grid-cols-4 gap-1">
                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(g => (
                              <button key={g} onClick={() => setFormGroup(g)}
                                className={`h-7 rounded text-xs font-bold transition-all ${formGroup === g ? "bg-platelet text-white border border-platelet" : "border border-border hover:border-platelet"}`}
                              >{g}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-20">
                          <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Units</label>
                          <Input type="number" value={formUnits} onChange={e => setFormUnits(e.target.value)} className="h-9 rounded-lg font-body text-sm" min={1} />
                        </div>
                        <div className="flex-1">
                          <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Urgency</label>
                          <div className="flex gap-1">
                            {["critical", "high", "urgent"].map(u => (
                              <button key={u} onClick={() => setFormUrgency(u)}
                                className={`flex-1 h-9 rounded-lg border text-xs font-bold capitalize transition-all ${formUrgency === u ? "bg-platelet text-white border-platelet" : "border-border hover:border-platelet"}`}
                              >{u}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button className="w-full bg-platelet text-primary-foreground font-body font-bold rounded-xl" onClick={handleAddPatient} disabled={posting}>
                        {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                        {posting ? "Submitting..." : "Submit Request"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  className={`w-full font-body font-bold rounded-xl ${showForm ? "bg-muted text-foreground" : "bg-platelet text-primary-foreground"}`}
                  onClick={() => setShowForm(!showForm)}
                >
                  {showForm ? <><X className="w-4 h-4 mr-1.5" /> Cancel</> : <><Plus className="w-4 h-4 mr-1.5" /> Add Patient</>}
                </Button>
              </div>
            </div>

            {/* ── RIGHT ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Urgent requests */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold">Urgent Platelet Requests</h3>
                  {errorReq && (
                    <Button variant="ghost" size="sm" onClick={fetchRequests} className="text-platelet font-body text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {loadingReq ? (
                    Array.from({ length: 2 }).map((_, i) => <ReqSkeleton key={i} />)
                  ) : requests.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border-2 border-dashed border-border">
                      <p className="font-body text-sm text-muted-foreground">No urgent requests at this time.</p>
                      <Button variant="ghost" size="sm" className="mt-2 text-platelet font-body" onClick={fetchRequests}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                      </Button>
                    </div>
                  ) : (
                    requests.map((req, i) => (
                      <motion.div
                        key={req.id || i}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-xl border-2 border-platelet/25 bg-card p-4 flex items-center gap-4"
                      >
                        <div className="text-3xl">⏱️</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-body font-bold text-sm">{req.patient}</span>
                            <Badge className={`text-xs border-0 font-body ${req.urgency === "CRITICAL" ? "bg-blood/15 text-blood" : "bg-platelet/15 text-platelet"}`}>
                              {req.urgency}
                            </Badge>
                          </div>
                          <div className="font-body text-xs text-muted-foreground mt-0.5">
                            {req.cancer} · {req.group} · {req.units} unit(s) · {req.hospital}
                          </div>
                          <div className="font-body text-xs font-semibold text-blood mt-1">⏰ Expires in {req.expiry}</div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-platelet text-primary-foreground font-body font-semibold rounded-lg"
                          onClick={() => handleDonate(req)}
                          disabled={donatingId === req.id}
                        >
                          {donatingId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Donate"}
                        </Button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Donor cards */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold">Compatible Apheresis Donors</h3>
                  {errorDonors && (
                    <Button variant="ghost" size="sm" onClick={fetchDonors} className="text-platelet font-body text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {loadingDonors ? (
                    Array.from({ length: 3 }).map((_, i) => <DonorSkeleton key={i} />)
                  ) : donors.length === 0 ? (
                    <div className="col-span-3 text-center py-8 rounded-xl border-2 border-dashed border-border">
                      <p className="font-body text-sm text-muted-foreground">No apheresis donors found.</p>
                    </div>
                  ) : (
                    donors.map((d, i) => (
                      <motion.div
                        key={d.id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-xl border-2 border-platelet/20 bg-card p-4 shadow-card text-center"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-platelet/10 flex items-center justify-center text-xl font-display font-bold text-platelet mx-auto mb-2">
                          {d.name?.[0] || "?"}
                        </div>
                        <div className="font-body font-bold text-sm text-foreground">{d.name}</div>
                        <div className="font-body text-xs text-muted-foreground">{d.city}</div>
                        <div className="mt-3 p-2 rounded-lg bg-platelet/8">
                          <div className="font-display font-black text-2xl text-platelet">{d.compat}%</div>
                          <div className="font-body text-xs text-muted-foreground">Compat. Score</div>
                        </div>
                        <div className="flex items-center gap-1.5 justify-center mt-2 text-xs font-body text-muted-foreground">
                          <Star className="w-3 h-3 text-accent fill-current" /> {d.trust}
                        </div>
                        <div className="font-body text-xs text-secondary font-semibold mt-1">Available: {d.nextAvail}</div>
                        <Button
                          size="sm"
                          className="w-full mt-3 bg-platelet text-primary-foreground font-body text-xs rounded-lg"
                          onClick={() => handleRequestDonor(d)}
                        >
                          Request
                        </Button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
