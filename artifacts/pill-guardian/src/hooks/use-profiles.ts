import { useQueryClient } from "@tanstack/react-query";
import {
  useGetGuardian,
  useSaveGuardian,
  useGetPatient,
  useSavePatient,
  getGetGuardianQueryKey,
  getGetPatientQueryKey,
} from "@workspace/api-client-react";

export function useGuardianProfile() {
  return useGetGuardian({
    query: {
      retry: false, // Don't retry on 404 if profile doesn't exist yet
    }
  });
}

export function usePatientProfile() {
  return useGetPatient({
    query: {
      retry: false,
    }
  });
}

export function useProfileMutations() {
  const qc = useQueryClient();
  const guardianKey = getGetGuardianQueryKey();
  const patientKey = getGetPatientQueryKey();

  const saveGuardian = useSaveGuardian({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: guardianKey }),
    },
  });

  const savePatient = useSavePatient({
    mutation: {
      onSuccess: () => qc.invalidateQueries({ queryKey: patientKey }),
    },
  });

  return { saveGuardian, savePatient };
}
