import { useGetEsp32Status } from "@workspace/api-client-react";

export function useSystemStatus() {
  // Poll every 5 seconds to keep ESP32 status fresh
  return useGetEsp32Status({
    query: {
      refetchInterval: 5000,
      retry: false,
    },
  });
}
