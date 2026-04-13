import { useState } from "react";
import { Phone, X, AlertTriangle, User } from "lucide-react";
import { useGuardianAlert } from "@/hooks/use-guardian-alert";

export function GuardianCallModal() {
  const { data } = useGuardianAlert();
  const [dismissed, setDismissed] = useState(false);

  if (!data?.shouldAlert || !data.guardian || dismissed) return null;

  const { guardian } = data;

  const handleCall = () => {
    window.location.href = `tel:${guardian.phone}`;
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #1a0a0a 0%, #2d0e0e 50%, #1a0a14 100%)",
          border: "1px solid rgba(255,60,60,0.3)",
          boxShadow: "0 0 60px rgba(255,40,40,0.25), 0 0 120px rgba(255,40,40,0.1)",
        }}
      >
        <div
          className="px-6 pt-6 pb-4 text-center"
          style={{ borderBottom: "1px solid rgba(255,60,60,0.2)" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(255,60,60,0.15)", border: "1px solid rgba(255,60,60,0.4)" }}
          >
            <AlertTriangle className="w-6 h-6" style={{ color: "#ff4444" }} />
          </div>
          <h2 className="text-white font-bold text-xl">3 Doses Missed</h2>
          <p className="text-white/50 text-sm mt-1">Your guardian should be notified</p>
        </div>

        <div className="px-6 py-6 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(167,139,250,0.15))",
              border: "2px solid rgba(0,212,255,0.3)",
            }}
          >
            <User className="w-9 h-9" style={{ color: "#00d4ff" }} />
          </div>

          <p className="text-white/60 text-sm font-medium uppercase tracking-widest mb-1">
            Guardian
          </p>
          <p className="text-white font-bold text-2xl mb-1">
            {guardian.name}
          </p>
          {guardian.nickname && (
            <p className="text-white/50 text-sm mb-2">"{guardian.nickname}"</p>
          )}
          <p className="font-mono text-white/70 text-base">{guardian.phone}</p>
        </div>

        <div className="px-6 pb-6 flex flex-col gap-3">
          <button
            onClick={handleCall}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-lg"
            style={{
              background: "linear-gradient(135deg, #00c853, #00e87a)",
              color: "#000",
              boxShadow: "0 0 30px rgba(0,200,83,0.4)",
            }}
          >
            <Phone className="w-6 h-6" />
            Call {guardian.nickname || guardian.name}
          </button>

          <button
            onClick={() => setDismissed(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <X className="w-4 h-4" />
            Dismiss for now
          </button>
        </div>
      </div>
    </div>
  );
}
