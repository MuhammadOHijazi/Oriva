import { useEffect, useState } from "react";
import { Pill, X, CheckCircle } from "lucide-react";
import { useMarkPillTaken } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAlarmContext } from "@/context/alarm-context";
import { stopAlarmSound } from "@/lib/alarm-sound";

const FLASH_COLORS = [
  "#ff2244",
  "#ff6600",
  "#ffcc00",
  "#00e87a",
  "#00d4ff",
  "#aa44ff",
  "#ff44aa",
  "#ffffff",
];

export function AlarmOverlay() {
  const { alarm, dismissAlarm } = useAlarmContext();
  const [colorIdx, setColorIdx] = useState(0);
  const queryClient = useQueryClient();

  const { mutate: markTaken, isPending } = useMarkPillTaken({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/pills"] });
        queryClient.invalidateQueries({ queryKey: ["/api/adherence/weekly"] });
        stopAlarmSound();
        dismissAlarm();
      },
    },
  });

  useEffect(() => {
    if (!alarm) return;
    setColorIdx(0);
    const interval = setInterval(() => {
      setColorIdx((i) => (i + 1) % FLASH_COLORS.length);
    }, 180);
    return () => clearInterval(interval);
  }, [alarm]);

  if (!alarm) return null;

  const flashColor = FLASH_COLORS[colorIdx]!;
  const textColor = flashColor === "#ffffff" || flashColor === "#ffcc00" ? "#000000" : "#ffffff";

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{ background: flashColor, transition: "background 0.15s ease" }}
    >
      <div
        className="flex flex-col items-center gap-6 px-8 py-10 rounded-3xl text-center max-w-sm w-full mx-4"
        style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)" }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: flashColor, boxShadow: `0 0 40px ${flashColor}` }}
        >
          <Pill className="w-10 h-10" style={{ color: textColor }} />
        </div>

        <div>
          <p className="text-white text-lg font-semibold tracking-wide uppercase opacity-80 mb-1">
            Time to take your pill!
          </p>
          <p
            className="font-bold"
            style={{ color: flashColor, fontSize: "2rem", textShadow: `0 0 20px ${flashColor}` }}
          >
            {alarm.pillName}
          </p>
          <p className="text-white/60 text-sm mt-1">Scheduled for {alarm.scheduledTime}</p>
        </div>

        <button
          onClick={() => markTaken({ id: alarm.pillId })}
          disabled={isPending}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg w-full justify-center"
          style={{
            background: "#00e87a",
            color: "#000",
            boxShadow: "0 0 30px rgba(0,232,122,0.6)",
            opacity: isPending ? 0.7 : 1,
          }}
        >
          <CheckCircle className="w-6 h-6" />
          {isPending ? "Marking..." : "Mark as Taken"}
        </button>

        <button
          onClick={dismissAlarm}
          className="flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors"
        >
          <X className="w-4 h-4" />
          Dismiss — auto-forgotten in 10 min if not taken
        </button>
      </div>
    </div>
  );
}
