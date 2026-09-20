import React from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { showToast } from "@vendetta/ui/toasts";
import { getConfig, setConfig } from "../utils/store";

export default function SettingsScreen({ onClose }: { onClose: () => void }) {
  const config = getConfig();
  const [message, setMessage] = React.useState(config.defaultMessage);
  const [autoDM, setAutoDM] = React.useState(config.autoOpenDM);
  const [autoSend, setAutoSend] = React.useState(config.autoSend);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>PartnerlyPro settings</Text>

      <Text style={styles.label}>Domyślna wiadomość</Text>
      <TextInput
        multiline
        value={message}
        onChangeText={setMessage}
        placeholder="Wpisz wiadomość, którą ma wysyłać plugin"
        placeholderTextColor="#8d93a1"
        style={styles.textarea}
      />

      <Pressable style={styles.toggle} onPress={() => setAutoDM((v) => !v)}>
        <Text style={styles.toggleText}>Auto open DM: {autoDM ? "ON" : "OFF"}</Text>
      </Pressable>

      <Pressable style={styles.toggle} onPress={() => setAutoSend((v) => !v)}>
        <Text style={styles.toggleText}>Auto send: {autoSend ? "ON" : "OFF"}</Text>
      </Pressable>

      <Pressable
        style={styles.save}
        onPress={() => {
          setConfig({ defaultMessage: message, autoOpenDM: autoDM, autoSend: autoSend });
          showToast("Zapisano ustawienia", getAssetIDByName("ic_check_24px"));
          onClose();
        }}
      >
        <Text style={styles.saveText}>Zapisz</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 12, backgroundColor: "#121418" },
  title: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  label: { color: "#dfe5f2", fontSize: 12, marginBottom: 6 },
  textarea: {
    backgroundColor: "#1b1f25",
    borderRadius: 12,
    color: "#fff",
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    borderColor: "#2a2f36",
    borderWidth: 1,
    marginBottom: 12,
  },
  toggle: {
    backgroundColor: "#1b1f25",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2f36",
    marginBottom: 10,
  },
  toggleText: { color: "#fff", fontWeight: "600" },
  save: {
    backgroundColor: "#5865f2",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    marginTop: 6,
  },
  saveText: { color: "#fff", fontWeight: "700" },
});
