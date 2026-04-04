import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../auth/AuthContext";
import type {
  CitizenProfilePayload,
  FeedReportItem,
  MyReportItem,
  OfficerProfilePayload,
  PoliceCaseItem,
  PoliceIncidentForMap,
  CommunityGroup,
  PublicAppealItem,
} from "../auth/types";

const CACHE_STORAGE_KEY = "crime_app_data_cache";

export type AppDataCacheState = {
  citizenProfile: CitizenProfilePayload | null;
  officerProfile: OfficerProfilePayload | null;
  citizenReports: MyReportItem[] | null;
  policeIncidents: PoliceIncidentForMap[] | null;
  policeCases: PoliceCaseItem[] | null;
  feedReports: FeedReportItem[] | null;
  communityGroups: CommunityGroup[] | null;
  publicAppeals: PublicAppealItem[] | null;
};

export type RevalidatingState = {
  [K in keyof AppDataCacheState]: boolean;
};

const emptyCache = (): AppDataCacheState => ({
  citizenProfile: null,
  officerProfile: null,
  citizenReports: null,
  policeIncidents: null,
  policeCases: null,
  feedReports: null,
  communityGroups: null,
  publicAppeals: null,
});

const emptyRevalidating = (): RevalidatingState => ({
  citizenProfile: false,
  officerProfile: false,
  citizenReports: false,
  policeIncidents: false,
  policeCases: false,
  feedReports: false,
  communityGroups: false,
  publicAppeals: false,
});

type AppDataCacheContextValue = AppDataCacheState & {
  revalidating: RevalidatingState;
  setCitizenProfile: (v: CitizenProfilePayload | null) => void;
  setOfficerProfile: (v: OfficerProfilePayload | null) => void;
  setCitizenReports: (v: MyReportItem[] | null) => void;
  setPoliceIncidents: (v: PoliceIncidentForMap[] | null) => void;
  setPoliceCases: (v: PoliceCaseItem[] | null) => void;
  setFeedReports: (v: FeedReportItem[] | null) => void;
  setCommunityGroups: (v: CommunityGroup[] | null) => void;
  setPublicAppeals: (v: PublicAppealItem[] | null) => void;
  setRevalidating: (key: keyof AppDataCacheState, isRevalidating: boolean) => void;
  clearAppDataCache: () => void;
};

const AppDataCacheContext = createContext<AppDataCacheContextValue | null>(null);

export function AppDataCacheProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppDataCacheState>(emptyCache);
  const [revalidating, setRevalidatingState] = useState<RevalidatingState>(emptyRevalidating);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cache from disk on mount
  useEffect(() => {
    async function init() {
      try {
        const stored = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setState(parsed);
        }
      } catch (e) {
        console.error("Failed to load app data cache from storage:", e);
      } finally {
        setIsLoaded(true);
      }
    }
    init();
  }, []);

  // Save cache to disk whenever state changes
  useEffect(() => {
    if (!isLoaded) return;
    async function persist() {
      try {
        await AsyncStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error("Failed to persist app data cache:", e);
      }
    }
    persist();
  }, [state, isLoaded]);

  useEffect(() => {
    if (!user) {
      setState(emptyCache());
      setRevalidatingState(emptyRevalidating());
      AsyncStorage.removeItem(CACHE_STORAGE_KEY).catch(() => {});
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

  const setCommunityGroups = useCallback((v: CommunityGroup[] | null) => {
    setState((s) => ({ ...s, communityGroups: v }));
  }, []);

  const setPublicAppeals = useCallback((v: PublicAppealItem[] | null) => {
    setState((s) => ({ ...s, publicAppeals: v }));
  }, []);

  const setRevalidating = useCallback((key: keyof AppDataCacheState, isRevalidating: boolean) => {
    setRevalidatingState((s) => ({ ...s, [key]: isRevalidating }));
  }, []);

  const clearAppDataCache = useCallback(() => {
    setState(emptyCache());
    setRevalidatingState(emptyRevalidating());
    AsyncStorage.removeItem(CACHE_STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo<AppDataCacheContextValue>(
    () => ({
      ...state,
      revalidating,
      setCitizenProfile,
      setOfficerProfile,
      setCitizenReports,
      setPoliceIncidents,
      setPoliceCases,
      setFeedReports,
      setCommunityGroups,
      setPublicAppeals,
      setRevalidating,
      clearAppDataCache,
    }),
    [
      state,
      revalidating,
      setCitizenProfile,
      setOfficerProfile,
      setCitizenReports,
      setPoliceIncidents,
      setPoliceCases,
      setFeedReports,
      setCommunityGroups,
      setPublicAppeals,
      setRevalidating,
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
