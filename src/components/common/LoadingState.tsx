import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { CrimeBookLoader } from "./CrimeBookLoader";

type Props = {
  message?: string;
  size?: "small" | "medium" | "large";
  fullScreen?: boolean;
  inline?: boolean;
  style?: ViewStyle;
  barColor?: string;
  ballColor?: string;
};

export function LoadingState({
  message,
  size = "large",
  fullScreen = false,
  inline = false,
  style,
  barColor,
  ballColor,
}: Props) {
  const content = (
    <View style={[styles.inner, inline && styles.inline, style]}>
      <CrimeBookLoader size={size} barColor={barColor} ballColor={ballColor} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );

  if (fullScreen) {
    return <View style={styles.fullScreen}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 24,
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 16,
  },
  inline: {
    flexDirection: "column",
    paddingVertical: 12,
    gap: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
});
