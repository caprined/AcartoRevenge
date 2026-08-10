import React from "react";
import { View, Text, TextInput, FlatList, Pressable, Animated, StyleSheet, Dimensions, Switch } from "react-native";
import {
    getServers,
    addServer,
    updateServer,
    deleteServer,
    toggleServer,
    moveServer,
    PartnerServer,
} from "../utils/servers";
import GuildIcon from "./GuildIcon";

const { height: SCREEN_H } = Dimensions.get("window");

interface Props {
    onClose: () => void;
}

function ServerForm({ initial, onSave, onCancel }: { initial: Partial<PartnerServer> | null; onSave: (data: { name: string; adText: string; channelLink: string }) => void; onCancel: () => void }) {
    const [name, setName] = React.useState(initial?.name ?? "");
    const [adText, setAdText] = React.useState(initial?.adText ?? "");
    const [channelLink, setChannelLink] = React.useState(initial?.channelLink ?? "");

    return (
        <View style={fst.form}>
            <Text style={fst.label}>Nazwa:</Text>
            <TextInput style={fst.input} value={name} onChangeText={setName} placeholder="Nazwa serwera" placeholderTextColor="#72767d" />

            <Text style={fst.label}>Reklama:</Text>
            <TextInput
                style={[fst.input, fst.inputTall]}
                value={adText}
                onChangeText={setAdText}
                placeholder="Treść reklamy do wysyłania"
                placeholderTextColor="#72767d"
                multiline
                textAlignVertical="top"
            />

            <Text style={fst.label}>Kanał partnerstw (link):</Text>
            <TextInput
                style={fst.input}
                value={channelLink}
                onChangeText={setChannelLink}
                placeholder="https://discord.com/channels/.../..."
                placeholderTextColor="#72767d"
                autoCapitalize="none"
            />

            <View style={fst.formActions}>
                <Pressable style={fst.cancelBtn} onPress={onCancel}>
                    <Text style={fst.cancelBtnText}>Anuluj</Text>
                </Pressable>
                <Pressable
                    style={fst.saveBtn}
                    onPress={() => {
                        if (!name.trim()) return;
                        onSave({ name: name.trim(), adText, channelLink: channelLink.trim() });
                    }}
                >
                    <Text style={fst.saveBtnText}>Zapisz</Text>
                </Pressable>
            </View>
        </View>
    );
}

function ServerTile({ server, index, total, onChanged }: { server: PartnerServer; index: number; total: number; onChanged: () => void }) {
    const [editing, setEditing] = React.useState(false);

    if (editing) {
        return (
            <View style={tst.tile}>
                <ServerForm
                    initial={server}
                    onCancel={() => setEditing(false)}
                    onSave={(data) => {
                        updateServer(server.id, data);
                        setEditing(false);
                        onChanged();
                    }}
                />
            </View>
        );
    }

    return (
        <View style={tst.tile}>
            <View style={tst.tileRow}>
                <GuildIcon guildId={server.guildId} size={40} />
                <View style={tst.tileNameCol}>
                    <Text style={tst.tileName} numberOfLines={1}>{server.name}</Text>
                    <Text style={tst.tileSub} numberOfLines={1}>{server.enabled ? "aktywny" : "wyłączony"}</Text>
                </View>
                <Switch
                    value={server.enabled}
                    onValueChange={() => { toggleServer(server.id); onChanged(); }}
                />
            </View>
            <View style={tst.tileActions}>
                <Pressable style={tst.smallBtn} onPress={() => setEditing(true)}>
                    <Text style={tst.smallBtnText}>Edytuj</Text>
                </Pressable>
                <Pressable style={tst.smallBtn} onPress={() => { deleteServer(server.id); onChanged(); }}>
                    <Text style={[tst.smallBtnText, { color: "#f23f42" }]}>Usuń</Text>
                </Pressable>
                <Pressable
                    style={[tst.smallBtn, index === 0 && tst.smallBtnDisabled]}
                    disabled={index === 0}
                    onPress={() => { moveServer(server.id, -1); onChanged(); }}
                >
                    <Text style={tst.smallBtnText}>↑</Text>
                </Pressable>
                <Pressable
                    style={[tst.smallBtn, index === total - 1 && tst.smallBtnDisabled]}
                    disabled={index === total - 1}
                    onPress={() => { moveServer(server.id, 1); onChanged(); }}
                >
                    <Text style={tst.smallBtnText}>↓</Text>
                </Pressable>
            </View>
        </View>
    );
}

