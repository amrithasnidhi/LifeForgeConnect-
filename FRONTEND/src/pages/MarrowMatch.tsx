import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Dna, ChevronRight, Shield, Loader2, CheckCircle2, X, AlertTriangle } from "lucide-react";
import FileUploadZone from "@/components/FileUploadZone";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";

function MatchMeter({ pct }: { pct: number }) {
  return (
    <div className="relative w-16 h-16 mx-auto">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15.9" fill="none"
          stroke="hsl(var(--marrow))" strokeWidth="3"
          strokeDasharray={`${pct} ${100 - pct}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display font-black text-sm text-marrow">{pct}%</span>
      </div>
    </div>
  );
}

export default function MarrowMatch() {
  const [patientName, setPatientName] = useState("");
  const [urgency, setUrgency] = useState("Routine");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contacting, setContacting] = useState<string | null>(null);
  const [contactSuccess, setContactSuccess] = useState<any | null>(null);
  const [error, setError] = useState("");

  const handleFindMatches = async () => {
    if (!patientName) {
      setError("Please enter a patient name");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // For demo, we send mock HLA data. 
      // In a real system, we'd parse this from the uploaded FileUploadZone.
      const mockHla = ["A*02:01", "B*07:02", "C*07:01", "DRB1*15:01"];
      const res = await api.marrow.findMatches(mockHla, undefined, 30);
      setMatches(res.matches);
    } catch (err: any) {
      setError(err.message || "Failed to find matches");
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async (donorId: string) => {
    setContacting(donorId);
    setError("");
    try {
      // Note: Added /marrow/contact to api.ts earlier
      const res = await (api.marrow as any).contact({
        donor_id: donorId,
        patient_name: patientName,
        urgency: urgency.toLowerCase(),
      });
      setContactSuccess(res);
    } catch (err: any) {
      setError(err.message || "Failed to submit contact request");
    } finally {
      setContacting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-to-br from-marrow/90 to-teal-700/60 text-primary-foreground py-16 px-4">
          <div className="container mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground font-body text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">🧬</div>
              <div>
                <h1 className="font-display text-5xl font-black">MarrowMatch</h1>
                <p className="font-body text-primary-foreground/70 text-lg">HLA precision matching for bone marrow transplants</p>
              </div>
            </div>
            <div className="flex gap-6 mt-6 flex-wrap">
              {[
                { label: "Registered Donors", value: "48,204" },
                { label: "Successful Transplants", value: "1,847" },
                { label: "Match Accuracy", value: "94%" },
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
            {/* Register + upload */}
            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-marrow/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                  <Dna className="w-5 h-5 text-marrow" /> Upload HLA Report
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Patient ID / Name</Label>
                    <Input
                      placeholder="Patient name or ID"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="h-10 rounded-xl font-body"
                    />
                  </div>
                  <FileUploadZone
                    accept=".pdf,.jpg,.jpeg,.png"
                    maxSizeMB={10}
                    hint="PDF, JPEG — max 10 MB"
                    accentClass="marrow"
                  />
                  <div className="space-y-1.5">
                    <Label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Urgency Level</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["High", "Critical", "Routine"].map((u) => (
                        <button
                          key={u}
                          onClick={() => setUrgency(u)}
                          className={`h-9 rounded-lg border-2 font-body text-xs font-semibold transition-all ${urgency === u ? "border-marrow bg-marrow/10 text-marrow" : "border-border hover:border-marrow/50"}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  {error && (
                    <div className="p-2 bg-destructive/10 text-destructive text-xs rounded-lg flex gap-2">
                      <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                  )}
                  <Button
                    onClick={handleFindMatches}
                    disabled={loading}
                    className="w-full bg-marrow text-primary-foreground font-body font-bold rounded-xl"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Find Matches"}
                  </Button>
                </div>
              </div>

              {/* Donor signup */}
              <div className="rounded-2xl border-2 border-marrow/20 bg-marrow/5 p-5">
                <h3 className="font-display text-base font-bold mb-2">Pledge Marrow Donation</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">18–55 years, healthy. Save a life with a simple HLA test.</p>
                <div className="space-y-2">
                  {["Age 18–55", "No serious health conditions", "Willing to travel if matched", "Complete health quiz"].map(req => (
                    <div key={req} className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-marrow" />
                      <span className="font-body text-xs text-muted-foreground">{req}</span>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4 border-marrow text-marrow font-body font-semibold rounded-xl hover:bg-marrow hover:text-primary-foreground">
                  Register as Donor
                </Button>
              </div>
            </div>

            {/* Matches */}
            <div className="lg:col-span-2">
              <h3 className="font-display text-xl font-bold mb-4">Top HLA Matches</h3>
              <div className="space-y-4">
                {matches.length === 0 ? (
                  <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border border-marrow/10 p-5">
                    <p className="font-body text-muted-foreground">Enter patient details to see live matches</p>
                  </div>
                ) : (
                  matches.map((m, i) => (
                    <motion.div
                      key={m.donor_id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-2xl border-2 border-marrow/20 bg-card p-5 shadow-card"
                    >
                      <div className="flex items-center gap-4">
                        <MatchMeter pct={m.matchPct} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-body font-bold text-foreground">Donor #{m.id}</span>
                            <Badge className={`text-xs border-0 font-body ${m.matchPct >= 95 ? "bg-secondary/15 text-secondary" : m.matchPct >= 85 ? "bg-marrow/15 text-marrow" : "bg-muted text-muted-foreground"}`}>
                              {m.confidence}
                            </Badge>
                            <Badge className={`text-xs border-0 font-body ${m.status === "Willing" ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}>
                              {m.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            {[
                              { label: "HLA-A", val: m.hlaA },
                              { label: "HLA-B", val: m.hlaB },
                              { label: "Location", val: m.location },
                              { label: "Age", val: m.age ? `${m.age} yrs` : "—" },
                            ].map(({ label, val }) => (
                              <div key={label}>
                                <div className="font-body text-xs text-muted-foreground">{label}</div>
                                <div className="font-body text-xs font-semibold text-foreground">{val}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleContact(m.donor_id)}
                          disabled={contacting === m.donor_id}
                          className="bg-marrow text-primary-foreground font-body font-semibold rounded-xl"
                        >
                          {contacting === m.donor_id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                          Contact <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                      {/* Journey steps */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {["HLA Confirmation", "Counselling", "Health Check", "Harvest", "Transplant"].map((step, j) => (
                            <div key={step} className="flex items-center gap-1.5 shrink-0">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${j === 0 ? "bg-marrow text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                                {j + 1}
                              </div>
                              <span className="font-body text-xs text-muted-foreground">{step}</span>
                              {j < 4 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                            </div>
                          ))}
                        </div>
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

      {/* Contact Success Modal */}
      <AnimatePresence>
        {contactSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border-2 border-marrow/30 rounded-2xl p-7 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-marrow/10 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-marrow" />
                  </div>
                  <h2 className="font-display text-xl font-bold">Request Submitted</h2>
                </div>
                <button onClick={() => setContactSuccess(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="font-body text-sm text-foreground">
                  Your request to contact <strong>{contactSuccess.donor_name}</strong> in {contactSuccess.donor_city} has been received.
                </p>

                <div className="bg-marrow/5 border border-marrow/20 rounded-xl p-4">
                  <p className="font-body text-xs font-bold text-marrow uppercase tracking-wider mb-2">Next Steps</p>
                  <ul className="space-y-2">
                    {contactSuccess.next_steps.map((step: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-marrow mt-0.5">•</span>
                        <span className="font-body text-xs text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button onClick={() => setContactSuccess(null)} className="w-full bg-marrow text-primary-foreground font-body font-bold rounded-xl mt-2">
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
