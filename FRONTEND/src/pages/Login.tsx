import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Mode = "donor" | "hospital" | "admin";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [mode, setMode] = useState<Mode>("donor");
  const [otpSent, setOtpSent] = useState(false);
  const [mobile, setMobile] = useState("");
  const [searchParams] = useSearchParams();
  const defaultMode = (searchParams.get("mode") as Mode) || "donor";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-accent blur-3xl" />
          <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-primary-foreground blur-3xl" />
        </div>
        <div className="relative flex flex-col justify-between h-full p-12">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary-foreground fill-current" />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-primary-foreground">LifeForge</div>
              <div className="font-body text-xs text-accent font-bold tracking-widest uppercase -mt-1">Connect</div>
            </div>
          </Link>

          <div>
            <h2 className="font-display text-5xl font-black text-primary-foreground leading-tight mb-4">
              Welcome<br />Back, Hero.
            </h2>
            <p className="font-body text-primary-foreground/70 leading-relaxed mb-8">
              Thousands are waiting for a match right now. Log in and check if your donation can save a life today.
            </p>
            <div className="space-y-4">
              {[
                { icon: "🩸", text: "2,847 matches made today" },
                { icon: "🟢", text: "18,423 donors currently online" },
                { icon: "⚡", text: "Average match time: 4 minutes" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-primary-foreground/80">
                  <span className="text-xl">{icon}</span>
                  <span className="font-body text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="font-body text-xs text-primary-foreground/40">
            © 2025 LifeForge Connect · Securing lives across India
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground fill-current" />
              </div>
              <span className="font-display font-bold text-xl text-foreground">LifeForge Connect</span>
            </div>

            <h1 className="font-display text-3xl font-bold text-foreground mb-1">Sign In</h1>
            <p className="font-body text-sm text-muted-foreground mb-7">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">
                Register now
              </Link>
            </p>

            {/* Mode tabs */}
            <Tabs defaultValue={defaultMode} onValueChange={(v) => setMode(v as Mode)} className="mb-6">
              <TabsList className="w-full grid grid-cols-3 bg-muted rounded-xl h-11">
                <TabsTrigger value="donor" className="rounded-lg font-body font-semibold text-sm">
                  Donor
                </TabsTrigger>
                <TabsTrigger value="hospital" className="rounded-lg font-body font-semibold text-sm">
                  Hospital
                </TabsTrigger>
                <TabsTrigger value="admin" className="rounded-lg font-body font-semibold text-sm">
                  Admin
                </TabsTrigger>
              </TabsList>

              {["donor", "hospital", "admin"].map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-6 space-y-4">
                  {/* Mobile OTP section */}
                  <div className="space-y-2">
                    <Label className="font-body font-semibold text-sm text-foreground">Mobile Number</Label>
                    <div className="flex gap-2">
                      <Input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="font-body flex-1 h-11 rounded-xl border-border focus:border-primary"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOtpSent(true)}
                        className="h-11 px-4 border-primary text-primary font-body font-semibold hover:bg-primary hover:text-primary-foreground rounded-xl"
                      >
                        {otpSent ? "Resend" : "Get OTP"}
                      </Button>
                    </div>
                  </div>

                  {otpSent && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2"
                    >
                      <Label className="font-body font-semibold text-sm text-foreground">Enter OTP</Label>
                      <Input
                        type="text"
                        maxLength={6}
                        placeholder="6-digit OTP"
                        className="font-body h-11 rounded-xl border-border focus:border-primary tracking-[0.3em] text-center text-lg"
                      />
                      {otpSent && (
                        <p className="font-body text-xs text-secondary flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> OTP sent to {mobile || "+91 XXXXX XXXXX"}
                        </p>
                      )}
                    </motion.div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="font-body text-xs text-muted-foreground font-medium">or login with email</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-body font-semibold text-sm">Email Address</Label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="font-body h-11 rounded-xl border-border focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="font-body font-semibold text-sm">Password</Label>
                      <a href="#" className="font-body text-xs text-primary hover:underline">Forgot password?</a>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPass ? "text" : "password"}
                        placeholder="••••••••"
                        className="font-body h-11 rounded-xl border-border focus:border-primary pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Link to="/dashboard">
                    <Button className="w-full h-12 font-body font-bold text-base bg-gradient-primary text-primary-foreground rounded-xl shadow-primary hover:opacity-90 mt-2">
                      Sign In as {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Button>
                  </Link>
                </TabsContent>
              ))}
            </Tabs>

            <p className="font-body text-xs text-muted-foreground text-center mt-4">
              By signing in, you agree to our{" "}
              <a href="#" className="text-primary hover:underline">Terms</a> &{" "}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
