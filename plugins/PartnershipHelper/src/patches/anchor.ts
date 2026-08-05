import React from "react";
import { find, findByTypeName } from "@vendetta/metro";
import PartnershipOverlay from "../components/PartnershipOverlay";

function findGuildsBarMemo(): any {
    try {
        const mod = findByTypeName("GuildsBar");
        if (mod && typeof mod === "object" && "type" in mod) return mod;
    } catch (e) {
        console.log("[PartnershipHelper] findByTypeName error:", e);
    }
    try {
        return find((m) => {
            try { return m?.type?.name === "GuildsBar" || m?.type?.displayName === "GuildsBar"; } catch { return false; }
        });
    } catch (e) {
        console.log("[PartnershipHelper] find fallback error:", e);
    }
    return null;
}

/**
 * Dopisuje PartnershipOverlay obok normalnego GuildsBar (nie zastępuje go —
 * ten plugin ma współistnieć z domyślnym paskiem serwerów, ewentualnie
 * z naszym TopGuildBar). Renderuje oba przez React.Fragment.
 */
export function patchAnchor(cleanups: (() => void)[]): boolean {
    try {
        const memoObj = findGuildsBarMemo();
        if (!memoObj?.type) {
            console.log("[PartnershipHelper] GuildsBar (memo) nie znaleziony");
            return false;
        }
        const origRender = memoObj.type;

        memoObj.type = function GuildsBarWithOverlay(...args: any[]) {
            const original = origRender.apply(this, args);
            return React.createElement(React.Fragment, null, original, React.createElement(PartnershipOverlay));
        };

        cleanups.push(() => { memoObj.type = origRender; });
        console.log("[PartnershipHelper] PATCH: overlay dopięty do GuildsBar");
        return true;
    } catch (e) {
        console.log("[PartnershipHelper] patchAnchor() wywalił się:", e);
        return false;
    }
}
