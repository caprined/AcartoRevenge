import React from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { getLogs, clearLogs, subscribe, LogEntry } from "../utils/logger";

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
    log: "#dbdee1",
    warn: "#f0b232",
    error: "#ed4245",
};

export default function LogsScreen() {
    const [entries, setEntries] = React.useState<LogEntry[]>(() => getLogs());

    React.useEffect(() => {
        const unsub = subscribe(() => setEntries(getLogs()));
        return unsub;
    }, []);

    return (
        <View style={st.root}>
            <View style={st.toolbar}>
                <Text style={st.title}>TopGuildBar — logi ({entries.length})</Text>
                <Pressable onPress={() => clearLogs()} style={st.clearBtn}>
                    <Text style={st.clearBtnText}>Wyczyść</Text>
                </Pressable>
            </View>
            <Text style={st.hint}>
                Przytrzymaj palec na dowolnej linii żeby ją zaznaczyć/skopiować (zaznaczanie tekstu Androida).
            </Text>
            <ScrollView style={st.scroll} contentContainerStyle={st.scrollContent}>
                {entries.length === 0 ? (
                    <Text style={st.empty}>Brak logów — otwórz/zrestartuj Discorda żeby je wygenerować.</Text>
                ) : (
                    entries.map((e, i) => (
                        <Text key={i} selectable style={[st.line, { color: LEVEL_COLOR[e.level] }]}>
                            {`[${e.time}] ${e.msg}`}
                        </Text>
                    ))
                )}
            </ScrollView>
        </View>
    );
}

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#1e1f22", padding: 12 },
    toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    title: { color: "#fff", fontSize: 14, fontWeight: "700" },
    clearBtn: { backgroundColor: "#ed4245", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    clearBtnText: { color: "#fff", fontSize: 12, fontWeight: "600" },
    hint: { color: "#949ba4", fontSize: 11, marginBottom: 8 },
    scroll: { flex: 1, backgroundColor: "#111214", borderRadius: 8 },
    scrollContent: { padding: 8 },
    empty: { color: "#949ba4", fontSize: 12 },
    line: { fontSize: 11, fontFamily: "monospace", marginBottom: 4 },
});
