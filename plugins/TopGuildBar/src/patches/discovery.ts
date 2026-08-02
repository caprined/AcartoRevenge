import { log } from "../utils/logger";
import { find, findByProps, findByStoreName } from "@vendetta/metro";



/**
 * Znajduje moduł renderujący pionowy pasek serwerów (GuildsBar).
 * Bazowane na sprawdzonym wzorcu z pluginu ServerDrawer.
 */
export function findGuildsBarModule(): any {
    const byName = find((m) => {
        try {
            return (
                m?.default?.type?.name === "GuildsBar" ||
                m?.default?.displayName === "GuildsBar"
            );
        } catch {
            return false;
        }
    });
    if (byName?.default) return byName;
    return null;
}

/**
 * PROBE: przeszukuje Metro w poszukiwaniu prawdopodobnego rodzica,
 * który układa [GuildsBar][MainContent] obok siebie (flexDirection: row).
 * Loguje kandydatów zamiast zgadywać na ślepo — pozwala nam potem
 * dopasować dokładny target na podstawie realnych logów z urządzenia.
 */
export function probeLayoutContainers() {
    try {
        const candidates = findByProps("AppContainer") ?? null;
        log("PROBE AppContainer:", !!candidates);

        // Szukamy komponentów, których nazwa sugeruje układ główny appki
        const nameHints = ["AppView", "Chrome", "MainTabsView", "RootView", "AppContent"];
        for (const hint of nameHints) {
            const mod = find((m) => {
                try {
                    return m?.default?.name === hint || m?.default?.displayName === hint;
                } catch {
                    return false;
                }
            });
            log(`PROBE candidate "${hint}":`, !!mod);
        }
    } catch (e) {
        log("PROBE error:", e);
    }
}

/**
 * Store z listą serwerów + folderów. Nazwa znana z web/desktop Discorda,
 * na RN może się różnić — logujemy czy w ogóle się znalazł i jaki ma kształt.
 */
export function getSortedGuildStore(): any {
    const store =
        findByStoreName("SortedGuildStore") ??
        findByStoreName("GuildsStore") ??
        null;

    if (!store) {
        log("WARN: nie znaleziono store z listą serwerów/folderów");
    } else {
        log("OK: znaleziono store", Object.keys(store));
    }
    return store;
}
