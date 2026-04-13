import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { PillCard } from "@/components/pill-card";
import { usePills } from "@/hooks/use-pills";
import { usePatientProfile } from "@/hooks/use-profiles";
import { useWeeklyAdherence } from "@/hooks/use-adherence";
import { format } from "date-fns";
import { Loader2, PlusCircle, CheckCircle, TrendingUp, AlarmClock, Activity } from "lucide-react";
import { Link } from "wouter";

function AdherenceCard() {
  const { data, isLoading } = useWeeklyAdherence();

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border p-6 animate-pulse"
           style={{ background: "rgba(6,18,34,0.6)" }}>
        <div className="h-4 bg-secondary rounded w-1/3 mb-4" />
        <div className="h-8 bg-secondary rounded w-1/2 mb-4" />
        <div className="h-3 bg-secondary rounded w-full" />
      </div>
    );
  }

  const percent = data?.percent ?? 100;
  const earlyMode = data?.earlyMode ?? false;
  const taken = data?.taken ?? 0;
  const total = data?.total ?? 0;
  const daily = data?.dailyBreakdown ?? [];

  const ringColor = percent >= 80 ? "#00e87a" : percent >= 60 ? "#f59e0b" : "#ef4444";
  const trackColor = percent >= 80 ? "rgba(0,232,122,0.15)" : percent >= 60 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)";

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="rounded-3xl border border-border p-6 space-y-5"
         style={{ background: "rgba(6,18,34,0.7)", backdropFilter: "blur(12px)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: ringColor }} />
          <span className="font-bold text-foreground">Weekly Adherence</span>
        </div>
        {earlyMode && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
               style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
            <AlarmClock className="w-3.5 h-3.5" />
            Early Alert Mode ON
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                    stroke={trackColor} />
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                    stroke={ringColor}
                    strokeDasharray={`${percent} ${100 - percent}`}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dasharray 0.6s ease" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-2xl font-bold text-foreground">{percent}%</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "No history yet. Start taking your pills to build a record."
              : `${taken} of ${total} doses taken in the past 7 days.`}
          </p>
          {earlyMode ? (
            <p className="text-sm font-medium" style={{ color: "#ef4444" }}>
              Adherence below 60% — alarms will fire 10 minutes early to help you stay on track.
            </p>
          ) : (
            <p className="text-sm font-medium" style={{ color: ringColor }}>
              {percent >= 80 ? "Great job staying on track!" : "Keep it up — aim for 60%+ to avoid early alerts."}
            </p>
          )}
        </div>
      </div>

      {daily.length > 0 && (
        <div className="flex items-end gap-1.5 h-14 pt-2">
          {[...daily].reverse().map((day, i) => {
            const h = day.percent === null ? 0 : Math.max(8, (day.percent / 100) * 56);
            const col = day.percent === null ? "rgba(255,255,255,0.08)"
              : day.percent >= 80 ? "#00e87a"
              : day.percent >= 60 ? "#f59e0b"
              : "#ef4444";
            const label = dayLabels[new Date(day.date).getDay()] ?? "";
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm transition-all duration-500"
                     style={{ height: `${h}px`, background: col, opacity: day.percent === null ? 0.3 : 0.85 }} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { data: pills, isLoading: pillsLoading } = usePills();
  const { data: patient, isLoading: patientLoading } = usePatientProfile();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const todayAbbrev = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][currentTime.getDay()] ?? "Mon";

  const sortedPills = pills
    ? [...pills]
        .filter((p) => {
          const days = (p.daysOfWeek || "Sun,Mon,Tue,Wed,Thu,Fri,Sat").split(",").map((d) => d.trim());
          return days.includes(todayAbbrev);
        })
        .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
    : [];

  const allDone = sortedPills.length > 0 && sortedPills.every(p => p.takenToday);
  const pendingCount = sortedPills.filter(p => !p.takenToday).length;

  return (
    <Layout>
      <header className="mb-6">
        <div className="flex justify-between items-end mb-3">
          <div className="flex-1 min-w-0">
            <p className="text-primary font-bold tracking-wider uppercase text-xs sm:text-sm mb-1">
              {format(currentTime, "EEEE, MMMM do")}
            </p>
            <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
              {patientLoading ? (
                <span className="animate-pulse bg-secondary text-transparent rounded-lg">Loading...</span>
              ) : (
                `Good morning, ${patient?.nickname || "Friend"}.`
              )}
            </h1>
          </div>
          <div className="text-right hidden sm:block shrink-0 ml-4">
            <p className="text-5xl font-display font-light tracking-tighter" style={{ background: "linear-gradient(135deg, #00e87a, #00d4ff, #ffffff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 12px rgba(0,212,255,0.4))" }}>
              {format(currentTime, "HH:mm")}
            </p>
          </div>
        </div>

        {sortedPills.length > 0 && (
          <p className="text-base sm:text-xl text-muted-foreground font-medium">
            {allDone
              ? "Great job! You've taken all your medication for today."
              : `You have ${pendingCount} medication${pendingCount === 1 ? "" : "s"} left to take today.`}
          </p>
        )}
      </header>

      <div className="mb-8">
        <AdherenceCard />
      </div>

      {pillsLoading ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      ) : sortedPills.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-3xl p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground mb-3">No Pills Scheduled</h3>
          <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
            Your schedule is currently empty. Head over to the management page to add your first medication.
          </p>
          <Link
            href="/pills"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <PlusCircle className="w-5 h-5" />
            Manage Schedule
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {sortedPills.map(pill => (
            <PillCard key={pill.id} pill={pill} currentTime={currentTime} />
          ))}
        </div>
      )}
    </Layout>
  );
}
