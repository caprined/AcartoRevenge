import React from "react";
import { Modal } from "react-native";
import { subscribe } from "../utils/bus";
import { log } from "../utils/logger";
import ReadScreen from "./ReadScreen";

export default function ReadScreenHost() {
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
        log("ReadScreenHost zamontowany");
        return subscribe(() => setOpen(true));
    }, []);

    if (!open) return null;

    return (
        <Modal
            transparent
            visible
            animationType="none"
            statusBarTranslucent
            onRequestClose={() => setOpen(false)}
        >
            <ReadScreen onClose={() => setOpen(false)} />
        </Modal>
    );
}
