import { type Pill } from "@workspace/api-client-react";
import { CheckCircle2, Clock, AlertCircle, RefreshCw, Pill as PillIcon } from "lucide-react";
import { motion } from "framer-motion";
import { usePillMutations } from "@/hooks/use-pills";

const DAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface PillCardProps {
  pill: Pill;
  currentTime: Date;
}

export function PillCard({ pill, currentTime }: PillCardProps) {
  const { markTaken, reset } = usePillMutations();

  const currentHours = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentTotalMins = currentHours * 60 + currentMinutes;

  const [pillHours, pillMinutes] = pill.scheduledTime.split(":").map(Number);
  const pillTotalMins = (pillHours ?? 0) * 60 + (pillMinutes ?? 0);

  const isDone = pill.takenToday;
  const isOverdue = !isDone && currentTotalMins > pillTotalMins;

  const timeFormatted = new Date(0, 0, 0, pillHours, pillMinutes).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const scheduledDays = (pill.daysOfWeek || "Sun,Mon,Tue,Wed,Thu,Fri,Sat").split(",").map((d) => d.trim());

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-3xl p-6 transition-all duration-500
        border-2 
        ${isDone
          ? "bg-success/5 border-success/20 shadow-lg shadow-success/5"
          : isOverdue
            ? "bg-warning/5 border-warning/30 shadow-xl shadow-warning/10"
            : "bg-card border-transparent shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 hover:-translate-y-1"}
      `}
    >
      <PillIcon
        className={`absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.03] -rotate-12 pointer-events-none transition-colors duration-500
          ${isDone ? "text-success" : isOverdue ? "text-warning" : "text-primary"}
        `}
      />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-display text-2xl font-bold text-foreground tracking-tight">
              {pill.name}
            </h3>
            {isDone ? (
              <span className="px-2.5 py-1 rounded-full bg-success/15 text-success text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Taken
              </span>
            ) : isOverdue ? (
              <span className="px-2.5 py-1 rounded-full bg-warning/15 text-warning-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Overdue
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5 font-medium">
            <Clock className="w-4 h-4" />
            Scheduled for {timeFormatted}
          </p>
        </div>
      </div>

      {/* Days of week pills */}
      <div className="flex flex-wrap gap-1.5 mb-4 relative z-10">
        {DAY_ORDER.map((day) => {
          const active = scheduledDays.includes(day);
          return (
            <span
              key={day}
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={active
                ? { background: "rgba(0,232,122,0.15)", color: "#00e87a", border: "1px solid rgba(0,232,122,0.3)" }
                : { background: "rgba(255,255,255,0.04)", color: "#4a6580", border: "1px solid rgba(255,255,255,0.06)" }
              }
            >
              {day}
            </span>
          );
        })}
      </div>

      <div className="space-y-4 mb-6 relative z-10">
        {pill.description && (
          <p className="text-sm text-foreground/80 leading-relaxed bg-secondary/50 p-3 rounded-xl">
            {pill.description}
          </p>
        )}
        {pill.steps && (
          <div className="text-sm border-l-2 border-primary/30 pl-4 py-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-1 block">Instructions</span>
            <p className="text-foreground/90 font-medium">{pill.steps}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 relative z-10">
        {!isDone ? (
          <button
            onClick={() => markTaken.mutate({ id: pill.id })}
            disabled={markTaken.isPending}
            className={`
              flex-1 py-4 px-6 rounded-2xl font-bold text-white text-lg
              shadow-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2
              ${isOverdue
                ? "bg-warning hover:bg-warning/90 shadow-warning/25 hover:shadow-warning/40"
                : "bg-primary hover:bg-primary/90 shadow-primary/25 hover:shadow-primary/40"}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {markTaken.isPending ? "Marking..." : "Mark as Taken"}
          </button>
        ) : (
          <div className="flex-1 flex gap-3">
            <div className="flex-1 py-4 px-6 rounded-2xl bg-success/10 text-success font-bold text-lg flex items-center justify-center gap-2 border border-success/20">
              <CheckCircle2 className="w-6 h-6" /> Completed
            </div>
            <button
              onClick={() => reset.mutate({ id: pill.id })}
              disabled={reset.isPending}
              className="p-4 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
              title="Reset Status"
            >
              <RefreshCw className={`w-6 h-6 ${reset.isPending ? "animate-spin" : ""}`} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
