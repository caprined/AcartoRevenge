import { storage } from "@vendetta/plugin";

export interface PartnerlyEntry {
  userId: string;
  guildId: string;
  guildName: string;
  channelId: string;
  serverLink: string;
  timestamp: number;
  foundAt: number;
  displayName?: string;
  username?: string;
  avatar?: string | null;
}

export interface PartnerlyConfig {
  defaultMessage: string;
  autoOpenDM: boolean;
  autoSend: boolean;
  sortMode: "newest" | "name" | "online";
  filterMode: "all" | "online";
}

function ensureEntries(): Record<string, PartnerlyEntry> {
  if (!storage.partnerlyProEntries || typeof storage.partnerlyProEntries !== "object") {
    storage.partnerlyProEntries = {};
  }
  return storage.partnerlyProEntries as Record<string, PartnerlyEntry>;
}

export function ensureConfig(): PartnerlyConfig {
  const value = storage.partnerlyProConfig as Partial<PartnerlyConfig> | undefined;
  const next: PartnerlyConfig = {
    defaultMessage: value?.defaultMessage ?? "Cześć! Chciałbym się z Tobą skontaktować w sprawie współpracy.",
    autoOpenDM: value?.autoOpenDM ?? true,
    autoSend: value?.autoSend ?? false,
    sortMode: value?.sortMode ?? "newest",
    filterMode: value?.filterMode ?? "all",
  };
  storage.partnerlyProConfig = next;
  return next;
}

export function addEntry(entry: PartnerlyEntry): boolean {
  const entries = ensureEntries();
  if (entries[entry.userId]) return false;
  entries[entry.userId] = entry;
  return true;
}

export function updateEntry(entry: PartnerlyEntry) {
  const entries = ensureEntries();
  entries[entry.userId] = entry;
}

export function removeEntry(userId: string) {
  const entries = ensureEntries();
  delete entries[userId];
}

export function clearEntries() {
  storage.partnerlyProEntries = {};
}

export function getEntries(): PartnerlyEntry[] {
  const entries = ensureEntries();
  return Object.values(entries).sort((a, b) => b.foundAt - a.foundAt);
}

export function getConfig(): PartnerlyConfig {
  return ensureConfig();
}

export function setConfig(next: Partial<PartnerlyConfig>) {
  const current = ensureConfig();
  storage.partnerlyProConfig = { ...current, ...next };
  return storage.partnerlyProConfig as PartnerlyConfig;
}

export function hasEntry(userId: string): boolean {
  return !!ensureEntries()[userId];
}
