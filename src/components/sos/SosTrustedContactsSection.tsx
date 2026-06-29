"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View } from "react-native";
import { CrimeBookLoader } from "../../../src/components/common/CrimeBookLoader";
import { LoadingState } from "../../../src/components/common/LoadingState";
import { Ionicons } from "@expo/vector-icons";
import {
  addSosTrustedContact,
  fetchSosTrustedContacts,
  removeSosTrustedContact,
  type SosTrustedContactItem } from "../../auth/api";

export function SosTrustedContactsSection() {
  const [contacts, setContacts] = useState<SosTrustedContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetchSosTrustedContacts();
      setContacts(res.contacts);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleAdd = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert("Email required", "Enter an email for a family member or friend.");
      return;
    }

    setAdding(true);
    try {
      const res = await addSosTrustedContact(trimmedEmail, name.trim() || undefined);
      setContacts((prev) => {
        const without = prev.filter((c) => c.email.toLowerCase() !== trimmedEmail);
        return [...without, res.contact];
      });
      setEmail("");
      setName("");
    } catch (e) {
      Alert.alert("Could not add contact", e instanceof Error ? e.message : "Try again");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = (contact: SosTrustedContactItem) => {
    Alert.alert(
      "Remove contact",
      `Stop alerting ${contact.name} (${contact.email}) on SOS?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setRemovingId(contact.id);
            try {
              await removeSosTrustedContact(contact.id);
              setContacts((prev) => prev.filter((c) => c.id !== contact.id));
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Could not remove contact");
            } finally {
              setRemovingId(null);
            }
          } },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="people-outline" size={20} color="#2563EB" />
        <Text style={styles.title}>Family & Friends Alerts</Text>
      </View>
      <Text style={styles.body}>
        Add family or friends by email. They do not need a CrimeBook account — they will receive an email with SOS
        details, a live location track link, and how to download the app. Contacts on CrimeBook also get a push
        notification.
      </Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Name (optional)"
        placeholderTextColor="#94A3B8"
        autoCapitalize="words"
        editable={!adding}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={[styles.input, styles.inputFlex]}
          value={email}
          onChangeText={setEmail}
          placeholder="friend@email.com"
          placeholderTextColor="#94A3B8"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          editable={!adding}
        />
        <TouchableOpacity
          style={[styles.addBtn, adding && styles.addBtnDisabled]}
          onPress={handleAdd}
          disabled={adding}
        >
          {adding ? (
            <CrimeBookLoader size="small" barColor="#fff" ballColor="#93C5FD" />
          ) : (
            <Text style={styles.addBtnText}>Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoadingState size="small" message="Loading contacts…" />
      ) : contacts.length === 0 ? (
        <Text style={styles.empty}>No emergency contacts added yet.</Text>
      ) : (
        <View style={styles.list}>
          {contacts.map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{contact.name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <View style={styles.contactInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  {contact.onApp ? (
                    <View style={styles.appBadge}>
                      <Text style={styles.appBadgeText}>On app</Text>
                    </View>
                  ) : (
                    <View style={styles.emailBadge}>
                      <Text style={styles.emailBadgeText}>Email alert</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.contactEmail}>{contact.email}</Text>
              </View>
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemove(contact)}
                disabled={removingId === contact.id}
              >
                {removingId === contact.id ? (
                  <CrimeBookLoader size="small" ballColor="#B91C1C" />
                ) : (
                  <Ionicons name="trash-outline" size={18} color="#B91C1C" />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
    marginTop: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
  body: { fontSize: 13, color: "#64748B", lineHeight: 20 },
  inputRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F172A" },
  inputFlex: { flex: 1 },
  addBtn: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 64 },
  addBtnDisabled: { opacity: 0.7 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty: { fontSize: 13, color: "#94A3B8", fontStyle: "italic", marginTop: 4 },
  list: { gap: 10, marginTop: 4 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center" },
  avatarText: { color: "#1D4ED8", fontWeight: "800", fontSize: 14 },
  contactInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  contactName: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  contactEmail: { fontSize: 12, color: "#64748B", marginTop: 2 },
  appBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6 },
  appBadgeText: { fontSize: 10, fontWeight: "700", color: "#15803D" },
  emailBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6 },
  emailBadgeText: { fontSize: 10, fontWeight: "700", color: "#1D4ED8" },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center" } });
