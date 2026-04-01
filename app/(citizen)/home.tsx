import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import BottomTabBar from '../../src/components/common/BottomTabBar';

export default function CitizenHome() {
  return (
    <View style={styles.wrapper}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        <Text style={styles.title}>Citizen Home</Text>
        <Text style={styles.subtitle}>Welcome to your community safety dashboard.</Text>
      </View>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
});
