import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Timer, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const donors = [
  { name: "Deepak A.", group: "A+", compat: 98, trust: 4.9, lastApheresis: "16 days ago", nextAvail: "Tomorrow", city: "Dadar, Mumbai" },
  { name: "Rekha B.", group: "O+", compat: 94, trust: 4.8, lastApheresis: "18 days ago", nextAvail: "Today", city: "Sion, Mumbai" },
  { name: "Kiran T.", group: "A+", compat: 91, trust: 4.7, lastApheresis: "20 days ago", nextAvail: "Feb 22", city: "Chembur, Mumbai" },
];

const requests = [
  { patient: "Ananya R.", cancer: "Leukemia (AML)", group: "A+", units: 2, expiry: "4d 12h", urgency: "HIGH", hospital: "Tata Memorial" },
  { patient: "Suresh M.", cancer: "Lymphoma", group: "O+", units: 1, expiry: "2d 6h", urgency: "CRITICAL", hospital: "AIIMS, Delhi" },
];

function ExpiryTimer({ label, hours }: { label: string; hours: number }) {
  const pct = (hours / 120) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="font-body text-xs text-muted-foreground">{label}</span>
        <span className={`font-body text-xs font-bold ${hours < 48 ? "text-blood" : "text-platelet"}`}>{label === "Expiry" ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`}</span>
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
                { label: "Active Requests", value: "284" },
                { label: "Expiring in 24h", value: "47" },
                { label: "Apheresis Donors", value: "1,204" },
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
              {/* Expiry clocks */}
              <div className="rounded-2xl border-2 border-platelet/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-platelet animate-pulse" /> Viability Clocks
                </h3>
                <div className="space-y-4">
                  {requests.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-platelet/5 border border-platelet/20">
                      <div className="font-body text-xs font-bold text-foreground mb-2">{r.patient} — {r.cancer}</div>
                      <ExpiryTimer label="Expiry" hours={parseInt(r.expiry) * 24 + 12} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border-2 border-platelet/20 bg-platelet/5 p-5">
                <h3 className="font-display text-base font-bold mb-2">Post Platelet Need</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">Register a cancer patient's platelet requirement.</p>
                <Button className="w-full bg-platelet text-primary-foreground font-body font-bold rounded-xl">
                  <Plus className="w-4 h-4 mr-1.5" /> Add Patient
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* Urgent */}
              <div>
                <h3 className="font-display text-xl font-bold mb-4">Urgent Platelet Requests</h3>
                <div className="space-y-3">
                  {requests.map((req, i) => (
                    <motion.div
                      key={i}
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
                      <Button size="sm" className="bg-platelet text-primary-foreground font-body font-semibold rounded-lg">
                        Donate
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Donor cards */}
              <div>
                <h3 className="font-display text-xl font-bold mb-4">Compatible Apheresis Donors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {donors.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl border-2 border-platelet/20 bg-card p-4 shadow-card text-center"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-platelet/10 flex items-center justify-center text-xl font-display font-bold text-platelet mx-auto mb-2">
                        {d.name[0]}
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
                      <Button size="sm" className="w-full mt-3 bg-platelet text-primary-foreground font-body text-xs rounded-lg">
                        Request
                      </Button>
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
