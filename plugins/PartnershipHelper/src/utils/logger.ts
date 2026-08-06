export interface LogEntry {
    time: string;
    msg: string;
    level: "log" | "warn" | "error";
}

const buffer: LogEntry[] = [];
const listeners = new Set<() => void>();
const MAX_ENTRIES = 400;

function stringifyArg(a: any): string {
    if (typeof a === "string") return a;
    if (a instanceof Error) return `${a.name}: ${a.message}`;
    try {
        return JSON.stringify(a);
    } catch {
        return String(a);
    }
}

function push(level: LogEntry["level"], args: any[]) {
    const msg = args.map(stringifyArg).join(" ");
    buffer.push({ time: new Date().toLocaleTimeString(), msg, level });
    if (buffer.length > MAX_ENTRIES) buffer.shift();
    for (const fn of listeners) {
        try { fn(); } catch { /* ignore listener errors */ }
    }
}

export function log(...args: any[]) {
    try { console.log("[TopGuildBar]", ...args); } catch { /* console may not exist */ }
    push("log", args);
}

export function warn(...args: any[]) {
    try { console.warn("[TopGuildBar]", ...args); } catch { /* ignore */ }
    push("warn", args);
}

export function error(...args: any[]) {
    try { console.error("[TopGuildBar]", ...args); } catch { /* ignore */ }
    push("error", args);
}

export function getLogs(): LogEntry[] {
    return buffer.slice();
}

export function clearLogs() {
    buffer.length = 0;
    for (const fn of listeners) {
        try { fn(); } catch { /* ignore */ }
    }
}

export function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}
