import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { openDM, watchForSentMessage, getDisplayName, getAvatarUri, isFriend, fetchUserIfMissing, sendMessageToChannel } from "../utils/discord";
import { getEntries, removeEntry, getConfig } from "../utils/store";

export default function PartnerlyPanel({ onClose, onNavigateAway }: { onClose: () => void; onNavigateAway?: () => void }) {
  const [entries, setEntries] = React.useState(getEntries());
  const [query, setQuery] = React.useState("");
  const [sortMode, setSortMode] = React.useState<"newest" | "name" | "online">("newest");
  const config = getConfig();

  React.useEffect(() => {
    const i = setInterval(() => setEntries(getEntries()), 8000);
    return () => clearInterval(i);
  }, []);

  const visible = [...entries]
    .filter((entry) => {
      const haystack = `${entry.guildName} ${entry.userId} ${getDisplayName(entry.userId).displayName}`.toLowerCase();
      return !query || haystack.includes(query.toLowerCase());
    })
    .sort((a, b) => {
      if (sortMode === "name") {
        return getDisplayName(a.userId).displayName.localeCompare(getDisplayName(b.userId).displayName);
      }
      if (sortMode === "online") return 0;
      return b.foundAt - a.foundAt;
    });

  const handleSend = (entry: any) => {
    onClose();
    onNavigateAway?.();
    setTimeout(() => {
      openDM(entry.userId, (channelId) => {
        const message = config.defaultMessage;

        const sent = sendMessageToChannel(channelId, message);
        if (config.autoSend && !sent) {
          try {
            globalThis?.navigator?.clipboard?.writeText?.(message);
          } catch { }
        }

        if (config.autoOpenDM || config.autoSend || sent) {
          watchForSentMessage(channelId, () => {
            showToast("Wysłano wiadomość do użytkownika", getAssetIDByName("ic_check_24px"));
          });
        }
      });
    }, 260);
  };

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>PartnerlyPro</Text>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Szukaj po nazwie, userId..."
        placeholderTextColor="#8c93a3"
        style={styles.search}
      />

      <View style={styles.sortRow}>
        {(["newest", "name", "online"] as const).map((mode) => (
          <Pressable
            key={mode}
            onPress={() => setSortMode(mode)}
            style={[styles.sortChip, sortMode === mode && styles.sortChipActive]}
          >
            <Text style={[styles.sortChipText, sortMode === mode && styles.sortChipTextActive]}>
              {mode === "newest" ? "Najnowsze" : mode === "name" ? "Nazwa" : "Online"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>Brak wpisów. Uruchom Load New i zrób scrapowanie.</Text>
        ) : (
          visible.map((entry) => {
            const profile = getDisplayName(entry.userId);
            const avatarUri = getAvatarUri(entry.userId);
            const friend = isFriend(entry.userId);
            fetchUserIfMissing(entry.userId);

            return (
              <View key={entry.userId} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatarWrap}>
                    {avatarUri ? (
                      <Text style={styles.avatarTag}>IMG</Text>
                    ) : (
                      <Text style={styles.avatarFallback}>{profile.displayName.slice(0, 1).toUpperCase()}</Text>
                    )}
                  </View>

                  <View style={styles.meta}>
                    <Text style={styles.displayName} numberOfLines={1}>{profile.displayName}</Text>
                    <Text style={styles.username}>@{profile.username}</Text>
                    <Text style={styles.serverName} numberOfLines={1}>{entry.guildName}</Text>
                  </View>
                </View>

                <Text style={styles.link} numberOfLines={1}>{entry.serverLink}</Text>

                <View style={styles.actions}>
                  <Pressable style={[styles.primaryButton, friend && styles.primaryButtonFriend]} onPress={() => handleSend(entry)}>
                    <Text style={styles.primaryButtonText}>Wykonaj</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => {
                      removeEntry(entry.userId);
                      setEntries(getEntries());
                    }}
                  >
                    <Text style={styles.secondaryButtonText}>Usuń</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 12, paddingTop: 6 },
  heading: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 10 },
  search: {
    backgroundColor: "#1b1f25",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#2c3139",
    marginBottom: 10,
  },
  sortRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  sortChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, backgroundColor: "#1d2228" },
  sortChipActive: { backgroundColor: "#5865f2" },
  sortChipText: { color: "#dfe5f2", fontSize: 11, fontWeight: "700" },
  sortChipTextActive: { color: "#fff" },
  list: { flex: 1 },
  listContent: { paddingBottom: 20 },
  empty: { color: "#9aa4b2", textAlign: "center", paddingTop: 20 },
  card: {
    backgroundColor: "#181b20",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2f36",
  },
  cardTop: { flexDirection: "row", alignItems: "center" },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#2a3038",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarTag: { color: "#fff", fontSize: 10, fontWeight: "700" },
  avatarFallback: { color: "#fff", fontSize: 18, fontWeight: "800" },
  meta: { flex: 1 },
  displayName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  username: { color: "#8e97a5", fontSize: 12 },
  serverName: { color: "#b8beca", fontSize: 12, marginTop: 2 },
  link: { color: "#7d8798", fontSize: 11, marginTop: 10 },
  actions: { flexDirection: "row", marginTop: 12, gap: 8 },
  primaryButton: {
    flex: 1,
    backgroundColor: "#5865f2",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  primaryButtonFriend: { backgroundColor: "#2d9d54" },
  primaryButtonText: { color: "#fff", fontWeight: "700" },
  secondaryButton: {
    backgroundColor: "#2b3037",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#ff9a9a", fontWeight: "700" },
});
