import { router, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { ReaderSettingsModal } from "@/features/reader/ReaderSettingsModal";
import { spacing } from "@/design/tokens";
import {
  isReaderFontSizeTier,
  useReaderFontSize,
  type ReaderFontSizeTier,
} from "@/services";

import { SettingsLineItem } from "./SettingsLineItem";

export function SettingsScreen() {
  const { tier, setTier } = useReaderFontSize();
  const [readerSettingsOpen, setReaderSettingsOpen] = useState(false);

  const onFontSizeTierChange = useCallback(
    (next: ReaderFontSizeTier) => {
      void setTier(next);
    },
    [setTier],
  );

  return (
    <Screen>
      <View style={styles.header}>
        <AppText variant="title">Settings</AppText>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </View>

      <View style={styles.list}>
        <SettingsLineItem
          title="Reader Settings"
          description="Adjust the UI for your reading experience."
          onPress={() => setReaderSettingsOpen(true)}
        />
        <SettingsLineItem
          title="Your Reading Data"
          description="Data about your reading location, and more."
          onPress={() => router.push("/data" as Href)}
        />
      </View>

      <ReaderSettingsModal
        visible={readerSettingsOpen}
        fontSizeTier={tier}
        onClose={() => setReaderSettingsOpen(false)}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  list: {
    gap: 0,
  },
});