import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../../src/auth/AuthContext";

export default function Login() {
  const router = useRouter();
  const { signInPassword, requestOtpSignIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInPassword({ email, password });
      if (result.requiresOtp) {
        router.push({
          pathname: "/(auth)/otp",
          params: { email: result.email, mode: "signup" },
        });
        return;
      }
      router.replace("/");
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    try {
      await requestOtpSignIn({ email });
      router.push({
        pathname: "/(auth)/otp",
        params: { email, mode: "signin" },
      });
    } catch (error) {
      Alert.alert("Could not send OTP", error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />

      {/* Tab Toggle */}
      <View style={styles.tabRow}>
        <View style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>Login</Text>
        </View>
        <TouchableOpacity style={styles.tab} onPress={() => router.push("/(auth)/signup")}>
          <Text style={styles.tabText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Inputs */}
      <View style={styles.inputWrapper}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94A3B8" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      </View>

      <View style={styles.inputWrapper}>
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#94A3B8" value={password} onChangeText={setPassword} secureTextEntry />
      </View>

      <TouchableOpacity style={styles.forgotBtn}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleOtpLogin}>
        <Text style={styles.passwordlessText}>Use OTP Login</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>OR</Text>

      <TouchableOpacity style={styles.googleBtn}>
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 },
  logo: { width: 140, height: 52, marginBottom: 28 },
  tabRow: { flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 10, padding: 4, width: "100%", marginBottom: 28 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#2563EB" },
  tabText: { fontSize: 15, fontWeight: "600", color: "#888" },
  activeTabText: { color: "#fff" },
  inputWrapper: { backgroundColor: "#F0F4FF", borderRadius: 10, paddingHorizontal: 14, marginBottom: 14, width: "100%" },
  input: { width: "100%", paddingVertical: 14, fontSize: 15, color: "#111" },
  forgotBtn: { alignSelf: "flex-start", marginBottom: 20 },
  forgotText: { color: "#2563EB", fontSize: 13 },
  button: { width: "100%", backgroundColor: "#2563EB", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  passwordlessText: { color: "#2563EB", fontSize: 14, fontWeight: "600" },
  orText: { color: "#aaa", fontSize: 13, marginVertical: 12 },
  googleBtn: { width: "100%", borderWidth: 1, borderColor: "#DDD", paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  googleText: { fontSize: 15, color: "#333", fontWeight: "500" },
});