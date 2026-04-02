import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScreenBackButton } from "../../../src/components/common/ScreenBackButton";
import { useVerificationDraft } from "../../../src/verification/VerificationDraftContext";

export default function CitizenStep2() {
  const router = useRouter();
  const { draft, setDraft } = useVerificationDraft();

  const onContinue = () => {
    if (!draft.street.trim() || !draft.city.trim() || !draft.zip.trim()) {
      Alert.alert("Missing address", "Please enter street, city, and zip code.");
      return;
    }
    router.push("/(auth)/verify/citizen-step3");
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <ScreenBackButton />
          <View>
            <Text style={styles.heading}>Identification Verification</Text>
            <Text style={styles.step}>Step 2 of 3</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={styles.progressSegment} />
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>
            Confirm your residential address to establish your community zone.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Address verification</Text>
        <Text style={styles.sectionDesc}>Use the address on your ID or your current residence.</Text>

        <Text style={styles.fieldLabel}>Street address</Text>
        <TextInput
          style={styles.input}
          placeholder="123 Main Street"
          placeholderTextColor="#AAA"
          value={draft.street}
          onChangeText={(street) => setDraft((d) => ({ ...d, street }))}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.fieldLabel}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="City"
              placeholderTextColor="#AAA"
              value={draft.city}
              onChangeText={(city) => setDraft((d) => ({ ...d, city }))}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Zip code</Text>
            <TextInput
              style={styles.input}
              placeholder="100001"
              placeholderTextColor="#AAA"
              value={draft.zip}
              onChangeText={(zip) => setDraft((d) => ({ ...d, zip }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Phone (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="+234 …"
          placeholderTextColor="#AAA"
          value={draft.phone}
          onChangeText={(phone) => setDraft((d) => ({ ...d, phone }))}
          keyboardType="phone-pad"
        />

        <TouchableOpacity style={styles.button} onPress={onContinue}>
          <Text style={styles.buttonText}>Continue →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  container: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  heading: { fontSize: 16, fontWeight: "700", color: "#111" },
  step: { fontSize: 12, color: "#888", marginTop: 1 },
  progressRow: { flexDirection: "row", gap: 6, marginBottom: 16 },
  progressSegment: { flex: 1, height: 5, borderRadius: 4, backgroundColor: "#E2E8F0" },
  progressActive: { backgroundColor: "#2563EB" },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#F8FAFF",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  infoIcon: { fontSize: 14 },
  infoText: { flex: 1, fontSize: 12, color: "#555", lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: "#666", lineHeight: 20, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#111",
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
  },
  row: { flexDirection: "row" },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
