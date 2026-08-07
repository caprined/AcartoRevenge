import { findByProps } from "@vendetta/metro";

export interface AlertModule {
    show(alert: any): void;
    openLazy(data: {
        importer: () => Promise<JSX.Element>;
        isDismissable?: boolean;
        hideActionSheet?: boolean;
    }): Promise<void>;
    close: () => void;
}

export const Alert: AlertModule = findByProps("show", "openLazy", "close");
