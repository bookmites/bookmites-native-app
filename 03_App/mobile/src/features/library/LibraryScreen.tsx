import { router } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/design/tokens";
import {
  BOOK_IDS,
  isReaderFontSizeTier,
  useReaderFontSize,
  type ReaderFontSizeTier,
} from "@/services";
import { ReaderSettingsModal } from "@/features/reader/ReaderSettingsModal";

import { LibraryBookRow } from "./LibraryBookRow";
import { useLibraryBooks } from "./useLibraryBooks";

export function LibraryScreen() {
  const { books, loading, importing, error, importBook } = useLibraryBooks();
  const { tier, setTier } = useReaderFontSize();
  const [settingsOpen, setSettingsOpen] = useState(false);

  function openBook(bookId: string) {
    router.push({
      pathname: "/reader",
      params: { bookId },
    });
  }

  function openSmokeBook() {
    openBook(BOOK_IDS.fixtureSmoke);
  }

  const onFontSizeTierChange = useCallback(
    (next: ReaderFontSizeTier) => {
      void setTier(next);
    },
    [setTier],
  );

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={styles.header}>
          <AppText variant="title">Library</AppText>
          <Button
            label={importing ? "Importing…" : "Add book"}
            onPress={() => void importBook()}
            disabled={importing}
            style={styles.addButton}
          />
        </View>
        <Button
          label="Settings"
          variant="secondary"
          onPress={() => setSettingsOpen(true)}
          style={styles.settingsButton}
        />
      </View>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.bookId}
          renderItem={({ item }) => (
            <LibraryBookRow book={item} onPress={openBook} />
          )}
          contentContainerStyle={books.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <AppText variant="body" muted style={styles.emptyText}>
              No books yet
            </AppText>
          }
        />
      )}

      {__DEV__ ? (
        <Button
          label="Open smoke book"
          variant="secondary"
          onPress={openSmokeBook}
          style={styles.devAction}
        />
      ) : null}

      <ReaderSettingsModal
        visible={settingsOpen}
        fontSizeTier={tier}
        onClose={() => setSettingsOpen(false)}
        onFontSizeTierChange={(value) => {
          if (isReaderFontSizeTier(value)) {
            onFontSizeTierChange(value);
          }
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  header: {
    flex: 1,
    gap: spacing.md,
  },
  addButton: {
    alignSelf: "flex-start",
  },
  settingsButton: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    textAlign: "center",
  },
  devAction: {
    marginTop: spacing.lg,
  },
});