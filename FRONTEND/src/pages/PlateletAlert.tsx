import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Timer, Plus, Star, Loader2, Search, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, PlateletRequest, PlateletDonor, getCurrentUserId, isLoggedIn } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/AuthContext";

function ExpiryTimer({ label, hours }: { label: string; hours: number }) {
  const pct = Math.min(100, (hours / 120) * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-body text-xs text-muted-foreground">{label}</span>
        <span className={`font-body text-xs font-bold ${hours < 48 ? "text-blood" : "text-platelet"}`}>
          {label === "Expiry" ? (hours > 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`) : `${hours}h`}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${hours < 48 ? "bg-blood" : "bg-platelet"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PlateletAlert() {
  const { role } = useAuth();
  const [requests, setRequests] = useState<PlateletRequest[]>([]);
  const [donors, setDonors] = useState<PlateletDonor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    patient_name: "",
    cancer_type: "",
    blood_group: "",
    units: 1,
    urgency: "urgent"
  });

  const fetchData = async () => {
    try {
      const [openRequests, compatibleDonors] = await Promise.all([
        api.platelet.getOpenRequests(),
        api.platelet.getDonors()
      ]);
      setRequests(openRequests);
      setDonors(compatibleDonors);
    } catch (error) {
      console.error("Failed to fetch platelet data", error);
      toast.error("Could not load latest platelet alerts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      toast.error("Please login as a hospital to post requests");
      return;
    }
    if (role !== "hospital") {
      toast.error("Only verified hospitals can post patient requirements");
      return;
    }

    if (!formData.patient_name || !formData.blood_group) {
      toast.error("Please fill in patient name and blood group");
      return;
    }

    setIsSubmitting(true);
    try {
      const hospitalId = getCurrentUserId();
      await api.platelet.postRequest({
        ...formData,
        hospital_id: hospitalId
      });
      toast.success("Patient registered successfully!");
      setShowAddModal(false);
      setFormData({ patient_name: "", cancer_type: "", blood_group: "", units: 1, urgency: "urgent" });
      fetchData(); // Refresh list
    } catch (error: any) {
      toast.error(error.message || "Failed to register patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestDonor = (donor: PlateletDonor) => {
    if (!isLoggedIn()) {
      toast.error("Please login to request donors");
      return;
    }
    toast.success(`Request sent to ${donor.name}! They will be notified for apheresis donation.`);
  };

  const handleDonate = (request: PlateletRequest) => {
    if (!isLoggedIn()) {
      toast.error("Please login to register as a donor");
      return;
    }
    toast.success(`Coordination request sent! ${request.hospital} will be notified of your intent to donate for ${request.patient}.`, {
      icon: <Heart className="text-blood w-4 h-4" />
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
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
                { label: "Active Requests", value: requests.length },
                { label: "Expiring in 24h", value: requests.filter(r => r.hours_left <= 24).length },
                { label: "Apheresis Donors", value: donors.length > 0 ? "1,204+" : "..." },
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
            <div className="space-y-5">
              {/* Expiry clocks sidebar */}
              <div className="rounded-2xl border-2 border-platelet/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-platelet animate-pulse" /> Viability Clocks
                </h3>
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="flex justify-center py-10">
                      <Loader2 className="w-6 h-6 animate-spin text-platelet" />
                    </div>
                  ) : requests.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-4 font-body italic">No active clocks</p>
                  ) : (
                    requests.slice(0, 3).map((r) => (
                      <div key={r.id} className="p-3 rounded-xl bg-platelet/5 border border-platelet/20">
                        <div className="font-body text-xs font-bold text-foreground mb-2">{r.patient} — {r.cancer}</div>
                        <ExpiryTimer label="Expiry" hours={r.hours_left} />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Card */}
              <div className="rounded-2xl border-2 border-platelet/20 bg-platelet/5 p-5">
                <h3 className="font-display text-base font-bold mb-2">Post Platelet Need</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">Register a cancer patient's platelet requirement.</p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="w-full bg-platelet text-primary-foreground font-body font-bold rounded-xl h-12 shadow-lg shadow-platelet/20 hover:scale-[1.02] transition-transform"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Add Patient
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* Urgent Requests List */}
              <div>
                <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                  Urgent Platelet Requests
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin text-platelet" />}
                </h3>
                <div className="space-y-3">
                  {requests.length === 0 && !isLoading && (
                    <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/5">
                      <p className="text-muted-foreground font-body italic">No pending platelet requests found.</p>
                    </div>
                  )}
                  {requests.map((req, i) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl border-2 border-platelet/25 bg-card p-4 flex items-center gap-4 hover:border-platelet/50 transition-colors shadow-sm"
                    >
                      <div className="text-3xl filter saturate-[0.8]">⏱️</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-body font-bold text-sm truncate">{req.patient}</span>
                          <Badge className={`text-[10px] px-1.5 h-4 border-0 font-body uppercase tracking-tighter ${req.is_critical ? "bg-blood/15 text-blood" : "bg-platelet/15 text-platelet"}`}>
                            {req.urgency}
                          </Badge>
                        </div>
                        <div className="font-body text-xs text-muted-foreground mt-0.5 truncate">
                          {req.cancer} · {req.group} · {req.units} unit(s) · {req.hospital}
                        </div>
                        <div className={`font-body text-[11px] font-bold mt-1 ${req.is_critical ? "text-blood" : "text-platelet"}`}>
                          ⏰ Life Window: {req.expiry} remaining
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleDonate(req)}
                        className="bg-platelet text-primary-foreground font-body font-bold rounded-lg px-4 h-9 whitespace-nowrap"
                      >
                        Donate
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Donor Grid */}
              <div>
                <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                  Compatible Apheresis Donors
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin text-platelet" />}
                </h3>
                {donors.length === 0 && !isLoading && (
                  <div className="text-center py-10 bg-muted/20 border-2 border-dashed rounded-2xl">
                    <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                    <p className="text-muted-foreground font-body text-sm">No compatible donors currently online.</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {donors.map((d, i) => (
                    <motion.div
                      key={d.id || i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="rounded-xl border-2 border-platelet/10 bg-card p-4 shadow-card hover:border-platelet/30 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-platelet/10 flex items-center justify-center text-xl font-display font-bold text-platelet mx-auto mb-3 group-hover:scale-110 transition-transform">
                        {d.name[0]}
                      </div>
                      <div className="font-body font-bold text-sm text-center text-foreground">{d.name}</div>
                      <div className="font-body text-[10px] text-center text-muted-foreground uppercase tracking-widest">{d.city}</div>

                      <div className="mt-4 p-3 rounded-xl bg-platelet/5 border border-platelet/10">
                        <div className="font-display font-black text-2xl text-center text-platelet leading-none">{d.compat}%</div>
                        <div className="font-body text-[9px] text-center text-muted-foreground uppercase mt-1">Compat. Score</div>
                      </div>

                      <div className="flex items-center gap-4 justify-between mt-4">
                        <div className="flex items-center gap-1 font-body text-xs font-bold">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {d.trust}
                        </div>
                        <div className="font-body text-[10px] text-secondary font-bold">NEXT: {d.nextAvail}</div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleRequestDonor(d)}
                        variant="outline"
                        className="w-full mt-4 border-platelet/30 text-platelet font-body font-bold text-xs rounded-lg hover:bg-platelet hover:text-white"
                      >
                        Request Apheresis
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-card rounded-3xl border-2 border-platelet/20 shadow-2xl overflow-hidden"
            >
              <div className="bg-platelet p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="font-display text-xl font-bold">New Platelet Request</h3>
                  <p className="text-white/70 text-xs font-body">Emergency registration for apheresis</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Patient Name</Label>
                  <Input
                    required
                    placeholder="Full name"
                    className="rounded-xl font-body"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Cancer Type</Label>
                    <Input
                      placeholder="e.g. Leukemia"
                      className="rounded-xl font-body"
                      value={formData.cancer_type}
                      onChange={(e) => setFormData({ ...formData, cancer_type: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Blood Group</Label>
                    <select
                      className="w-full h-10 px-3 rounded-xl border-2 border-input bg-background font-body text-sm"
                      value={formData.blood_group}
                      required
                      onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                    >
                      <option value="">Select Group</option>
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Units Needed</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      className="rounded-xl font-body"
                      value={formData.units}
                      onChange={(e) => setFormData({ ...formData, units: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase text-muted-foreground">Urgency</Label>
                    <div className="flex bg-muted p-1 rounded-xl gap-1">
                      {["urgent", "critical"].map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setFormData({ ...formData, urgency: u })}
                          className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${formData.urgency === u ? "bg-white text-platelet shadow-sm" : "text-muted-foreground hover:bg-white/50"}`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-platelet text-white font-bold h-12 rounded-xl mt-4"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Alert"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}


