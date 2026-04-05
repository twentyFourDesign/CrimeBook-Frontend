import type { ReactNode } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CitizenTabBar } from "./CitizenTabBar";
import { useTheme } from "../../theme/ThemeContext";

type Props = { children: ReactNode };

export function CitizenShell({ children }: Props) {
  const { colors, animValue } = useTheme();

  const animatedBg = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "#141414"],
  });

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.safeArea }]}
      edges={["top", "left", "right"]}
    >
      <Animated.View style={[styles.body, { backgroundColor: animatedBg }]}>
        {children}
      </Animated.View>
      <View style={styles.tabBarOuter} collapsable={false}>
        <CitizenTabBar />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, overflow: "visible" },
  body: { flex: 1 },
  tabBarOuter: { overflow: "visible", zIndex: 50 },
});
