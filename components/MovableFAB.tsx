import React, { useRef, useState } from "react";
import { Animated, PanResponder, StyleSheet } from "react-native";
import { FAB, useTheme } from "react-native-paper";

export default function MovableFAB({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  const pan = useRef(new Animated.ValueXY({ x: 300, y: 600 })).current; // initial position
  const [dragging, setDragging] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setDragging(true),
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gesture) => {
        setDragging(false);

        // Save final position
        pan.flattenOffset();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.fabContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
    >
      <FAB
        icon="refresh"
        onPress={onPress}
        style={{
          backgroundColor: theme.colors.primary,
        }}
        color={theme.colors.onPrimary}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    bottom: 100, // initial vertical offset
    right: 20,   // initial horizontal offset
  },
});
