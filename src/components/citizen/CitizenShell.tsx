import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CitizenTabBar } from "./CitizenTabBar";

type Props = { children: ReactNode };

/** Main citizen screens: content + fixed bottom bar (no expo-router Tabs). */
export function CitizenShell({ children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.body}>{children}</View>
      {/* Allow the FAB to extend above the bar without being clipped (esp. Android). */}
      <View style={styles.tabBarOuter} collapsable={false}>
        <CitizenTabBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", overflow: "visible" },
  body: { flex: 1 },
  tabBarOuter: { overflow: "visible", zIndex: 50 },
});
