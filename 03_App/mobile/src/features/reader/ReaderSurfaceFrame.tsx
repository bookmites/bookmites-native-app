import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";

import {
  colors,
  readerNavSurfaceRadius,
  readerNavSurfaceScale,
  readerNavSurfaceShadow,
} from "@/design/tokens";

type ReaderSurfaceFrameProps = {
  progress: SharedValue<number>;
  children: ReactNode;
};

export function ReaderSurfaceFrame({ progress, children }: ReaderSurfaceFrameProps) {
  const shellStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.background, colors.readerNavShell]),
  }));

  const cardShadowStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(progress.value, [0, 1], [1, readerNavSurfaceScale]),
      },
    ],
    borderRadius: interpolate(progress.value, [0, 1], [0, readerNavSurfaceRadius]),
    shadowOpacity: interpolate(progress.value, [0, 1], [0, readerNavSurfaceShadow.opacity]),
    elevation: interpolate(progress.value, [0, 1], [0, readerNavSurfaceShadow.elevation]),
  }));

  const cardClipStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(progress.value, [0, 1], [0, readerNavSurfaceRadius]),
  }));

  return (
    <Animated.View style={[styles.shell, shellStyle]}>
      <Animated.View style={[styles.cardShadow, cardShadowStyle]}>
        <Animated.View style={[styles.card, cardClipStyle]}>{children}</Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cardShadow: {
    flex: 1,
    alignSelf: "stretch",
    backgroundColor: colors.surface,
    shadowColor: readerNavSurfaceShadow.color,
    shadowOffset: readerNavSurfaceShadow.offset,
    shadowRadius: readerNavSurfaceShadow.radius,
  },
  card: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
});