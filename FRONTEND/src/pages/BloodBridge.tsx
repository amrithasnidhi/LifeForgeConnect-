import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock, AlertTriangle, CheckCircle2, Plus, Filter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const donors = [
  { name: "Rahul M.", group: "O-", distance: "1.2 km", trust: 4.9, lastDonated: "92 days ago", available: true, city: "Andheri, Mumbai" },
  { name: "Sneha P.", group: "O-", distance: "2.7 km", trust: 4.7, lastDonated: "95 days ago", available: true, city: "Bandra, Mumbai" },
  { name: "Vikram S.", group: "O-", distance: "3.4 km", trust: 4.8, lastDonated: "100 days ago", available: true, city: "Juhu, Mumbai" },
  { name: "Anita K.", group: "O-", distance: "4.8 km", trust: 4.6, lastDonated: "98 days ago", available: false, city: "Powai, Mumbai" },
];

const urgentRequests = [
  { hospital: "KEM Hospital", group: "O-", units: 3, urgency: "CRITICAL", timeLeft: "2h 14m", city: "Parel, Mumbai" },
  { hospital: "Tata Memorial", group: "AB+", units: 2, urgency: "URGENT", timeLeft: "5h 40m", city: "Parel, Mumbai" },
  { hospital: "Lilavati Hospital", group: "B-", units: 1, urgency: "HIGH", timeLeft: "9h 00m", city: "Bandra, Mumbai" },
];

export default function BloodBridge() {
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
              <div className="rounded-2xl border-2 border-blood/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-blood" /> Find Donors
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Blood Group</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((g) => (
                        <button key={g} className="h-9 rounded-lg border-2 border-border hover:border-blood hover:bg-blood/10 font-display text-xs font-bold transition-all">
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Location / PIN</label>
                    <Input placeholder="Enter city or PIN code" className="h-10 rounded-xl font-body" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Units Required</label>
                    <Input type="number" placeholder="e.g. 2" className="h-10 rounded-xl font-body" />
                  </div>
                  <Button className="w-full bg-blood text-primary-foreground font-body font-bold rounded-xl h-11">
                    Search Donors
                  </Button>
                </div>
              </div>

              {/* Post request */}
              <div className="rounded-2xl border-2 border-blood/20 bg-blood/5 p-5">
                <h3 className="font-display text-base font-bold text-foreground mb-2">Hospital? Post Urgent Need</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">Notify verified donors near your hospital instantly.</p>
                <Button variant="outline" className="w-full border-blood text-blood font-body font-semibold rounded-xl hover:bg-blood hover:text-primary-foreground">
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
                  {urgentRequests.map((req, i) => (
                    <motion.div
                      key={i}
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
                        <div className="font-body text-xs text-muted-foreground mt-0.5">
                          {req.units} unit(s) · <MapPin className="w-3 h-3 inline" /> {req.city}
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
                  ))}
                </div>
              </div>

              {/* Donor cards */}
              <div>
                <h3 className="font-display text-xl font-bold text-foreground mb-4">Available Donors (O-)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {donors.map((donor, i) => (
                    <motion.div
                      key={i}
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
                          <div>
                            <div className="font-body font-bold text-sm text-foreground">{donor.name}</div>
                            <div className="font-body text-xs text-muted-foreground">{donor.city}</div>
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
                        <span>Last: {donor.lastDonated}</span>
                      </div>
                      {donor.available && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 border-border font-body text-xs rounded-lg">
                            View Profile
                          </Button>
                          <Button size="sm" className="flex-1 bg-blood text-primary-foreground font-body text-xs rounded-lg">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Request
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  ))}
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
