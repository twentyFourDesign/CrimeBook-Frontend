import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import BottomTabBar from '../../../src/components/common/BottomTabBar';

export default function CitizenStep2() {
  const router = useRouter();
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [phone, setPhone] = useState('');

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
          <Text style={styles.infoText}>Verification help maintains community trust and safety. Your documents are encrypted and securely stored.</Text>
        </View>

        <Text style={styles.sectionTitle}>Address Verification</Text>
        <Text style={styles.sectionDesc}>Confirm your residential address to establish your community zone.</Text>

        <Text style={styles.fieldLabel}>Street Address</Text>
        <TextInput style={styles.input} placeholder="123 main street" placeholderTextColor="#AAA" value={street} onChangeText={setStreet} />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.fieldLabel}>City</Text>
            <TextInput style={styles.input} placeholder="City" placeholderTextColor="#AAA" value={city} onChangeText={setCity} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Zip Code</Text>
            <TextInput style={styles.input} placeholder="10000101" placeholderTextColor="#AAA" value={zip} onChangeText={setZip} keyboardType="numeric" />
          </View>
        </View>

        <TouchableOpacity style={styles.locationBtn}>
          <Text style={styles.locationIcon}>📍</Text>
          <View>
            <Text style={styles.locationTitle}>Use Current Location</Text>
            <Text style={styles.locationSub}>Auto-detect your address</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
        <TextInput style={styles.input} placeholder="+1(5555)0000-0000" placeholderTextColor="#AAA" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/verify/citizen-step3')}>
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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#111', marginBottom: 16, backgroundColor: '#FAFAFA' },
  row: { flexDirection: 'row' },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0F4FF', borderRadius: 10, padding: 14, marginBottom: 16 },
  locationIcon: { fontSize: 20 },
  locationTitle: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  locationSub: { fontSize: 11, color: '#888' },
  button: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});