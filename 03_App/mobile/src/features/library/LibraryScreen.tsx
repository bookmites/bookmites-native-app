import { router } from "expo-router";
import { ActivityIndicator, FlatList, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/design/tokens";
import { BOOK_IDS } from "@/services";

import { LibraryBookRow } from "./LibraryBookRow";
import { useLibraryBooks } from "./useLibraryBooks";

export function LibraryScreen() {
  const { books, loading, importing, error, importBook } = useLibraryBooks();

  function openBook(bookId: string) {
    router.push({
      pathname: "/reader",
      params: { bookId },
    });
  }

  function openSmokeBook() {
    openBook(BOOK_IDS.fixtureSmoke);
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Library</AppText>
        <Button
          label={importing ? "Importing…" : "Add book"}
          onPress={() => void importBook()}
          disabled={importing}
          style={styles.addButton}
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  addButton: {
    alignSelf: "flex-start",
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