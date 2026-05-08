import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";
import { useReportDraft } from "../../src/report/ReportDraftContext";
import { ReportProgress } from "../../src/report/ReportProgress";
import { ReportScreenHeader } from "../../src/components/report/ReportScreenHeader";
import { ReportContinueButton } from "../../src/components/report/ReportContinueButton";
import { ReportFooter } from "../../src/components/report/ReportFooter";
import { useReportScreenLayout } from "../../src/report/reportScreenLayout";

export default function ReportStep3() {
  const router = useRouter();
  const layout = useReportScreenLayout();
  const { draft, updateDraft } = useReportDraft();
  const [location, setLocation] = useState(draft.locationText);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsLat, setGpsLat] = useState<number | null>(draft.latitude);
  const [gpsLng, setGpsLng] = useState<number | null>(draft.longitude);

  const [region, setRegion] = useState<Region>({
    latitude: draft.latitude || 3.3792, // Default to a center point or Lagos
    longitude: draft.longitude || 6.5244,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const reverseGeocode = async (lat: number, lng: number) => {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
      );
      const data = (await res.json()) as {
        status?: string;
        results?: Array<{ formatted_address?: string }>;
      };
      if (data.status === "OK" && data.results && data.results[0]?.formatted_address) {
        const addr = data.results[0].formatted_address;
        setLocation(addr);
        updateDraft({ locationText: addr, latitude: lat, longitude: lng });
      }
    } catch {
      // ignore
    }
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={layout.scrollContentStyle}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ReportScreenHeader step={3} />

        <ReportProgress currentStep={3} />

        <Text style={styles.sectionTitle}>Incident Location</Text>
        <Text style={styles.sectionDesc}>Describe where the incident occurred or use your current GPS location</Text>

        <Text style={styles.fieldLabel}>Address or area</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Main St & 5th Ave"
          placeholderTextColor="#BBB"
          value={location}
          onChangeText={setLocation}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.useCurrentBtn, gpsLoading && styles.useCurrentBtnDisabled]}
          disabled={gpsLoading}
          onPress={async () => {
            setError(null);
            setGpsLoading(true);
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== "granted") {
                setError("Location permission denied. You can still type the address manually.");
                return;
              }

              const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
              });

              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;

              let displayText = location.trim();
              const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
              if (!displayText && apiKey) {
                try {
                  const res = await fetch(
                    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
                  );
                  const data = (await res.json()) as {
                    status?: string;
                    results?: Array<{ formatted_address?: string }>;
                  };
                  if (data.status === "OK" && data.results && data.results[0]?.formatted_address) {
                    displayText = data.results[0].formatted_address;
                    setLocation(displayText);
                  }
                } catch {
                  // ignore reverse geocode error, still use lat/lng
                }
              }

              updateDraft({
                locationText: displayText || draft.locationText,
                latitude: lat,
                longitude: lng,
              });
              setGpsLat(lat);
              setGpsLng(lng);
              setRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              });
              reverseGeocode(lat, lng);
            } catch {
              setError("Could not fetch your current location. Try again or type it manually.");
            } finally {
              setGpsLoading(false);
            }
          }}
        >
          {gpsLoading ? (
            <ActivityIndicator size="small" color="#1D4ED8" />
          ) : (
            <View style={styles.useCurrentRow}>
              <Ionicons name="navigate-outline" size={18} color="#1D4ED8" />
              <Text style={styles.useCurrentText}>Use my current location</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.mapBox}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            onRegionChangeComplete={(newRegion) => {
              setRegion(newRegion);
              setGpsLat(newRegion.latitude);
              setGpsLng(newRegion.longitude);
              reverseGeocode(newRegion.latitude, newRegion.longitude);
            }}
          />
          <View style={styles.mapPinContainer} pointerEvents="none">
            <Ionicons name="location" size={32} color="#DC2626" />
          </View>
        </View>

        {gpsLat != null && gpsLng != null && (
          <Text style={styles.coordsText}>
            Using coordinates: {gpsLat.toFixed(5)}, {gpsLng.toFixed(5)}
          </Text>
        )}

      </ScrollView>
      <ReportFooter>
        <ReportContinueButton
          disabled={!location.trim() || resolving}
          onPress={async () => {
            const text = location.trim();
            if (!text || resolving) return;
            setError(null);
            setResolving(true);
            try {
              const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
              let lat: number | null = draft.latitude;
              let lng: number | null = draft.longitude;

              if (apiKey) {
                const encoded = encodeURIComponent(text);
                const res = await fetch(
                  `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${apiKey}`
                );
                const data = (await res.json()) as { status?: string; results?: Array<{ geometry?: { location?: { lat: number; lng: number } } }> };
                if (data.status === "OK" && data.results && data.results[0]?.geometry?.location) {
                  lat = data.results[0].geometry.location.lat;
                  lng = data.results[0].geometry.location.lng;
                } else if (!draft.latitude || !draft.longitude) {
                  setError("Couldn't auto-detect coordinates from this address. You can still continue.");
                }
              }

              updateDraft({
                locationText: text,
                latitude: lat ?? null,
                longitude: lng ?? null,
              });
              router.push("/(citizen)/report-step4");
            } catch {
              if (!draft.latitude || !draft.longitude) {
                setError("Location lookup failed. You can still continue.");
              }
              updateDraft({ locationText: text });
              router.push("/(citizen)/report-step4");
            } finally {
              setResolving(false);
            }
          }}
        />
        {resolving && (
          <View style={[styles.resolvingRow, { marginTop: 12, marginBottom: 0 }]}>
            <ActivityIndicator size="small" />
            <Text style={styles.resolvingText}>Resolving location…</Text>
          </View>
        )}
      </ReportFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 4 },
  sectionDesc: { fontSize: 13, color: "#888", marginBottom: 20 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#333", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#111",
    marginBottom: 14,
    backgroundColor: "#FAFAFA",
  },
  mapBox: {
    height: 180,
    backgroundColor: "#E8F4E8",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPinContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { fontSize: 12, color: "#DC2626", marginBottom: 8 },
  resolvingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  resolvingText: { fontSize: 12, color: "#64748B" },
  coordsText: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 8,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  useCurrentBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    marginBottom: 14,
  },
  useCurrentBtnDisabled: {
    opacity: 0.7,
  },
  useCurrentRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  useCurrentText: { fontSize: 12, fontWeight: "600", color: "#1D4ED8" },
});
