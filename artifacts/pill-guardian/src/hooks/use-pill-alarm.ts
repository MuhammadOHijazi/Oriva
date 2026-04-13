import { useState, useEffect, useRef } from "react";
import { useGetPills } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { playAlarmSound, stopAlarmSound } from "@/lib/alarm-sound";

export interface AlarmState {
  pillId: number;
  pillName: string;
  scheduledTime: string;
}

function getCurrentHHMM(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

export function usePillAlarm() {
  const { data: pills, refetch } = useGetPills();
  const queryClient = useQueryClient();
  const [alarm, setAlarm] = useState<AlarmState | null>(null);
  const firedRef = useRef<Set<string>>(new Set());
  const missedTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissAlarm = () => {
    setAlarm(null);
    stopAlarmSound();
  };

  const markMissed = async (pillId: number) => {
    try {
      const fresh = await refetch();
      const updatedPill = fresh.data?.find((p) => p.id === pillId);
      if (updatedPill?.done) return;

      await fetch(`/api/pills/${pillId}/missed`, { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["/api/pills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/adherence/weekly"] });
    } catch (err) {
      console.error("Failed to mark pill as missed:", err);
    }
  };

  useEffect(() => {
    const checkAlarms = () => {
      if (!pills) return;
      const hhmm = getCurrentHHMM();
      const today = getTodayString();

      for (const pill of pills) {
        if (pill.done) continue;
        if (pill.scheduledTime !== hhmm) continue;

        const key = `${pill.id}-${today}-${hhmm}`;
        if (firedRef.current.has(key)) continue;

        firedRef.current.add(key);

        setAlarm({ pillId: pill.id, pillName: pill.name, scheduledTime: pill.scheduledTime });
        playAlarmSound(10);

        setTimeout(() => {
          setAlarm((prev) => (prev?.pillId === pill.id ? null : prev));
        }, 10_000);

        const tenMin = setTimeout(() => {
          markMissed(pill.id);
          missedTimersRef.current.delete(key);
        }, 10 * 60 * 1_000);

        missedTimersRef.current.set(key, tenMin);
      }
    };

    const interval = setInterval(checkAlarms, 15_000);
    checkAlarms();

    return () => clearInterval(interval);
  }, [pills]);

  useEffect(() => {
    return () => {
      stopAlarmSound();
      missedTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  return { alarm, dismissAlarm };
}
