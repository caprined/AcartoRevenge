import React from "react";
import { View, Modal, StyleSheet } from "react-native";
import { findByProps } from "@vendetta/metro";
import { before, after } from "@vendetta/patcher";
import { Forms } from "@vendetta/ui/components";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import SettingsScreen from "./components/SettingsScreen";
import PartnerlyPanel from "./components/PartnerlyPanel";
import { getConfig } from "./utils/store";
import { log, warn } from "./utils/logger";
import { startRecording, stopRecording, isRecording, getSessionAddedCount } from "./utils/recorder";

const LazyActionSheet = findByProps("openLazy", "hideActionSheet");
const ActionSheetRow = findByProps("ActionSheetRow")?.ActionSheetRow ?? Forms.FormRow;
const cleanups: (() => void)[] = [];
const patchedInstances = new Set<any>();
let persistentToastInterval: ReturnType<typeof setInterval> | null = null;

function stopLiveToast() {
  if (persistentToastInterval) {
    clearInterval(persistentToastInterval);
    persistentToastInterval = null;
  }
}

function startLiveToast() {
  stopLiveToast();
  showToast(`Load New: ${getSessionAddedCount()} wpisów`, getAssetIDByName("ic_refresh_24px"));
  persistentToastInterval = setInterval(() => {
    if (!isRecording()) {
      stopLiveToast();
      return;
    }
    showToast(`Load New: ${getSessionAddedCount()} wpisów`, getAssetIDByName("ic_refresh_24px"));
  }, 3000);
}

export default {
  onLoad() {
    log("PartnerlyPro onLoad");
    try {
      const ok = patchMessageMenu(cleanups);
      if (!ok) {
        showToast("PartnerlyPro: menu patch failed", getAssetIDByName("ic_warning_24px"));
      } else {
        showToast("PartnerlyPro załadowany", getAssetIDByName("ic_information_24px"));
      }
    } catch (e) {
      warn("onLoad error:", e);
    }
  },
  onUnload() {
    for (const fn of cleanups) {
      try { fn(); } catch (e) { warn("cleanup error:", e); }
    }
    cleanups.length = 0;
    stopLiveToast();
    stopRecording();
  },
  settings: SettingsScreen,
};

export function patchMessageMenu(cleanups: (() => void)[]): boolean {
  if (!LazyActionSheet?.openLazy) {
    warn("LazyActionSheet not found");
    return false;
  }

  const unpatchOpen = before("openLazy", LazyActionSheet, ([component, key]: any[]) => {
    if (typeof key !== "string" || !key.endsWith("MessageLongPressActionSheet")) return;
    if (!component?.then) return;

    component.then((instance: any) => {
      if (patchedInstances.has(instance)) return;
      patchedInstances.add(instance);

      after("default", instance, (_args: any, res: any) => {
        try {
          const existing = Array.isArray(res?.props?.children)
            ? res.props.children
            : (res?.props?.children ? [res.props.children] : []);

          if (existing.some((b: any) => typeof b?.key === "string" && b.key.startsWith("partnerlypro"))) return;

          const MenuWrapper = () => {
            const [panelOpen, setPanelOpen] = React.useState(false);
            const config = getConfig();

            const copyAd = () => {
              const text = config.defaultMessage || "Brak tekstu reklamowego";
              try {
                // @ts-ignore
                navigator.clipboard.writeText(text);
                showToast("Skopiowano AD do schowka", getAssetIDByName("ic_content_copy_24px"));
              } catch {
                showToast("Nie udało się skopiować AD", getAssetIDByName("ic_warning_24px"));
              }
            };

            const loadNew = () => {
              if (isRecording()) {
                stopRecording();
                stopLiveToast();
                showToast("Load New zatrzymane", getAssetIDByName("ic_stop_24px"));
                return;
              }

              startRecording();
              startLiveToast();
            };

            return (
              <>
                {existing}
                <ActionSheetRow
                  key="partnerlypro-copy-ad"
                  label="Copy AD"
                  icon={<ActionSheetRow.Icon source={getAssetIDByName("ic_content_copy_24px")} />}
                  onPress={copyAd}
                />
                <ActionSheetRow
                  key="partnerlypro-panel"
                  label="Panel"
                  icon={<ActionSheetRow.Icon source={getAssetIDByName("ic_apps_24px")} />}
                  onPress={() => setPanelOpen(true)}
                />
                <ActionSheetRow
                  key="partnerlypro-load-new"
                  label="Load New"
                  icon={<ActionSheetRow.Icon source={getAssetIDByName("ic_refresh_24px")} />}
                  onPress={loadNew}
                />

                <Modal
                  visible={panelOpen}
                  transparent
                  animationType="slide"
                  onRequestClose={() => setPanelOpen(false)}
                >
                  <View style={styles.modalBackdrop}>
                    <View style={styles.modalSheet}>
                      <PartnerlyPanel onClose={() => setPanelOpen(false)} />
                    </View>
                  </View>
                </Modal>
              </>
            );
          };

          instance.default = MenuWrapper;
          log("PartnerlyPro: menu patched");
        } catch (e) {
          warn("partnerly menu patch failed:", e);
        }
      });
    }).catch((e: any) => warn("component.then() error:", e));
  });

  cleanups.push(() => {
    unpatchOpen();
    patchedInstances.clear();
  });

  log("PartnerlyPro: hook installed");
  return true;
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#111418",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: "82%",
    minHeight: "48%",
  },
});
