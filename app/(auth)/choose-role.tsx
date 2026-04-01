import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';

const roles = [
  {
    id: 'citizen',
    title: 'Citizen',
    subtitle: 'Standard User',
    icon: '👤',
    perks: ['Report Crimes', 'View Crimes', 'Received Safety alerts'],
    badge: null,
  },
  {
    id: 'verified_citizen',
    title: 'Verified Citizen',
    subtitle: 'Community Leader',
    icon: '✅',
    perks: ['Validate incident report', 'Send neighbourhood alerts', 'Moderate community activity'],
    badge: { label: 'Requires Verification', color: '#F59E0B' },
  },
  {
    id: 'police',
    title: 'Police Officer',
    subtitle: 'Law Enforcement',
    icon: '🛡️',
    perks: ['Respond to incidents', 'View live reports', 'Manage Investigations'],
    badge: { label: 'Requires Departmental approval', color: '#10B981' },
  },
];

export default function ChooseRole() {
  const router = useRouter();
  const [selected, setSelected] = useState('verified_citizen');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <StatusBar style="dark" />

      {/* Back + Title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Role</Text>
      </View>

      {roles.map((role) => (
        <TouchableOpacity
          key={role.id}
          style={[styles.card, selected === role.id && styles.selectedCard]}
          onPress={() => setSelected(role.id)}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>{role.icon}</Text>
            </View>
            <View style={styles.cardTitleBlock}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
            </View>
            {selected === role.id && <Text style={styles.checkmark}>✓</Text>}
          </View>

          {role.perks.map((perk, i) => (
            <Text key={i} style={styles.perk}>• {perk}</Text>
          ))}

          {role.badge && (
            <View style={[styles.badge, { borderColor: role.badge.color }]}>
              <Text style={[styles.badgeText, { color: role.badge.color }]}>{role.badge.label}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/verify/citizen-step1')}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  back: { fontSize: 22, color: '#111' },
  title: { fontSize: 20, fontWeight: '700', color: '#111' },
  card: { borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, padding: 16, marginBottom: 14, backgroundColor: '#fff' },
  selectedCard: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0EAFF', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 18 },
  cardTitleBlock: { flex: 1 },
  roleTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  roleSubtitle: { fontSize: 12, color: '#888' },
  checkmark: { fontSize: 18, color: '#2563EB', fontWeight: '700' },
  perk: { fontSize: 13, color: '#444', lineHeight: 22 },
  badge: { marginTop: 10, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  button: { width: '100%', backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});