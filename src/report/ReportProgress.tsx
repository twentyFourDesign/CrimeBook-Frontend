import { View, StyleSheet } from "react-native";

type Props = { currentStep: number; totalSteps?: number };

export function ReportProgress({ currentStep, totalSteps = 6 }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View key={i} style={[styles.seg, i < currentStep && styles.segActive]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, marginBottom: 24 },
  seg: { flex: 1, height: 5, borderRadius: 4, backgroundColor: "#E2E8F0" },
  segActive: { backgroundColor: "#2563EB" },
});
