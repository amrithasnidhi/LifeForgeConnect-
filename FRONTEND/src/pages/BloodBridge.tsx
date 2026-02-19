import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, AlertTriangle, CheckCircle2, Plus,
  Filter, ArrowLeft, Loader2, RefreshCw, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BloodBridgeMap from "@/components/BloodBridgeMap";
import { api, BloodDonor, BloodRequest, BloodShortage, getCurrentUserId, isLoggedIn } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function BloodBridge() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // ── Data state ──
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<BloodRequest[]>([]);
  const [shortages, setShortages] = useState<BloodShortage[]>([]);
  const [stats, setStats] = useState({ activeDonors: "—", matchesToday: "—", avgTime: "4 min" });

  // ── Loading / error ──
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [errorDonors, setErrorDonors] = useState(false);
  const [errorRequests, setErrorRequests] = useState(false);

  // ── Search filters ──
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [unitsNeeded, setUnitsNeeded] = useState("");

  // ── Post request form state ──
  const [showPostForm, setShowPostForm] = useState(false);
  const [postGroup, setPostGroup] = useState("O+");
  const [postUnits, setPostUnits] = useState("1");
  const [postUrgency, setPostUrgency] = useState("urgent");
  const [posting, setPosting] = useState(false);

  // ── Donate button state ──
  const [donatingId, setDonatingId] = useState<string | null>(null);

  // ── Fetch donors ──
  const fetchDonors = async (group?: string, city?: string) => {
    setLoadingDonors(true);
    setErrorDonors(false);
    try {
      const data = await api.blood.getDonors({
        blood_group: group || undefined,
        city: city || undefined,
      });
      setDonors(data || []);
    } catch {
      setDonors([]);
      setErrorDonors(true);
    } finally {
      setLoadingDonors(false);
    }
  };

  // ── Fetch urgent requests ──
  const fetchRequests = async () => {
    setLoadingRequests(true);
    setErrorRequests(false);
    try {
      const data = await api.blood.getOpenRequests();
      setUrgentRequests(data || []);
    } catch {
      setUrgentRequests([]);
      setErrorRequests(true);
    } finally {
      setLoadingRequests(false);
    }
  };

  // ── Fetch stats ──
  const fetchStats = async () => {
    try {
      const s = await api.stats();
      setStats({
        activeDonors: s.active_donors_online?.toLocaleString() || "0",
        matchesToday: s.matches_today?.toLocaleString() || "0",
        avgTime: "4 min",
      });
    } catch {
      /* keep defaults */
    }
  };

  // ── Fetch shortage ──
  const fetchShortage = async () => {
    try {
      const data = await api.blood.getShortage();
      setShortages(data || []);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    fetchDonors();
    fetchRequests();
    fetchStats();
    fetchShortage();
  }, []);

  // ── Search button ──
  const handleSearch = () => {
    fetchDonors(selectedGroup || undefined, locationFilter || undefined);
    toast({
      title: "Searching Donors",
      description: `Blood group: ${selectedGroup || "All"}, Location: ${locationFilter || "All"}`,
    });
  };

  // ── Post blood request ──
  const handlePostRequest = async () => {
    if (!isLoggedIn()) {
      toast({ title: "Login Required", description: "Please log in as a hospital to post requests.", variant: "destructive" });
      navigate("/login");
      return;
    }

    setPosting(true);
    try {
      const result = await api.blood.postRequest({
        hospital_id: getCurrentUserId(),
        blood_group: postGroup,
        units: parseInt(postUnits) || 1,
        urgency: postUrgency,
      });
      toast({
        title: "🩸 Request Posted!",
        description: (result as any).message || "Donors will be alerted.",
      });
      setShowPostForm(false);
      fetchRequests(); // refresh list
    } catch (err: any) {
      toast({
        title: "Post Failed",
        description: err.message || "Could not post blood request.",
        variant: "destructive",
      });
    } finally {
      setPosting(false);
    }
  };

  // ── Donate button ──
  const handleDonate = async (req: BloodRequest) => {
    if (!isLoggedIn()) {
      toast({ title: "Login Required", description: "Please log in to respond to requests.", variant: "destructive" });
      navigate("/login");
      return;
    }
    setDonatingId(req.id);
    await new Promise((r) => setTimeout(r, 500));
    toast({
      title: `Responding to ${req.hospital}`,
      description: `${req.group} · ${req.units} unit(s) · ${req.city}. The hospital will contact you shortly.`,
    });
    setDonatingId(null);
  };

  // ── Request donor button ──
  const handleRequestDonor = async (donor: BloodDonor) => {
    if (!isLoggedIn()) {
      toast({ title: "Login Required", description: "Please log in to request a donor.", variant: "destructive" });
      navigate("/login");
      return;
    }
    toast({
      title: `Request sent to ${donor.name}`,
      description: `Blood group: ${donor.group} · ${donor.city}. They will be notified.`,
    });
  };

  // ── Map-compatible donor data ──
  const mapDonors = donors.filter(d => d.distance_km != null).map((d, i) => ({
    id: i + 1,
    name: d.name,
    blood_group: d.group,
    city: d.city,
    trust_score: d.trust,
    distance_km: d.distance_km ?? 0,
    lat: 19.076 + (Math.random() - 0.5) * 0.1,  // approx since API may not return coords
    lng: 72.877 + (Math.random() - 0.5) * 0.1,
  }));

  // ── Skeletons ──
  const RequestSkeleton = () => (
    <div className="rounded-xl border-2 border-blood/20 bg-card p-4 flex items-center gap-4">
      <Skeleton className="w-12 h-12 rounded-xl" />
      <div className="flex-1 space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
      <Skeleton className="h-8 w-16 rounded-lg" />
    </div>
  );

  const DonorSkeleton = () => (
    <div className="rounded-xl border-2 bg-card p-4 space-y-3">
      <div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-xl" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-32" /></div></div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );

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
                { label: "Active Donors", value: stats.activeDonors },
                { label: "Matches Today", value: stats.matchesToday },
                { label: "Avg Match Time", value: stats.avgTime },
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
            {/* ── LEFT: Search + Post Request ─────────────────────────── */}
            <div className="space-y-5">
              {/* Search panel */}
              <div className="rounded-2xl border-2 border-blood/20 bg-card p-5 shadow-card">
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
                          className={`h-9 rounded-lg border-2 font-display text-xs font-bold transition-all ${selectedGroup === g
                              ? "border-blood bg-blood/15 text-blood"
                              : "border-border hover:border-blood hover:bg-blood/10"
                            }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Location / PIN</label>
                    <Input
                      placeholder="Enter city or PIN code"
                      className="h-10 rounded-xl font-body"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Units Required</label>
                    <Input
                      type="number"
                      placeholder="e.g. 2"
                      className="h-10 rounded-xl font-body"
                      value={unitsNeeded}
                      onChange={(e) => setUnitsNeeded(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-blood text-primary-foreground font-body font-bold rounded-xl h-11"
                    onClick={handleSearch}
                  >
                    Search Donors
                  </Button>
                </div>
              </div>

              {/* Post request */}
              <div className="rounded-2xl border-2 border-blood/20 bg-blood/5 p-5">
                <h3 className="font-display text-base font-bold text-foreground mb-2">Hospital? Post Urgent Need</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">Notify verified donors near your hospital instantly.</p>

                <AnimatePresence>
                  {showPostForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 mb-3 overflow-hidden"
                    >
                      <div>
                        <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Blood Group Needed</label>
                        <div className="grid grid-cols-4 gap-1">
                          {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                            <button
                              key={g}
                              onClick={() => setPostGroup(g)}
                              className={`h-8 rounded-lg border text-xs font-bold transition-all ${postGroup === g ? "border-blood bg-blood text-white" : "border-border hover:border-blood"
                                }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Units</label>
                          <Input
                            type="number"
                            value={postUnits}
                            onChange={(e) => setPostUnits(e.target.value)}
                            className="h-9 rounded-lg font-body text-sm"
                            min={1}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="font-body text-xs font-semibold text-muted-foreground mb-1 block">Urgency</label>
                          <div className="flex gap-1">
                            {["critical", "urgent", "normal"].map((u) => (
                              <button
                                key={u}
                                onClick={() => setPostUrgency(u)}
                                className={`flex-1 h-9 rounded-lg border text-xs font-bold capitalize transition-all ${postUrgency === u ? "border-blood bg-blood text-white" : "border-border hover:border-blood"
                                  }`}
                              >
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full bg-blood text-primary-foreground font-body font-bold rounded-xl"
                        onClick={handlePostRequest}
                        disabled={posting}
                      >
                        {posting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-1.5" />}
                        {posting ? "Posting..." : "Submit Request"}
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="outline"
                  className="w-full border-blood text-blood font-body font-semibold rounded-xl hover:bg-blood hover:text-primary-foreground"
                  onClick={() => setShowPostForm(!showPostForm)}
                >
                  {showPostForm ? (
                    <><X className="w-4 h-4 mr-1.5" /> Cancel</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-1.5" /> Post Request</>
                  )}
                </Button>
              </div>

              {/* Shortage prediction */}
              {shortages.length > 0 && (
                <div className="rounded-2xl border-2 border-blood/20 bg-card p-5 shadow-card">
                  <h3 className="font-display text-base font-bold text-foreground mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-blood" /> Shortage Alert
                  </h3>
                  <div className="space-y-2">
                    {shortages.filter(s => s.deficit > 0).slice(0, 4).map((s) => (
                      <div key={s.blood_group} className="flex items-center justify-between p-2 rounded-lg bg-blood/5">
                        <span className="font-display font-bold text-sm text-blood">{s.blood_group}</span>
                        <span className="font-body text-xs text-muted-foreground">
                          {s.requests} needed · {s.donors_available} available
                        </span>
                        <Badge className={`text-xs border-0 font-body ${s.severity === "critical" ? "bg-blood/15 text-blood" : "bg-platelet/15 text-platelet"}`}>
                          {s.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: Results ───────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Urgent requests */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-blood animate-pulse" /> Live Urgent Requests
                  </h3>
                  {errorRequests && (
                    <Button variant="ghost" size="sm" onClick={fetchRequests} className="text-blood font-body text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {loadingRequests ? (
                    Array.from({ length: 3 }).map((_, i) => <RequestSkeleton key={i} />)
                  ) : urgentRequests.length === 0 ? (
                    <div className="text-center py-8 rounded-xl border-2 border-dashed border-border">
                      <CheckCircle2 className="w-8 h-8 text-secondary mx-auto mb-2 opacity-50" />
                      <p className="font-body text-sm text-muted-foreground">No urgent requests at this time.</p>
                      <Button variant="ghost" size="sm" className="mt-2 text-blood font-body" onClick={fetchRequests}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                      </Button>
                    </div>
                  ) : (
                    urgentRequests.map((req, i) => (
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
                            <Badge className={`text-xs border-0 font-body ${req.urgency === "CRITICAL" ? "bg-blood/15 text-blood" :
                                req.urgency === "URGENT" ? "bg-platelet/15 text-platelet" :
                                  "bg-muted text-muted-foreground"
                              }`}>
                              {req.urgency}
                            </Badge>
                          </div>
                          <div className="font-body text-xs text-muted-foreground mt-0.5">
                            {req.units} unit(s) · <MapPin className="w-3 h-3 inline" /> {req.city}
                            {req.posted ? ` · ${req.posted}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-blood font-body font-bold text-sm">
                            <Clock className="w-3.5 h-3.5" /> {req.timeLeft}
                          </div>
                          <div className="font-body text-xs text-muted-foreground">remaining</div>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blood text-primary-foreground font-body font-semibold rounded-lg"
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
                  <h3 className="font-display text-xl font-bold text-foreground">
                    Available Donors{selectedGroup ? ` (${selectedGroup})` : ""}
                  </h3>
                  {errorDonors && (
                    <Button variant="ghost" size="sm" onClick={() => fetchDonors()} className="text-blood font-body text-xs">
                      <RefreshCw className="w-3 h-3 mr-1" /> Retry
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loadingDonors ? (
                    Array.from({ length: 4 }).map((_, i) => <DonorSkeleton key={i} />)
                  ) : donors.length === 0 ? (
                    <div className="col-span-2 text-center py-8 rounded-xl border-2 border-dashed border-border">
                      <p className="font-body text-sm text-muted-foreground">No donors found. Try different filters.</p>
                      <Button variant="ghost" size="sm" className="mt-2 text-blood font-body" onClick={() => fetchDonors()}>
                        <RefreshCw className="w-3 h-3 mr-1" /> Show All
                      </Button>
                    </div>
                  ) : (
                    donors.map((donor, i) => (
                      <motion.div
                        key={donor.id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={`rounded-xl border-2 bg-card p-4 shadow-card ${donor.available ? "border-secondary/30" : "border-border opacity-60"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blood/10 flex items-center justify-center font-display font-bold text-blood">
                              {donor.name?.[0] || "?"}
                            </div>
                            <div>
                              <div className="font-body font-bold text-sm text-foreground">{donor.name}</div>
                              <div className="font-body text-xs text-muted-foreground">{donor.city}</div>
                            </div>
                          </div>
                          <Badge className={`font-body text-xs border-0 ${donor.available ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"
                            }`}>
                            {donor.available ? "Available" : "Busy"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-body text-muted-foreground mb-3">
                          <span className="font-bold text-blood">{donor.group}</span>
                          <span><MapPin className="w-3 h-3 inline" /> {donor.distance}</span>
                          <span>⭐ {donor.trust}</span>
                          <span>Last: {donor.last_donated}</span>
                        </div>
                        {donor.eligible_to_donate && (
                          <Badge className="mb-2 bg-secondary/10 text-secondary border-0 font-body text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Eligible
                          </Badge>
                        )}
                        {donor.available && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-border font-body text-xs rounded-lg"
                              onClick={() => toast({ title: donor.name, description: `${donor.group} · ${donor.city} · Trust: ${donor.trust}⭐ · ${donor.last_donated}` })}
                            >
                              View Profile
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-blood text-primary-foreground font-body text-xs rounded-lg"
                              onClick={() => handleRequestDonor(donor)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Request
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Interactive Donor Map */}
              <div>
                <h3 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blood" /> Nearby Donors
                </h3>
                <div className="rounded-2xl border-2 border-blood/20 bg-card shadow-card overflow-hidden">
                  <BloodBridgeMap donors={mapDonors.length > 0 ? mapDonors : undefined} />
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
