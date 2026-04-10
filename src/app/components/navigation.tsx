import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Menu, X, Sun, Moon, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative p-2 rounded-full hover:bg-[#E8F5E9] dark:hover:bg-white/10 transition-colors text-[#006B3C] dark:text-white"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute top-2 left-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}

const navItems = [
  { label: "Home",         anchor: "hero" },
  { label: "About",        anchor: "about" },
  { label: "How It Works", anchor: "how-it-works" },
  { label: "For Mentees",  anchor: "for-mentees" },
  { label: "For Mentors",  anchor: "for-mentors" },
  { label: "Pricing",      anchor: "pricing" },
];

export function Navigation() {
  const [isOpen,   setIsOpen]   = useState(false);
  const [active,   setActive]   = useState("hero");
  const [visible,  setVisible]  = useState(true);
  const [atTop,    setAtTop]    = useState(true);
  const [showBack, setShowBack] = useState(false);
  const lastY = useState(0);
  const location  = useLocation();
  const navigate  = useNavigate();
  const isLanding = location.pathname === "/";

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setAtTop(y < 20);
    setShowBack(y > 400);

    // Hide on scroll down, show on scroll up
    if (y > lastY[0] && y > 80) {
      setVisible(false);
      setIsOpen(false);
    } else {
      setVisible(true);
    }
    lastY[0] = y;

    // Track active section
    if (isLanding) {
      const sections = navItems.map(n => document.getElementById(n.anchor));
      const current = sections.findLast(s => s && s.getBoundingClientRect().top <= 120);
      if (current) setActive(current.id);
    }
  }, [isLanding]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  function scrollTo(anchor: string) {
    if (!isLanding) {
      navigate("/");
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } else {
      document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsOpen(false);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <>
      {/* ── Floating pill navbar ── */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0,   opacity: 1 }}
              exit={{   y: -80, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="pointer-events-auto w-full max-w-5xl"
            >
              {/* Pill container */}
              <div className={`flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300 ${
                atTop
                  ? "bg-white/80 dark:bg-gray-950/80 border-gray-200/60 dark:border-gray-700/60 backdrop-blur-xl shadow-lg"
                  : "bg-white/95 dark:bg-gray-950/95 border-gray-200 dark:border-gray-700 backdrop-blur-xl shadow-xl"
              }`}>

                {/* Logo */}
                <button onClick={() => scrollTo("hero")} className="flex items-center shrink-0">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#00A651] to-[#006B3C] rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-base">LH</span>
                  </div>
                </button>

                {/* Desktop nav items */}
                <div className="hidden md:flex items-center gap-1">
                  {navItems.map(item => (
                    <button
                      key={item.anchor}
                      onClick={() => scrollTo(item.anchor)}
                      className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isLanding && active === item.anchor
                          ? "bg-[#00A651] text-white shadow-md"
                          : "text-gray-600 dark:text-gray-300 hover:bg-[#E8F5E9] dark:hover:bg-[#00A651]/15 hover:text-[#006B3C] dark:hover:text-[#00A651]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <ThemeToggle />
                  <Link to="/login" className="hidden sm:block">
                    <Button variant="outline" size="sm" className="border-[#00A651] text-[#00A651] hover:bg-[#E8F5E9] dark:border-[#00A651] dark:text-[#00A651] dark:hover:bg-[#00A651]/10 text-xs px-3">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" className="hidden sm:block">
                    <Button size="sm" className="bg-[#00A651] hover:bg-[#006B3C] text-white shadow-md text-xs px-3">
                      Get Started
                    </Button>
                  </Link>
                  {/* Mobile hamburger */}
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                  >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Mobile dropdown */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0,  scale: 1 }}
                    exit={{   opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden"
                  >
                    <div className="p-3 space-y-1">
                      {navItems.map(item => (
                        <button
                          key={item.anchor}
                          onClick={() => scrollTo(item.anchor)}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            isLanding && active === item.anchor
                              ? "bg-[#00A651] text-white"
                              : "text-gray-700 dark:text-gray-300 hover:bg-[#E8F5E9] dark:hover:bg-[#00A651]/15 hover:text-[#006B3C] dark:hover:text-[#00A651]"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800 mt-1">
                        <Link to="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full border-[#00A651] text-[#00A651] text-sm">Sign In</Button>
                        </Link>
                        <Link to="/signup" className="flex-1" onClick={() => setIsOpen(false)}>
                          <Button className="w-full bg-[#00A651] hover:bg-[#006B3C] text-white text-sm">Get Started</Button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Scroll to top button ── */}
      <AnimatePresence>
        {showBack && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1,   y: 0 }}
            exit={{   opacity: 0, scale: 0.5, y: 20 }}
            transition={{ duration: 0.3, ease: "backOut" }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-6 z-50 w-12 h-12 bg-[#00A651] hover:bg-[#006B3C] text-white rounded-full shadow-xl flex items-center justify-center transition-colors group"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
