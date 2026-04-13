import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, Home, Settings, QrCode, Menu, X, Wifi, WifiOff } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const navItems = [
  { href: "/",         label: "Dashboard",     icon: Home,     color: "#00d4ff", glow: "rgba(0,212,255,0.15)"  },
  { href: "/pills",    label: "Pills",          icon: Pill,     color: "#00e87a", glow: "rgba(0,232,122,0.15)"  },
  { href: "/settings", label: "Profiles",       icon: Settings, color: "#a78bfa", glow: "rgba(167,139,250,0.15)"},
  { href: "/qr",       label: "QR Code",        icon: QrCode,   color: "#00d4ff", glow: "rgba(0,212,255,0.15)"  },
];

function useEsp32Status() {
  return useQuery<{ connected: boolean; ip: string | null }>({
    queryKey: ["/api/esp32/status"],
    queryFn: () => fetch("/api/esp32/status").then((r) => r.json()),
    refetchInterval: 5000,
    retry: false,
  });
}

function Esp32Badge() {
  const { data } = useEsp32Status();
  const queryClient = useQueryClient();
  const connected = data?.connected ?? false;
  const ip = data?.ip ?? "";

  const [open, setOpen] = useState(false);
  const [inputIp, setInputIp] = useState(ip);
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    setInputIp(data?.ip ?? "");
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/esp32/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: inputIp }),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/esp32/status"] });
    } finally {
      setSaving(false);
      setOpen(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch("/api/esp32/configure", { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["/api/esp32/status"] });
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl w-full transition-all"
        style={{
          background: connected ? "rgba(0,232,122,0.08)" : "rgba(107,114,128,0.08)",
          border: connected ? "1px solid rgba(0,232,122,0.25)" : "1px solid rgba(107,114,128,0.2)",
        }}
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          {connected && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "#00e87a" }} />
          )}
          <span className="relative inline-flex rounded-full h-2.5 w-2.5"
            style={{ background: connected ? "#00e87a" : "#6b7280", boxShadow: connected ? "0 0 8px #00e87a" : "none" }} />
        </span>
        {connected
          ? <Wifi className="w-4 h-4 shrink-0" style={{ color: "#00e87a" }} />
          : <WifiOff className="w-4 h-4 shrink-0" style={{ color: "#6b7280" }} />
        }
        <span className="text-sm font-semibold" style={{ color: connected ? "#00e87a" : "#6b7280" }}>
          {connected ? "ESP32 Connected" : "ESP32 not connected"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-black/70" onClick={() => setOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className="fixed z-50 inset-x-4 bottom-24 md:inset-auto md:left-6 md:bottom-24 md:w-72 rounded-3xl p-6"
              style={{ background: "rgba(6,18,34,0.98)", border: "1px solid rgba(0,212,255,0.25)", backdropFilter: "blur(20px)", boxShadow: "0 0 40px rgba(0,212,255,0.15)" }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white text-base">ESP32 Connection</h3>
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg" style={{ color: "#7a9bb5" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#7a9bb5" }}>
                ESP32 IP Address
              </label>
              <input
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
                placeholder="e.g. 192.168.1.100"
                className="w-full px-3 py-2.5 rounded-xl text-sm font-mono text-white outline-none mb-4"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(0,212,255,0.2)" }}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />

              <button
                onClick={handleSave}
                disabled={saving || !inputIp.trim()}
                className="w-full py-2.5 rounded-xl font-bold text-sm mb-2 transition-opacity disabled:opacity-50"
                style={{ background: "linear-gradient(90deg,#00e87a,#00d4ff)", color: "#000" }}
              >
                {saving ? "Connecting…" : "Connect"}
              </button>

              {data?.ip && (
                <button
                  onClick={handleDisconnect}
                  className="w-full py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{ background: "rgba(255,60,60,0.1)", color: "#ff6060", border: "1px solid rgba(255,60,60,0.2)" }}
                >
                  Disconnect
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex w-full relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f2744 0%, #1a1a4e 22%, #0d3d3a 44%, #2a1060 66%, #0f3d2a 88%, #1a2a5e 100%)" }}
    >
      {/* Glow blobs */}
      <div className="absolute top-[-40px] right-[0%]   w-[600px] h-[600px] rounded-full blur-[110px] pointer-events-none -z-10" style={{ background: "rgba(0,200,255,0.28)" }} />
      <div className="absolute bottom-[-40px] left-[0%]  w-[560px] h-[560px] rounded-full blur-[110px] pointer-events-none -z-10" style={{ background: "rgba(0,220,120,0.25)" }} />
      <div className="absolute top-[20%] left-[30%]  w-[500px] h-[400px] rounded-full blur-[100px] pointer-events-none -z-10" style={{ background: "rgba(140,60,255,0.22)" }} />
      <div className="absolute bottom-[10%] right-[15%] w-[420px] h-[360px] rounded-full blur-[100px] pointer-events-none -z-10" style={{ background: "rgba(255,80,180,0.12)" }} />

      {/* ── Desktop Sidebar (hidden on mobile) ── */}
      <aside
        className="hidden md:flex w-72 border-r flex-col relative z-10 shrink-0"
        style={{ background: "rgba(6,18,34,0.92)", borderColor: "rgba(0,212,255,0.20)", backdropFilter: "blur(18px)" }}
      >
        {/* Logo */}
        <div className="px-5 pt-5 pb-4 flex items-center gap-4">
          <div className="shrink-0 w-24 h-24 rounded-full overflow-hidden border-2 shadow-lg"
               style={{ borderColor: "rgba(0,212,255,0.5)", boxShadow: "0 0 20px rgba(0,212,255,0.45)" }}>
            <img src="/logo.png" alt="Orvia" className="w-full h-full object-cover" style={{ objectPosition: "45% 8%" }} />
          </div>
          <span className="font-display font-bold text-3xl leading-snug tracking-tight"
                style={{ background: "linear-gradient(90deg,#00e87a,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Orvia
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-medium relative"
                style={isActive ? { background: item.glow, border: `1px solid ${item.color}40`, boxShadow: `0 0 12px ${item.color}30` } : { color: "#7a9bb5" }}
              >
                {isActive && (
                  <motion.div layoutId="active-nav-bar" className="absolute left-0 w-1 h-8 rounded-r-full"
                    style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                )}
                <item.icon className="w-5 h-5" style={{ color: isActive ? item.color : "#7a9bb5" }} />
                <span style={{ color: isActive ? item.color : "#7a9bb5" }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Heartbeat divider */}
        <div className="mx-6 my-2 opacity-30">
          <svg viewBox="0 0 200 24" className="w-full h-5">
            <polyline points="0,12 30,12 40,3 50,21 60,12 80,12 90,5 100,19 110,12 140,12 150,4 160,20 170,12 200,12"
              fill="none" stroke="url(#hbGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="hbGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#00e87a" /><stop offset="100%" stopColor="#00d4ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ESP32 connect button */}
        <div className="px-4 pb-5">
          <Esp32Badge />
        </div>

      </aside>

      {/* ── Mobile Header ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3"
           style={{ background: "rgba(6,18,34,0.95)", borderBottom: "1px solid rgba(0,212,255,0.15)", backdropFilter: "blur(16px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-cyan-400/40 shrink-0">
            <img src="/logo.png" alt="Orvia" className="w-full h-full object-cover" style={{ objectPosition: "45% 8%" }} />
          </div>
          <span className="font-bold text-lg" style={{ background: "linear-gradient(90deg,#00e87a,#00d4ff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Orvia
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl transition-all"
            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff" }}>
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer Overlay ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div className="md:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setDrawerOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div className="md:hidden fixed top-0 right-0 bottom-0 w-72 z-50 flex flex-col"
              style={{ background: "rgba(6,18,34,0.98)", borderLeft: "1px solid rgba(0,212,255,0.2)", backdropFilter: "blur(20px)" }}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(0,212,255,0.15)" }}>
                <span className="font-bold text-lg" style={{ color: "#00d4ff" }}>Menu</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1.5 rounded-lg" style={{ color: "#7a9bb5" }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-4 pt-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setDrawerOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all font-medium"
                      style={isActive ? { background: item.glow, border: `1px solid ${item.color}40` } : { color: "#7a9bb5" }}>
                      <item.icon className="w-5 h-5" style={{ color: isActive ? item.color : "#7a9bb5" }} />
                      <span style={{ color: isActive ? item.color : "#7a9bb5" }}>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
              {/* ESP32 connect in mobile drawer */}
              <div className="px-4 pb-6 pt-2 border-t" style={{ borderColor: "rgba(0,212,255,0.1)" }}>
                <Esp32Badge />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto relative z-10 md:pt-0 pt-[60px] pb-[72px] md:pb-0">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-12">
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-2"
           style={{ background: "rgba(6,18,34,0.97)", borderTop: "1px solid rgba(0,212,255,0.15)", backdropFilter: "blur(16px)" }}>
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[56px]"
              style={isActive ? { background: item.glow } : {}}>
              <item.icon className="w-5 h-5" style={{ color: isActive ? item.color : "#4a6580" }} />
              <span className="text-[10px] font-medium" style={{ color: isActive ? item.color : "#4a6580" }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
