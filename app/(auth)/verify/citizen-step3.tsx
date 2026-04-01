import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import BottomTabBar from '../../../src/components/common/BottomTabBar';

export default function CitizenStep3() {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.heading}>Identification Verification</Text>
            <Text style={styles.step}>Step 3 of 3</Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={[styles.progressSegment, styles.progressActive]} />
        </View>

        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>Verification help maintains community trust and safety. Your documents are encrypted and securely stored.</Text>
        </View>

        <Text style={styles.sectionTitle}>Selfie Verification</Text>
        <Text style={styles.sectionDesc}>Take a clear selfie to match with your government ID. Ensure good lightning.</Text>

        {/* Camera Box */}
        <TouchableOpacity style={styles.cameraBox}>
          <Text style={styles.cameraIcon}>📤</Text>
          <Text style={styles.cameraText}>Tap to take a Selfie</Text>
          <Text style={styles.cameraHint}>Face forward with good lighting</Text>
        </TouchableOpacity>

        {/* Tips */}
        <Text style={styles.tipsTitle}>TIPS FOR GOOD SELFIE</Text>
        {[
          'Remove sunglasses or hat',
          'Ensure even lightning',
          'Look directly at the camera',
        ].map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Text style={styles.tipCheck}>✓</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/verify/citizen-review')}>
          <Text style={styles.buttonText}>Continue →</Text>
        </TouchableOpacity>

      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  container: { paddingHorizontal: 20, paddingTop: 52, paddingBottom: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  backBtn: { width: 32, height: 32, justifyContent: 'center' },
  backArrow: { fontSize: 20, color: '#111' },
  heading: { fontSize: 16, fontWeight: '700', color: '#111' },
  step: { fontSize: 12, color: '#888', marginTop: 1 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  progressSegment: { flex: 1, height: 5, borderRadius: 4, backgroundColor: '#E2E8F0' },
  progressActive: { backgroundColor: '#2563EB' },
  infoBanner: { flexDirection: 'row', backgroundColor: '#F8FAFF', borderRadius: 10, padding: 12, gap: 10, marginBottom: 24, alignItems: 'flex-start' },
  infoIcon: { fontSize: 14 },
  infoText: { flex: 1, fontSize: 12, color: '#555', lineHeight: 18 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: '#666', lineHeight: 20, marginBottom: 16 },
  cameraBox: { borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 48, alignItems: 'center', marginBottom: 24, backgroundColor: '#FAFAFA' },
  cameraIcon: { fontSize: 32, marginBottom: 10 },
  cameraText: { fontSize: 14, fontWeight: '600', color: '#333' },
  cameraHint: { fontSize: 12, color: '#999', marginTop: 4 },
  tipsTitle: { fontSize: 11, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  tipCheck: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
  tipText: { fontSize: 13, color: '#444' },
  button: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});