import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFeedReports, type FeedSegment } from "../auth/api";
import type { FeedReportItem } from "../auth/types";
import { filterFeedBySegment } from "../components/community/feed-helpers";

export function useFeedSegment(segment: FeedSegment) {
  const [data, setData] = useState<FeedReportItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode?: "refresh") => {
    setError(null);
    if (mode !== "refresh") {
      setLoading(true);
    } else {
      setRevalidating(true);
    }

    try {
      const res = await fetchFeedReports(segment);
      const filtered = filterFeedBySegment(res.reports ?? [], segment);
      setData(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load incidents");
    } finally {
      setLoading(false);
      setRevalidating(false);
    }
  }, [segment]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load("refresh"), [load]);

  return {
    data,
    loading,
    revalidating,
    error,
    refresh,
    setData,
  };
}
