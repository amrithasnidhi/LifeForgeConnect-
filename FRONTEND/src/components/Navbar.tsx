import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Heart, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const modules = [
  { name: "BloodBridge", path: "/blood-bridge", emoji: "🩸", color: "text-blood" },
  { name: "ThalCare", path: "/thal-care", emoji: "💉", color: "text-thal" },
  { name: "PlateletAlert", path: "/platelet-alert", emoji: "⏱️", color: "text-platelet" },
  { name: "MarrowMatch", path: "/marrow-match", emoji: "🧬", color: "text-marrow" },
  { name: "LastGift", path: "/last-gift", emoji: "🫁", color: "text-organ" },
  { name: "MilkBridge", path: "/milk-bridge", emoji: "🍼", color: "text-milk" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = location.pathname === "/";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isHome
          ? "bg-card/95 backdrop-blur-md shadow-card border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary">
              <Heart className="w-5 h-5 text-primary-foreground fill-current" />
            </div>
            <div className="leading-tight">
              <span
                className={`font-display font-bold text-lg ${
                  scrolled || !isHome ? "text-foreground" : "text-primary-foreground"
                }`}
              >
                LifeForge
              </span>
              <span
                className={`font-body text-xs block -mt-1 font-semibold tracking-widest uppercase ${
                  scrolled || !isHome ? "text-primary" : "text-accent"
                }`}
              >
                Connect
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* Modules dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setModulesOpen(true)}
                onMouseLeave={() => setModulesOpen(false)}
                className={`flex items-center gap-1 font-body text-sm font-medium transition-colors ${
                  scrolled || !isHome
                    ? "text-foreground hover:text-primary"
                    : "text-primary-foreground/90 hover:text-primary-foreground"
                }`}
              >
                Modules <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {modulesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    onMouseEnter={() => setModulesOpen(true)}
                    onMouseLeave={() => setModulesOpen(false)}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-card rounded-xl shadow-primary-lg border border-border p-2"
                  >
                    {modules.map((m) => (
                      <Link
                        key={m.path}
                        to={m.path}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className={`font-body text-sm font-semibold ${m.color}`}>
                          {m.name}
                        </span>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link
              to="/dashboard"
              className={`font-body text-sm font-medium transition-colors ${
                scrolled || !isHome
                  ? "text-foreground hover:text-primary"
                  : "text-primary-foreground/90 hover:text-primary-foreground"
              }`}
            >
              Dashboard
            </Link>

            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className={`font-body font-semibold border-2 ${
                  scrolled || !isHome
                    ? "border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                    : "border-primary-foreground/60 text-primary-foreground hover:bg-primary-foreground/10"
                }`}
              >
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button
                size="sm"
                className="font-body font-semibold bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-primary"
              >
                Donate / Register
              </Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className={`md:hidden p-2 rounded-lg ${
              scrolled || !isHome ? "text-foreground" : "text-primary-foreground"
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-card border-t border-border overflow-hidden"
            >
              <div className="py-4 space-y-1">
                {modules.map((m) => (
                  <Link
                    key={m.path}
                    to={m.path}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted rounded-lg mx-2 transition-colors"
                  >
                    <span>{m.emoji}</span>
                    <span className={`font-body font-semibold text-sm ${m.color}`}>{m.name}</span>
                  </Link>
                ))}
                <div className="flex flex-col gap-2 px-4 pt-3 border-t border-border mx-2">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full border-primary text-primary">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-gradient-primary text-primary-foreground">
                      Donate / Register
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
