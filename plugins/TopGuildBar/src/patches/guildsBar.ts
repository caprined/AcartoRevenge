import React from "react";
import { find, findByName } from "@vendetta/metro";
import HorizontalTopBar from "../components/HorizontalTopBar";
import { log, warn, error as logError } from "../utils/logger";

function findGuildsBarModule(): any {
    try {
        const byName = findByName("GuildsBar");
        if (byName) return { default: byName };
    } catch (e) {
        warn("findByName(GuildsBar) rzucił błąd:", e);
    }

    try {
        let mod = find((m) => {
            try { return m?.default?.type?.name === "GuildsBar"; } catch { return false; }
        });
        if (mod?.default) return mod;

        mod = find((m) => {
            try { return m?.default?.displayName === "GuildsBar"; } catch { return false; }
        });
        if (mod?.default) return mod;
    } catch (e) {
        warn("find(GuildsBar) rzucił błąd:", e);
    }

    return null;
}

/**
 * Jedyne miejsce, które w praktyce niezawodnie się przemontowuje (przy
 * zmianie serwera) — więc tu renderujemy nasz pasek. Bez Modal (blokował
 * dotyk na Androidzie), bez wymuszania pełnej szerokości (rodzic i tak
 * przycina do swojej naturalnej, wąskiej szerokości — nie da się tego
 * ominąć bez patcha rodzica, którego nie znaleźliśmy bez devtoolsów).
 */
export function patchGuildsBar(cleanups: (() => void)[]): boolean {
    try {
        const mod = findGuildsBarModule();
        if (!mod?.default) {
            warn("GuildsBar nie znaleziony — zobacz zakładkę Configure tego pluginu");
            return false;
        }
        const orig = mod.default;

        mod.default = function TopGuildBarPatch() {
            log("TopGuildBarPatch() wywołany");
            return React.createElement(HorizontalTopBar);
        };
        mod.default.displayName = "GuildsBar";

        cleanups.push(() => { mod.default = orig; });
        log("PATCH: GuildsBar zastąpiony przez HorizontalTopBar");
        return true;
    } catch (e) {
        logError("patchGuildsBar() wywalił się:", e);
        return false;
    }
}
