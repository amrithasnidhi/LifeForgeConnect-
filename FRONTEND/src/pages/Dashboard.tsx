import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Bell, MapPin, CheckCircle2, AlertCircle, Clock,
  Users, TrendingUp, Activity, Plus, Eye, Settings, LogOut,
<<<<<<< Updated upstream
  Shield, Star, ChevronRight, BarChart3, Loader2, RefreshCw
=======
  Shield, Star, ChevronRight, BarChart3, Loader2
>>>>>>> Stashed changes
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/AuthContext";
<<<<<<< Updated upstream
import { api, getCurrentUserId, DonorDashboard as DonorDashboardType } from "@/lib/api";

const MODULE_ROUTES: Record<string, string> = {
  BloodBridge: "/blood-bridge",
  PlateletAlert: "/platelet-alert",
  MarrowMatch: "/marrow-match",
};

function DonorDashboard() {
  const [available, setAvailable] = useState(true);
  const [data, setData] = useState<DonorDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userName, profile } = useAuth();

  const donorId = getCurrentUserId();

  useEffect(() => {
    if (!donorId) {
      setLoading(false);
      setError("Please log in to view your dashboard.");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);
    api.dashboard
      .getDonor(donorId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e) => {
        if (!cancelled) {
          const msg = e.message || "";
          if (msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("404")) {
            setData(null);
            setError("");
          } else {
            setError(msg || "Failed to load dashboard");
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [donorId]);

  const p = data?.profile;
  const stats = data?.stats;
  const urgentRequests = data?.urgent_requests ?? [];
  const donationHistory = data?.donation_history ?? [];

  const name = p?.name || profile?.name || userName || "Donor";
  const initial = (p?.initial || name.charAt(0)).toUpperCase();
  const bloodGroup = p?.blood_group || profile?.blood_group || "—";
  const city = p?.city || profile?.city || "—";
  const isVerified = p?.is_verified ?? profile?.is_verified ?? false;
  const trustScore = stats?.trust_score != null ? String(stats.trust_score) : (profile?.trust_score ? (profile.trust_score / 10).toFixed(1) : "—");
  const donorTypes = p?.donor_types || profile?.donor_types || [];
=======
import { api, getCurrentUserId, BloodRequest } from "@/lib/api";
import { toast } from "sonner";

const matchHistory = [
  { date: "Feb 15, 2025", type: "🩸 Blood (O+)", hospital: "Lilavati Hospital", status: "Fulfilled", impact: "3 lives saved" },
  { date: "Jan 28, 2025", type: "⏱️ Platelets", hospital: "Kokilaben Hospital", status: "Fulfilled", impact: "1 patient helped" },
  { date: "Jan 10, 2025", type: "🩸 Blood (O+)", hospital: "Breach Candy Hospital", status: "Fulfilled", impact: "2 lives saved" },
];

function DonorDashboard() {
  const [available, setAvailable] = useState(true);
  const [activeRequests, setActiveRequests] = useState<BloodRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userName, profile } = useAuth();

  useEffect(() => {
    const fetchRequests = async () => {
      const donorId = getCurrentUserId();
      if (!donorId) return;
      try {
        const reqs = await api.blood.getRequestsForDonor(donorId);
        setActiveRequests(reqs);
      } catch (error) {
        console.error("Failed to fetch donor requests", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleRespond = (req: BloodRequest) => {
    toast.success(`Response sent to ${req.hospital}!`, {
      description: `They will contact you shortly for the ${req.group} blood donation.`,
      icon: <Heart className="w-4 h-4 text-blood" />
    });
  };

  const name = profile?.name || userName || "Donor";
  const initial = name.charAt(0).toUpperCase();
  const bloodGroup = profile?.blood_group || "—";
  const city = profile?.city || "—";
  const isVerified = profile?.is_verified ?? false;
  const trustScore = profile?.trust_score ? (profile.trust_score / 10).toFixed(1) : "—";
  const donorTypes = profile?.donor_types || [];
>>>>>>> Stashed changes
  const donorTypeSummary = [
    bloodGroup !== "—" ? `${bloodGroup} Blood` : null,
    donorTypes.includes("marrow") ? "Marrow Pledged" : null,
    city !== "—" ? `${city}` : null,
  ].filter(Boolean).join(" · ") || "—";
  const nextEligible = stats?.next_eligible ?? "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="font-body text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="font-body">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const showProfileBanner = !data && donorId;

  return (
    <div className="space-y-6">
      {showProfileBanner && (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="font-body text-sm font-medium text-foreground">Profile not found in database</p>
            <p className="font-body text-xs text-muted-foreground mb-1">
              Register as a donor to see urgent requests and track your donation history.
            </p>
            <Button asChild size="sm" variant="outline" className="border-primary text-primary font-body mt-1">
              <Link to="/register">Complete registration</Link>
            </Button>
          </div>
        </div>
      )}
      {/* Profile card */}
      <div className="rounded-2xl bg-gradient-hero p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-accent/10 blur-2xl" />
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 flex items-center justify-center text-3xl font-bold font-display">
            {initial}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-display text-2xl font-bold">{name}</h2>
              {isVerified && (
                <Badge className="bg-accent/20 text-accent border-0 font-body text-xs">
                  <Shield className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
            </div>
            <p className="font-body text-primary-foreground/70 text-sm">{donorTypeSummary}</p>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-accent fill-current" />
                <span className="font-body text-sm font-bold">{trustScore} Trust Score</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-body text-sm font-medium text-primary-foreground/80">Available</span>
            <button
              onClick={() => setAvailable(!available)}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${available ? "bg-accent" : "bg-primary-foreground/30"
                }`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-all duration-300 ${available ? "right-1" : "left-1"
                }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🩸", label: "Blood Group", value: bloodGroup, color: "text-blood" },
          { icon: "📍", label: "City", value: city, color: "text-primary" },
          { icon: "⭐", label: "Trust Score", value: trustScore, color: "text-accent" },
          { icon: "📅", label: "Next Eligible", value: nextEligible, color: "text-secondary" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-xl bg-card border border-border p-4 shadow-card text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
            <div className="font-body text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Urgent nearby */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" /> Urgent Requests Nearby
          </h3>
          <Badge className="bg-primary/10 text-primary border-0 font-body text-xs animate-pulse">
            {activeRequests.length} Active
          </Badge>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : activeRequests.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed rounded-2xl bg-muted/20">
            <Heart className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground font-body font-semibold">No urgent requests matching your blood group matching right now.</p>
            <p className="text-muted-foreground font-body text-xs mt-1">We'll alert you if someone nearby needs your help.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRequests.map((req, i) => (
              <motion.div
                key={req.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border-2 border-border bg-card p-4 flex items-center gap-4 hover:border-primary/30 transition-all shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-blood/10 flex items-center justify-center font-display font-bold text-blood shrink-0">
                  {req.group}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body font-bold text-sm text-foreground truncate">{req.hospital}</span>
                    <Badge
                      className={`text-[10px] border-0 font-body px-1.5 h-4 ${req.urgency === "CRITICAL"
                        ? "bg-blood/15 text-blood"
                        : req.urgency === "URGENT"
                          ? "bg-platelet/15 text-platelet"
                          : "bg-marrow/15 text-marrow"
                        }`}
                    >
                      {req.urgency}
                    </Badge>
                  </div>
                  <div className="font-body text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2">
                    <MapPin className="w-3 h-3 shrink-0" /> {req.city} · <Clock className="w-3 h-3 shrink-0" /> {req.posted}
                  </div>
                </div>
<<<<<<< Updated upstream
              </div>
              <Button
                size="sm"
                asChild
                className="bg-gradient-primary text-primary-foreground font-body font-semibold rounded-lg shadow-primary"
              >
                <Link to={MODULE_ROUTES[req.module] || "/blood-bridge"}>
                  Respond
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
        {urgentRequests.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border bg-card p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <p className="font-body text-sm text-muted-foreground">No urgent requests right now. Check back later!</p>
=======
                <Button
                  size="sm"
                  onClick={() => handleRespond(req)}
                  className="bg-primary text-primary-foreground font-body font-semibold rounded-lg shrink-0"
                >
                  Respond
                </Button>
              </motion.div>
            ))}
>>>>>>> Stashed changes
          </div>
        )}
      </div>

      {/* Match history */}
      <div>
        <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-secondary" /> Donation History
        </h3>
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {["Date", "Type", "Hospital", "Status", "Impact"].map((h) => (
                  <th key={h} className="font-body text-xs font-semibold text-muted-foreground px-4 py-3 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donationHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="font-body text-sm text-muted-foreground px-4 py-8 text-center">
                    No donation history yet. Respond to urgent requests to get started!
                  </td>
                </tr>
              ) : (
                donationHistory.map((row, i) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="font-body text-sm px-4 py-3 text-muted-foreground">{row.date}</td>
                    <td className="font-body text-sm px-4 py-3 font-medium">{row.type}</td>
                    <td className="font-body text-sm px-4 py-3 text-muted-foreground">{row.hospital}</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-secondary/15 text-secondary border-0 font-body text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> {row.status}
                      </Badge>
                    </td>
                    <td className="font-body text-sm px-4 py-3 text-accent font-semibold">{row.impact}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OrgDashboardRouter() {
  const { orgType } = useAuth();
  switch (orgType) {
    case "bloodbank": return <BloodBankDashboard />;
    case "orphanage": return <OrphanageDashboard />;
    case "ngo": return <NgoDashboard />;
    case "hospital":
    default: return <HospitalDashboard />;
  }
}

function HospitalDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hospitalId = getCurrentUserId();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.dashboard.getHospital(hospitalId)
      .then(setData)
      .catch((e) => setError(e.message || "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, [hospitalId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border bg-card p-8 text-center">
        <p className="font-body text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const h = data?.hospital;
  const stats = data?.stats;
  const activeRequests = data?.active_requests ?? [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-hero p-6 text-primary-foreground">
        <h2 className="font-display text-2xl font-bold mb-2">🏥 {h?.name || "Hospital Dashboard"}</h2>
        <p className="font-body text-primary-foreground/70 text-sm mb-4">
          {h?.is_verified ? "Verified Hospital" : "Verification Pending"} · {h?.city}
        </p>
        <Button
          onClick={() => navigate("/blood-bridge")}
          className="bg-primary-foreground text-primary font-body font-bold rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" /> Post Urgent Blood Request
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "📋", label: "Active Requests", value: stats?.active_requests || 0, color: "text-platelet" },
          { icon: "✅", label: "Matched This Month", value: stats?.matched_this_month || 0, color: "text-secondary" },
          { icon: "🩸", label: "Units Received", value: stats?.units_received || 0, color: "text-blood" },
          { icon: "⏱️", label: "Avg Match Time", value: stats?.avg_match_time || "—", color: "text-organ" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-xl bg-card border border-border p-4 shadow-card text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
            <div className="font-body text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display text-lg font-bold mb-4">Active Blood Requests</h3>
        <div className="space-y-3">
          {activeRequests.length === 0 ? (
            <div className="p-10 text-center border-2 border-dashed border-border rounded-2xl">
              <p className="font-body text-muted-foreground">No active requests found.</p>
            </div>
          ) : (
            activeRequests.map((req: any, i: number) => (
              <div key={req.id || i} className="rounded-xl border-2 border-border bg-card p-4 flex items-center gap-4">
                <div className="text-2xl">{req.module === "BloodBridge" ? "🩸" : "⏱️"}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body font-bold text-sm">{req.group}</span>
                    <span className="font-body text-xs text-muted-foreground">· {req.units} unit(s)</span>
                    <Badge className={`text-xs border-0 font-body ${req.urgency === "CRITICAL" ? "bg-blood/15 text-blood" : "bg-platelet/15 text-platelet"}`}>
                      {req.urgency}
                    </Badge>
                  </div>
                  <div className="font-body text-xs text-muted-foreground mt-0.5">
                    {req.matched} donors matched · Posted {req.posted}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-border font-body text-xs rounded-lg">
                    <Eye className="w-3 h-3 mr-1" /> View
                  </Button>
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground font-body text-xs rounded-lg">
                    Contact ({req.matched})
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BloodBankDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-red-600 to-red-800 p-6 text-primary-foreground">
        <h2 className="font-display text-2xl font-bold mb-2">🩸 Blood Bank Dashboard</h2>
        <p className="font-body text-primary-foreground/70 text-sm mb-4">Licensed Blood Collection & Storage Center</p>
        <div className="flex gap-3">
          <Button className="bg-primary-foreground text-red-700 font-body font-bold rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Log New Collection
          </Button>
          <Button variant="outline" className="border-primary-foreground/40 text-primary-foreground font-body font-bold rounded-xl hover:bg-primary-foreground/10">
            <Activity className="w-4 h-4 mr-2" /> View Inventory
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🩸", label: "Units in Stock", value: "342", color: "text-blood" },
          { icon: "📥", label: "Collected Today", value: "18", color: "text-secondary" },
          { icon: "📤", label: "Dispatched Today", value: "12", color: "text-platelet" },
          { icon: "⚠️", label: "Expiring Soon", value: "7", color: "text-organ" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-xl bg-card border border-border p-4 shadow-card text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
            <div className="font-body text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display text-lg font-bold mb-4">Blood Inventory by Group</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {[
            { group: "A+", units: 58, status: "ok" }, { group: "A-", units: 12, status: "low" },
            { group: "B+", units: 74, status: "ok" }, { group: "B-", units: 8, status: "critical" },
            { group: "AB+", units: 31, status: "ok" }, { group: "AB-", units: 5, status: "critical" },
            { group: "O+", units: 96, status: "ok" }, { group: "O-", units: 3, status: "critical" },
          ].map(({ group, units, status }) => (
            <div key={group} className={`rounded-xl border-2 p-3 text-center ${status === "critical" ? "border-blood bg-blood/5" : status === "low" ? "border-platelet bg-platelet/5" : "border-border bg-card"
              }`}>
              <div className="font-display text-lg font-bold">{group}</div>
              <div className={`font-display text-xl font-bold ${status === "critical" ? "text-blood" : status === "low" ? "text-platelet" : "text-foreground"
                }`}>{units}</div>
              <div className="font-body text-xs text-muted-foreground">units</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold mb-4">Recent Dispatch Requests</h3>
        <div className="space-y-3">
          {[
            { hospital: "KEM Hospital", group: "O-", units: 2, status: "Dispatched", time: "15 min ago" },
            { hospital: "Lilavati Hospital", group: "B+", units: 3, status: "Pending", time: "45 min ago" },
            { hospital: "Hinduja Hospital", group: "AB+", units: 1, status: "Dispatched", time: "1 hr ago" },
          ].map((req, i) => (
            <div key={i} className="rounded-xl border-2 border-border bg-card p-4 flex items-center gap-4">
              <div className="text-2xl">🏥</div>
              <div className="flex-1">
                <span className="font-body font-bold text-sm">{req.hospital}</span>
                <div className="font-body text-xs text-muted-foreground mt-0.5">
                  {req.group} · {req.units} unit(s) · {req.time}
                </div>
              </div>
              <Badge className={`text-xs border-0 font-body ${req.status === "Dispatched" ? "bg-secondary/15 text-secondary" : "bg-platelet/15 text-platelet"}`}>
                {req.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrphanageDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-primary-foreground">
        <h2 className="font-display text-2xl font-bold mb-2">🏠 Orphanage Dashboard</h2>
        <p className="font-body text-primary-foreground/70 text-sm mb-4">Registered Child Care Institution</p>
        <div className="flex gap-3">
          <Button className="bg-primary-foreground text-amber-700 font-body font-bold rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Request Breast Milk
          </Button>
          <Button variant="outline" className="border-primary-foreground/40 text-primary-foreground font-body font-bold rounded-xl hover:bg-primary-foreground/10">
            <Users className="w-4 h-4 mr-2" /> View Children
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "👶", label: "Children Under Care", value: "34", color: "text-platelet" },
          { icon: "🍼", label: "Milk Received (L)", value: "28", color: "text-secondary" },
          { icon: "💉", label: "Health Checkups Due", value: "5", color: "text-blood" },
          { icon: "🤝", label: "Active Donors", value: "12", color: "text-organ" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-xl bg-card border border-border p-4 shadow-card text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
            <div className="font-body text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display text-lg font-bold mb-4">Pending Requests</h3>
        <div className="space-y-3">
          {[
            { type: "🍼", need: "Breast Milk", qty: "5 liters", urgency: "URGENT", posted: "2 hrs ago" },
            { type: "🩸", need: "Blood (B+)", qty: "2 units", urgency: "NORMAL", posted: "1 day ago" },
            { type: "💊", need: "Thalassemia Screening", qty: "8 children", urgency: "SCHEDULED", posted: "3 days ago" },
          ].map((req, i) => (
            <div key={i} className="rounded-xl border-2 border-border bg-card p-4 flex items-center gap-4">
              <div className="text-2xl">{req.type}</div>
              <div className="flex-1">
                <span className="font-body font-bold text-sm">{req.need}</span>
                <div className="font-body text-xs text-muted-foreground mt-0.5">
                  {req.qty} · Posted {req.posted}
                </div>
              </div>
              <Badge className={`text-xs border-0 font-body ${req.urgency === "URGENT" ? "bg-blood/15 text-blood" : req.urgency === "SCHEDULED" ? "bg-muted text-muted-foreground" : "bg-secondary/15 text-secondary"
                }`}>
                {req.urgency}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NgoDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-primary-foreground">
        <h2 className="font-display text-2xl font-bold mb-2">🤝 NGO / Foundation Dashboard</h2>
        <p className="font-body text-primary-foreground/70 text-sm mb-4">Verified Non-Profit Organization</p>
        <div className="flex gap-3">
          <Button className="bg-primary-foreground text-emerald-700 font-body font-bold rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Organize Drive
          </Button>
          <Button variant="outline" className="border-primary-foreground/40 text-primary-foreground font-body font-bold rounded-xl hover:bg-primary-foreground/10">
            <BarChart3 className="w-4 h-4 mr-2" /> Impact Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🎯", label: "Drives This Month", value: "6", color: "text-secondary" },
          { icon: "👥", label: "Donors Mobilized", value: "284", color: "text-platelet" },
          { icon: "🩸", label: "Units Collected", value: "152", color: "text-blood" },
          { icon: "🏥", label: "Partner Hospitals", value: "11", color: "text-organ" },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-xl bg-card border border-border p-4 shadow-card text-center">
            <div className="text-2xl mb-1">{icon}</div>
            <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
            <div className="font-body text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="font-display text-lg font-bold mb-4">Upcoming Drives</h3>
        <div className="space-y-3">
          {[
            { name: "Mega Blood Drive — Dadar", date: "22 Feb, 9 AM", registered: 45, target: 100, status: "OPEN" },
            { name: "Thalassemia Awareness Camp", date: "25 Feb, 10 AM", registered: 28, target: 50, status: "OPEN" },
            { name: "Platelet Donation Drive — Andheri", date: "1 Mar, 8 AM", registered: 0, target: 60, status: "UPCOMING" },
          ].map((drive, i) => (
            <div key={i} className="rounded-xl border-2 border-border bg-card p-4 flex items-center gap-4">
              <div className="text-2xl">📅</div>
              <div className="flex-1">
                <span className="font-body font-bold text-sm">{drive.name}</span>
                <div className="font-body text-xs text-muted-foreground mt-0.5">
                  {drive.date} · {drive.registered}/{drive.target} registered
                </div>
              </div>
              <Badge className={`text-xs border-0 font-body ${drive.status === "OPEN" ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"}`}>
                {drive.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg font-bold mb-4">Recent Impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Lives Saved This Month", value: "47", icon: "❤️" },
            { label: "Volunteer Hours", value: "320", icon: "⏰" },
            { label: "Communities Reached", value: "8", icon: "🌍" },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-xl bg-card border border-border p-5 shadow-card text-center">
              <div className="text-3xl mb-2">{icon}</div>
              <div className="font-display text-3xl font-bold text-foreground">{value}</div>
              <div className="font-body text-sm text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: "🔍", label: "Pending Verifications", value: "142", color: "text-platelet", action: "Review" },
          { icon: "🚩", label: "Flagged Accounts", value: "7", color: "text-blood", action: "Investigate" },
          { icon: "👥", label: "Total Users", value: "12.4L", color: "text-secondary", action: "View All" },
          { icon: "📊", label: "Today's Matches", value: "2,847", color: "text-organ", action: "Analytics" },
        ].map(({ icon, label, value, color, action }) => (
          <div key={label} className="rounded-xl bg-card border border-border p-5 shadow-card">
            <div className="text-2xl mb-2">{icon}</div>
            <div className={`font-display text-3xl font-bold ${color} mb-1`}>{value}</div>
            <div className="font-body text-xs text-muted-foreground mb-3">{label}</div>
            <Button size="sm" variant="outline" className="border-border font-body text-xs rounded-lg w-full">
              {action} <ChevronRight className="w-3 h-3 ml-auto" />
            </Button>
          </div>
        ))}
      </div>

      {/* Verification queue */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-secondary" /> Verification Queue
          </h3>
          <Badge className="bg-platelet/15 text-platelet border-0 font-body">142 pending</Badge>
        </div>
        <div className="space-y-3">
          {[
            { name: "Priya Nair", type: "Donor", city: "Chennai", docs: "Aadhaar, Blood Report", time: "2h ago" },
            { name: "Ramesh Blood Bank", type: "Hospital", city: "Pune", docs: "License, NABH", time: "4h ago" },
            { name: "Kavita Deshpande", type: "Donor", city: "Nagpur", docs: "Aadhaar, HLA Report", time: "6h ago" },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-display font-bold text-foreground">
                {item.name[0]}
              </div>
              <div className="flex-1">
                <div className="font-body font-semibold text-sm text-foreground">{item.name}</div>
                <div className="font-body text-xs text-muted-foreground">{item.type} · {item.city} · {item.docs} · {item.time}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-secondary text-secondary rounded-lg font-body text-xs">
                  ✓ Approve
                </Button>
                <Button size="sm" variant="outline" className="border-blood text-blood rounded-lg font-body text-xs">
                  ✗ Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { role, userName, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if no role is set
  if (!role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-foreground">Please log in first</h2>
          <p className="font-body text-muted-foreground">You need to be logged in to view the dashboard.</p>
          <Link to="/login">
            <Button className="bg-gradient-primary text-primary-foreground font-body font-bold rounded-xl">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabels: Record<string, string> = {
    donor: "🩸 Donor",
    hospital: "🏥 Hospital",
    admin: "🛡️ Admin",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-primary fill-current" />
              <span className="font-body text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dashboard</span>
              <Badge className="bg-muted text-muted-foreground border-0 font-body text-xs ml-2">
                {roleLabels[role]}
              </Badge>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Welcome back, {userName} 👋</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-border font-body rounded-xl">
              <Bell className="w-4 h-4 mr-1.5" /> Alerts <Badge className="ml-1.5 bg-primary text-primary-foreground text-xs border-0">3</Badge>
            </Button>
            <Button variant="outline" size="sm" className="border-border font-body rounded-xl">
              <Settings className="w-4 h-4 mr-1.5" /> Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-blood text-blood font-body rounded-xl hover:bg-blood hover:text-primary-foreground"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-1.5" /> Logout
            </Button>
          </div>
        </motion.div>

        {/* Role-specific dashboard */}
        {role === "donor" && <DonorDashboard />}
        {role === "hospital" && <OrgDashboardRouter />}
        {role === "admin" && <AdminDashboard />}
      </div>
      <Footer />
    </div>
  );
}
