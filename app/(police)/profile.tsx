import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { PoliceShell } from "../../src/components/police/PoliceShell";
import { useAuth } from "../../src/auth/AuthContext";

export default function PoliceProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <PoliceShell>
      <StatusBar style="dark" />
      <View style={styles.wrap}>
        <Text style={styles.title}>Profile</Text>
        {user ? (
          <View style={styles.meta}>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.role}>{user.role.replace(/_/g, " ")}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.signOut} onPress={() => signOut()} activeOpacity={0.85}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </PoliceShell>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 20 },
  meta: { marginBottom: 28 },
  name: { fontSize: 18, fontWeight: "700", color: "#111" },
  email: { fontSize: 14, color: "#64748B", marginTop: 6 },
  role: { fontSize: 12, color: "#94A3B8", marginTop: 8, textTransform: "capitalize" },
  signOut: {
    backgroundColor: "#DC2626",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  signOutText: { color: "#fff", fontSize: 17, fontWeight: "700" },
});
