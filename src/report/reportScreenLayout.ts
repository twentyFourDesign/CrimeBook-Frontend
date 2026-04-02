import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Horizontal padding for report flows — keeps content off screen edges. */
export const REPORT_H_PAD = 24;

const GRID_GAP = 12;
const GRID_COLS = 3;

/**
 * Safe-area-aware scroll content padding + exact crime-card width so 3 columns + gaps align.
 */
export function useReportScreenLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const paddingTop = Math.max(insets.top, 20) + 8;
    const innerWidth = width - REPORT_H_PAD * 2;
    const crimeCellWidth = Math.floor((innerWidth - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS);

    return {
      scrollContentStyle: {
        paddingHorizontal: REPORT_H_PAD,
        paddingTop,
        paddingBottom: 36,
      },
      crimeCellWidth: Math.max(crimeCellWidth, 96),
      gridGap: GRID_GAP,
    };
  }, [insets.top, width]);
}
