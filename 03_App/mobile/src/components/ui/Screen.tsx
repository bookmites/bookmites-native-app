import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { colors, spacing } from "@/design/tokens";

const DEFAULT_SAFE_AREA_EDGES: Edge[] = ["top", "bottom", "left", "right"];

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  /** Omit bottom inset when a sibling (e.g. GlobalNav) already handles it. */
  safeAreaEdges?: Edge[];
  /** When false, omit bottom padding on the inner container. */
  padBottom?: boolean;
}>;

export function Screen({
  children,
  padded = true,
  safeAreaEdges = DEFAULT_SAFE_AREA_EDGES,
  padBottom = true,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={safeAreaEdges}>
      <View
        style={[
          styles.inner,
          padded && styles.paddedHorizontal,
          padded && styles.paddedTop,
          padded && padBottom && styles.paddedBottom,
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
  },
  paddedHorizontal: {
    paddingHorizontal: spacing.lg,
  },
  paddedTop: {
    paddingTop: spacing.md,
  },
  paddedBottom: {
    paddingBottom: spacing.md,
  },
});