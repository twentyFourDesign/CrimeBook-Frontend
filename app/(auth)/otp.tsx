import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";

type OtpMode = "signup" | "signin";

export default function OtpScreen() {
  const router = useRouter();
  const { email = "", mode = "signup" } = useLocalSearchParams<{ email?: string; mode?: OtpMode }>();
  const { verifySignUpOtp, verifyOtpSignIn, requestOtpSignIn, resendSignUpOtp } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const normalizedMode: OtpMode = mode === "signin" ? "signin" : "signup";

  const onVerify = async () => {
    if (code.length !== 6 || !email) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      if (normalizedMode === "signin") {
        await verifyOtpSignIn({ email, code });
        router.replace("/");
      } else {
        await verifySignUpOtp({ email, code });
        router.replace("/(auth)/choose-role");
      }
    } catch (error) {
      Alert.alert("Verification failed", error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (!email.trim()) {
      Alert.alert("Email missing", "Go back and enter your email again.");
      return;
    }
    try {
      setResending(true);
      if (normalizedMode === "signin") {
        await requestOtpSignIn({ email: email.trim() });
      } else {
        await resendSignUpOtp({ email: email.trim() });
      }
      Alert.alert("OTP sent", "Please check your email for the new code.");
    } catch (error) {
      Alert.alert("Could not resend", error instanceof Error ? error.message : "Try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        maxLength={6}
        value={code}
        onChangeText={setCode}
        placeholder="123456"
        placeholderTextColor="#94A3B8"
      />
      <TouchableOpacity style={styles.button} onPress={onVerify} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify OTP"}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onResend} disabled={resending}>
        <Text style={styles.resend}>{resending ? "Sending…" : "Resend OTP"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 20 },
  input: { width: "100%", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 12, paddingVertical: 16, paddingHorizontal: 14, fontSize: 18, textAlign: "center", letterSpacing: 6, marginBottom: 16 },
  button: { width: "100%", backgroundColor: "#2563EB", borderRadius: 12, alignItems: "center", paddingVertical: 16, marginBottom: 12 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resend: { color: "#2563EB", fontSize: 14, fontWeight: "600" },
});
