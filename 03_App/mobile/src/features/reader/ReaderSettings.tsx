import { StyleSheet, View } from "react-native";

import { spacing } from "@/design/tokens";
import type { ReaderFontSizeTier } from "@/services";

import { TextSizeBlock } from "./TextSizeBlock";

type ReaderSettingsProps = {
  fontSizeTier: ReaderFontSizeTier;
  onFontSizeTierChange: (tier: ReaderFontSizeTier) => void;
};

export function ReaderSettings({ fontSizeTier, onFontSizeTierChange }: ReaderSettingsProps) {
  return (
    <View style={styles.root}>
      <TextSizeBlock tier={fontSizeTier} onTierChange={onFontSizeTierChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.lg,
  },
});