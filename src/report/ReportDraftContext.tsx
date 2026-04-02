import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { CrimeMediaUploadResult } from "../auth/types";

export type ReportDraft = {
  crimeSlug: string | null;
  /** ISO 8601 */
  incidentTimeIso: string;
  isHappeningNow: boolean;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  isAnonymous: boolean;
  evidenceNote: string;
  /** Files already uploaded to Supabase `crime-media` */
  media: CrimeMediaUploadResult[];
};

const emptyDraft = (): ReportDraft => ({
  crimeSlug: null,
  incidentTimeIso: new Date().toISOString(),
  isHappeningNow: true,
  locationText: "",
  latitude: null,
  longitude: null,
  description: "",
  isAnonymous: false,
  evidenceNote: "",
  media: [],
});

type Ctx = {
  draft: ReportDraft;
  setDraft: React.Dispatch<React.SetStateAction<ReportDraft>>;
  updateDraft: (patch: Partial<ReportDraft>) => void;
  resetDraft: () => void;
};

const ReportDraftContext = createContext<Ctx | null>(null);

export function ReportDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft>(emptyDraft);

  const updateDraft = useCallback((patch: Partial<ReportDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(emptyDraft());
  }, []);

  const value = useMemo(
    () => ({ draft, setDraft, updateDraft, resetDraft }),
    [draft, updateDraft, resetDraft]
  );

  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}

export function useReportDraft() {
  const v = useContext(ReportDraftContext);
  if (!v) throw new Error("useReportDraft must be used within ReportDraftProvider");
  return v;
}
