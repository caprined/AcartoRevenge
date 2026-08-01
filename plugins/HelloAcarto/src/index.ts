import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

export default {
    onLoad: () => {
        showToast(
            "AcartoRevenge działa! 🎉",
            getAssetIDByName("ic_information_24px"),
        );
    },
    onUnload: () => {
        // nic do sprzątania w tym prostym pluginie
    },
};