export default function ManageServersScreen({ onClose }: Props) {
    const [, forceRender] = React.useReducer((x) => x + 1, 0);
    const [adding, setAdding] = React.useState(false);
    const slide = React.useRef(new Animated.Value(SCREEN_H)).current;

    React.useEffect(() => {
        Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    }, []);

    const close = () => {
        Animated.timing(slide, { toValue: SCREEN_H, duration: 200, useNativeDriver: true }).start(onClose);
    };

    const servers = getServers();

    return (
        <View style={rst.backdrop} pointerEvents="box-none">
            <Pressable style={rst.backdropTouch} onPress={close} />
            <Animated.View style={[rst.sheet, { transform: [{ translateY: slide }] }]}>
                <View style={rst.handle} />
                <View style={rst.header}>
                    <Text style={rst.title}>Zarządzaj serwerami</Text>
                    <Pressable onPress={close}><Text style={rst.closeX}>✕</Text></Pressable>
                </View>

                {adding ? (
                    <View style={{ paddingHorizontal: 12 }}>
                        <ServerForm
                            initial={null}
                            onCancel={() => setAdding(false)}
                            onSave={(data) => { addServer(data); setAdding(false); forceRender(); }}
                        />
                    </View>
                ) : (
                    <Pressable style={rst.addBtn} onPress={() => setAdding(true)}>
                        <Text style={rst.addBtnText}>+ Dodaj serwer</Text>
                    </Pressable>
                )}

                <FlatList
                    style={rst.scroll}
                    contentContainerStyle={rst.scrollContent}
                    data={servers}
                    keyExtractor={(s) => s.id}
                    renderItem={({ item, index }) => (
                        <ServerTile server={item} index={index} total={servers.length} onChanged={forceRender} />
                    )}
                    ListEmptyComponent={!adding ? <Text style={rst.empty}>Brak dodanych serwerów.</Text> : null}
                />
            </Animated.View>
        </View>
    );
}

const rst = StyleSheet.create({
    backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "flex-end", zIndex: 1000 },
    backdropTouch: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)" },
    sheet: { backgroundColor: "#1e1f22", borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: SCREEN_H * 0.85, paddingBottom: 24 },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#4e5058", alignSelf: "center", marginTop: 8 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
    title: { color: "#fff", fontSize: 16, fontWeight: "700" },
    closeX: { color: "#b5bac1", fontSize: 18, padding: 4 },
    addBtn: { marginHorizontal: 12, marginBottom: 10, backgroundColor: "#5865f2", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
    addBtnText: { color: "#fff", fontWeight: "700" },
    scroll: { paddingHorizontal: 12 },
    scrollContent: { paddingBottom: 12 },
    empty: { color: "#949ba4", fontSize: 13, textAlign: "center", padding: 24 },
});

const tst = StyleSheet.create({
    tile: { backgroundColor: "#2b2d31", borderRadius: 10, padding: 12, marginBottom: 10 },
    tileRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    tileNameCol: { flex: 1 },
    tileName: { color: "#fff", fontSize: 15, fontWeight: "700" },
    tileSub: { color: "#949ba4", fontSize: 11, marginTop: 2 },
    tileActions: { flexDirection: "row", marginTop: 10, gap: 6 },
    smallBtn: { backgroundColor: "#3a3c41", borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
    smallBtnDisabled: { opacity: 0.3 },
    smallBtnText: { color: "#dbdee1", fontSize: 12, fontWeight: "600" },
});

const fst = StyleSheet.create({
    form: { backgroundColor: "#2b2d31", borderRadius: 10, padding: 12, marginBottom: 10 },
    label: { color: "#b5bac1", fontSize: 12, fontWeight: "700", marginTop: 8, marginBottom: 4 },
    input: { backgroundColor: "#1e1f22", color: "#fff", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13 },
    inputTall: { minHeight: 90 },
    formActions: { flexDirection: "row", marginTop: 12, gap: 8 },
    cancelBtn: { flex: 1, backgroundColor: "#3a3c41", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
    cancelBtnText: { color: "#dbdee1", fontWeight: "600" },
    saveBtn: { flex: 1, backgroundColor: "#5865f2", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
    saveBtnText: { color: "#fff", fontWeight: "700" },
});
