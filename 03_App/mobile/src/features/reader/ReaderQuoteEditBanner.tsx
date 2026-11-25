import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { spacing } from "@/design/tokens";

type ReaderQuoteEditBannerProps = {
  onCancel: () => void;
};

export function ReaderQuoteEditBanner({ onCancel }: ReaderQuoteEditBannerProps) {
  return (
    <View style={styles.banner}>
      <AppText variant="caption" style={styles.bannerText}>
        Select the passage you want, then tap Highlight to update this quote.
      </AppText>
      <Button label="Cancel" variant="secondary" onPress={onCancel} style={styles.bannerButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  bannerText: {
    flex: 1,
  },
  bannerButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});