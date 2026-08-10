import React from "react";
import { View, Text, FlatList, Pressable, Animated, StyleSheet, Dimensions } from "react-native";
import { getServers, getServerByGuildId } from "../utils/servers";
import { sendMessageToChannel, openChannelSilently } from "../utils/discord";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import GuildIcon from "./GuildIcon";

const { height: SCREEN_H } = Dimensions.get("window");

interface Props {
    onClose: () => void;
    currentGuildId: string | null;
}

export default function PublishAdScreen({ onClose, currentGuildId }: Props) {
    const slide = React.useRef(new Animated.Value(SCREEN_H)).current;

    React.useEffect(() => {
        Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    }, []);

    const close = () => {
        Animated.timing(slide, { toValue: SCREEN_H, duration: 200, useNativeDriver: true }).start(onClose);
    };

    const myServer = currentGuildId ? getServerByGuildId(currentGuildId) : null;
    const targets = getServers().filter((s) => s.id !== myServer?.id);

    return (
        <View style={rst.backdrop} pointerEvents="box-none">
            <Pressable style={rst.backdropTouch} onPress={close} />
            <Animated.View style={[rst.sheet, { transform: [{ translateY: slide }] }]}>
                <View style={rst.handle} />
                <View style={rst.header}>
                    <Text style={rst.title}>Opublikuj reklamę</Text>
                    <Pressable onPress={close}><Text style={rst.closeX}>✕</Text></Pressable>
                </View>

                {!myServer ? (
                    <Text style={rst.empty}>
                        Ten serwer nie jest zarejestrowany w "Zarządzaj serwerami" — dodaj go najpierw, żeby mieć swoją treść reklamy do wysłania.
                    </Text>
                ) : (
                    <FlatList
                        style={rst.scroll}
                        contentContainerStyle={rst.scrollContent}
                        data={targets}
                        keyExtractor={(s) => s.id}
                        ListEmptyComponent={<Text style={rst.empty}>Brak innych zarejestrowanych serwerów do wysłania.</Text>}
                        renderItem={({ item }) => (
                            <View style={rst.row}>
                                <GuildIcon guildId={item.guildId} size={36} />
                                <Text style={rst.rowName} numberOfLines={1}>{item.name}</Text>
                                <Pressable
                                    style={[rst.sendBtn, !item.channelId && rst.sendBtnDisabled]}
                                    disabled={!item.channelId}
                                    onPress={() => {
                                        if (!item.channelId) {
                                            showToast("Brak kanału partnerstw dla tego serwera", getAssetIDByName("ic_warning_24px"));
                                            return;
                                        }
                                        openChannelSilently(item.channelId);
                                        setTimeout(() => {
                                            const ok = sendMessageToChannel(item.channelId!, myServer.adText);
                                            showToast(
                                                ok ? `Wysłano reklamę do "${item.name}"` : "Nie udało się wysłać",
                                                getAssetIDByName(ok ? "ic_information_24px" : "ic_warning_24px"),
                                            );
                                            if (ok) close();
                                        }, 400);
                                    }}
                                >
                                    <Text style={rst.sendBtnText}>Wyślij</Text>
                                </Pressable>
                            </View>
                        )}
                    />
                )}
            </Animated.View>
        </View>
    );
}

const rst = StyleSheet.create({
    backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", zIndex: 1000 },
    backdropTouch: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: { backgroundColor: "#1e1f22", borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: SCREEN_H * 0.7, paddingBottom: 24 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#4e5058", alignSelf: "center", marginTop: 8 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
    title: { color: "#fff", fontSize: 16, fontWeight: "700" },
    closeX: { color: "#b5bac1", fontSize: 18, padding: 4 },
    scroll: { paddingHorizontal: 12 },
    scrollContent: { paddingBottom: 12 },
    empty: { color: "#949ba4", fontSize: 13, textAlign: "center", padding: 24 },
    row: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: "#2b2d31", borderRadius: 10, padding: 10, marginBottom: 8,
    },
    rowName: { color: "#fff", fontSize: 14, fontWeight: "600", flex: 1 },
    sendBtn: { backgroundColor: "#5865f2", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14 },
    sendBtnDisabled: { backgroundColor: "#3a3c41", opacity: 0.5 },
    sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
