import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface ForensicSignal {
  label: string;
  score: number;
  detail: string;
}

export interface ForensicAnalysis {
  finalScore: number;
  grade: string;
  gradeColor: string;
  signals: Record<string, ForensicSignal>;
  allFlags: string[];
  reportHash: string;
}

export function ForensicBreakdown({ analysis }: { analysis: ForensicAnalysis }) {
  return (
    <View style={styles.container}>
      {/* Score Ring */}
      <View style={[styles.scoreRing, { borderColor: analysis.gradeColor }]}>
        <View style={styles.scoreTextContainer}>
          <Text style={[styles.scoreValue, { color: analysis.gradeColor }]}>
            {analysis.finalScore}
          </Text>
          <Text style={styles.scoreSlash}>/</Text>
          <Text style={styles.scoreTotal}>100</Text>
        </View>
        <Text style={[styles.gradeLabel, { color: analysis.gradeColor }]}>
          {analysis.grade}
        </Text>
      </View>

      {/* Signals */}
      <Text style={styles.sectionTitle}>SIGNAL ANALYSIS</Text>
      {Object.values(analysis.signals).map((sig) => (
        <SignalBar key={sig.label} signal={sig} />
      ))}

      {/* Flags */}
      <Text style={styles.sectionTitle}>FORENSIC FLAGS</Text>
      <View style={styles.flagsContainer}>
        {analysis.allFlags.map((flag, idx) => (
          <View key={idx} style={styles.flagPill}>
            <Text style={styles.flagText}>{flag}</Text>
          </View>
        ))}
      </View>

      {/* Trace */}
      <Text style={styles.mlNote}>
        REPORT_HASH: {analysis.reportHash}
        {"\n"}ENGINE: crimebook-neural v4.2
      </Text>
    </View>
  );
}

function SignalBar({ signal }: { signal: ForensicSignal }) {
  const color =
    signal.score >= 70 ? "#059669" : signal.score >= 40 ? "#D97706" : "#DC2626";
  return (
    <View style={styles.signalRow}>
      <View style={styles.signalMeta}>
        <Text style={styles.signalLabel}>{signal.label}</Text>
        <Text style={styles.signalDetail}>{signal.detail}</Text>
      </View>
      <View style={styles.signalBarContainer}>
        <View style={[styles.signalBarFill, { width: `${signal.score}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.signalScore, { color }]}>{signal.score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", paddingVertical: 8 },
  scoreRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  scoreTextContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
  },
  scoreValue: { fontSize: 36, fontWeight: "900", includeFontPadding: false },
  scoreSlash: { fontSize: 16, color: "#CBD5E1", marginHorizontal: 2, fontWeight: "600" },
  scoreTotal: { fontSize: 16, color: "#94A3B8", fontWeight: "600" },
  gradeLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, marginTop: -2 },

  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginTop: 8,
  },

  signalRow: { width: "100%", marginBottom: 12 },
  signalMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  signalLabel: { fontSize: 11, fontWeight: "700", color: "#334155" },
  signalDetail: {
    fontSize: 9,
    color: "#94A3B8",
    flex: 1,
    textAlign: "right",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
  },
  signalBarContainer: {
    height: 5,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    overflow: "hidden",
  },
  signalBarFill: { height: "100%", borderRadius: 3 },
  signalScore: { fontSize: 10, fontWeight: "700", alignSelf: "flex-end", marginTop: 2 },

  flagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  flagPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  flagText: { fontSize: 9, fontWeight: "700", color: "#475569" },

  mlNote: {
    fontSize: 8,
    color: "#CBD5E1",
    textAlign: "center",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    marginTop: 8,
    lineHeight: 12,
  },
});
