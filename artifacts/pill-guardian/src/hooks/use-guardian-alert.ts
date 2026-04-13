import { useQuery } from "@tanstack/react-query";

interface GuardianAlertData {
  shouldAlert: boolean;
  guardian?: {
    id: number;
    name: string;
    nickname: string;
    phone: string;
  } | null;
}

async function fetchAlert(): Promise<GuardianAlertData> {
  const res = await fetch("/api/alert/consecutive-missed");
  if (!res.ok) throw new Error("Failed to fetch guardian alert");
  return res.json();
}

export function useGuardianAlert() {
  return useQuery<GuardianAlertData>({
    queryKey: ["/api/alert/consecutive-missed"],
    queryFn: fetchAlert,
    refetchInterval: 30_000,
    retry: false,
  });
}
