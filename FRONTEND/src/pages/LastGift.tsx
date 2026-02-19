import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Heart, QrCode, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const organs = [
  { name: "Heart", emoji: "❤️", window: "4–6 hrs", viabilityHrs: 5, color: "text-blood", bg: "bg-blood" },
  { name: "Liver", emoji: "🫀", window: "12–24 hrs", viabilityHrs: 18, color: "text-thal", bg: "bg-thal" },
  { name: "Kidney", emoji: "🫘", window: "24–36 hrs", viabilityHrs: 30, color: "text-organ", bg: "bg-organ" },
  { name: "Lungs", emoji: "🫁", window: "4–6 hrs", viabilityHrs: 5, color: "text-marrow", bg: "bg-marrow" },
  { name: "Pancreas", emoji: "🔬", window: "12–18 hrs", viabilityHrs: 15, color: "text-platelet", bg: "bg-platelet" },
  { name: "Cornea", emoji: "👁️", window: "5–7 days", viabilityHrs: 144, color: "text-milk", bg: "bg-milk" },
];

const recipients = [
  { name: "P. Ramaswamy", organ: "Kidney", blood: "O+", urgency: 9.8, hospital: "PGIMER, Chandigarh", wait: "3.2 yrs" },
  { name: "S. Krishnan", organ: "Liver", blood: "B+", urgency: 9.4, hospital: "Apollo, Chennai", wait: "1.8 yrs" },
  { name: "Anita G.", organ: "Heart", blood: "A-", urgency: 10.0, hospital: "Fortis, Delhi", wait: "11 months" },
];

function ViabilityTimer({ name, hrs, maxHrs }: { name: string; hrs: number; maxHrs: number }) {
  const pct = (hrs / maxHrs) * 100;
  const remaining = Math.round(hrs * 0.6);
  return (
    <div className="p-3 rounded-xl border border-border bg-card">
      <div className="flex justify-between items-center mb-2">
        <span className="font-body text-xs font-semibold text-foreground">{name}</span>
        <span className={`font-display font-bold text-sm ${hrs < 8 ? "text-blood animate-pulse" : "text-organ"}`}>{remaining}h left</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${hrs < 8 ? "bg-blood" : "bg-organ"}`} style={{ width: `${100 - pct}%` }} />
      </div>
    </div>
  );
}

export default function LastGift() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-to-br from-organ/90 to-cyan-700/60 text-primary-foreground py-16 px-4">
          <div className="container mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground font-body text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">🫁</div>
              <div>
                <h1 className="font-display text-5xl font-black">LastGift</h1>
                <p className="font-body text-primary-foreground/70 text-lg">Dignified organ donation. Lasting impact.</p>
              </div>
            </div>
            <div className="flex gap-6 mt-6 flex-wrap">
              {[
                { label: "Pledged Donors", value: "2.1L" },
                { label: "Organ Types", value: "6" },
                { label: "Lives Saved", value: "8,420" },
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
              {/* Pledge card */}
              <div className="rounded-2xl border-2 border-organ/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-organ fill-current" /> Pledge Your Organs
                </h3>
                <p className="font-body text-sm text-muted-foreground mb-4 leading-relaxed">
                  Select which organs you wish to donate. Family OTP consent required. Receive a digital pledge card + QR code.
                </p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {organs.map((o) => (
                    <button key={o.name} className={`rounded-xl p-2.5 text-center border-2 border-border hover:border-organ hover:bg-organ/10 transition-all`}>
                      <div className="text-xl">{o.emoji}</div>
                      <div className="font-body text-xs font-semibold text-foreground mt-0.5">{o.name}</div>
                    </button>
                  ))}
                </div>
                <Button className="w-full bg-organ text-primary-foreground font-body font-bold rounded-xl">
                  <QrCode className="w-4 h-4 mr-2" /> Get Digital Pledge Card
                </Button>
              </div>

              {/* Viability timers */}
              <div className="rounded-2xl border-2 border-organ/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-organ" /> Viability Windows
                </h3>
                <div className="space-y-2">
                  <ViabilityTimer name="Heart (active case)" hrs={4} maxHrs={6} />
                  <ViabilityTimer name="Kidney (active case)" hrs={24} maxHrs={36} />
                  <ViabilityTimer name="Liver (active case)" hrs={12} maxHrs={24} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* Organ viability */}
              <div>
                <h3 className="font-display text-xl font-bold mb-4">Organ Viability Windows</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {organs.map((o, i) => (
                    <motion.div
                      key={o.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className="rounded-xl border-2 border-border bg-card p-4 text-center shadow-card hover:border-organ/30 transition-all"
                    >
                      <div className="text-3xl mb-2">{o.emoji}</div>
                      <div className="font-display font-bold text-foreground text-base">{o.name}</div>
                      <div className={`font-body text-sm font-bold mt-1 ${o.color}`}>{o.window}</div>
                      <div className="font-body text-xs text-muted-foreground">viability</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Recipients */}
              <div>
                <h3 className="font-display text-xl font-bold mb-4">Recipient Ranking (Active)</h3>
                <div className="space-y-3">
                  {recipients.map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-xl border-2 border-organ/20 bg-card p-4 flex items-center gap-4"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-organ/10 flex items-center justify-center font-display font-black text-organ text-sm`}>
                        #{i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-body font-bold text-sm">{r.name}</span>
                          <Badge className="bg-organ/15 text-organ border-0 font-body text-xs">{r.organ}</Badge>
                          <span className="font-body text-xs text-muted-foreground">{r.blood}</span>
                        </div>
                        <div className="font-body text-xs text-muted-foreground mt-0.5">
                          <MapPin className="w-3 h-3 inline" /> {r.hospital} · Wait: {r.wait}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-black text-organ text-xl">{r.urgency}</div>
                        <div className="font-body text-xs text-muted-foreground">urgency</div>
                      </div>
                      <Button size="sm" className="bg-organ text-primary-foreground font-body font-semibold rounded-lg">
                        Match <ChevronRight className="w-3 h-3 ml-1" />
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
