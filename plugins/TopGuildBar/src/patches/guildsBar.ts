import React from "react";
import { find, findByName } from "@vendetta/metro";
import { registerIntercept } from "./createElementIntercept";
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
 * Zamienia GuildsBar (pionowy pasek) na nasz poziomy HorizontalTopBar.
 * Całość owinięta w try/catch — jeśli coś tu wybuchnie, plugin ma zostać
 * przy DOMYŚLNYM pasku zamiast zawiesić cały onLoad w połowie roboty.
 */
export function patchGuildsBar(cleanups: (() => void)[]): boolean {
    try {
        const mod = findGuildsBarModule();
        if (!mod?.default) {
            warn("GuildsBar nie znaleziony — zobacz zakładkę Configure tego pluginu");
            return false;
        }
        const orig = mod.default;

        registerIntercept(orig, HorizontalTopBar);

        mod.default = function TopGuildBarPatch() {
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
