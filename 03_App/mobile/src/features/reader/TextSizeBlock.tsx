import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { SelectButtonRow } from "@/components/ui/selectbutton";
import { spacing } from "@/design/tokens";
import {
  READER_FONT_SIZE_LABELS,
  READER_FONT_SIZE_TIERS,
  type ReaderFontSizeTier,
} from "@/services";

type TextSizeBlockProps = {
  tier: ReaderFontSizeTier;
  onTierChange: (tier: ReaderFontSizeTier) => void;
};

const OPTIONS = READER_FONT_SIZE_TIERS.map((value) => ({
  value,
  label: READER_FONT_SIZE_LABELS[value],
}));

export function TextSizeBlock({ tier, onTierChange }: TextSizeBlockProps) {
  return (
    <View style={styles.block}>
      <AppText variant="body" style={styles.label}>
        Font size
      </AppText>
      <SelectButtonRow
        options={OPTIONS}
        selectionMode="single"
        selectedValues={[tier]}
        onSelectionChange={(values) => {
          const next = values[0];
          if (next && values.length === 1) {
            onTierChange(next as ReaderFontSizeTier);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: spacing.md,
  },
  label: {
    fontWeight: "600",
  },
});