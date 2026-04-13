import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPills,
  useAddPill,
  useUpdatePill,
  useDeletePill,
  useMarkPillTaken,
  useResetPillTaken,
  getGetPillsQueryKey,
} from "@workspace/api-client-react";

export function usePills() {
  return useGetPills();
}

export function usePillMutations() {
  const qc = useQueryClient();
  const key = getGetPillsQueryKey();

  const add = useAddPill({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: key }) },
  });

  const update = useUpdatePill({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: key }) },
  });

  const remove = useDeletePill({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: key }) },
  });

  const markTaken = useMarkPillTaken({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: key }) },
  });

  const reset = useResetPillTaken({
    mutation: { onSuccess: () => qc.invalidateQueries({ queryKey: key }) },
  });

  return { add, update, remove, markTaken, reset };
}
