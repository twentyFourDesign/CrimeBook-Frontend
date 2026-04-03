import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Audio, ResizeMode, Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CitizenShell } from "../../../src/components/citizen/CitizenShell";
import { ScreenBackButton } from "../../../src/components/common/ScreenBackButton";
import { fetchReportDetail, fetchReportMessages, sendReportMessage } from "../../../src/auth/api";
import type {
  PoliceMediaItem,
  ReportDetailPayload,
  ReportMediaItem,
  ReportMessageItem,
} from "../../../src/auth/types";

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

function openMaps(lat: number, lng: number) {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url).catch(() => null);
}

function openUrl(url: string) {
  Linking.openURL(url).catch(() => null);
}

function isLikelyVideo(urlOrName: string) {
  return /\.(mp4|mov|webm|m4v)$/i.test(urlOrName);
}

function isLikelyImage(urlOrName: string) {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(urlOrName);
}

function isLikelyAudio(urlOrName: string) {
  return /\.(m4a|mp3|wav|aac|caf|3gp)$/i.test(urlOrName);
}

function isPoliceSenderRole(role: string) {
  return role === "POLICE_OFFICER" || role === "POLICE_COMMAND";
}

type SectionKey = "status" | "details" | "content" | "police" | "messages";

const defaultExpanded = (): Record<SectionKey, boolean> => ({
  status: false,
  details: false,
  content: false,
  police: false,
  messages: false,
});

