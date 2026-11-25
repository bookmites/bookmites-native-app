import { Ionicons } from "@expo/vector-icons";
import { router, usePathname, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { colors, spacing, typography } from "@/design/tokens";

import { useLastOpenedBook } from "./useLastOpenedBook";

type NavItemConfig = {
  key: string;
  label: string;
  href: Href;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  match: (pathname: string) => boolean;
  onPress?: () => void;
};

const HOME_HREF = "/" as Href;
const LIBRARY_HREF = "/bookmites-library" as Href;
const NOTEBOOK_HREF = "/notebook" as Href;

function normalizePath(pathname: string): string {
  if (pathname === "" || pathname === "/") {
    return "/";
  }
  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isHomePath(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  return normalized === "/" || normalized === "/index";
}

function NavItem({
  label,
  active,
  icon,
  iconActive,
  onPress,
}: {
  label: string;
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  const tint = active ? colors.textPrimary : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={styles.navItem}
    >
      <Ionicons name={active ? iconActive : icon} size={22} color={tint} />
      <AppText variant="caption" style={[styles.navLabel, { color: tint }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function GlobalNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { lastBookId } = useLastOpenedBook();

  const items: NavItemConfig[] = [];

  if (lastBookId) {
    items.push({
      key: "last",
      label: "Last",
      href: "/reader",
      icon: "book-outline",
      iconActive: "book",
      match: () => false,
      onPress: () => {
        router.push({
          pathname: "/reader",
          params: { bookId: lastBookId },
        });
      },
    });
  }

  items.push(
    {
      key: "home",
      label: "Home",
      href: HOME_HREF,
      icon: "home-outline",
      iconActive: "home",
      match: isHomePath,
    },
    {
      key: "library",
      label: "Library",
      href: LIBRARY_HREF,
      icon: "library-outline",
      iconActive: "library",
      match: (path) => normalizePath(path) === "/bookmites-library",
    },
    {
      key: "notebook",
      label: "Notebook",
      href: NOTEBOOK_HREF,
      icon: "document-text-outline",
      iconActive: "document-text",
      match: (path) => normalizePath(path) === "/notebook",
    },
  );

  function onNavPress(item: NavItemConfig) {
    if (item.onPress) {
      item.onPress();
      return;
    }
    const normalizedPath = normalizePath(pathname);
    if (item.match(normalizedPath)) {
      return;
    }
    router.replace(item.href);
  }

  return (
    <View
      style={[
        styles.bar,
        {
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}
    >
      {items.map((item) => (
        <NavItem
          key={item.key}
          label={item.label}
          active={item.match(pathname)}
          icon={item.icon}
          iconActive={item.iconActive}
          onPress={() => onNavPress(item)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  navLabel: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
});