import { useQuery } from "@tanstack/react-query";

interface DailyBreakdown {
  date: string;
  total: number;
  taken: number;
  percent: number | null;
}

interface WeeklyAdherence {
  percent: number;
  total: number;
  taken: number;
  earlyMode: boolean;
  dailyBreakdown: DailyBreakdown[];
}

async function fetchWeeklyAdherence(): Promise<WeeklyAdherence> {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const res = await fetch(`${base}/api/adherence/weekly`);
  if (!res.ok) throw new Error("Failed to fetch adherence");
  return res.json();
}

export function useWeeklyAdherence() {
  return useQuery<WeeklyAdherence>({
    queryKey: ["adherence", "weekly"],
    queryFn: fetchWeeklyAdherence,
    refetchInterval: 60_000,
  });
}
