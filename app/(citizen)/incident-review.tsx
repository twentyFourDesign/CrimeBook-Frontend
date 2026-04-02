import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function IncidentReview() {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.heading}>Incident Review</Text>
            <Text style={styles.reportNo}>Report # 1</Text>
          </View>
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        </View>

        {/* Incident Title Card */}
        <View style={styles.titleCard}>
          <View style={styles.incidentIconBox}>
            <Text style={{ fontSize: 20 }}>🔒</Text>
          </View>
          <View>
            <Text style={styles.incidentTitle}>Armed Robbery</Text>
            <Text style={styles.incidentMeta}>March 16, 2026  •  2:42 PM</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📍</Text>
            <Text style={styles.sectionTitle}>Location</Text>
          </View>
          {/* Map Placeholder */}
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>🗺️</Text>
          </View>
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>📍 Main St & 5th Ave</Text>
            <Text style={styles.timeText}>🕐 8 min ago</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📋</Text>
            <Text style={styles.sectionTitle}>Description</Text>
          </View>
          <Text style={styles.descText}>
            Two Aspects were fleeing the scene after robbing a convenience store ar gunpoint. One suspect was wearing a dark hoodie. The other had a red cap. No injuries reported. Police Units have been dispatched to the area.
          </Text>
        </View>

        {/* Evidence */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📷</Text>
            <Text style={styles.sectionTitle}>Evidence</Text>
          </View>
          <View style={styles.evidenceRow}>
            <View style={styles.evidenceBox}><Text style={{ fontSize: 28 }}>📷</Text></View>
            <View style={styles.evidenceBox}><Text style={{ fontSize: 28 }}>📷</Text></View>
          </View>
        </View>

        {/* Anonymous Reporter */}
        <View style={styles.reporterRow}>
          <View style={styles.reporterLeft}>
            <Text style={{ fontSize: 18 }}>👤</Text>
            <Text style={styles.reporterText}>Anonymous Reporter</Text>
          </View>
          <Text style={styles.reporterConfidence}>● 72%</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#F8FAFF' },
  container: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
  backArrow: { fontSize: 18, color: '#111' },
  heading: { fontSize: 17, fontWeight: '700', color: '#111', flex: 1 },
  reportNo: { fontSize: 12, color: '#888' },
  pendingBadge: { backgroundColor: '#FEF9C3', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pendingText: { fontSize: 11, fontWeight: '700', color: '#CA8A04' },
  titleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  incidentIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  incidentTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  incidentMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionIcon: { fontSize: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  mapPlaceholder: { height: 140, backgroundColor: '#E8F0FE', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  mapText: { fontSize: 48 },
  locationRow: { flexDirection: 'row', justifyContent: 'space-between' },
  locationText: { fontSize: 12, color: '#555' },
  timeText: { fontSize: 12, color: '#888' },
  descText: { fontSize: 13, color: '#444', lineHeight: 21 },
  evidenceRow: { flexDirection: 'row', gap: 12 },
  evidenceBox: { width: 80, height: 80, backgroundColor: '#F0F4FF', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  reporterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  reporterLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reporterText: { fontSize: 13, fontWeight: '600', color: '#333' },
  reporterConfidence: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
});