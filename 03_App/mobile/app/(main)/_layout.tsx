import { Slot } from "expo-router";
import { StyleSheet, View } from "react-native";

import { GlobalNav } from "@/components/layout/GlobalNav";

export default function MainLayout() {
  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Slot />
      </View>
      <GlobalNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});