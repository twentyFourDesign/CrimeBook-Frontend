import { StyleSheet, Text, View } from "react-native";
import { ScreenBackButton } from "../common/ScreenBackButton";

type Props = {
  step: number;
  totalSteps?: number;
  title?: string;
};

export function ReportScreenHeader({ step, totalSteps = 6, title = "Report Incident" }: Props) {
  return (
    <View style={styles.header}>
      <ScreenBackButton />
      <View style={styles.headerText}>
        <Text style={styles.heading}>{title}</Text>
        <Text style={styles.step}>
          Step {step} of {totalSteps}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
    paddingRight: 4,
  },
  headerText: { flex: 1, justifyContent: "center", minHeight: 40 },
  heading: { fontSize: 17, fontWeight: "700", color: "#111", letterSpacing: -0.2 },
  step: { fontSize: 12, color: "#888", marginTop: 4 },
});
