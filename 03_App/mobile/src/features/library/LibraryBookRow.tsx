import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import type { BookRow } from "@/db/schema";
import { colors, spacing } from "@/design/tokens";

type LibraryBookRowProps = {
  book: BookRow;
  onPress: (bookId: string) => void;
};

export function LibraryBookRow({ book, onPress }: LibraryBookRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(book.bookId)}
      style={(state) => [styles.row, state.pressed && styles.pressed]}
    >
      <View style={styles.textBlock}>
        <AppText variant="body" numberOfLines={2}>
          {book.title}
        </AppText>
        {book.author ? (
          <AppText variant="caption" muted numberOfLines={1}>
            {book.author}
          </AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.88,
  },
  textBlock: {
    gap: spacing.xs,
  },
});