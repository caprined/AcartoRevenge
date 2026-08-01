import React from "react";
import { View, ScrollView, StyleSheet, Dimensions, Text } from "react-native";
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

function HorizontalTopBarInner() {
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
        <View
            style={st.wrap}
            onLayout={(e) => {
                console.log(TAG, "HorizontalTopBar measured:", JSON.stringify(e.nativeEvent.layout));
            }}
        >
            <Text style={st.debugLabel}>TopGuildBar DEBUG · {nodes.length} pozycji</Text>
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

// Error boundary klasowy — jeśli render wywali błąd, Discordowy ErrorBoundary
// może go połknąć bez oznaczenia pluginu jako błędnego. Tu łapiemy to sami
// i pokazujemy widoczny na ekranie komunikat zamiast ciszy.
class HorizontalTopBar extends React.Component<{}, { error: string | null }> {
    state = { error: null as string | null };
    static getDerivedStateFromError(err: any) {
        return { error: String(err?.message ?? err) };
    }
    componentDidCatch(err: any) {
        console.log(TAG, "RENDER ERROR:", err);
    }
    render() {
        if (this.state.error) {
            return (
                <View style={st.errorBox}>
                    <Text style={st.errorText}>TopGuildBar crash: {this.state.error}</Text>
                </View>
            );
        }
        return <HorizontalTopBarInner />;
    }
}

export default HorizontalTopBar;

let __DEV_LOGGED__ = false;

const { width: SCREEN_W } = Dimensions.get("window");

const st = StyleSheet.create({
    wrap: {
        // Twarda, jawna szerokość/wysokość — nie ufamy rodzicowi, że da nam miejsce.
        width: SCREEN_W,
        minHeight: 64,
        backgroundColor: "#ff00c8", // JASKRAWE tło tymczasowo — do usunięcia po potwierdzeniu że działa
        paddingTop: 6,
    },
    debugLabel: {
        color: "#fff",
        fontSize: 10,
        paddingHorizontal: 8,
        marginBottom: 2,
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
    errorBox: {
        width: SCREEN_W,
        minHeight: 40,
        backgroundColor: "#ed4245",
        padding: 8,
    },
    errorText: {
        color: "#fff",
        fontSize: 11,
    },
});
