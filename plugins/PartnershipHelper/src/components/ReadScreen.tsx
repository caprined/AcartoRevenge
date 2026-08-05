import React from "react";
import { View, Text, ScrollView, Pressable, Animated, StyleSheet, Dimensions } from "react-native";
import { getReviews, removeReview, ReviewEntry } from "../utils/store";
import { getDisplayName, openDM } from "../utils/discord";
import { formatRelative } from "../utils/time";

const { height: SCREEN_H } = Dimensions.get("window");

interface Props {
    onClose: () => void;
}

function Row({ entry, onRemove }: { entry: ReviewEntry; onRemove: () => void }) {
    const { displayName, username } = getDisplayName(entry.userId);

    return (
        <View style={rst.row}>
            <View style={rst.rowTop}>
                <View style={rst.namesCol}>
                    <Text style={rst.displayName} numberOfLines={1}>{displayName}</Text>
                    <Text style={rst.username} numberOfLines={1}>@{username}</Text>
                    <Text style={rst.guildName} numberOfLines={1}>{entry.guildName}</Text>
                </View>
                <Text style={rst.timestamp}>{formatRelative(entry.timestamp)}</Text>
            </View>
            <View style={rst.actions}>
                <Pressable
                    style={rst.sendBtn}
                    onPress={() => {
                        openDM(entry.userId);
                        onRemove();
                    }}
                >
                    <Text style={rst.sendBtnText}>Wyślij wiadomość</Text>
                </Pressable>
                <Pressable style={rst.deleteBtn} onPress={onRemove}>
                    <Text style={rst.deleteBtnText}>Usuń</Text>
                </Pressable>
            </View>
        </View>
    );
}

export default function ReadScreen({ onClose }: Props) {
    const [, forceRender] = React.useReducer((x) => x + 1, 0);
    const slide = React.useRef(new Animated.Value(SCREEN_H)).current;

    React.useEffect(() => {
        Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    }, []);

    const close = () => {
        Animated.timing(slide, { toValue: SCREEN_H, duration: 200, useNativeDriver: true }).start(onClose);
    };

    const entries = getReviews();

    return (
        <View style={rst.backdrop} pointerEvents="box-none">
            <Pressable style={rst.backdropTouch} onPress={close} />
            <Animated.View style={[rst.sheet, { transform: [{ translateY: slide }] }]}>
                <View style={rst.handle} />
                <View style={rst.header}>
                    <Text style={rst.title}>Partnership Helper · {entries.length}</Text>
                    <Pressable onPress={close}><Text style={rst.closeX}>✕</Text></Pressable>
                </View>
                <ScrollView style={rst.scroll} contentContainerStyle={rst.scrollContent}>
                    {entries.length === 0 ? (
                        <Text style={rst.empty}>
                            Brak zebranych wzmianek. Uruchom "Stwórz review" i przescrolluj kanał z reklamami.
                        </Text>
                    ) : (
                        entries.map((e) => (
                            <Row
                                key={e.userId}
                                entry={e}
                                onRemove={() => { removeReview(e.userId); forceRender(); }}
                            />
                        ))
                    )}
                </ScrollView>
            </Animated.View>
        </View>
    );
}

const rst = StyleSheet.create({
    backdrop: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        justifyContent: "flex-end",
        zIndex: 1000,
    },
    backdropTouch: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    sheet: {
        backgroundColor: "#1e1f22",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: SCREEN_H * 0.8,
        paddingBottom: 24,
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: "#4e5058",
        alignSelf: "center",
        marginTop: 8,
    },
    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
    },
    title: { color: "#fff", fontSize: 16, fontWeight: "700" },
    closeX: { color: "#b5bac1", fontSize: 18, padding: 4 },
    scroll: { paddingHorizontal: 12 },
    scrollContent: { paddingBottom: 12 },
    empty: { color: "#949ba4", fontSize: 13, textAlign: "center", padding: 24 },
    row: {
        backgroundColor: "#2b2d31",
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
    },
    rowTop: { flexDirection: "row", justifyContent: "space-between" },
    namesCol: { flex: 1, paddingRight: 8 },
    displayName: { color: "#fff", fontSize: 15, fontWeight: "700" },
    username: { color: "#949ba4", fontSize: 12, marginTop: 1 },
    guildName: { color: "#b5bac1", fontSize: 12, marginTop: 4 },
    timestamp: { color: "#949ba4", fontSize: 11 },
    actions: { flexDirection: "row", marginTop: 10, gap: 8 },
    sendBtn: {
        flex: 1, backgroundColor: "#5865f2",
        borderRadius: 8, paddingVertical: 10, alignItems: "center",
    },
    sendBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    deleteBtn: {
        backgroundColor: "#3a3c41",
        borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, alignItems: "center",
    },
    deleteBtnText: { color: "#f23f42", fontWeight: "600", fontSize: 13 },
});
