import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Audio, ResizeMode, Video } from "expo-av";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { CitizenShell } from "../../../src/components/citizen/CitizenShell";
import { Skeleton } from "../../../src/components/common/Skeleton";
import {
  createGroupPost,
  fetchGroupDetail,
  fetchGroupPosts,
  joinCommunityGroup,
  leaveCommunityGroup,
  inviteToGroup,
  uploadCrimeMediaFile,
  fetchGroupMessages,
  sendGroupMessage,
} from "../../../src/auth/api";
import type { CommunityGroup, GroupPost, GroupMessage } from "../../../src/auth/types";

function PostMediaGallery({
  media,
  activeMediaId,
  onPlayAudio
}: {
  media: any[],
  activeMediaId: string | null,
  onPlayAudio: (id: string, uri: string) => void
}) {
  const photos = media.filter(m => m.mediaType === "PHOTO");
  const videos = media.filter(m => m.mediaType === "VIDEO");
  const audios = media.filter(m => m.mediaType === "AUDIO");
  const docs = media.filter(m => m.mediaType === "DOCUMENT" || (!photos.includes(m) && !videos.includes(m) && !audios.includes(m)));

  return (
    <View style={styles.postMediaGallery}>
      {photos.length > 0 && <PostImageGrid images={photos} />}

      {videos.map(v => (
        <PostVideoPlayer key={v.id} video={v} />
      ))}

      {audios.map(a => (
        <PostAudioCard
          key={a.id}
          audio={a}
          isPlaying={activeMediaId === a.id}
          onToggle={() => onPlayAudio(a.id, a.fileUrl)}
        />
      ))}

      {docs.map(d => (
        <TouchableOpacity key={d.id} style={styles.mediaAttachmentItem} onPress={() => Alert.alert("Download", `Opening ${d.fileName}...`)}>
          <Ionicons name="document-text" size={20} color="#2563EB" />
          <Text style={styles.mediaAttachmentName} numberOfLines={1}>{d.fileName}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function PostImageGrid({ images }: { images: any[] }) {
  const count = images.length;
  if (count === 1) {
    return (
      <View style={styles.imageGrid1}>
        <Image source={{ uri: images[0].fileUrl }} style={styles.gridImageFull} resizeMode="cover" />
      </View>
    );
  }
  if (count === 2) {
    return (
      <View style={styles.imageGrid2}>
        <Image source={{ uri: images[0].fileUrl }} style={styles.gridImageHalf} />
        <Image source={{ uri: images[1].fileUrl }} style={styles.gridImageHalf} />
      </View>
    );
  }
  return (
    <View style={styles.imageGrid3}>
      <Image source={{ uri: images[0].fileUrl }} style={styles.gridImageMain} />
      <View style={styles.gridImageSideCol}>
        <Image source={{ uri: images[1].fileUrl }} style={styles.gridImageSide} />
        <View style={styles.gridImageMoreContainer}>
          <Image source={{ uri: images[2].fileUrl }} style={styles.gridImageSide} />
          {count > 3 && (
            <View style={styles.gridMoreOverlay}>
              <Text style={styles.gridMoreText}>+{count - 3}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function PostVideoPlayer({ video }: { video: any }) {
  return (
    <View style={styles.videoPlayerContainer}>
      <Video
        source={{ uri: video.fileUrl }}
        style={styles.videoPlayer}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        isLooping={false}
      />
    </View>
  );
}

function PostAudioCard({ audio, isPlaying, onToggle }: { audio: any, isPlaying: boolean, onToggle: () => void }) {
  return (
    <TouchableOpacity style={styles.audioCard} onPress={onToggle} activeOpacity={0.8}>
      <View style={styles.audioIconContainer}>
        <Ionicons name={isPlaying ? "pause" : "play"} size={22} color="#fff" />
      </View>
      <View style={styles.audioInfo}>
        <Text style={styles.audioName} numberOfLines={1}>{audio.fileName}</Text>
        <Text style={styles.audioSubtext}>{isPlaying ? "Playing..." : "Tap to listen"}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{
    uri: string;
    name: string;
    mimeType: string;
    type: "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT";
  }[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [mediaMenuVisible, setMediaMenuVisible] = useState(false);

  // UX Overhaul State
  const [activeTab, setActiveTab] = useState<"feed" | "chat" | "info">("feed");
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Media Playback
  const [activeMediaId, setActiveMediaId] = useState<string | null>(null);
  const audioSound = useRef<Audio.Sound | null>(null);

  // Audio Cleanup
  useEffect(() => {
    return () => {
      const sound = audioSound.current;
      if (sound) {
        sound.unloadAsync().catch(() => null);
      }
    };
  }, []);

  const handlePlayAudio = async (id: string, uri: string) => {
    try {
      if (activeMediaId === id) {
        await audioSound.current?.pauseAsync();
        setActiveMediaId(null);
        return;
      }

      const snd = audioSound.current;
      if (snd) {
        await snd.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );
      audioSound.current = sound;
      setActiveMediaId(id);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setActiveMediaId(null);
        }
      });
    } catch (err) {
      console.warn("Error playing audio", err);
    }
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [groupRes, postsRes] = await Promise.all([
        fetchGroupDetail(id),
        fetchGroupPosts(id).catch(() => ({ posts: [] })),
      ]);
      setGroup(groupRes.group);
      setPosts(postsRes.posts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load group details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const loadMessages = useCallback(async () => {
    if (!id || activeTab !== "chat") return;
    try {
      const res = await fetchGroupMessages(id);
      setMessages(res.messages);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  }, [id, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "chat") {
      setIsLoadingMessages(true);
      loadMessages().finally(() => setIsLoadingMessages(false));

      const interval = setInterval(loadMessages, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [activeTab, loadMessages]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleJoinLeave = async () => {
    if (!group) return;
    setJoinLoading(true);
    try {
      if (group.isMember) {
        await leaveCommunityGroup(group.id);
        Alert.alert("Left neighborhood", `You are no longer a member of ${group.name}.`);
      } else {
        await joinCommunityGroup(group.id);
        Alert.alert("Success!", `You have joined ${group.name} neighborhood.`);
      }
      // Reload group data to update membership status and count
      const res = await fetchGroupDetail(group.id);
      setGroup(res.group);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    } finally {
      setJoinLoading(false);
    }
  };

  const handlePost = async () => {
    if (!id || !newPostContent.trim()) return;
    setIsPosting(true);
    try {
      const uploadedMedia = [];
      if (selectedMedia.length > 0) {
        setIsUploadingMedia(true);
        for (const item of selectedMedia) {
          const res = await uploadCrimeMediaFile({
            uri: item.uri,
            name: item.name,
            mimeType: item.mimeType,
            folder: "community",
          });
          uploadedMedia.push({
            mediaType: item.type,
            fileUrl: res.url,
            fileName: item.name,
            fileSizeBytes: res.fileSizeBytes,
            mimeType: item.mimeType,
          });
        }
        setIsUploadingMedia(false);
      }

      await createGroupPost(id, {
        content: newPostContent.trim(),
        media: uploadedMedia,
      });

      setNewPostContent("");
      setSelectedMedia([]);
      // Reload posts
      const res = await fetchGroupPosts(id);
      setPosts(res.posts);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not create post");
    } finally {
      setIsPosting(false);
      setIsUploadingMedia(false);
    }
  };

  const handleInvite = async () => {
    if (!id || !inviteEmail.trim()) return;
    setIsInviting(true);
    try {
      await inviteToGroup(id, inviteEmail.trim());
      Alert.alert("Success", "Invitation sent successfully!");
      setInviteModalVisible(false);
      setInviteEmail("");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not send invitation");
    } finally {
      setIsInviting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!id || !newMessage.trim()) return;
    setIsSending(true);
    try {
      await sendGroupMessage(id, newMessage.trim());
      setNewMessage("");
      loadMessages();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.uri.split("/").pop() || "image.jpg",
          mimeType: asset.type === "image" ? "image/jpeg" : "application/octet-stream",
          type: "PHOTO",
        },
      ]);
      setMediaMenuVisible(false);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.uri.split("/").pop() || "video.mp4",
          mimeType: "video/mp4",
          type: "VIDEO",
        },
      ]);
      setMediaMenuVisible(false);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || "application/octet-stream",
          type: "DOCUMENT",
        },
      ]);
      setMediaMenuVisible(false);
    }
  };

  const pickAudio = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia((prev) => [
        ...prev,
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType || "audio/mpeg",
          type: "AUDIO",
        },
      ]);
      setMediaMenuVisible(false);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <CitizenShell>
        <View style={styles.header}>
          <Skeleton width={36} height={36} circle style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width="60%" height={20} style={{ marginBottom: 4 }} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
        <View style={styles.segmentContainer}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.segmentBtn}>
              <Skeleton width={40} height={16} />
            </View>
          ))}
        </View>
        <ScrollView contentContainerStyle={styles.listContainer}>
          <View style={styles.descriptionCard}>
            <Skeleton width="30%" height={12} style={{ marginBottom: 12 }} />
            <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="90%" height={14} />
          </View>
          {[1, 2].map((i) => (
            <View key={i} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Skeleton width={36} height={36} circle style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width="40%" height={14} style={{ marginBottom: 4 }} />
                  <Skeleton width="30%" height={10} />
                </View>
              </View>
              <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="100%" height={14} style={{ marginBottom: 8 }} />
              <Skeleton width="60%" height={14} />
            </View>
          ))}
        </ScrollView>
      </CitizenShell>
    );
  }

  if (error || !group) {
    return (
      <CitizenShell>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error || "Group not found"}</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </CitizenShell>
    );
  }

  return (
    <CitizenShell>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupSubMeta}>
            {group.memberCount} members · {group.isMember ? "Active Member" : "Neighborhood"}
          </Text>
        </View>
        {group.isMember && (
          <TouchableOpacity onPress={() => setActiveTab("info")}>
            <Ionicons name="information-circle-outline" size={26} color="#475569" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "feed" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("feed")}
        >
          <Text style={[styles.segmentText, activeTab === "feed" && styles.segmentTextActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "chat" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("chat")}
          disabled={!group.isMember}
        >
          <Text style={[styles.segmentText, activeTab === "chat" && styles.segmentTextActive]}>Chat</Text>
          {!group.isMember && <Ionicons name="lock-closed" size={12} color="#94A3B8" style={{ marginLeft: 4 }} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === "info" && styles.segmentBtnActive]}
          onPress={() => setActiveTab("info")}
        >
          <Text style={[styles.segmentText, activeTab === "info" && styles.segmentTextActive]}>About</Text>
        </TouchableOpacity>
      </View>

      {activeTab === "feed" && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={
            <>
              {group.isMember ? (
                <View style={styles.postInputCard}>
                  <TextInput
                    style={styles.input}
                    placeholder="Share something with the neighborhood..."
                    multiline
                    value={newPostContent}
                    onChangeText={setNewPostContent}
                  />

                  {selectedMedia.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviewList}>
                      {selectedMedia.map((item, index) => (
                        <View key={index} style={styles.mediaPreviewItem}>
                          {item.type === "PHOTO" ? (
                            <Image source={{ uri: item.uri }} style={styles.mediaPreviewThumb} />
                          ) : (
                            <View style={[styles.mediaPreviewThumb, styles.mediaPreviewIcon]}>
                              <Ionicons
                                name={item.type === "VIDEO" ? "videocam" : item.type === "AUDIO" ? "mic" : "document"}
                                size={24}
                                color="#64748B"
                              />
                            </View>
                          )}
                          <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(index)}>
                            <Ionicons name="close-circle" size={20} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  <View style={styles.postInputActions}>
                    <TouchableOpacity style={styles.addMediaBtn} onPress={() => setMediaMenuVisible(true)}>
                      <Ionicons name="add-circle-outline" size={28} color="#2563EB" />
                      <Text style={styles.addMediaBtnText}>Add Media</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.postBtn, (!newPostContent.trim() && selectedMedia.length === 0) && styles.postBtnDisabled]}
                      onPress={handlePost}
                      disabled={isPosting || isUploadingMedia || (!newPostContent.trim() && selectedMedia.length === 0)}
                    >
                      {isPosting || isUploadingMedia ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.postBtnText}>Post</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.lockedCard}>
                  <View style={styles.lockedIconCircle}>
                    <Ionicons name="lock-closed" size={32} color="#64748B" />
                  </View>
                  <Text style={styles.lockedTitle}>Private Neighborhood</Text>
                  <Text style={styles.lockedText}>Join this group to view posts and participate in the community chat.</Text>
                  <TouchableOpacity style={styles.joinSmallBtn} onPress={handleJoinLeave}>
                    <Text style={styles.joinSmallBtnText}>Join Community</Text>
                  </TouchableOpacity>
                </View>
              )}
              {posts.length > 0 && <Text style={styles.sectionTitle}>Neighborhood Feed</Text>}
            </>
          }
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{item.author.displayName[0]}</Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{item.author.displayName}</Text>
                  <Text style={styles.postTime}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                {item.isPinned && (
                  <View style={styles.pinnedBadge}>
                    <Text style={styles.pinnedText}>Pinned</Text>
                  </View>
                )}
              </View>
              <Text style={styles.postContent}>{item.content}</Text>

              {item.media && item.media.length > 0 && (
                <PostMediaGallery
                  media={item.media}
                  activeMediaId={activeMediaId}
                  onPlayAudio={handlePlayAudio}
                />
              )}
            </View>
          )}
          ListEmptyComponent={
            group.isMember ? (
              <View style={styles.emptyFeed}>
                <View style={styles.emptyFeedIcon}>
                  <Ionicons name="chatbubbles-outline" size={40} color="#94A3B8" />
                </View>
                <Text style={styles.emptyText}>No posts yet. Be the first to share something with your neighbors!</Text>
              </View>
            ) : null
          }
        />
      )}

      {activeTab === "chat" && (
        <View style={styles.chatContainer}>
          {isLoadingMessages ? (
            <View style={styles.chatListContent}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={styles.messageRow}>
                  <Skeleton width={32} height={32} circle style={{ marginRight: 8 }} />
                  <View style={[styles.msgBubble, { width: "70%" }]}>
                    <Skeleton width="40%" height={12} style={{ marginBottom: 8 }} />
                    <Skeleton width="100%" height={14} style={{ marginBottom: 6 }} />
                    <Skeleton width="80%" height={14} />
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chatListContent}
              renderItem={({ item }) => (
                <View style={styles.messageRow}>
                  <View style={styles.msgAvatar}>
                    <Text style={styles.msgAvatarText}>{item.sender.name[0]}</Text>
                  </View>
                  <View style={styles.msgBubble}>
                    <Text style={styles.msgSenderName}>{item.sender.name}</Text>
                    <Text style={styles.msgText}>{item.content}</Text>
                    <Text style={styles.msgTime}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
              )}
              inverted={false}
              ListEmptyComponent={
                <View style={styles.chatEmpty}>
                  <Text style={styles.chatEmptyText}>No messages yet. Start a conversation!</Text>
                </View>
              }
            />
          )}
          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
              onPress={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === "info" && (
        <ScrollView contentContainerStyle={styles.infoContainer}>
          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>Description</Text>
            <View style={styles.infoCard}>
              <Text style={styles.descriptionText}>
                {group.description || "No description provided for this neighborhood group."}
              </Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>Group Details</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoGridItem}>
                <Ionicons name="people" size={20} color="#2563EB" />
                <Text style={styles.infoGridValue}>{group.memberCount}</Text>
                <Text style={styles.infoGridLabel}>Members</Text>
              </View>
              <View style={styles.infoGridItem}>
                <Ionicons name="location" size={20} color="#2563EB" />
                <Text style={styles.infoGridValue}>{group.radiusKm} km</Text>
                <Text style={styles.infoGridLabel}>Radius</Text>
              </View>
              <View style={styles.infoGridItem}>
                <Ionicons name="calendar" size={20} color="#2563EB" />
                <Text style={styles.infoGridValue}>{new Date(group.createdAt).getFullYear()}</Text>
                <Text style={styles.infoGridLabel}>Created</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.infoSectionTitle}>Group Actions</Text>
            <View style={styles.actionList}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setInviteModalVisible(true)}>
                <Ionicons name="person-add" size={20} color="#2563EB" />
                <Text style={styles.actionBtnText}>Invite Neighbors</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, group.isMember ? styles.actionBtnDanger : styles.actionBtnSuccess]}
                onPress={handleJoinLeave}
                disabled={joinLoading}
              >
                {joinLoading ? (
                  <ActivityIndicator size="small" color={group.isMember ? "#EF4444" : "#16A34A"} />
                ) : (
                  <>
                    <Ionicons
                      name={group.isMember ? "log-out" : "enter"}
                      size={20}
                      color={group.isMember ? "#EF4444" : "#16A34A"}
                    />
                    <Text style={[styles.actionBtnText, { color: group.isMember ? "#EF4444" : "#16A34A" }]}>
                      {group.isMember ? "Leave Neighborhood" : "Join Neighborhood"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {group.isMember && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setSettingsModalVisible(true)}>
                  <Ionicons name="settings" size={20} color="#64748B" />
                  <Text style={styles.actionBtnText}>Additional Settings</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      )}

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={settingsModalVisible}
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Group Settings</Text>
              <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingsList}>
              <TouchableOpacity
                style={[styles.settingsItem, styles.leaveSettingItem]}
                onPress={() => {
                  setSettingsModalVisible(false);
                  handleJoinLeave();
                }}
              >
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
                <Text style={styles.leaveSettingText}>Leave Neighborhood</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Media Pick Menu */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={mediaMenuVisible}
        onRequestClose={() => setMediaMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMediaMenuVisible(false)}
        >
          <View style={styles.mediaMenuContent}>
            <Text style={styles.mediaMenuTitle}>Attach Media</Text>
            <View style={styles.mediaOptionsGrid}>
              <TouchableOpacity style={styles.mediaOption} onPress={pickImage}>
                <View style={[styles.mediaOptionIcon, { backgroundColor: "#DBEAFE" }]}>
                  <Ionicons name="image" size={24} color="#2563EB" />
                </View>
                <Text style={styles.mediaOptionLabel}>Image</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mediaOption} onPress={pickVideo}>
                <View style={[styles.mediaOptionIcon, { backgroundColor: "#FEE2E2" }]}>
                  <Ionicons name="videocam" size={24} color="#EF4444" />
                </View>
                <Text style={styles.mediaOptionLabel}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mediaOption} onPress={pickAudio}>
                <View style={[styles.mediaOptionIcon, { backgroundColor: "#DCFCE7" }]}>
                  <Ionicons name="mic" size={24} color="#16A34A" />
                </View>
                <Text style={styles.mediaOptionLabel}>Audio</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mediaOption} onPress={pickDocument}>
                <View style={[styles.mediaOptionIcon, { backgroundColor: "#FEF3C7" }]}>
                  <Ionicons name="document" size={24} color="#D97706" />
                </View>
                <Text style={styles.mediaOptionLabel}>Docs</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={inviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Neighbors</Text>
            <Text style={styles.modalSubtitle}>Enter an email to invite someone to {group.name}.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="neighbor@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setInviteModalVisible(false);
                  setInviteEmail("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalInviteBtn, !inviteEmail.trim() && styles.modalInviteBtnDisabled]}
                onPress={handleInvite}
                disabled={isInviting || !inviteEmail.trim()}
              >
                {isInviting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalInviteText}>Send Invite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </CitizenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  backIcon: { fontSize: 20, color: "#475569" },
  headerInfo: { flex: 1 },
  groupName: { fontSize: 18, fontWeight: "700", color: "#1E293B" },
  groupSubMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  segmentBtn: {
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
  },
  segmentBtnActive: {
    borderBottomColor: "#2563EB",
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  segmentTextActive: {
    color: "#2563EB",
  },
  listContainer: { padding: 20, paddingBottom: 40 },
  descriptionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  descriptionLabel: { fontSize: 12, fontWeight: "700", color: "#2563EB", marginBottom: 8, textTransform: "uppercase" },
  descriptionText: { fontSize: 14, color: "#475569", lineHeight: 20 },
  postInputCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: {
    fontSize: 14,
    color: "#1E293B",
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  postBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  postBtnDisabled: { backgroundColor: "#94A3B8" },
  postBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  lockedCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  lockedIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8FAFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  lockedText: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  joinSmallBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinSmallBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1E293B", marginBottom: 16 },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  postHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarInitial: { color: "#2563EB", fontWeight: "700", fontSize: 14 },
  authorName: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
  postTime: { fontSize: 11, color: "#94A3B8", marginTop: 1 },
  pinnedBadge: {
    marginLeft: "auto",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pinnedText: { fontSize: 10, color: "#D97706", fontWeight: "700" },
  postContent: { fontSize: 15, color: "#334155", lineHeight: 24, marginTop: 4 },
  emptyFeed: { alignItems: "center", paddingVertical: 80 },
  emptyFeedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F8FAFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: { fontSize: 14, color: "#94A3B8", textAlign: "center", maxWidth: "80%", lineHeight: 22 },

  // Chat Styles
  chatContainer: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  chatCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  chatListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "85%",
  },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 4,
  },
  msgAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  msgBubble: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  msgSenderName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 4,
  },
  msgText: {
    fontSize: 14,
    color: "#1E293B",
    lineHeight: 20,
  },
  msgTime: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "right",
    marginTop: 4,
  },
  chatEmpty: {
    paddingVertical: 80,
    alignItems: "center",
  },
  chatEmptyText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  chatInputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    alignItems: "flex-end",
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 8,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#CBD5E1",
  },

  // Info Styles
  infoContainer: {
    padding: 20,
    gap: 24,
  },
  infoSection: {
    gap: 12,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  infoGridItem: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    gap: 8,
  },
  infoGridValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  infoGridLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  actionList: {
    gap: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  actionBtnDanger: {
    borderColor: "#FECDD3",
    backgroundColor: "#FFF1F2",
  },
  actionBtnSuccess: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
  },

  errorText: { color: "#EF4444", fontSize: 14, marginBottom: 20 },
  backBtn: { backgroundColor: "#F1F5F9", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: "#475569", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1E293B", marginBottom: 8 },
  modalSubtitle: { fontSize: 14, color: "#64748B", marginBottom: 20, lineHeight: 20 },
  modalInput: {
    backgroundColor: "#F8FAFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1E293B",
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", gap: 12 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  modalCancelText: { color: "#475569", fontWeight: "600" },
  modalInviteBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#2563EB",
  },
  modalInviteBtnDisabled: { backgroundColor: "#94A3B8" },
  modalInviteText: { color: "#fff", fontWeight: "700" },

  // Multimedia & Settings Styles
  postInputActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addMediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addMediaBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563EB",
  },
  mediaPreviewList: {
    marginBottom: 12,
  },
  mediaPreviewItem: {
    marginRight: 10,
    position: "relative",
  },
  mediaPreviewThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  mediaPreviewIcon: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  removeMediaBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  // Enhanced Media Gallery Styles
  postMediaGallery: {
    marginTop: 12,
    gap: 12,
  },
  imageGrid1: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  gridImageFull: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  imageGrid2: {
    flexDirection: "row",
    gap: 4,
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  gridImageHalf: {
    flex: 1,
    height: "100%",
  },
  imageGrid3: {
    flexDirection: "row",
    gap: 4,
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
  },
  gridImageMain: {
    flex: 2,
    height: "100%",
  },
  gridImageSideCol: {
    flex: 1,
    gap: 4,
  },
  gridImageSide: {
    flex: 1,
    width: "100%",
  },
  gridImageMoreContainer: {
    flex: 1,
    position: "relative",
  },
  gridMoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  gridMoreText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  videoPlayerContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
    aspectRatio: 16 / 9,
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  audioCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F7FF",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    gap: 12,
  },
  audioIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  audioInfo: {
    flex: 1,
  },
  audioName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  audioSubtext: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  postMediaContainer: {
    marginTop: 12,
    gap: 8,
  },
  mediaAttachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFF",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DBEAFE",
    gap: 10,
  },
  mediaAttachmentName: {
    fontSize: 13,
    color: "#1E293B",
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  settingsList: {
    gap: 12,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    gap: 12,
  },
  leaveSettingItem: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECDD3",
  },
  leaveSettingText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
  mediaMenuContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
  },
  mediaMenuTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 20,
    textAlign: "center",
  },
  mediaOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  mediaOption: {
    width: "45%",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  mediaOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaOptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
});
