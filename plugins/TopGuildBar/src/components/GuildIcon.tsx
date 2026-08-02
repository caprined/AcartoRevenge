import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { findByStoreName, findByProps } from "@vendetta/metro";
import { warn } from "../utils/logger";

const GuildStore = findByStoreName("GuildStore");
const colors = findByProps("colors", "unsafe_rawColors")?.colors;

const alreadyWarned = new Set<string>();

export default function GuildIcon({ id, size = 44 }: { id: string | number; size?: number }) {
    const idStr = String(id);
    const g = GuildStore?.getGuild?.(idStr);

    if (!g) {
        if (!alreadyWarned.has(idStr)) {
            alreadyWarned.add(idStr);
            warn(`GuildIcon: brak danych w GuildStore dla id=${idStr} (typ oryginalny: ${typeof id})`);
        }
        return null;
    }

    const rad = size >= 40 ? 14 : 8;
    if (g.icon) {
        return (
            <Image
                source={{ uri: `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=${size * 2}` }}
                style={{ width: size, height: size, borderRadius: rad }}
                onError={(e) => warn(`GuildIcon: błąd ładowania obrazka dla ${g.name}:`, e.nativeEvent?.error)}
            />
        );
    }
    return (
        <View style={[st.fallback, { width: size, height: size, borderRadius: rad, backgroundColor: colors?.BG_ACCENT ?? "#5865f2" }]}>
            <Text style={[st.letter, { fontSize: Math.max(10, size * 0.38) }]}>
                {g.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}
            </Text>
        </View>
    );
}

const st = StyleSheet.create({
    fallback: { alignItems: "center", justifyContent: "center" },
    letter: { color: "#fff", fontWeight: "700" },
});
