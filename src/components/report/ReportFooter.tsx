import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/**
 * A fixed footer component for report incident screens.
 * Ensures buttons are always visible and above the safe area bottom inset.
 */
export function ReportFooter({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    // Premium shadow to indicate it's floating above content
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
  },
});
