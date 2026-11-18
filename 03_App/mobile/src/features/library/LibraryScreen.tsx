import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { spacing } from "@/design/tokens";
import { BOOK_IDS } from "@/services";

export function LibraryScreen() {
  function openSmokeBook() {
    router.push({
      pathname: "/reader",
      params: { bookId: BOOK_IDS.fixtureSmoke },
    });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Library</AppText>
      </View>
      <View style={styles.empty}>
        <AppText variant="body" muted>
          No books yet
        </AppText>
        {__DEV__ ? (
          <Button
            label="Open smoke book"
            onPress={openSmokeBook}
            style={styles.devAction}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  devAction: {
    marginTop: spacing.md,
    minWidth: 240,
  },
});