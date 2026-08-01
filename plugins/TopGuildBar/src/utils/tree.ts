import { findByProps, findByStoreName } from "@vendetta/metro";

const Flux = findByProps("useStateFromStores");
const ExpandedGuildFolderStore = findByStoreName("ExpandedGuildFolderStore");

export interface GuildNode {
    type: string; // "folder" | "guild" (dokładna wartość dla guild zależy od buildu, filtrujemy po != "root")
    id: string | number;
    name?: string;
    color?: number | null;
    children: GuildNode[];
}

export function useFolderExpanded(folderId: string | number): boolean {
    return Flux?.useStateFromStores?.(
        [ExpandedGuildFolderStore],
        () => {
            const folders = ExpandedGuildFolderStore?.getExpandedFolders?.();
            return folders instanceof Set ? folders.has(folderId) : false;
        },
        [folderId],
    ) ?? false;
}

export function folderColor(color?: number | null): string {
    if (color == null) return "#5865f2";
    return `#${color.toString(16).padStart(6, "0")}`;
}
