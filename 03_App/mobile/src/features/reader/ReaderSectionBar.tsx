import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { colors, spacing } from "@/design/tokens";

type ReaderSectionBarProps = {
  spineIndex: number;
  spineCount: number;
  onPrevious: () => void;
  onNext: () => void;
};

export function ReaderSectionBar({ spineIndex, spineCount, onPrevious, onNext }: ReaderSectionBarProps) {
  const atStart = spineIndex <= 0;
  const atEnd = spineIndex >= spineCount - 1;

  return (
    <View style={styles.sectionBar}>
      <Button
        label="Previous"
        variant="secondary"
        onPress={onPrevious}
        disabled={atStart}
        style={[styles.sectionButton, styles.sectionButtonOutline, atStart && styles.disabled]}
      />
      <AppText variant="caption" muted>
        {`Section ${String(spineIndex + 1)} of ${String(spineCount)}`}
      </AppText>
      <Button
        label="Next"
        variant="secondary"
        onPress={onNext}
        disabled={atEnd}
        style={[styles.sectionButton, styles.sectionButtonOutline, atEnd && styles.disabled]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.readerNavShell,
  },
  sectionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionButtonOutline: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.4,
  },
});