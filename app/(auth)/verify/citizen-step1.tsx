import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import BottomTabBar from '../../../src/components/common/BottomTabBar';

export default function CitizenStep1() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [idNumber, setIdNumber] = useState('');

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
            <Text style={styles.heading}>Identification Verification</Text>
            <Text style={styles.step}>Step 1 of 3</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressRow}>
          <View style={[styles.progressSegment, styles.progressActive]} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>Verification help maintains community trust and safety. Your documents are encrypted and securely stored.</Text>
        </View>

        {/* Section */}
        <Text style={styles.sectionTitle}>Government – Issue ID</Text>
        <Text style={styles.sectionDesc}>Upload a clear photo of your government ID passport, drivers license or national ID.</Text>

        {/* Upload Box */}
        <TouchableOpacity style={styles.uploadBox}>
          <Text style={styles.uploadIcon}>📤</Text>
          <Text style={styles.uploadText}>Tap to Upload ID</Text>
          <Text style={styles.uploadHint}>JPG, PNG or PDF Max 10MB</Text>
        </TouchableOpacity>

        {/* Full Name */}
        <Text style={styles.fieldLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="As shown on ID"
          placeholderTextColor="#AAA"
          value={fullName}
          onChangeText={setFullName}
        />

        {/* ID Number */}
        <Text style={styles.fieldLabel}>ID Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter ID Number"
          placeholderTextColor="#AAA"
          value={idNumber}
          onChangeText={setIdNumber}
        />

        <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/verify/citizen-step2')}>
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
  uploadBox: { borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 32, alignItems: 'center', marginBottom: 20, backgroundColor: '#FAFAFA' },
  uploadIcon: { fontSize: 28, marginBottom: 8 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#333' },
  uploadHint: { fontSize: 12, color: '#999', marginTop: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: '#111', marginBottom: 16, backgroundColor: '#FAFAFA' },
  button: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});