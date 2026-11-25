import { Image, StyleSheet, View } from "react-native";

import { colors } from "@/design/tokens";

import { useBookCoverUri } from "./useBookCoverUri";

export const BOOK_COVER_WIDTH = 48;
export const BOOK_COVER_HEIGHT = 72;

type BookCoverThumbnailProps = {
  bookId: string;
};

export function BookCoverThumbnail({ bookId }: BookCoverThumbnailProps) {
  const coverUri = useBookCoverUri(bookId);

  if (!coverUri) {
    return <View style={styles.placeholder} accessibilityElementsHidden importantForAccessibility="no" />;
  }

  return <Image source={{ uri: coverUri }} style={styles.image} resizeMode="cover" />;
}

const styles = StyleSheet.create({
  placeholder: {
    width: BOOK_COVER_WIDTH,
    height: BOOK_COVER_HEIGHT,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  image: {
    width: BOOK_COVER_WIDTH,
    height: BOOK_COVER_HEIGHT,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
});