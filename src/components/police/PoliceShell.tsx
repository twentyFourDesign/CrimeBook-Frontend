import type { ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PoliceTabBar } from "./PoliceTabBar";

type Props = { children: ReactNode };

/** Police main screens: content + same bottom bar pattern as citizen. */
export function PoliceShell({ children }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.body}>{children}</View>
      <View style={styles.tabBarOuter} collapsable={false}>
        <PoliceTabBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", overflow: "visible" },
  body: { flex: 1 },
  tabBarOuter: { overflow: "visible", zIndex: 50 },
});
