import { useCallback, useEffect, useState, useRef } from "react";
import { useAppDataCache, AppDataCacheState } from "../cache/AppDataCacheContext";

/**
 * A hook that implements the Stale-While-Revalidate (SWR) pattern.
 * It returns cached data immediately and refreshes it in the background.
 *
 * @param cacheKey The key in the AppDataCacheState to use
 * @param fetcher The API function to call
 * @param setter The context setter function to update the cache
 * @param options Optional configuration (e.g. skip auto-fetch)
 */
export function useCachedData<T>(
  cacheKey: keyof AppDataCacheState,
  fetcher: () => Promise<T>,
  setter: (data: T) => void,
  options: { skipInit?: boolean } = {}
) {
  const cache = useAppDataCache();
  const cachedData = cache[cacheKey] as unknown as T | null;
  const isRevalidating = cache.revalidating[cacheKey];

  const [loading, setLoading] = useState(() => cachedData === null);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to track if we've already done the initial fetch to avoid double-firing
  const hasFetched = useRef(false);

  const load = useCallback(
    async (mode?: "refresh") => {
      setError(null);

      // Only show full-screen loader if we have NO cached data
      if (mode !== "refresh" && cache[cacheKey] === null) {
        setLoading(true);
      }

      cache.setRevalidating(cacheKey, true);

      try {
        const data = await fetcher();
        setter(data);
      } catch (e) {
        console.error(`SWR Fetch Error [${cacheKey}]:`, e);
        setError(e instanceof Error ? e.message : "Failed to refresh data");
      } finally {
        setLoading(false);
        cache.setRevalidating(cacheKey, false);
      }
    },
    [cacheKey, fetcher, setter, cache.setRevalidating, cache[cacheKey]]
  );

  useEffect(() => {
    if (!options.skipInit && !hasFetched.current) {
      hasFetched.current = true;
      load();
    }
  }, [load, options.skipInit]);

  return {
    data: cachedData,
    loading,
    revalidating: isRevalidating,
    error,
    refresh: () => load("refresh"),
  };
}
