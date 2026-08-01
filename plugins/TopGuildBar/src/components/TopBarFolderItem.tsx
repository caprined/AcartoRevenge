import React from "react";
import { View, Image, Pressable, StyleSheet } from "react-native";
import { findByProps } from "@vendetta/metro";
import { getAssetIDByName } from "@vendetta/ui/assets";
import { GuildNode, folderColor, useFolderExpanded } from "../utils/tree";
import GuildIcon from "./GuildIcon";

const GuildActions = findByProps("toggleGuildFolderExpand");
const Haptic = findByProps("triggerHapticFeedback", "HapticFeedbackTypes");
const FOLDER_ASSET = getAssetIDByName("FolderIcon");

const ICON = 44;
const MINI = 15;

const POS = [
    { top: 5, left: 5 },
    { top: 5, right: 5 },
    { bottom: 5, left: 5 },
    { bottom: 5, right: 5 },
] as const;

export default function TopBarFolderItem({ node }: { node: GuildNode }) {
    const open = useFolderExpanded(node.id);

    const toggle = () => {
        Haptic?.triggerHapticFeedback?.(Haptic.HapticFeedbackTypes.SOFT);
        GuildActions?.toggleGuildFolderExpand?.(node.id);
    };

    const col = folderColor(node.color);

    return (
        <Pressable onPress={toggle} style={st.outer}>
            {open ? (
                <View style={[st.openIcon, { backgroundColor: col }]}>
                    <Image source={FOLDER_ASSET} style={st.folderImg} tintColor="#fff" />
                </View>
            ) : (
                <View style={[st.closedIcon, { backgroundColor: col }]}>
                    {node.children.slice(0, 4).map((ch, i) => (
                        <View key={ch.id} style={[st.cell, POS[i]]}>
                            <GuildIcon id={ch.id as string} size={MINI} />
                        </View>
                    ))}
                </View>
            )}
        </Pressable>
    );
}

const st = StyleSheet.create({
    outer: { width: ICON, height: ICON, marginHorizontal: 4 },
    openIcon: { width: ICON, height: ICON, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    folderImg: { width: 22, height: 22 },
    closedIcon: { width: ICON, height: ICON, borderRadius: 14, overflow: "hidden" },
    cell: { position: "absolute", width: MINI, height: MINI, borderRadius: 7, overflow: "hidden" },
});
