import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, AlertTriangle, CheckCircle2, Plus, Filter, ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BloodBridgeMap from "@/components/BloodBridgeMap";
import { api, BloodDonor, BloodRequest } from "@/lib/api";
import { toast } from "sonner";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bloodGroup) {
      setError("Please select a blood group");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const hospitalId = localStorage.getItem("lf_user_id") || "e9b5f8a0-72a2-b281-0081-8b9cad0e1f20"; // Fallback for demo
      await api.blood.postRequest({
        hospital_id: hospitalId,
        blood_group: bloodGroup,
        units: Number(units),
        urgency
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to post request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border-2 border-blood/30 rounded-2xl p-7 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">Post Urgent Blood Need</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Blood Group Needed</label>
            <div className="grid grid-cols-4 gap-2">
              {groups.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBloodGroup(g)}
                  className={`h-10 rounded-xl border-2 font-display text-sm font-bold transition-all ${bloodGroup === g ? "border-blood bg-blood/10 text-blood" : "border-border hover:border-blood/30"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Units Required</label>
              <Input
                type="number"
                min={1}
                value={units}
                onChange={(e) => setUnits(parseInt(e.target.value))}
                className="h-11 rounded-xl font-body"
              />
            </div>
            <div>
              <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Urgency</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-border bg-background px-3 font-body text-sm focus:border-blood outline-none"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 text-xs font-body flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-blood text-primary-foreground font-body font-bold rounded-xl h-12 shadow-lg shadow-blood/20">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            Post Request & Alert Donors
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BloodBridge() {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqs, initialDonors] = await Promise.all([
          api.blood.getOpenRequests(),
          api.blood.getDonors({ limit: 4 })
        ]);
        setUrgentRequests(reqs);
        setDonors(initialDonors);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        toast.error("Could not load latest requests");
      } finally {
        setIsInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // Determine if input is pincode (numeric, 6 digits) or city
      const isPincode = /^\d{6}$/.test(locationInput.trim());
      const searchParams = {
        blood_group: selectedGroup || undefined,
        city: !isPincode ? locationInput.trim() || undefined : undefined,
        pincode: isPincode ? locationInput.trim() : undefined,
        limit: 20
      };

      const results = await api.blood.getDonors(searchParams);
      setDonors(results);

      if (results.length === 0) {
        toast.info("No matching donors found in this area.");
      } else {
        toast.success(`Found ${results.length} matching donors!`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search donors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequest = (donor: BloodDonor) => {
    if (!donor.eligible_to_donate) {
      toast.error(`${donor.name} is busy or not eligible yet.`);
      return;
    }
    toast.success(`Request sent to ${donor.name}! They will receive an SMS alert.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Module hero */}
        <div className="bg-gradient-to-br from-blood/90 to-blood/60 text-primary-foreground py-16 px-4">
          <div className="container mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground font-body text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">🩸</div>
              <div>
                <h1 className="font-display text-5xl font-black">BloodBridge</h1>
                <p className="font-body text-primary-foreground/70 text-lg">Real-time blood group matching across India</p>
              </div>
            </div>
            <div className="flex gap-6 mt-6 flex-wrap">
              {[
                { label: "Active Donors", value: "4,217" },
                { label: "Matches Today", value: "847" },
                { label: "Avg Match Time", value: "4 min" },
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
            {/* Search panel */}
            <div className="space-y-5">
              <form onSubmit={handleSearch} className="rounded-2xl border-2 border-blood/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blood" /> Find Donors
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Blood Group</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                        <button
                          key={g}
                          onClick={() => setSelectedGroup(selectedGroup === g ? null : g)}
                          className={`h-9 rounded-lg border-2 font-display text-xs font-bold transition-all ${selectedGroup === g ? "border-blood bg-blood text-white" : "border-border hover:border-blood hover:bg-blood/10"}`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Location / PIN</label>
                    <Input
                      placeholder="Enter city or 6-digit PIN"
                      className="h-10 rounded-xl font-body"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Units Required</label>
                    <Input type="number" placeholder="e.g. 2" className="h-10 rounded-xl font-body" defaultValue={1} />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="w-full bg-blood text-primary-foreground font-body font-bold rounded-xl h-11"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search Donors"}
                  </Button>
                </div>
              </form>

              {/* Post request */}
              <div className="rounded-2xl border-2 border-blood/20 bg-blood/5 p-5">
                <h3 className="font-display text-base font-bold text-foreground mb-2">Hospital? Post Urgent Need</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">Notify verified donors near your hospital instantly.</p>
                <Button
                  onClick={() => setShowPostModal(true)}
                  variant="outline"
                  className="w-full border-blood text-blood font-body font-semibold rounded-xl hover:bg-blood hover:text-primary-foreground"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Post Request
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-2 space-y-6">
              {/* Urgent requests */}
              <div>
                <h3 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-blood animate-pulse" /> Live Urgent Requests
                </h3>
                <div className="space-y-3">
                  {urgentRequests.length === 0 && !isInitialLoading && (
                    <div className="p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground font-body">
                      No active urgent requests at the moment.
                    </div>
                  )}
                  {urgentRequests.map((req, i) => (
                    <motion.div
                      key={req.id || i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl border-2 border-blood/20 bg-card p-4 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl bg-blood/10 flex items-center justify-center">
                        <span className="font-display font-black text-blood text-sm">{req.group}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-body font-bold text-sm">{req.hospital}</span>
                          <Badge className={`text-xs border-0 font-body ${req.urgency === "CRITICAL" ? "bg-blood/15 text-blood" : req.urgency === "URGENT" ? "bg-platelet/15 text-platelet" : "bg-muted text-muted-foreground"}`}>
                            {req.urgency}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-body font-bold text-sm">{req.hospital}</span>
                            <Badge className={`text-xs border-0 font-body ${req.urgency === "CRITICAL" ? "bg-blood/15 text-blood" : req.urgency === "URGENT" ? "bg-platelet/15 text-platelet" : "bg-muted text-muted-foreground"}`}>
                              {req.urgency}
                            </Badge>
                          </div>
                          <div className="font-body text-xs text-muted-foreground mt-0.5">
                            {req.units} unit(s) · <MapPin className="w-3 h-3 inline" /> {req.city} · {req.posted}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-blood font-body font-bold text-sm">
                            <Clock className="w-3.5 h-3.5" /> {req.timeLeft}
                          </div>
                          <div className="font-body text-xs text-muted-foreground">remaining</div>
                        </div>
                        <Button size="sm" className="bg-blood text-primary-foreground font-body font-semibold rounded-lg">
                          Donate
                        </Button>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Donor cards */}
              <div>
                <h3 className="font-display text-xl font-bold text-foreground mb-4">
                  {selectedGroup ? `Available Donors (${selectedGroup})` : "Available Donors"}
                </h3>
                {donors.length === 0 && !isLoading && (
                  <div className="p-12 text-center bg-muted/20 border-2 border-dashed rounded-2xl">
                    <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <p className="text-muted-foreground font-body">No donors found. Try changing your search filters.</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {donors.map((donor, i) => (
                    <motion.div
                      key={donor.id || i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className={`rounded-xl border-2 bg-card p-4 shadow-card ${donor.available ? "border-secondary/30" : "border-border opacity-60"}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blood/10 flex items-center justify-center font-display font-bold text-blood">
                            {donor.name[0]}
                          </div>
                          <Badge className={`font-body text-xs border-0 ${donor.available ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}>
                            {donor.available ? "Available" : "Busy"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-body text-muted-foreground mb-3">
                          <span className="font-bold text-blood">{donor.group}</span>
                          <span><MapPin className="w-3 h-3 inline" /> {donor.distance || "—"}</span>
                          <span>⭐ {donor.trust}</span>
                          <span>Last: {donor.last_donated}</span>
                        </div>
                        {donor.available && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 border-border font-body text-xs rounded-lg">
                              View Profile
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRequestDonor(donor.id)}
                              className="flex-1 bg-blood text-primary-foreground font-body text-xs rounded-lg"
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Request
                            </Button>
                          </div>
                        </div>
                        <Badge className={`font-body text-xs border-0 ${donor.available ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}>
                          {donor.available ? "Available" : "Busy"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-body text-muted-foreground mb-3">
                        <span className="font-bold text-blood">{donor.group}</span>
                        <span><MapPin className="w-3 h-3 inline" /> {donor.distance}</span>
                        <span>⭐ {donor.trust}</span>
                        <span>Last: {donor.last_donated}</span>
                      </div>
                      {donor.available && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 border-border font-body text-xs rounded-lg">
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRequest(donor)}
                            className="flex-1 bg-blood text-primary-foreground font-body text-xs rounded-lg"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Request
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Interactive Donor Map */}
              <div>
                <h3 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blood" /> Nearby Donors
                </h3>
                <div className="rounded-2xl border-2 border-blood/20 bg-card shadow-card overflow-hidden">
                  <BloodBridgeMap
                    donors={donors.map(d => ({
                      id: d.id,
                      name: d.name,
                      blood_group: d.group,
                      city: d.city,
                      trust_score: d.trust,
                      distance_km: d.distance_km || 0,
                      lat: 0, // In a real app we'd use actual lat/lng from backend
                      lng: 0,
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <AnimatePresence>
        {showPostModal && (
          <PostRequestModal
            onClose={() => setShowPostModal(false)}
            onSuccess={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

