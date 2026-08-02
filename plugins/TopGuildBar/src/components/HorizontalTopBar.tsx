import React from "react";
import { View, ScrollView, StyleSheet, Text, Modal, Platform, StatusBar } from "react-native";
import { findByProps, findByStoreName } from "@vendetta/metro";
import { GuildNode, useFolderExpanded } from "../utils/tree";
import { log, warn, error as logError } from "../utils/logger";
import TopBarGuildItem from "./TopBarGuildItem";
import TopBarFolderItem from "./TopBarFolderItem";

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
                log("getGuildsTree() sample node:", JSON.stringify(children[0])?.slice(0, 300));
            }
            return children.filter((n: GuildNode) => n.type !== "root");
        },
    ) ?? [];

    const folderNodes = nodes.filter((n) => n.type === "folder");

    return (
        <View
            style={[st.wrap, { paddingTop: safeStatusBarHeight() + 6 }]}
            pointerEvents="auto"
            onLayout={(e) => {
                log("HorizontalTopBar measured:", JSON.stringify(e.nativeEvent.layout));
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

function safeStatusBarHeight(): number {
    try {
        if (Platform?.OS === "android") {
            return StatusBar?.currentHeight ?? 24;
        }
        return 44;
    } catch (e) {
        warn("safeStatusBarHeight() fallback:", e);
        return 24;
    }
}

// Error boundary klasowy — jeśli render wywali błąd, Discordowy ErrorBoundary
// może go połknąć bez oznaczenia pluginu jako błędnego. Tu łapiemy to sami
// i pokazujemy widoczny na ekranie komunikat zamiast ciszy.
class HorizontalTopBar extends React.Component<{}, { error: string | null }> {
    constructor(props: {}) {
        super(props);
        this.state = { error: null };
        log("HorizontalTopBar constructor() — komponent jest montowany");
    }
    static getDerivedStateFromError(err: any) {
        return { error: String(err?.message ?? err) };
    }
    componentDidCatch(err: any) {
        logError("RENDER ERROR:", err);
    }
    render() {
        if (this.state?.error) {
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

const st = StyleSheet.create({
    modalRoot: {
        flex: 1,
    },
    wrap: {
        width: "100%",
        minHeight: 64,
        backgroundColor: "#1e1f22",
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
        width: "100%",
        minHeight: 40,
        backgroundColor: "#ed4245",
        padding: 8,
    },
    errorText: {
        color: "#fff",
        fontSize: 11,
    },
});
