import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, QrCode, Plus, Heart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const donors = [
  { name: "Nisha Patel", babyAge: "3 months", qty: "200ml/day", area: "Andheri, Mumbai", verified: true, impact: "2 babies fed" },
  { name: "Priyanka Roy", babyAge: "2 months", qty: "150ml/day", area: "Salt Lake, Kolkata", verified: true, impact: "1 NICU baby" },
  { name: "Kavya S.", babyAge: "4 months", qty: "180ml/day", area: "Koramangala, Bengaluru", verified: true, impact: "3 babies fed" },
];

const milkBank = [
  { id: "MB-001", from: "Nisha P.", pasteurized: "Feb 18", expiry: "Feb 25", qty: "1.2L", status: "Available" },
  { id: "MB-002", from: "Priyanka R.", pasteurized: "Feb 17", expiry: "Feb 24", qty: "0.8L", status: "Reserved" },
  { id: "MB-003", from: "Kavya S.", pasteurized: "Feb 16", expiry: "Feb 23", qty: "1.5L", status: "Low Stock" },
];

export default function MilkBridge() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-to-br from-milk/90 to-amber-400/60 text-foreground py-16 px-4">
          <div className="container mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 text-foreground/60 hover:text-foreground font-body text-sm mb-6">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">🍼</div>
              <div>
                <h1 className="font-display text-5xl font-black text-foreground">MilkBridge</h1>
                <p className="font-body text-foreground/60 text-lg">Nourishing India's tiniest lives</p>
              </div>
            </div>
            <div className="flex gap-6 mt-6 flex-wrap">
              {[
                { label: "Active Donors", value: "4,820" },
                { label: "Babies Helped", value: "12,400" },
                { label: "Milk Banks", value: "42" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-foreground/10 rounded-xl px-5 py-3 backdrop-blur-sm">
                  <div className="font-display text-2xl font-bold text-foreground">{value}</div>
                  <div className="font-body text-xs text-foreground/60">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-5">
              {/* Register donor */}
              <div className="rounded-2xl border-2 border-milk/30 bg-card p-5 shadow-card">
                <h3 className="font-display text-base font-bold mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-milk" /> Register as Donor
                  <Badge className="bg-milk/20 text-amber-700 border-0 font-body text-xs ml-auto">Women Only</Badge>
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Baby's Age</Label>
                    <Input placeholder="e.g. 3 months" className="h-10 rounded-xl font-body" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Quantity Available</Label>
                    <Input placeholder="e.g. 150 ml/day" className="h-10 rounded-xl font-body" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pickup Location</Label>
                    <Input placeholder="Area, City" className="h-10 rounded-xl font-body" />
                  </div>
                  <p className="font-body text-xs text-muted-foreground">
                    You'll need to complete a health quiz and upload a recent blood test report.
                  </p>
                  <Button className="w-full bg-milk text-foreground font-body font-bold rounded-xl">
                    Register as Donor
                  </Button>
                </div>
              </div>

              {/* Shortage alert */}
              <div className="rounded-2xl border-2 border-blood/20 bg-blood/5 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-blood" />
                  <h3 className="font-display text-base font-bold text-blood">Shortage Alert</h3>
                </div>
                <p className="font-body text-xs text-muted-foreground mb-3">
                  NICU at Rainbow Children's Hospital, Hyderabad needs <strong>500ml/day</strong> for premature infants.
                </p>
                <Button variant="outline" className="w-full border-blood text-blood font-body font-semibold rounded-xl hover:bg-blood hover:text-primary-foreground text-sm">
                  Respond to Alert
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* Donor cards with impact */}
              <div>
                <h3 className="font-display text-xl font-bold mb-4">Active Donors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {donors.map((d, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="rounded-2xl border-2 border-milk/25 bg-card p-5 shadow-card"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-milk/15 flex items-center justify-center text-2xl mx-auto mb-3">
                        🤱
                      </div>
                      <div className="text-center">
                        <div className="font-body font-bold text-foreground">{d.name}</div>
                        <div className="font-body text-xs text-muted-foreground">Baby age: {d.babyAge}</div>
                        <div className="font-body text-xs text-muted-foreground">{d.area}</div>
                      </div>
                      <div className="mt-3 p-2.5 rounded-xl bg-milk/10 text-center">
                        <div className="font-display font-bold text-milk text-lg">{d.qty}</div>
                        <div className="font-body text-xs text-muted-foreground">available</div>
                      </div>
                      <div className="mt-3 text-center">
                        <Badge className="bg-secondary/15 text-secondary border-0 font-body text-xs">
                          ❤️ {d.impact}
                        </Badge>
                      </div>
                      <Button size="sm" className="w-full mt-3 bg-milk text-foreground font-body text-xs font-bold rounded-lg">
                        Request Donation
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Milk Bank */}
              <div>
                <h3 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  🏦 Milk Bank — Pasteurization Log
                  <Badge className="bg-milk/20 text-amber-700 border-0 font-body text-xs">Milk Passport™</Badge>
                </h3>
                <div className="rounded-xl border border-border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        {["Passport ID", "Donor", "Pasteurized", "Expiry", "Qty", "Status", "QR"].map((h) => (
                          <th key={h} className="font-body text-xs font-semibold text-muted-foreground px-4 py-3 text-left">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {milkBank.map((row, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                          <td className="font-body text-xs font-bold px-4 py-3 text-milk">{row.id}</td>
                          <td className="font-body text-sm px-4 py-3 font-medium">{row.from}</td>
                          <td className="font-body text-xs px-4 py-3 text-muted-foreground">{row.pasteurized}</td>
                          <td className="font-body text-xs px-4 py-3 text-muted-foreground">{row.expiry}</td>
                          <td className="font-body text-sm px-4 py-3 font-semibold">{row.qty}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs border-0 font-body ${row.status === "Available" ? "bg-secondary/15 text-secondary" : row.status === "Low Stock" ? "bg-blood/15 text-blood" : "bg-muted text-muted-foreground"}`}>
                              {row.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <button className="text-milk hover:text-milk/70 transition-colors">
                              <QrCode className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
