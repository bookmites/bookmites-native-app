import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { spacing } from "@/design/tokens";

export function LibraryScreen() {
  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="title">Bookmites Library</AppText>
        <AppText variant="body" muted>
          Coming in V2!
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.md,
  },
});