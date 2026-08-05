import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";
import FloatingButton from "./FloatingButton";
import ReadScreen from "./ReadScreen";
import { startRecording, stopRecording, isRecording } from "../utils/recorder";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

export default function PartnershipOverlay() {
    const [recording, setRecording] = React.useState(isRecording());
    const [readOpen, setReadOpen] = React.useState(false);

    const toggleRecording = () => {
        if (recording) {
            stopRecording();
            setRecording(false);
            showToast("Review zatrzymany", getAssetIDByName("ic_information_24px"));
        } else {
            startRecording();
            setRecording(true);
            showToast("Review włączony — scrolluj kanał", getAssetIDByName("ic_information_24px"));
        }
    };

    return (
        <View style={st.root} pointerEvents="box-none">
            <FloatingButton
                label="Stwórz review"
                initialX={SCREEN_W - 76}
                initialY={SCREEN_H - 220}
                active={recording}
                onPress={toggleRecording}
            />
            <FloatingButton
                label="Odczyt"
                initialX={SCREEN_W - 76}
                initialY={SCREEN_H - 150}
                onPress={() => setReadOpen(true)}
            />
            {readOpen && <ReadScreen onClose={() => setReadOpen(false)} />}
        </View>
    );
}

const st = StyleSheet.create({
    root: {
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 998,
    },
});
