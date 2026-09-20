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
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>PartnerlyPro</Text>
          <Text style={styles.heading}>Lista użytkowników</Text>
        </View>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Szukaj użytkownika…"
          placeholderTextColor="#8b93a7"
          style={styles.search}
        />
      </View>

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
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Brak wpisów</Text>
            <Text style={styles.emptyText}>Uruchom Load New i zrób scrapowanie tego kanału.</Text>
          </View>
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

                  <View style={[styles.badge, friend && styles.badgeFriend]}>
                    <Text style={styles.badgeText}>{friend ? "Friend" : "User"}</Text>
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
  root: {
    flex: 1,
    backgroundColor: "#0b1020",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  eyebrow: {
    color: "#8ea0ff",
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700",
    marginBottom: 4,
  },
  heading: {
    color: "#f4f7fb",
    fontSize: 24,
    fontWeight: "800",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#1b2331",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  closeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  toolbar: {
    marginBottom: 12,
  },
  search: {
    backgroundColor: "#131b2b",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.22)",
    fontSize: 14,
  },
  sortRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#121a2d",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
  },
  sortChipActive: {
    backgroundColor: "#5865f2",
    borderColor: "rgba(88,101,242,0.8)",
  },
  sortChipText: {
    color: "#dfe6f5",
    fontSize: 11,
    fontWeight: "700",
  },
  sortChipTextActive: {
    color: "#fff",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 18,
  },
  emptyCard: {
    backgroundColor: "#101827",
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
    alignItems: "center",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    backgroundColor: "#101827",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.14)",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "linear-gradient(135deg, #5865f2, #7c6cf6)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  avatarTag: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  avatarFallback: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    flex: 1,
  },
  displayName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
  username: {
    color: "#9aa5b5",
    fontSize: 12,
    marginTop: 2,
  },
  serverName: {
    color: "#cad2df",
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#1d2a39",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.15)",
    marginLeft: 8,
  },
  badgeFriend: {
    backgroundColor: "#143c2f",
    borderColor: "rgba(52,211,153,0.35)",
  },
  badgeText: {
    color: "#dfe8f5",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  link: {
    color: "#7f8aa1",
    fontSize: 11,
    marginTop: 12,
    paddingHorizontal: 2,
  },
  actions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#5865f2",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonFriend: {
    backgroundColor: "#2a9d6f",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: "#1b2433",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  secondaryButtonText: {
    color: "#ff9e9e",
    fontWeight: "800",
    fontSize: 13,
  },
});
