import { StyleSheet, View, type ViewStyle } from "react-native";
import { ReadiumView, type ReadiumProps } from "react-native-readium";

export type ReaderSurfaceProps = Pick<
  ReadiumProps,
  "file" | "preferences" | "onLocationChange" | "onPublicationReady" | "onPublicationError"
> & {
  style?: ViewStyle;
};

/**
 * App-owned reader surface; only `services/reader` imports react-native-readium.
 */
export function ReaderSurface({
  style,
  file,
  preferences,
  onLocationChange,
  onPublicationReady,
  onPublicationError,
}: ReaderSurfaceProps) {
  return (
    <View style={[styles.container, style]}>
      <ReadiumView
        style={styles.view}
        file={file}
        preferences={preferences}
        onLocationChange={onLocationChange}
        onPublicationReady={onPublicationReady}
        onPublicationError={onPublicationError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  view: {
    flex: 1,
  },
});