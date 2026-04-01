import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Onboarding1() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Icon */}
      <View style={styles.iconWrapper}>
        <View style={styles.iconCircle}>
          {/* Replace with your shield SVG/icon */}
          <Text style={styles.iconText}>🛡️</Text>
        </View>
      </View>

      {/* Text */}
      <Text style={styles.title}>Report Crime Instantly</Text>
      <Text style={styles.subtitle}>
        Submit detailed incident reports with evidence, location data, and real-time tracking.
      </Text>

      {/* Dots */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.activeDot]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/onboarding-2')}>
        <Text style={styles.buttonText}>Next →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF', alignItems: 'center', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 },
  logo: { width: 100, height: 36 },
  skip: { fontSize: 15, color: '#555', fontWeight: '500' },
  iconWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 },
  iconText: { fontSize: 64 },
  title: { fontSize: 22, fontWeight: '700', color: '#111', textAlign: 'center', marginTop: 32 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 12, lineHeight: 22, paddingHorizontal: 8 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#CBD5E1' },
  activeDot: { width: 24, backgroundColor: '#2563EB' },
  button: { width: '100%', backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});