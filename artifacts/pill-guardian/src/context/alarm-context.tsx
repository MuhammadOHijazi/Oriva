import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import { useGetPills } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { playAlarmSound, stopAlarmSound } from "@/lib/alarm-sound";

export interface AlarmState {
  pillId: number;
  pillName: string;
  scheduledTime: string;
}

interface AlarmContextValue {
  alarm: AlarmState | null;
  dismissAlarm: () => void;
  triggerAlarm: (pill: AlarmState) => void;
}

const AlarmContext = createContext<AlarmContextValue | null>(null);

export function useAlarmContext() {
  const ctx = useContext(AlarmContext);
  if (!ctx) throw new Error("useAlarmContext must be used inside AlarmProvider");
  return ctx;
}

function getCurrentHHMM(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

export function AlarmProvider({ children }: { children: ReactNode }) {
  const { data: pills, refetch } = useGetPills();
  const queryClient = useQueryClient();
  const [alarm, setAlarm] = useState<AlarmState | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const missedTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissAlarm = useCallback(() => {
    setAlarm(null);
    stopAlarmSound();
  }, []);

  const markMissed = useCallback(
    async (pillId: number) => {
      try {
        const fresh = await refetch();
        const updated = fresh.data?.find((p) => p.id === pillId);
        if (updated?.takenToday) return;
        await fetch(`/api/pills/${pillId}/missed`, { method: "POST" });
        queryClient.invalidateQueries({ queryKey: ["/api/pills"] });
        queryClient.invalidateQueries({ queryKey: ["/api/adherence/weekly"] });
      } catch (err) {
        console.error("Failed to mark pill as missed:", err);
      }
    },
    [refetch, queryClient],
  );

  const fireAlarm = useCallback(
    (pill: AlarmState, key: string) => {
      setAlarm(pill);
      playAlarmSound(10);

      setTimeout(() => {
        setAlarm((prev) => (prev?.pillId === pill.pillId ? null : prev));
      }, 10_000);

      if (!missedTimersRef.current.has(key)) {
        const t = setTimeout(() => {
          markMissed(pill.pillId);
          missedTimersRef.current.delete(key);
        }, 10 * 60 * 1_000);
        missedTimersRef.current.set(key, t);
      }
    },
    [markMissed],
  );

  const triggerAlarm = useCallback(
    (pill: AlarmState) => {
      const key = `test-${pill.pillId}-${Date.now()}`;
      fireAlarm(pill, key);
    },
    [fireAlarm],
  );

  useEffect(() => {
    const checkAlarms = () => {
      if (!pills) return;
      const hhmm = getCurrentHHMM();
      const today = getTodayString();

      const todayAbbrev = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()] ?? "Mon";

      for (const pill of pills) {
        const scheduledDays = (pill.daysOfWeek || "Sun,Mon,Tue,Wed,Thu,Fri,Sat").split(",").map((d: string) => d.trim());
        if (!scheduledDays.includes(todayAbbrev)) continue;
        if (pill.takenToday) continue;

        const [schedH, schedM] = pill.scheduledTime.split(":").map(Number);
        const [curH, curM] = hhmm.split(":").map(Number);
        const schedMins = (schedH ?? 0) * 60 + (schedM ?? 0);
        const curMins = (curH ?? 0) * 60 + (curM ?? 0);
        const diff = curMins - schedMins;
        if (diff < 0 || diff > 1) continue;

        const key = `${pill.id}-${today}-${pill.scheduledTime}`;
        if (firedRef.current.has(key)) continue;
        firedRef.current.add(key);

        fireAlarm(
          { pillId: pill.id, pillName: pill.name, scheduledTime: pill.scheduledTime },
          key,
        );
      }
    };

    const interval = setInterval(checkAlarms, 10_000);
    checkAlarms();
    return () => clearInterval(interval);
  }, [pills, fireAlarm]);

  useEffect(() => {
    return () => {
      stopAlarmSound();
      missedTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <AlarmContext.Provider value={{ alarm, dismissAlarm, triggerAlarm }}>
      {children}
    </AlarmContext.Provider>
  );
}
