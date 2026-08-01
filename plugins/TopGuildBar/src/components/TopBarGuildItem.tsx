import React from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { findByProps, findByStoreName } from "@vendetta/metro";
import GuildIcon from "./GuildIcon";

const ICON = 44;

const Flux = findByProps("useStateFromStores");
const GuildReadStateStore = findByStoreName("GuildReadStateStore");
const Haptic = findByProps("triggerHapticFeedback", "HapticFeedbackTypes");

function Badge({ guildId }: { guildId: string }) {
    const mentionCount = Flux?.useStateFromStores?.(
        [GuildReadStateStore],
        () => GuildReadStateStore?.getMentionCount?.(guildId) ?? 0,
        [guildId],
    ) ?? 0;

    const hasUnread = Flux?.useStateFromStores?.(
        [GuildReadStateStore],
        () => GuildReadStateStore?.hasUnread?.(guildId) ?? false,
        [guildId],
    ) ?? false;

    if (mentionCount > 0) {
        return (
            <View style={bd.outline}>
                <View style={bd.badge}>
                    <Text style={bd.text}>{mentionCount > 99 ? "99+" : String(mentionCount)}</Text>
                </View>
            </View>
        );
    }
    if (hasUnread) {
        return (
            <View style={bd.dotOutline}>
                <View style={bd.dot} />
            </View>
        );
    }
    return null;
}

export default function TopBarGuildItem({ id, onPick }: { id: string; onPick: (id: string) => void }) {
    const scale = React.useRef(new Animated.Value(1)).current;
    const scaleDown = () => Animated.spring(scale, { toValue: 0.85, useNativeDriver: true }).start();
    const scaleUp = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    return (
        <Pressable
            onPressIn={scaleDown}
            onPressOut={scaleUp}
            onPress={() => {
                Haptic?.triggerHapticFeedback?.(Haptic.HapticFeedbackTypes.SOFT);
                onPick(id);
            }}
        >
            <View style={st.outer}>
                <Animated.View style={[st.icon, { transform: [{ scale }] }]}>
                    <GuildIcon id={id} />
                </Animated.View>
                <Badge guildId={id} />
            </View>
        </Pressable>
    );
}

const st = StyleSheet.create({
    outer: { width: ICON, height: ICON, marginHorizontal: 4 },
    icon: { width: ICON, height: ICON, borderRadius: 14, overflow: "hidden" },
});

const bd = StyleSheet.create({
    outline: {
        position: "absolute", bottom: -3, right: -3,
        minWidth: 20, minHeight: 20, borderRadius: 10,
        backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center",
    },
    badge: {
        minWidth: 16, height: 16, borderRadius: 8,
        backgroundColor: "#ed4245", alignItems: "center", justifyContent: "center",
        paddingHorizontal: 4,
    },
    text: { color: "#fff", fontSize: 9, fontWeight: "700", lineHeight: 16 },
    dotOutline: {
        position: "absolute", bottom: -2, right: -2,
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center",
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#ed4245" },
});
