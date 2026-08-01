import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { GuildNode, useFolderExpanded } from "../utils/tree";
import TopBarGuildItem from "./TopBarGuildItem";
import TopBarFolderItem from "./TopBarFolderItem";

const TAG = "[TopGuildBar]";

const Flux = findByProps("useStateFromStores");
const SortedGuildStore = findByStoreName("SortedGuildStore");
const RootNav = findByProps("getRootNavigationRef");
const Routing = findByProps("transitionToGuild");

function pickGuild(id: string) {
    if (Routing?.transitionToGuild) {
        Routing.transitionToGuild(id, null);
    } else {
        RootNav?.getRootNavigationRef()?.navigate("guilds", { guildId: id });
    }
}

// Osobny podkomponent, żeby hook useFolderExpanded (subskrypcja Fluxa)
// nie renderował na nowo całego paska przy każdym otwarciu/zamknięciu folderu.
function ExpandedFolderRow({ node }: { node: GuildNode }) {
    const open = useFolderExpanded(node.id);
    if (!open || !node.children?.length) return null;

    return (
        <View style={st.expandedRowWrap}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={st.rowContent}
            >
                {node.children.map((ch) => (
                    <TopBarGuildItem key={ch.id} id={ch.id as string} onPick={pickGuild} />
                ))}
            </ScrollView>
        </View>
    );
}

export default function HorizontalTopBar() {
    const nodes: GuildNode[] = Flux?.useStateFromStores?.(
        [SortedGuildStore],
        () => {
            const t = SortedGuildStore?.getGuildsTree?.();
            const children = t?.root?.children || [];
            if (__DEV_LOGGED__ === false) {
                __DEV_LOGGED__ = true;
                console.log(TAG, "getGuildsTree() sample node:", JSON.stringify(children[0])?.slice(0, 300));
            }
            return children.filter((n: GuildNode) => n.type !== "root");
        },
    ) ?? [];

    const folderNodes = nodes.filter((n) => n.type === "folder");

    return (
        <View style={st.wrap} onLayout={(e) => {
            console.log(TAG, "HorizontalTopBar rendered, measured size:", JSON.stringify(e.nativeEvent.layout));
        }}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={st.rowContent}
            >
                {nodes.map((node) =>
                    node.type === "folder"
                        ? <TopBarFolderItem key={node.id} node={node} />
                        : <TopBarGuildItem key={node.id} id={node.id as string} onPick={pickGuild} />
                )}
            </ScrollView>

            {folderNodes.map((node) => (
                <ExpandedFolderRow key={`exp-${node.id}`} node={node} />
            ))}
        </View>
    );
}

let __DEV_LOGGED__ = false;

const st = StyleSheet.create({
    wrap: {
        width: "100%",
        backgroundColor: "#1e1f22",
        paddingTop: 6,
    },
    rowContent: {
        paddingHorizontal: 8,
        alignItems: "center",
    },
    expandedRowWrap: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#2b2d31",
        paddingVertical: 6,
    },
});
