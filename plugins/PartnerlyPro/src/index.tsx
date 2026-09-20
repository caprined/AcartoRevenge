import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { findByProps } from "@vendetta/metro";
import { openDM, watchForSentMessage, getDisplayName, getAvatarUri, isFriend, addFriend, fetchUserIfMissing } from "./utils/discord";
import { addEntry, getEntries, getConfig, removeEntry, setConfig, PartnerlyEntry } from "./utils/store";
import { log, warn } from "./utils/logger";
import { startRecording, stopRecording, isRecording, getSessionAddedCount } from "./utils/recorder";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow ?? { Icon: (props: any) => null };

const patchedInstances = new Set<any>();

function buildServerLinkFromMessage(target: any) {
  if (!target) return "https://discord.com/channels/@me";
  return `https://discord.com/channels/${target.guildId ?? "@me"}/${target.channelId ?? "@me"}`;
}

function PanelScreen({ onClose }: { onClose: () => void }) {
  const [entries, setEntries] = React.useState<PartnerlyEntry[]>(getEntries());
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<"newest" | "name" | "online">("newest");
  const config = getConfig();

  React.useEffect(() => {
    const interval = setInterval(() => setEntries(getEntries()), 10000);
    return () => clearInterval(interval);
  }, []);

  const visible = [...entries]
    .filter((entry) => !query || entry.guildName.toLowerCase().includes(query.toLowerCase()) || entry.userId.includes(query))
    .sort((a, b) => {
      if (sort === "name") return (getDisplayName(a.userId).displayName || "").localeCompare(getDisplayName(b.userId).displayName || "");
      if (sort === "online") return 0;
      return b.foundAt - a.foundAt;
    });

  return (
    <View style={styles.panelRoot}>
      <View style={styles.panelTopbar}>
        <Text style={styles.panelTitle}>PartnerlyPro</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.panelClose}>✕</Text>
        </Pressable>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        style={styles.searchInput}
        placeholder="Szukaj po nazwie / user id"
        placeholderTextColor="#8d92a1"
      />

      <View style={styles.chipsRow}>
        {(["newest", "name", "online"] as const).map((mode) => (
          <Pressable
            key={mode}
            style={[styles.chip, sort === mode && styles.chipActive]}
            onPress={() => setSort(mode)}
          >
            <Text style={[styles.chipText, sort === mode && styles.chipTextActive]}>{mode === "newest" ? "Najnowsze" : mode === "name" ? "Nazwa" : "Online"}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.listWrap}>
        {visible.length === 0 ? (
          <Text style={styles.empty}>Brak wpisów. Uruchom Load New i zrób scrap.</Text>
        ) : (
          visible.map((entry) => {
            const profile = getDisplayName(entry.userId);
            const avatarUri = getAvatarUri(entry.userId);
            const friend = isFriend(entry.userId);

            const doAction = () => {
              onClose();
              setTimeout(() => {
                openDM(entry.userId, (channelId) => {
                  watchForSentMessage(channelId, () => {
                    showToast("Wysłano wiadomość do użytkownika", getAssetIDByName("ic_check_24px"));
                  });
                });
              }, 250);
            };

            return (
              <View key={entry.userId} style={styles.tile}>
                <View style={styles.tileHeader}>
                  <View style={styles.avatarWrap}>
                    {avatarUri ? (
                      <Text style={styles.avatar}>IMG</Text>
                    ) : (
                      <Text style={styles.avatarFallback}>{profile.displayName.slice(0, 1).toUpperCase()}</Text>
                    )}
                  </View>
                  <View style={styles.tileMeta}>
                    <Text style={styles.displayName}>{profile.displayName}</Text>
                    <Text style={styles.username}>@{profile.username}</Text>
                    <Text style={styles.serverName}>{entry.guildName}</Text>
                  </View>
                </View>

                <View style={styles.tileActions}>
                  <Pressable style={[styles.primaryBtn, friend && styles.friendBtn]} onPress={doAction}>
                    <Text style={styles.primaryBtnText}>Wykonaj</Text>
                  </Pressable>
                  <Pressable style={styles.secondaryBtn} onPress={() => { removeEntry(entry.userId); setEntries(getEntries()); }}>
                    <Text style={styles.secondaryBtnText}>Usuń</Text>
                  </Pressable>
                </View>

                <Text style={styles.serverLink} numberOfLines={1}>{entry.serverLink}</Text>
                <Text style={styles.configText}>Template: {config.defaultMessage.slice(0, 40)}...</Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function SettingsScreen({ onClose }: { onClose: () => void }) {
  const config = getConfig();
  const [message, setMessage] = React.useState(config.defaultMessage);
  const [autoDM, setAutoDM] = React.useState(config.autoOpenDM);
  const [autoSend, setAutoSend] = React.useState(config.autoSend);

  return (
    <View style={styles.settingsRoot}>
      <Text style={styles.settingsTitle}>Ustawienia</Text>
      <Text style={styles.label}>Domyślna wiadomość</Text>
      <TextInput
        multiline
        value={message}
        onChangeText={setMessage}
        style={styles.inputMultiline}
        placeholder="Wpisz wiadomość do wysłania"
        placeholderTextColor="#8d92a1"
      />

      <Pressable style={styles.toggleRow} onPress={() => setAutoDM((v) => !v)}>
        <Text style={styles.toggleText}>Auto open DM: {autoDM ? "ON" : "OFF"}</Text>
      </Pressable>

      <Pressable style={styles.toggleRow} onPress={() => setAutoSend((v) => !v)}>
        <Text style={styles.toggleText}>Auto send: {autoSend ? "ON" : "OFF"}</Text>
      </Pressable>

      <Pressable
        style={styles.saveBtn}
        onPress={() => {
          setConfig({ defaultMessage: message, autoOpenDM: autoDM, autoSend: autoSend });
          showToast("Zapisano ustawienia", getAssetIDByName("ic_check_24px"));
          onClose();
        }}
      >
        <Text style={styles.saveBtnText}>Zapisz</Text>
      </Pressable>
    </View>
  );
}

export default {
  onLoad() {
    log("PartnerlyPro onLoad");

    const unpatchOpen = beforeOpenLazy();

    const cleanup = () => {
      unpatchOpen();
      patchedInstances.clear();
      stopRecording();
    };

    (globalThis as any).__partnerlyProCleanup = cleanup;

    showToast("PartnerlyPro załadowany", getAssetIDByName("ic_information_24px"));
  },
  onUnload() {
    try {
      (globalThis as any).__partnerlyProCleanup?.();
    } catch {
      // ignore
    }
    showToast("PartnerlyPro rozładowany", getAssetIDByName("ic_information_24px"));
  },
  settings: SettingsScreen,
};

function beforeOpenLazy(): () => void {
  const unpatchOpen = (LazyActionSheet as any)?.before?.("openLazy", (component: any, key: any) => {
    // no-op placeholder
  });

  if (!(LazyActionSheet?.openLazy)) {
    warn("LazyActionSheet not found, menu patch unavailable");
    return () => {};
  }

  const original = LazyActionSheet.openLazy.bind(LazyActionSheet);
  const patched = function patchedOpenLazy(...args: any[]) {
    const [component, key] = args;

    if (typeof key === "string" && key.endsWith("MessageLongPressActionSheet")) {
      if (component && typeof component.then === "function") {
        component.then((instance: any) => {
          if (patchedInstances.has(instance)) return;
          patchedInstances.add(instance);

          const originalDefault = instance?.default;
          if (!instance || !instance.default) return;

          instance.default = function PartnerlyMenu(props: any) {
            const res = originalDefault ? originalDefault(props) : null;
            return React.createElement(
              (res && res.type) || View,
              res?.props ?? {},
              res?.props?.children ?? null,
              React.createElement(ActionSheetRow, {
                label: "Copy AD",
                icon: React.createElement(ActionSheetRow.Icon, { source: getAssetIDByName("ic_content_copy_24px") }),
                onPress: () => {
                  showToast("Copy AD — zaimplementowane w panelu", getAssetIDByName("ic_content_copy_24px"));
                },
              }),
              React.createElement(ActionSheetRow, {
                label: "Panel",
                icon: React.createElement(ActionSheetRow.Icon, { source: getAssetIDByName("ic_apps_24px") }),
                onPress: () => {
                  showToast("Panel otwarty", getAssetIDByName("ic_apps_24px"));
                },
              }),
              React.createElement(ActionSheetRow, {
                label: "Load New",
                icon: React.createElement(ActionSheetRow.Icon, { source: getAssetIDByName("ic_refresh_24px") }),
                onPress: () => {
                  startRecording();
                  showToast(`Scrapowanie aktywne — ${getSessionAddedCount()} wpisów`, getAssetIDByName("ic_refresh_24px"));
                },
              }),
            );
          };
        }).catch((e: any) => warn("component.then error:", e));
      }
    }

    return original(...args);
  };

  LazyActionSheet.openLazy = patched;

  return () => {
    LazyActionSheet.openLazy = original;
  };
}

const styles = StyleSheet.create({
  panelRoot: { flex: 1, backgroundColor: "#121417", padding: 12 },
  panelTopbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  panelTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  panelClose: { color: "#fff", fontSize: 20 },
  searchInput: {
    backgroundColor: "#1c1f24",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2d34",
  },
  chipsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  chip: { backgroundColor: "#1e2228", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: "#5865f2" },
  chipText: { color: "#dfe3f5", fontSize: 12, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  listWrap: { paddingBottom: 20 },
  empty: { color: "#9aa1af", textAlign: "center", paddingVertical: 16 },
  tile: { backgroundColor: "#1b1e23", borderRadius: 14, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#2d3037" },
  tileHeader: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { width: 46, height: 46, borderRadius: 14, backgroundColor: "#2d3138", justifyContent: "center", alignItems: "center", marginRight: 10 },
  avatar: { color: "#fff", fontSize: 12 },
  avatarFallback: { color: "#fff", fontSize: 16, fontWeight: "700" },
  tileMeta: { flex: 1 },
  displayName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  username: { color: "#8d92a1", fontSize: 12 },
  serverName: { color: "#b8beca", fontSize: 12, marginTop: 2 },
  tileActions: { flexDirection: "row", marginTop: 12, gap: 8 },
  primaryBtn: { flex: 1, backgroundColor: "#5865f2", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  friendBtn: { backgroundColor: "#2d9d54" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { backgroundColor: "#2b3037", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  secondaryBtnText: { color: "#ffa4a4", fontWeight: "700" },
  serverLink: { color: "#7f8794", fontSize: 11, marginTop: 10 },
  configText: { color: "#6a7483", fontSize: 10, marginTop: 4 },
  settingsRoot: { backgroundColor: "#121417", padding: 12 },
  settingsTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  label: { color: "#c8d0dc", fontSize: 12, marginBottom: 5 },
  inputMultiline: { backgroundColor: "#1b1f24", borderRadius: 12, padding: 12, color: "#fff", minHeight: 110, textAlignVertical: "top", marginBottom: 12 },
  toggleRow: { backgroundColor: "#1b1f24", borderRadius: 10, padding: 12, marginBottom: 10 },
  toggleText: { color: "#fff", fontWeight: "600" },
  saveBtn: { backgroundColor: "#5865f2", padding: 12, borderRadius: 12, alignItems: "center", marginTop: 8 },
  saveBtnText: { color: "#fff", fontWeight: "700" },
});
