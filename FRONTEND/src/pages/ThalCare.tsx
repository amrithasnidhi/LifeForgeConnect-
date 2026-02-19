import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Plus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const patients = [
  { name: "Aarav Singh", age: 8, group: "B+", freq: "Every 21 days", nextDate: "Feb 22, 2025", hospital: "AIIMS, Delhi", donor: "Priya M.", countdown: "3 days" },
  { name: "Meera Iyer", age: 12, group: "O+", freq: "Every 28 days", nextDate: "Feb 25, 2025", hospital: "CMC Vellore", donor: "Unmatched", countdown: "6 days" },
  { name: "Rohan Das", age: 5, group: "A+", freq: "Every 14 days", nextDate: "Feb 20, 2025", hospital: "SSKM, Kolkata", donor: "Saurav B.", countdown: "1 day" },
];

const calendarDays = [
  { day: "Mon", date: "17", has: false },
  { day: "Tue", date: "18", has: false },
  { day: "Wed", date: "19", has: true, label: "Rohan (A+)" },
  { day: "Thu", date: "20", has: false },
  { day: "Fri", date: "21", has: false },
  { day: "Sat", date: "22", has: true, label: "Aarav (B+)" },
  { day: "Sun", date: "23", has: false },
];

export default function ThalCare() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <div className="bg-gradient-to-br from-thal/90 to-thal/50 text-primary-foreground py-16 px-4">
          <div className="container mx-auto">
            <Link to="/" className="inline-flex items-center gap-1.5 text-primary-foreground/70 hover:text-primary-foreground font-body text-sm mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-6xl">💉</div>
              <div>
                <h1 className="font-display text-5xl font-black">ThalCare</h1>
                <p className="font-body text-primary-foreground/70 text-lg">Recurring transfusion support for Thalassemia patients</p>
              </div>
            </div>
            <div className="flex gap-6 mt-6 flex-wrap">
              {[
                { label: "Active Patients", value: "3,847" },
                { label: "Dedicated Donors", value: "2,104" },
                { label: "This Month", value: "942 sessions" },
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
            {/* Calendar */}
            <div className="space-y-5">
              <div className="rounded-2xl border-2 border-thal/20 bg-card p-5 shadow-card">
                <h3 className="font-display text-base font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-thal" /> Transfusion Calendar
                  <span className="font-body text-xs text-muted-foreground ml-auto">Feb 2025</span>
                </h3>
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((d) => (
                    <div
                      key={d.day}
                      className={`rounded-lg p-1.5 text-center transition-all ${
                        d.has ? "bg-thal/15 border-2 border-thal/30" : "bg-muted/50"
                      }`}
                    >
                      <div className="font-body text-xs text-muted-foreground">{d.day}</div>
                      <div className={`font-display font-bold text-sm ${d.has ? "text-thal" : "text-foreground"}`}>{d.date}</div>
                      {d.has && <div className="w-1.5 h-1.5 rounded-full bg-thal mx-auto mt-0.5" />}
                    </div>
                  ))}
                </div>
                {calendarDays.filter(d => d.has).map(d => (
                  <div key={d.date} className="mt-3 p-2.5 rounded-lg bg-thal/8 border border-thal/20">
                    <span className="font-body text-xs font-semibold text-thal">Feb {d.date}: {d.label}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border-2 border-thal/20 bg-thal/5 p-5">
                <h3 className="font-display text-base font-bold mb-2">Add Patient</h3>
                <p className="font-body text-xs text-muted-foreground mb-3">Register a Thalassemia patient and find a dedicated recurring donor.</p>
                <Button className="w-full bg-thal text-primary-foreground font-body font-bold rounded-xl">
                  <Plus className="w-4 h-4 mr-1.5" /> Register Patient
                </Button>
              </div>
            </div>

            {/* Patient list */}
            <div className="lg:col-span-2">
              <h3 className="font-display text-xl font-bold text-foreground mb-4">Active Patients</h3>
              <div className="space-y-4">
                {patients.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl border-2 border-thal/20 bg-card p-5 shadow-card"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-thal/10 flex items-center justify-center text-xl font-display font-bold text-thal">
                          {p.age}y
                        </div>
                        <div>
                          <div className="font-body font-bold text-foreground">{p.name}</div>
                          <div className="font-body text-xs text-muted-foreground">{p.hospital}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`font-body text-xs border-0 ${parseInt(p.countdown) <= 2 ? "bg-blood/15 text-blood" : "bg-thal/15 text-thal"}`}>
                          <Clock className="w-3 h-3 mr-1" /> {p.countdown}
                        </Badge>
                        <div className="font-body text-xs text-muted-foreground mt-1">until transfusion</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                      <div>
                        <div className="font-body text-xs text-muted-foreground">Blood Group</div>
                        <div className="font-display font-bold text-blood text-sm">{p.group}</div>
                      </div>
                      <div>
                        <div className="font-body text-xs text-muted-foreground">Frequency</div>
                        <div className="font-body font-semibold text-xs text-foreground">{p.freq}</div>
                      </div>
                      <div>
                        <div className="font-body text-xs text-muted-foreground">Dedicated Donor</div>
                        <div className={`font-body font-semibold text-xs ${p.donor === "Unmatched" ? "text-blood" : "text-secondary"}`}>
                          {p.donor === "Unmatched" ? "⚠️ Unmatched" : `✓ ${p.donor}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" className="flex-1 border-thal text-thal font-body text-xs rounded-lg hover:bg-thal hover:text-primary-foreground">
                        View Schedule
                      </Button>
                      {p.donor === "Unmatched" && (
                        <Button size="sm" className="flex-1 bg-thal text-primary-foreground font-body text-xs rounded-lg">
                          Find Donor Now <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
