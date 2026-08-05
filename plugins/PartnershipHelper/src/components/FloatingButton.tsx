import React from "react";
import { Animated, PanResponder, Text, StyleSheet } from "react-native";

interface Props {
    label: string;
    initialX: number;
    initialY: number;
    active?: boolean;
    onPress: () => void;
}

const SIZE = 56;

export default function FloatingButton({ label, initialX, initialY, active, onPress }: Props) {
    const pan = React.useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
    const dragging = React.useRef(false);
    const moved = React.useRef(false);

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                dragging.current = true;
                moved.current = false;
                pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
                pan.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: (_evt, gesture) => {
                if (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4) moved.current = true;
                Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(_evt, gesture);
            },
            onPanResponderRelease: () => {
                dragging.current = false;
                pan.flattenOffset();
                if (!moved.current) onPress();
            },
        }),
    ).current;

    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                st.button,
                active ? st.buttonActive : null,
                { transform: pan.getTranslateTransform() },
            ]}
        >
            <Text style={st.label}>{label}</Text>
        </Animated.View>
    );
}

const st = StyleSheet.create({
    button: {
        position: "absolute",
        width: SIZE,
        height: SIZE,
        borderRadius: SIZE / 2,
        backgroundColor: "#5865f2",
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.4,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        zIndex: 999,
    },
    buttonActive: {
        backgroundColor: "#da373c",
    },
    label: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
        textAlign: "center",
        paddingHorizontal: 4,
    },
});
