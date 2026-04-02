import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  label?: string;
  onPress: () => void;
  disabled?: boolean;
};

export function ReportContinueButton({ label = "Continue", onPress, disabled }: Props) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        <Text style={styles.buttonText}>{label}</Text>
        <Ionicons name="chevron-forward" size={18} color="#fff" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  buttonDisabled: { backgroundColor: "#A0BCEF" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
});
