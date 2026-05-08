import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PinKeypadProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  onSubmit: (pin: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  errorMessage?: string | null;
  pinLength?: number; // default 4
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

export function PinKeypad({
  visible,
  title,
  subtitle,
  onSubmit,
  onCancel,
  loading = false,
  errorMessage,
  pinLength = 4,
}: PinKeypadProps) {
  const [digits, setDigits] = useState<string[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dotAnims = useRef(
    Array.from({ length: pinLength }, () => new Animated.Value(0))
  ).current;

  // Reset digits when modal opens
  useEffect(() => {
    if (visible) setDigits([]);
  }, [visible]);

  // Shake + vibrate on error
  useEffect(() => {
    if (errorMessage) {
      Vibration.vibrate([0, 80, 60, 80]);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
      setDigits([]);
    }
  }, [errorMessage]);

  // Dot fill animation
  const animateDot = (index: number, fill: boolean) => {
    Animated.spring(dotAnims[index], {
      toValue: fill ? 1 : 0,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleKey = (key: string) => {
    if (loading) return;

    if (key === "⌫") {
      if (digits.length > 0) {
        animateDot(digits.length - 1, false);
        setDigits((d) => d.slice(0, -1));
      }
      return;
    }

    if (key === "" || digits.length >= pinLength) return;

    const next = [...digits, key];
    animateDot(next.length - 1, true);
    setDigits(next);

    if (next.length === pinLength) {
      // Small delay so user sees last dot fill
      setTimeout(() => onSubmit(next.join("")), 150);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextBlock}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {onCancel ? (
              <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Dots */}
          <Animated.View style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}>
            {Array.from({ length: pinLength }).map((_, i) => {
              const scale = dotAnims[i].interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.25],
              });
              const filled = i < digits.length;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    filled ? styles.dotFilled : styles.dotEmpty,
                    { transform: [{ scale }] },
                  ]}
                />
              );
            })}
          </Animated.View>

          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : (
            <Text style={styles.errorPlaceholder}> </Text>
          )}

          {/* Keypad */}
          <View style={styles.keypad}>
            {KEYS.map((row, ri) => (
              <View key={ri} style={styles.keyRow}>
                {row.map((key, ki) => (
                  <TouchableOpacity
                    key={ki}
                    style={[
                      styles.key,
                      key === "" && styles.keyInvisible,
                      key === "⌫" && styles.keyBackspace,
                    ]}
                    onPress={() => handleKey(key)}
                    disabled={loading || key === ""}
                    activeOpacity={0.6}
                  >
                    {key === "⌫" ? (
                      <Ionicons name="backspace-outline" size={24} color="#CBD5E1" />
                    ) : (
                      <Text style={styles.keyText}>{key}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {loading && (
            <Text style={styles.verifying}>Verifying…</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 28,
  },
  headerTextBlock: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#F1F5F9",
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "500",
  },
  cancelBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  dots: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  dotEmpty: {
    borderWidth: 2,
    borderColor: "#334155",
    backgroundColor: "transparent",
  },
  dotFilled: {
    backgroundColor: "#EF4444",
    borderWidth: 0,
  },
  error: {
    color: "#F87171",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  errorPlaceholder: {
    fontSize: 13,
    marginBottom: 20,
  },
  keypad: {
    width: "100%",
    gap: 12,
  },
  keyRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  key: {
    width: 88,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#334155",
  },
  keyInvisible: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  keyBackspace: {
    backgroundColor: "#1E293B",
  },
  keyText: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  verifying: {
    marginTop: 16,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },
});