function CollapsibleSection({
  sectionKey,
  title,
  subtitle,
  icon,
  expanded,
  onToggle,
  children,
  summary,
}: {
  sectionKey: SectionKey;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  expanded: boolean;
  onToggle: (key: SectionKey) => void;
  children: ReactNode;
  /** One line when collapsed (e.g. status text) */
  summary?: string;
}) {
  return (
    <View style={styles.accordionOuter}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={() => onToggle(sectionKey)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <View style={styles.sectionHeaderIconWrap}>
          <Ionicons name={icon} size={18} color="#1D4ED8" />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionHeaderTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionHeaderSubtitle}>{subtitle}</Text> : null}
          {!expanded && summary ? (
            <Text style={styles.accordionSummary} numberOfLines={2}>
              {summary}
            </Text>
          ) : null}
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={22} color="#64748B" />
      </TouchableOpacity>
      {expanded ? <View style={styles.accordionBody}>{children}</View> : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function Subheading({ children }: { children: string }) {
  return <Text style={styles.subheading}>{children}</Text>;
}

function CitizenMediaCard({
  m,
  playingKey,
  playKey,
  onPlayPause,
}: {
  m: ReportMediaItem;
  playingKey: string | null;
  playKey: string;
  onPlayPause: (key: string, uri: string) => void;
}) {
  const target = `${m.fileName} ${m.fileUrl}`;
  const showImage = m.mediaType === "PHOTO" || isLikelyImage(target);
  const showVideo = m.mediaType === "VIDEO" || isLikelyVideo(target);
  const showAudio = m.mediaType === "AUDIO" || m.mediaType === "STATEMENT" || isLikelyAudio(target);

  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewFileName}>{m.fileName}</Text>
      <Text style={styles.previewMeta}>{formatEnum(m.mediaType)}</Text>

      {showImage ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => openUrl(m.fileUrl)}>
          <Image source={{ uri: m.fileUrl }} style={styles.imagePreview} resizeMode="cover" />
        </TouchableOpacity>
      ) : null}

      {showVideo ? (
        <Video
          source={{ uri: m.fileUrl }}
          style={styles.videoPreview}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
        />
      ) : null}

      {showAudio ? (
        <TouchableOpacity
          style={styles.audioBtn}
          activeOpacity={0.85}
          onPress={() => onPlayPause(playKey, m.fileUrl)}
        >
          <Ionicons
            name={playingKey === playKey ? "pause-circle-outline" : "play-circle-outline"}
            size={20}
            color="#1D4ED8"
          />
          <Text style={styles.audioBtnText}>{playingKey === playKey ? "Pause" : "Play audio"}</Text>
        </TouchableOpacity>
      ) : null}

      {!showImage && !showVideo && !showAudio ? (
        <TouchableOpacity style={styles.openBtn} activeOpacity={0.85} onPress={() => openUrl(m.fileUrl)}>
          <Text style={styles.openBtnText}>Open file</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function PoliceEvidenceCard({
  item,
  playingKey,
  playKey,
  onPlayPause,
}: {
  item: PoliceMediaItem;
  playingKey: string | null;
  playKey: string;
  onPlayPause: (key: string, uri: string) => void;
}) {
  const et = item.evidenceType.toUpperCase();
  const target = `${item.fileName} ${item.fileUrl}`;
  const showImage = et === "PHOTO" || isLikelyImage(target);
  const showVideo = et === "VIDEO" || et === "BODYCAM" || isLikelyVideo(target);
  const showAudio = et === "STATEMENT" || isLikelyAudio(target);

  return (
    <View style={styles.previewCard}>
      <Text style={styles.previewFileName}>{item.fileName}</Text>
      <Text style={styles.previewMeta}>
        {formatEnum(item.evidenceType)} • {new Date(item.capturedAt).toLocaleString()}
      </Text>

      {showImage ? (
        <TouchableOpacity activeOpacity={0.9} onPress={() => openUrl(item.fileUrl)}>
          <Image source={{ uri: item.fileUrl }} style={styles.imagePreview} resizeMode="cover" />
        </TouchableOpacity>
      ) : null}

      {showVideo ? (
        <Video
          source={{ uri: item.fileUrl }}
          style={styles.videoPreview}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
        />
      ) : null}

      {showAudio ? (
        <TouchableOpacity
          style={styles.audioBtn}
          activeOpacity={0.85}
          onPress={() => onPlayPause(playKey, item.fileUrl)}
        >
          <Ionicons
            name={playingKey === playKey ? "pause-circle-outline" : "play-circle-outline"}
            size={20}
            color="#1D4ED8"
          />
          <Text style={styles.audioBtnText}>{playingKey === playKey ? "Pause" : "Play audio"}</Text>
        </TouchableOpacity>
      ) : null}

      {!showImage && !showVideo && !showAudio ? (
        <TouchableOpacity style={styles.openBtn} activeOpacity={0.85} onPress={() => openUrl(item.fileUrl)}>
          <Text style={styles.openBtnText}>Open attachment</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function ReportDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>(defaultExpanded);
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
  const audioRef = useRef<Audio.Sound | null>(null);
  const [threadMessages, setThreadMessages] = useState<ReportMessageItem[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadSending, setThreadSending] = useState(false);
  const [threadInput, setThreadInput] = useState("");
  const [threadError, setThreadError] = useState<string | null>(null);

  const load = useCallback(async (mode?: "refresh") => {
    if (!id) return;
    setError(null);
    if (mode === "refresh") setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchReportDetail(id);
      setReport(data.report);
      if (mode === "refresh") {
        try {
          const { messages } = await fetchReportMessages(id);
          setThreadMessages(messages);
          setThreadError(null);
        } catch {
          /* keep existing thread on refresh failure */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load report");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!id || !expanded.messages) return;
    let cancelled = false;
    (async () => {
      setThreadError(null);
      setThreadLoading(true);
      try {
        const { messages } = await fetchReportMessages(id);
        if (!cancelled) setThreadMessages(messages);
      } catch (e) {
        if (!cancelled) {
          setThreadError(e instanceof Error ? e.message : "Could not load messages");
          setThreadMessages([]);
        }
      } finally {
        if (!cancelled) setThreadLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, expanded.messages]);

  const sendThreadMessage = async () => {
    const text = threadInput.trim();
    if (!text || !id || threadSending) return;
    setThreadSending(true);
    setThreadError(null);
    try {
      const { message } = await sendReportMessage(id, text);
      setThreadMessages((prev) => [...prev, message]);
      setThreadInput("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not send");
    } finally {
      setThreadSending(false);
    }
  };

  useEffect(() => {
    return () => {
      const snd = audioRef.current;
      audioRef.current = null;
      if (snd) {
        snd.unloadAsync().catch(() => null);
      }
    };
  }, []);

  const playPauseAudio = async (key: string, uri: string) => {
    if (playingAudioKey === key && audioRef.current) {
      await audioRef.current.pauseAsync().catch(() => null);
      setPlayingAudioKey(null);
      return;
    }
    if (audioRef.current) {
      await audioRef.current.unloadAsync().catch(() => null);
      audioRef.current = null;
    }
    try {
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      audioRef.current = sound;
      setPlayingAudioKey(key);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || status.didJustFinish) {
          setPlayingAudioKey(null);
        }
      });
    } catch {
      setPlayingAudioKey(null);
    }
  };

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const hasPoliceInvestigation =
    !!report &&
    ((report.policeMedia?.length ?? 0) > 0 ||
      (report.suspectTags?.length ?? 0) > 0 ||
      (report.policeNotes?.length ?? 0) > 0);

  const showPoliceSection =
    !!report && (hasPoliceInvestigation || !!(report.caseId || report.caseNumber));

  const statusSummary = report
    ? `${formatEnum(report.status)}${report.caseNumber ? ` · ${report.caseNumber}` : ""}`
    : "";

  const contentSummary = report
    ? [
        `${report.description.slice(0, 52)}${report.description.length > 52 ? "…" : ""}`,
        report.media.length ? `${report.media.length} file(s)` : "No files",
        report.locationLabel || report.locationAddress || "Map & address",
      ].join(" · ")
    : "";

  const messagesSummary =
    threadMessages.length > 0
      ? `${threadMessages.length} message${threadMessages.length === 1 ? "" : "s"}`
      : report?.caseId
        ? "Chat with officers on this case"
        : "Messages — officers see this after a case is opened";

  return (
    <CitizenShell>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load("refresh")} />}
      >
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title} numberOfLines={2}>
            Report
          </Text>
        </View>

        {loading && (
          <View style={styles.centerRow}>
            <ActivityIndicator />
          </View>
        )}

        {error && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{error}</Text>
            <TouchableOpacity onPress={() => load()} style={styles.retry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace("/(citizen)/my-reports")} style={styles.retry}>
              <Text style={styles.retryText}>Back to list</Text>
            </TouchableOpacity>
          </View>
        )}

        {report && (
          <>
            <CollapsibleSection
              sectionKey="status"
              icon="pulse-outline"
              title="Incident status"
              subtitle="Current handling state and case reference"
              expanded={expanded.status}
              onToggle={toggleSection}
              summary={statusSummary}
            >
              <View style={styles.statusBadgeLarge}>
                <Text style={styles.statusBadgeLargeText}>{formatEnum(report.status)}</Text>
              </View>
              {report.caseNumber ? <Row label="Case number" value={report.caseNumber} /> : null}
              {report.caseId ? <Row label="Case ID" value={report.caseId} /> : null}
              {!report.caseNumber && !report.caseId ? (
                <Text style={styles.mutedInline}>No police case linked yet.</Text>
              ) : null}
              <View style={styles.divider} />
              <Row label="Police verified" value={report.isPoliceVerified ? "Yes" : "No"} />
              {report.assignedOfficer ? (
                <Row
                  label="Assigned officer"
                  value={`${report.assignedOfficer.name}${
                    report.assignedOfficer.badgeNumber ? ` (${report.assignedOfficer.badgeNumber})` : ""
                  }`}
                />
              ) : (
                <Row label="Assigned officer" value="—" />
              )}
              {report.statusHistory && report.statusHistory.length > 0 ? (
                <>
                  <View style={styles.divider} />
                  <Subheading>Status history</Subheading>
                  {report.statusHistory.map((h) => (
                    <View key={h.id} style={styles.historyRow}>
                      <Text style={styles.historyMeta}>
                        {new Date(h.createdAt).toLocaleString()}
                      </Text>
                      <Text style={styles.historyLine}>
                        {h.fromStatus ? `${formatEnum(h.fromStatus)} → ` : ""}
                        {formatEnum(h.toStatus)}
                      </Text>
                      {h.notes ? <Text style={styles.historyNotes}>{h.notes}</Text> : null}
                    </View>
                  ))}
                </>
              ) : null}
            </CollapsibleSection>

            <CollapsibleSection
              sectionKey="details"
              icon="document-text-outline"
              title="Report details"
              subtitle="Category, timeline, and how you submitted"
              expanded={expanded.details}
              onToggle={toggleSection}
              summary={report.title?.trim() || formatEnum(report.crimeCategory)}
            >
              <Text style={styles.reportTitle}>{report.title?.trim() || formatEnum(report.crimeCategory)}</Text>
              <Text style={styles.reportCategory}>{formatEnum(report.crimeCategory)}</Text>
              <View style={styles.divider} />
              <Subheading>Timeline</Subheading>
              <Row label="Submitted" value={new Date(report.createdAt).toLocaleString()} />
              <Row label="Last updated" value={new Date(report.updatedAt).toLocaleString()} />
              <Row label="Incident time" value={new Date(report.incidentTime).toLocaleString()} />
              <Row label="Happening now" value={report.isHappeningNow ? "Yes" : "No"} />
              <View style={styles.divider} />
              <Subheading>Submission</Subheading>
              <Row label="Visibility" value={formatEnum(report.visibility)} />
              <Row label="Anonymous submission" value={report.isAnonymous ? "Yes" : "No"} />
              <Row label="Community confirmations" value={String(report.communityConfirmCount)} />
              <Row label="Location precision" value={formatEnum(report.locationPrecision)} />
            </CollapsibleSection>

            <CollapsibleSection
              sectionKey="content"
              icon="layers-outline"
              title="Your description, files & location"
              subtitle="What you reported, evidence you attached, and where it happened"
              expanded={expanded.content}
              onToggle={toggleSection}
              summary={contentSummary}
            >
              <Subheading>Your description</Subheading>
              <Text style={styles.description}>{report.description}</Text>

              <View style={styles.mergedDivider} />
              <Subheading>Your photos & files</Subheading>
              <Text style={styles.mergedHint}>
                {report.media.length === 0 ? "No files attached." : `${report.media.length} attached`}
              </Text>
              {report.media.length === 0 ? null : (
                report.media.map((m) => (
                  <CitizenMediaCard
                    key={m.id}
                    m={m}
                    playingKey={playingAudioKey}
                    playKey={`citizen-${m.id}`}
                    onPlayPause={playPauseAudio}
                  />
                ))
              )}

              <View style={styles.mergedDivider} />
              <Subheading>Location</Subheading>
              <Text style={styles.mergedHint}>Where the incident occurred</Text>
              {report.locationLabel ? <Text style={styles.bodyText}>{report.locationLabel}</Text> : null}
              {report.locationAddress ? <Text style={styles.bodyText}>{report.locationAddress}</Text> : null}
              <Text style={styles.coords}>
                {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}
              </Text>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                  pointerEvents="none"
                  initialRegion={{
                    latitude: report.latitude,
                    longitude: report.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker coordinate={{ latitude: report.latitude, longitude: report.longitude }} />
                </MapView>
              </View>
              <TouchableOpacity style={styles.mapBtn} onPress={() => openMaps(report.latitude, report.longitude)}>
                <Ionicons name="open-outline" size={16} color="#fff" style={styles.mapBtnIcon} />
                <Text style={styles.mapBtnText}>Open in Maps</Text>
              </TouchableOpacity>
            </CollapsibleSection>

            {showPoliceSection ? (
              <CollapsibleSection
                sectionKey="police"
                icon="shield-checkmark-outline"
                title="Police investigation"
                subtitle="Updates, tags, and notes from officers"
                expanded={expanded.police}
                onToggle={toggleSection}
                summary={
                  hasPoliceInvestigation
                    ? "Media, tags, or notes from officers"
                    : "No updates shared yet"
                }
              >
                {!hasPoliceInvestigation ? (
                  <Text style={styles.muted}>
                    No shared investigation updates yet. When officers add media, tags, or notes, they will appear
                    here.
                  </Text>
                ) : (
                  <>
                    {(report.policeMedia?.length ?? 0) > 0 ? (
                      <>
                        <Text style={styles.investigationSubLabel}>Investigation media</Text>
                        <Text style={styles.investigationSubHint}>Previews of files added by officers.</Text>
                        {report.policeMedia!.map((p) => (
                          <PoliceEvidenceCard
                            key={p.id}
                            item={p}
                            playingKey={playingAudioKey}
                            playKey={`police-${p.id}`}
                            onPlayPause={playPauseAudio}
                          />
                        ))}
                      </>
                    ) : null}

                    {(report.suspectTags?.length ?? 0) > 0 ? (
                      <>
                        <Text style={[styles.investigationSubLabel, { marginTop: 8 }]}>Suspect information</Text>
                        <View style={styles.tagsWrap}>
                          {report.suspectTags!.map((tag) => (
                            <View key={tag.id} style={styles.tagChip}>
                              <Text style={styles.tagText}>{tag.alias || tag.description}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    ) : null}

                    {(report.policeNotes?.length ?? 0) > 0 ? (
                      <>
                        <Text style={[styles.investigationSubLabel, { marginTop: 12 }]}>Investigation notes</Text>
                        {report.policeNotes!.map((n) => (
                          <View key={n.id} style={styles.noteCard}>
                            <Text style={styles.noteAuthor}>{n.officerName}</Text>
                            <Text style={styles.noteContent}>{n.content}</Text>
                            <Text style={styles.noteMeta}>
                              {formatEnum(n.noteType)} • {new Date(n.createdAt).toLocaleString()}
                            </Text>
                          </View>
                        ))}
                      </>
                    ) : null}
                  </>
                )}
              </CollapsibleSection>
            ) : null}

            <CollapsibleSection
              sectionKey="messages"
              icon="chatbubbles-outline"
              title="Messages"
              subtitle="Chat with officers assigned to your case"
              expanded={expanded.messages}
              onToggle={toggleSection}
              summary={messagesSummary}
            >
              <Text style={styles.threadHint}>
                {report?.caseId
                  ? "Assigned officers can reply here. Messages are tied to this report."
                  : "You can leave messages now; assigned officers will see them once they open a case."}
              </Text>
              {threadLoading ? (
                <ActivityIndicator style={{ marginVertical: 12 }} />
              ) : null}
              {threadError ? <Text style={styles.threadError}>{threadError}</Text> : null}
              <View style={styles.threadList}>
                {threadMessages.map((m) => {
                  const fromPolice = isPoliceSenderRole(m.senderRole);
                  return (
                    <View
                      key={m.id}
                      style={[styles.msgRow, fromPolice ? styles.msgRowPolice : styles.msgRowYou]}
                    >
                      <View style={[styles.msgBubble, fromPolice ? styles.msgBubblePolice : styles.msgBubbleYou]}>
                        <Text style={styles.msgSender}>
                          {fromPolice ? m.senderName : "You"} · {formatEnum(m.senderRole)}
                        </Text>
                        <Text style={styles.msgBody}>{m.body}</Text>
                        <Text style={styles.msgTime}>{new Date(m.createdAt).toLocaleString()}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
              <View style={styles.threadComposer}>
                <TextInput
                  style={styles.threadInput}
                  placeholder="Write a message…"
                  placeholderTextColor="#9CA3AF"
                  value={threadInput}
                  onChangeText={setThreadInput}
                  multiline
                  maxLength={8000}
                  editable={!threadSending}
                />
                <TouchableOpacity
                  style={[styles.threadSendBtn, threadSending && styles.threadSendBtnDisabled]}
                  onPress={sendThreadMessage}
                  disabled={threadSending || !threadInput.trim()}
                  activeOpacity={0.85}
                >
                  {threadSending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </CollapsibleSection>
          </>
        )}
      </ScrollView>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 4 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "700", color: "#111", flex: 1 },
  centerRow: { paddingVertical: 32, alignItems: "center" },
  errBox: { marginBottom: 12 },
  errText: { color: "#B91C1C", fontSize: 14 },
  retry: { marginTop: 8, alignSelf: "flex-start" },
  retryText: { color: "#2563EB", fontWeight: "600" },
  accordionOuter: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
  },
  accordionSummary: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 6,
    lineHeight: 17,
  },
  accordionBody: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FAFBFC",
  },
  sectionHeaderIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionHeaderText: { flex: 1 },
  sectionHeaderTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: 0.2 },
  sectionHeaderSubtitle: { fontSize: 12, color: "#64748B", marginTop: 4, lineHeight: 17 },
  statusBadgeLarge: {
    alignSelf: "flex-start",
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
  },
  statusBadgeLargeText: { fontSize: 15, fontWeight: "800", color: "#1D4ED8" },
  mutedInline: { fontSize: 13, color: "#94A3B8", marginBottom: 8 },
  historyRow: { marginBottom: 12 },
  historyMeta: { fontSize: 11, color: "#94A3B8" },
  historyLine: { fontSize: 14, color: "#0F172A", fontWeight: "600", marginTop: 2 },
  historyNotes: { fontSize: 12, color: "#64748B", marginTop: 4 },
  reportTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 6 },
  reportCategory: { fontSize: 14, color: "#64748B", marginBottom: 4 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#CBD5E1",
    marginVertical: 14,
  },
  subheading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  mergedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#CBD5E1",
    marginVertical: 18,
  },
  mergedHint: { fontSize: 12, color: "#64748B", marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 },
  rowLabel: { fontSize: 13, color: "#64748B", flex: 1 },
  rowValue: { fontSize: 13, color: "#0F172A", fontWeight: "600", flex: 1, textAlign: "right" },
  bodyText: { fontSize: 14, color: "#334155", lineHeight: 22, marginBottom: 8 },
  coords: {
    fontSize: 12,
    color: "#64748B",
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    marginBottom: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  map: { flex: 1 },
  mapBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 14,
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 6,
  },
  mapBtnIcon: { marginTop: 1 },
  mapBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  description: { fontSize: 15, color: "#334155", lineHeight: 24 },
  muted: { fontSize: 14, color: "#94A3B8" },
  previewCard: {
    marginBottom: 16,
    paddingBottom: 4,
  },
  previewFileName: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  previewMeta: { fontSize: 11, color: "#64748B", marginTop: 4, marginBottom: 8 },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#E2E8F0",
  },
  videoPreview: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    backgroundColor: "#0F172A",
  },
  audioBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  audioBtnText: { color: "#1D4ED8", fontSize: 14, fontWeight: "600" },
  openBtn: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
  },
  openBtnText: { color: "#334155", fontSize: 13, fontWeight: "600" },
  investigationSubLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 6,
  },
  investigationSubHint: { fontSize: 12, color: "#64748B", marginBottom: 12 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tagChip: { backgroundColor: "#EFF6FF", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  tagText: { fontSize: 12, color: "#1E40AF", fontWeight: "600" },
  noteCard: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  noteAuthor: { fontSize: 13, fontWeight: "700", color: "#0F172A" },
  noteContent: { fontSize: 14, color: "#334155", marginTop: 8, lineHeight: 22 },
  noteMeta: { fontSize: 11, color: "#64748B", marginTop: 10 },
  threadHint: { fontSize: 12, color: "#64748B", marginBottom: 10, lineHeight: 18 },
  threadError: { fontSize: 12, color: "#B91C1C", marginBottom: 8 },
  threadList: { marginBottom: 12 },
  msgRow: { marginBottom: 8, flexDirection: "row" },
  msgRowYou: { justifyContent: "flex-end" },
  msgRowPolice: { justifyContent: "flex-start" },
  msgBubble: {
    maxWidth: "88%",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  msgBubbleYou: { backgroundColor: "#DBEAFE", borderWidth: 1, borderColor: "#BFDBFE" },
  msgBubblePolice: { backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  msgSender: { fontSize: 11, fontWeight: "700", color: "#475569", marginBottom: 4 },
  msgBody: { fontSize: 14, color: "#0F172A", lineHeight: 20 },
  msgTime: { fontSize: 10, color: "#94A3B8", marginTop: 6 },
  threadComposer: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  threadInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
  },
  threadSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  threadSendBtnDisabled: { opacity: 0.6 },
});
