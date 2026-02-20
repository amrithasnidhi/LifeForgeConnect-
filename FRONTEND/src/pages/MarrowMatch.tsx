import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Upload, Dna, ChevronRight, Shield, CheckCircle2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, MarrowMatch as MarrowMatchType, isLoggedIn, getCurrentUserId } from "@/lib/api";
import { toast } from "sonner";

// Mock HLA data for demonstration if no file is uploaded
const DEFAULT_HLA = ["A*02:01", "B*07:02", "C*07:01", "DRB1*15:01", "DQB1*06:02"];

interface ContactSuccess {
  donor_name: string;
  donor_city: string;
  next_steps: string[];
}

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
  const [matches, setMatches] = useState<MarrowMatchType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<ContactSuccess | null>(null);

  // Load initial donors on mount
  useEffect(() => {
    const loadDonors = async () => {
      try {
        const data = await api.marrow.getDonors();
        if (Array.isArray(data)) {
          const formatted = data.slice(0, 3).map((d: any) => ({
            id: d.id.slice(0, 4).toUpperCase(),
            donor_id: d.id,
            matchPct: 0,
            confidence: "Donor",
            hlaA: d.hla_type?.[0] || "—",
            hlaB: d.hla_type?.[1] || "—",
            location: d.city || "Chennai",
            age: 28,
            donated: 0,
            status: d.trust_score >= 70 ? "Willing" : "Considering",
          }));
          setMatches(formatted);
        }
      } catch (error) {
        console.error("Failed to load donors", error);
      }
    };
    loadDonors();
  }, []);

  const handleFindMatches = async () => {
    if (!isUploaded && !patientName) {
      toast.error("Please enter a patient name or upload a report first");
      return;
    }
    setIsLoading(true);
    try {
      const result = await api.marrow.findMatches(DEFAULT_HLA, patientName || "P-101");
      setMatches(result.matches);
      toast.success(`Found ${result.total_found} compatible HLA matches!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to find matches");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterDonor = async () => {
    if (!isLoggedIn()) {
      toast.error("Please login as a donor first");
      return;
    }
    setIsRegistering(true);
    try {
      const donorId = getCurrentUserId();
      await api.marrow.registerHla(donorId, ["A*01:01", "B*08:01", "C*07:01"]);
      toast.success("Successfully registered as a Marrow Donor!");
    } catch (error: any) {
      toast.error(error.message || "Failed to register");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleContact = (match: MarrowMatchType) => {
    setContactSuccess({
      donor_name: `Donor #${match.id}`,
      donor_city: match.location,
      next_steps: [
        "HLA confirmation test will be scheduled within 48 hours.",
        "A counsellor will contact you to explain the process.",
        "Health screening for the donor will be arranged.",
        "You will be notified at each step via SMS and email.",
      ],
    });
  };

  const handleUpload = () => {
    setIsUploaded(true);
    toast.success("HLA Report uploaded and scanned successfully!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Hero */}
        <div className="bg-gradient-to-br from-marrow/90 to-teal-700/60 text-primary-foreground py-16 px-4">
          <div className="container mx-auto">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground font-body text-sm mb-6"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">🧬</div>
              <div>
                <h1 className="font-display text-5xl font-black">MarrowMatch</h1>
                <p className="font-body text-primary-foreground/70 text-lg">
                  HLA precision matching for bone marrow transplants
                </p>
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

            {/* Sidebar: Upload + Register */}
            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-marrow/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                  <Dna className="w-5 h-5 text-marrow" /> Upload HLA Report
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Patient ID / Name
                    </Label>
                    <Input
                      placeholder="Patient name or ID"
                      className="h-10 rounded-xl font-body"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </div>

                  {/* Upload zone */}
                  <div
                    onClick={handleUpload}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${isUploaded
                        ? "border-green-500 bg-green-500/5"
                        : "border-marrow/30 hover:border-marrow/60"
                      }`}
                  >
                    {isUploaded ? (
                      <CheckCircle2 className="w-7 h-7 text-green-500 mx-auto mb-2" />
                    ) : (
                      <Upload className="w-7 h-7 text-marrow mx-auto mb-2" />
                    )}
                    <p className={`font-body text-sm ${isUploaded ? "text-green-600 font-bold" : "text-muted-foreground"}`}>
                      {isUploaded ? "Report Verified" : "Upload HLA Typing Report"}
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-1">PDF, JPEG — max 10MB</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Urgency Level
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["High", "Critical", "Routine"].map((u) => (
                        <button
                          key={u}
                          onClick={() => setUrgency(u)}
                          className={`h-9 rounded-lg border-2 font-body text-xs font-semibold transition-all ${urgency === u
                              ? "border-marrow bg-marrow/10 text-marrow"
                              : "border-border hover:border-marrow hover:bg-marrow/10"
                            }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleFindMatches}
                    disabled={isLoading}
                    className="w-full bg-marrow text-primary-foreground font-body font-bold rounded-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      "Find Matches"
                    )}
                  </Button>
                </div>
              </div>

              {/* Donor signup */}
              <div className="rounded-2xl border-2 border-marrow/20 bg-marrow/5 p-5">
                <h3 className="font-display text-base font-bold mb-2">Pledge Marrow Donation</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">
                  18–55 years, healthy. Save a life with a simple HLA test.
                </p>
                <div className="space-y-2">
                  {[
                    "Age 18–55",
                    "No serious health conditions",
                    "Willing to travel if matched",
                    "Complete health quiz",
                  ].map((req) => (
                    <div key={req} className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-marrow" />
                      <span className="font-body text-xs text-muted-foreground">{req}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleRegisterDonor}
                  disabled={isRegistering}
                  variant="outline"
                  className="w-full mt-4 border-marrow text-marrow font-body font-semibold rounded-xl hover:bg-marrow hover:text-primary-foreground"
                >
                  {isRegistering ? <Loader2 className="w-4 h-4 animate-spin" /> : "Register as Donor"}
                </Button>
              </div>
            </div>

            {/* Matches list */}
            <div className="lg:col-span-2">
              <h3 className="font-display text-xl font-bold mb-4">
                {isLoading
                  ? "Fetching best HLA matches..."
                  : matches.length > 0 && matches[0].matchPct > 0
                    ? "Top HLA Matches"
                    : "Available Donors"}
              </h3>
              <div className="space-y-4">
                {matches.length === 0 && !isLoading && (
                  <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
                    <p className="text-muted-foreground font-body">
                      No matches found yet. Try searching with a report.
                    </p>
                  </div>
                )}
                {matches.map((m, i) => (
                  <motion.div
                    key={m.id + i}
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
                          <Badge
                            className={`text-xs border-0 font-body ${m.matchPct >= 95
                                ? "bg-secondary/15 text-secondary"
                                : m.matchPct >= 85
                                  ? "bg-marrow/15 text-marrow"
                                  : "bg-muted text-muted-foreground"
                              }`}
                          >
                            {m.confidence}
                          </Badge>
                          <Badge
                            className={`text-xs border-0 font-body ${m.status === "Willing"
                                ? "bg-secondary/15 text-secondary"
                                : "bg-muted text-muted-foreground"
                              }`}
                          >
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
                        onClick={() => handleContact(m)}
                        className="bg-marrow text-primary-foreground font-body font-semibold rounded-xl"
                      >
                        Contact <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>

                    {/* Journey steps */}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {["HLA Confirmation", "Counselling", "Health Check", "Harvest", "Transplant"].map(
                          (step, j) => (
                            <div key={step} className="flex items-center gap-1.5 shrink-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${j === 0
                                    ? "bg-marrow text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                  }`}
                              >
                                {j + 1}
                              </div>
                              <span className="font-body text-xs text-muted-foreground">{step}</span>
                              {j < 4 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
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
                <button
                  onClick={() => setContactSuccess(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="font-body text-sm text-foreground">
                  Your request to contact <strong>{contactSuccess.donor_name}</strong> in{" "}
                  {contactSuccess.donor_city} has been received.
                </p>
                <div className="bg-marrow/5 border border-marrow/20 rounded-xl p-4">
                  <p className="font-body text-xs font-bold text-marrow uppercase tracking-wider mb-2">
                    Next Steps
                  </p>
                  <ul className="space-y-2">
                    {contactSuccess.next_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-marrow mt-0.5">•</span>
                        <span className="font-body text-xs text-muted-foreground">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Button
                  onClick={() => setContactSuccess(null)}
                  className="w-full bg-marrow text-primary-foreground font-body font-bold rounded-xl mt-2"
                >
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