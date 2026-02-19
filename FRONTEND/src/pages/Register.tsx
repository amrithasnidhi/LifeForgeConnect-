import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowLeft, Upload, CheckCircle2, Eye, EyeOff, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const donorTypes = [
  { id: "blood", label: "Blood", emoji: "🩸" },
  { id: "platelet", label: "Platelets", emoji: "⏱️" },
  { id: "marrow", label: "Bone Marrow", emoji: "🧬" },
  { id: "plasma", label: "Plasma", emoji: "🧪" },
  { id: "organ", label: "Organ", emoji: "🫁" },
  { id: "milk", label: "Breast Milk", emoji: "🍼", womenOnly: true },
];

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

function DonorRegister() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [showPass, setShowPass] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [gender, setGender] = useState("");

  const toggleType = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              s <= step ? "bg-gradient-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="font-display text-xl font-bold text-foreground">Personal Details</h3>
            <p className="font-body text-sm text-muted-foreground">Step 1 of 3</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body font-semibold text-sm">First Name</Label>
              <Input placeholder="Arjun" className="h-11 rounded-xl font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body font-semibold text-sm">Last Name</Label>
              <Input placeholder="Sharma" className="h-11 rounded-xl font-body" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-body font-semibold text-sm">Mobile Number</Label>
            <div className="flex gap-2">
              <Input type="tel" placeholder="+91 98765 43210" className="h-11 rounded-xl font-body flex-1" />
              <Button
                variant="outline"
                onClick={() => setOtpSent(true)}
                className="h-11 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-xl font-body"
              >
                {otpSent ? <CheckCircle2 className="w-4 h-4" /> : "OTP"}
              </Button>
            </div>
          </div>
          {otpSent && (
            <div className="space-y-1.5">
              <Label className="font-body font-semibold text-sm">Enter OTP</Label>
              <Input placeholder="6-digit OTP" maxLength={6} className="h-11 rounded-xl font-body tracking-[0.3em] text-center" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="font-body font-semibold text-sm">Aadhaar Number</Label>
            <Input placeholder="XXXX XXXX XXXX" className="h-11 rounded-xl font-body" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body font-semibold text-sm">Date of Birth</Label>
              <Input type="date" className="h-11 rounded-xl font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body font-semibold text-sm">Gender</Label>
              <div className="flex gap-2">
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`flex-1 h-11 rounded-xl border-2 font-body text-xs font-semibold transition-all ${
                      gender === g
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="font-body font-semibold text-sm">City</Label>
              <Input placeholder="Mumbai" className="h-11 rounded-xl font-body" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-body font-semibold text-sm">PIN Code</Label>
              <Input placeholder="400001" className="h-11 rounded-xl font-body" />
            </div>
          </div>
          <Button
            onClick={() => setStep(2)}
            className="w-full h-12 bg-gradient-primary text-primary-foreground font-body font-bold rounded-xl shadow-primary"
          >
            Continue <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
          <div className="text-center mb-4">
            <h3 className="font-display text-xl font-bold text-foreground">Donation Preferences</h3>
            <p className="font-body text-sm text-muted-foreground">Step 2 of 3 — Select what you'd like to donate</p>
          </div>

          {/* Blood group */}
          <div className="space-y-2">
            <Label className="font-body font-semibold text-sm">Blood Group</Label>
            <div className="grid grid-cols-4 gap-2">
              {bloodGroups.map((bg) => (
                <button
                  key={bg}
                  onClick={() => setBloodGroup(bg)}
                  className={`h-11 rounded-xl border-2 font-display font-bold text-sm transition-all ${
                    bloodGroup === bg
                      ? "border-blood bg-blood/10 text-blood"
                      : "border-border text-muted-foreground hover:border-blood/30"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          {/* Donation types */}
          <div className="space-y-2">
            <Label className="font-body font-semibold text-sm">What would you like to donate?</Label>
            <div className="grid grid-cols-2 gap-2">
              {donorTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleType(type.id)}
                  disabled={type.womenOnly && gender === "Male"}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    selected.includes(type.id)
                      ? "border-primary bg-primary/8 text-primary"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-xl">{type.emoji}</span>
                  <div>
                    <div className="font-body text-sm font-semibold text-foreground">{type.label}</div>
                    {type.womenOnly && (
                      <div className="font-body text-xs text-muted-foreground">Women only</div>
                    )}
                  </div>
                  {selected.includes(type.id) && (
                    <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ID Upload */}
          <div className="space-y-2">
            <Label className="font-body font-semibold text-sm">Upload Government ID</Label>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-body text-sm text-muted-foreground">Drag & drop or <span className="text-primary font-semibold">browse</span></p>
              <p className="font-body text-xs text-muted-foreground mt-1">Aadhaar, PAN, Voter ID (max 5MB)</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1 h-12 border-border font-body rounded-xl"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              className="flex-1 h-12 bg-gradient-primary text-primary-foreground font-body font-bold rounded-xl shadow-primary"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      )}

      {step === 3 && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="font-display text-xl font-bold text-foreground">Create Account</h3>
            <p className="font-body text-sm text-muted-foreground">Step 3 of 3 — Almost there!</p>
          </div>
          <div className="space-y-1.5">
            <Label className="font-body font-semibold text-sm">Email Address</Label>
            <Input type="email" placeholder="you@example.com" className="h-11 rounded-xl font-body" />
          </div>
          <div className="space-y-1.5">
            <Label className="font-body font-semibold text-sm">Password</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Min 8 characters"
                className="h-11 rounded-xl font-body pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-body font-semibold text-sm">Confirm Password</Label>
            <Input type="password" placeholder="••••••••" className="h-11 rounded-xl font-body" />
          </div>
          <div className="flex items-start gap-2 mt-2">
            <Checkbox id="terms" className="mt-0.5 border-primary data-[state=checked]:bg-primary" />
            <label htmlFor="terms" className="font-body text-xs text-muted-foreground leading-relaxed">
              I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a>,{" "}
              <a href="#" className="text-primary hover:underline">Privacy Policy</a>, and consent to sharing my anonymized data for matching purposes.
            </label>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 border-border font-body rounded-xl">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Link to="/dashboard" className="flex-1">
              <Button className="w-full h-12 bg-gradient-primary text-primary-foreground font-body font-bold rounded-xl shadow-primary">
                Create Account ✓
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function HospitalRegister() {
  const [showPass, setShowPass] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="font-body font-semibold text-sm">Hospital Name</Label>
          <Input placeholder="Apollo Hospitals, Mumbai" className="h-11 rounded-xl font-body" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body font-semibold text-sm">Registration Number</Label>
          <Input placeholder="MH/HOS/XXXX" className="h-11 rounded-xl font-body" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body font-semibold text-sm">License Number</Label>
          <Input placeholder="Blood Bank License" className="h-11 rounded-xl font-body" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="font-body font-semibold text-sm">Full Address</Label>
          <Input placeholder="Street, Area, City, State - PIN" className="h-11 rounded-xl font-body" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body font-semibold text-sm">Contact Person</Label>
          <Input placeholder="Dr. Priya Menon" className="h-11 rounded-xl font-body" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body font-semibold text-sm">Contact Mobile</Label>
          <Input type="tel" placeholder="+91 98765 43210" className="h-11 rounded-xl font-body" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="font-body font-semibold text-sm">Official Email</Label>
          <Input type="email" placeholder="bloodbank@hospital.in" className="h-11 rounded-xl font-body" />
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="font-body font-semibold text-sm">Upload Hospital Documents</Label>
          <div className="border-2 border-dashed border-border rounded-xl p-5 text-center hover:border-primary/40 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
            <p className="font-body text-sm text-muted-foreground">Registration cert, License, NABH docs</p>
          </div>
        </div>
        <div className="col-span-2 space-y-1.5">
          <Label className="font-body font-semibold text-sm">Password</Label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              placeholder="Secure password"
              className="h-11 rounded-xl font-body pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
      <Link to="/dashboard?role=hospital">
        <Button className="w-full h-12 bg-gradient-primary text-primary-foreground font-body font-bold rounded-xl shadow-primary">
          Register Hospital
        </Button>
      </Link>
    </motion.div>
  );
}

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("type") === "hospital" ? "hospital" : "donor";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[42%] bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-accent blur-3xl" />
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
            <h2 className="font-display text-4xl font-black text-primary-foreground leading-tight mb-4">
              Join 12 Lakh+<br />Lifesavers.
            </h2>
            <p className="font-body text-primary-foreground/70 leading-relaxed mb-8">
              Register once. Save lives forever. Your single donation can impact up to 8 people directly.
            </p>
            <div className="space-y-4">
              {[
                { emoji: "🛡️", label: "Aadhaar-verified, fully secure" },
                { emoji: "🎖️", label: "Build your Trust Score over time" },
                { emoji: "📱", label: "Real-time alerts for nearby needs" },
                { emoji: "❤️", label: "See the impact of each donation" },
              ].map(({ emoji, label }) => (
                <div key={label} className="flex items-center gap-3 text-primary-foreground/80">
                  <span>{emoji}</span>
                  <span className="font-body text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="font-body text-xs text-primary-foreground/40">© 2025 LifeForge Connect</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 font-body text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">LifeForge Connect</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-1">Create Account</h1>
          <p className="font-body text-sm text-muted-foreground mb-6">
            Already registered?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="w-full grid grid-cols-2 bg-muted rounded-xl h-11 mb-6">
              <TabsTrigger value="donor" className="rounded-lg font-body font-semibold">
                🩸 Donor / Individual
              </TabsTrigger>
              <TabsTrigger value="hospital" className="rounded-lg font-body font-semibold">
                🏥 Hospital / Org
              </TabsTrigger>
            </TabsList>
            <TabsContent value="donor">
              <DonorRegister />
            </TabsContent>
            <TabsContent value="hospital">
              <HospitalRegister />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
