import { router, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { BookList } from "@/components/BookLists";
import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { colors, spacing } from "@/design/tokens";

import { useHomeBooks } from "./useHomeBooks";

const GEAR_HIT_SIZE = 44;

export function HomeScreen() {
  const { books, loading, importing, error, importBook } = useHomeBooks();

  function openBook(bookId: string) {
    router.push({
      pathname: "/reader",
      params: { bookId },
    });
  }

  function openSettings() {
    router.push("/settings" as Href);
  }

  const addBookFooter = (
    <Button
      label={importing ? "Importing…" : "Add book"}
      variant="secondary"
      onPress={() => void importBook()}
      disabled={importing}
      style={styles.addBookFooter}
    />
  );

  return (
    <Screen safeAreaEdges={["top", "left", "right"]} padBottom={false}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <AppText variant="title">Home</AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={openSettings}
            style={({ pressed }) => [styles.gearButton, pressed && styles.gearPressed]}
            hitSlop={spacing.sm}
          >
            <Ionicons name="cog" size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}

        <BookList
          books={books}
          loading={loading}
          onBookPress={openBook}
          ListFooterComponent={addBookFooter}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  gearButton: {
    width: GEAR_HIT_SIZE,
    height: GEAR_HIT_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  gearPressed: {
    opacity: 0.88,
  },
  error: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  addBookFooter: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
  },
});