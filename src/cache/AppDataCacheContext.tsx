import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import type {
  CitizenProfilePayload,
  FeedReportItem,
  MyReportItem,
  OfficerProfilePayload,
  PoliceCaseItem,
  PoliceIncidentForMap,
} from "../auth/types";

export type AppDataCacheState = {
  citizenProfile: CitizenProfilePayload | null;
  officerProfile: OfficerProfilePayload | null;
  citizenReports: MyReportItem[] | null;
  policeIncidents: PoliceIncidentForMap[] | null;
  policeCases: PoliceCaseItem[] | null;
  feedReports: FeedReportItem[] | null;
};

const emptyCache = (): AppDataCacheState => ({
  citizenProfile: null,
  officerProfile: null,
  citizenReports: null,
  policeIncidents: null,
  policeCases: null,
  feedReports: null,
});

type AppDataCacheContextValue = AppDataCacheState & {
  setCitizenProfile: (v: CitizenProfilePayload | null) => void;
  setOfficerProfile: (v: OfficerProfilePayload | null) => void;
  setCitizenReports: (v: MyReportItem[] | null) => void;
  setPoliceIncidents: (v: PoliceIncidentForMap[] | null) => void;
  setPoliceCases: (v: PoliceCaseItem[] | null) => void;
  setFeedReports: (v: FeedReportItem[] | null) => void;
  clearAppDataCache: () => void;
};

const AppDataCacheContext = createContext<AppDataCacheContextValue | null>(null);

export function AppDataCacheProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppDataCacheState>(emptyCache);

  useEffect(() => {
    if (!user) {
      setState(emptyCache());
    }
  }, [user]);

  const setCitizenProfile = useCallback((v: CitizenProfilePayload | null) => {
    setState((s) => ({ ...s, citizenProfile: v }));
  }, []);

  const setOfficerProfile = useCallback((v: OfficerProfilePayload | null) => {
    setState((s) => ({ ...s, officerProfile: v }));
  }, []);

  const setCitizenReports = useCallback((v: MyReportItem[] | null) => {
    setState((s) => ({ ...s, citizenReports: v }));
  }, []);

  const setPoliceIncidents = useCallback((v: PoliceIncidentForMap[] | null) => {
    setState((s) => ({ ...s, policeIncidents: v }));
  }, []);

  const setPoliceCases = useCallback((v: PoliceCaseItem[] | null) => {
    setState((s) => ({ ...s, policeCases: v }));
  }, []);

  const setFeedReports = useCallback((v: FeedReportItem[] | null) => {
    setState((s) => ({ ...s, feedReports: v }));
  }, []);

  const clearAppDataCache = useCallback(() => {
    setState(emptyCache());
  }, []);

  const value = useMemo<AppDataCacheContextValue>(
    () => ({
      ...state,
      setCitizenProfile,
      setOfficerProfile,
      setCitizenReports,
      setPoliceIncidents,
      setPoliceCases,
      setFeedReports,
      clearAppDataCache,
    }),
    [
      state,
      setCitizenProfile,
      setOfficerProfile,
      setCitizenReports,
      setPoliceIncidents,
      setPoliceCases,
      setFeedReports,
      clearAppDataCache,
    ]
  );

  return <AppDataCacheContext.Provider value={value}>{children}</AppDataCacheContext.Provider>;
}

export function useAppDataCache() {
  const ctx = useContext(AppDataCacheContext);
  if (!ctx) throw new Error("useAppDataCache must be used within AppDataCacheProvider");
  return ctx;
}
