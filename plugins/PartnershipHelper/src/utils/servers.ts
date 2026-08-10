import { storage } from "@vendetta/plugin";

export interface PartnerServer {
    id: string;
    name: string;
    adText: string;
    channelLink: string;
    guildId: string | null;
    channelId: string | null;
    enabled: boolean;
    order: number;
}

function ensure() {
    if (!storage.partnerServers || typeof storage.partnerServers !== "object") {
        storage.partnerServers = {};
    }
    return storage.partnerServers as Record<string, PartnerServer>;
}

/** Parsuje link typu https://discord.com/channels/{guildId}/{channelId} */
export function parseChannelLink(link: string): { guildId: string; channelId: string } | null {
    if (!link) return null;
    const m = link.match(/discord(?:app)?\.com\/channels\/(\d+)\/(\d+)/);
    if (!m) return null;
    return { guildId: m[1], channelId: m[2] };
}

export function getServers(): PartnerServer[] {
    const servers = ensure();
    return Object.values(servers).sort((a, b) => a.order - b.order);
}

export function getServer(id: string): PartnerServer | null {
    return ensure()[id] ?? null;
}

export function getServerByGuildId(guildId: string): PartnerServer | null {
    return getServers().find((s) => s.guildId === guildId) ?? null;
}

function nextOrder(): number {
    const servers = getServers();
    return servers.length ? servers[servers.length - 1].order + 1 : 0;
}

export function addServer(data: { name: string; adText: string; channelLink: string }): PartnerServer {
    const servers = ensure();
    const parsed = parseChannelLink(data.channelLink);
    const id = `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const entry: PartnerServer = {
        id,
        name: data.name,
        adText: data.adText,
        channelLink: data.channelLink,
        guildId: parsed?.guildId ?? null,
        channelId: parsed?.channelId ?? null,
        enabled: true,
        order: nextOrder(),
    };
    servers[id] = entry;
    return entry;
}

export function updateServer(id: string, data: { name: string; adText: string; channelLink: string }) {
    const servers = ensure();
    const existing = servers[id];
    if (!existing) return;
    const parsed = parseChannelLink(data.channelLink);
    servers[id] = {
        ...existing,
        name: data.name,
        adText: data.adText,
        channelLink: data.channelLink,
        guildId: parsed?.guildId ?? existing.guildId,
        channelId: parsed?.channelId ?? existing.channelId,
    };
}

export function deleteServer(id: string) {
    const servers = ensure();
    delete servers[id];
}

export function toggleServer(id: string) {
    const servers = ensure();
    if (servers[id]) servers[id].enabled = !servers[id].enabled;
}

export function moveServer(id: string, direction: -1 | 1) {
    const list = getServers();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) return;
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= list.length) return;

    const servers = ensure();
    const a = list[idx];
    const b = list[swapIdx];
    const tmpOrder = a.order;
    servers[a.id].order = b.order;
    servers[b.id].order = tmpOrder;
}
