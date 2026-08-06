import React from "react";
import { find, findByTypeName } from "@vendetta/metro";
import ReadScreenHost from "../components/ReadScreenHost";
import { log, warn, error as logError } from "../utils/logger";

const CANDIDATES = ["GuildsBar", "LaunchPadContainer"];

function findTargetMemo(): { memoObj: any; name: string } | null {
    for (const name of CANDIDATES) {
        try {
            const mod = findByTypeName(name);
            if (mod && typeof mod === "object" && "type" in mod) return { memoObj: mod, name };
        } catch (e) {
            warn(`findByTypeName(${name}) error:`, e);
        }
        try {
            const mod = find((m) => {
                try { return m?.type?.name === name || m?.type?.displayName === name; } catch { return false; }
            });
            if (mod?.type) return { memoObj: mod, name };
        } catch (e) {
            warn(`find(${name}) error:`, e);
        }
    }
    return null;
}

/**
 * WAŻNE: to NIE jest miejsce na widoczne UI. ReadScreenHost renderuje
 * `null` gdy zamknięty, więc nie ma znaczenia że ten anchor bywa
 * przycięty/niewidoczny wizualnie — kiedy Modal się otwiera, i tak
 * eskaluje do natywnej, pełnoekranowej warstwy niezależnie od tego
 * gdzie w drzewie React siedzi jego host.
 */
export function patchAnchor(cleanups: (() => void)[]): boolean {
    try {
        const found = findTargetMemo();
        if (!found) {
            warn("żaden z kandydatów-hostów nie znaleziony:", CANDIDATES.join(", "));
            return false;
        }
        const { memoObj, name } = found;
        const origRender = memoObj.type;

        memoObj.type = function PatchedWithHost(...args: any[]) {
            const original = origRender.apply(this, args);
            return React.createElement(React.Fragment, null, original, React.createElement(ReadScreenHost));
        };

        cleanups.push(() => { memoObj.type = origRender; });
        log(`PATCH: ReadScreenHost dopięty do ${name}`);
        return true;
    } catch (e) {
        logError("patchAnchor() wywalił się:", e);
        return false;
    }
}
