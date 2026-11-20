import { memo } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import {
  ReadiumView,
  type DecorationGroup,
  type ReadiumProps,
  type SelectionAction,
} from "react-native-readium";

export type ReaderSurfaceProps = Pick<
  ReadiumProps,
  | "file"
  | "preferences"
  | "onLocationChange"
  | "onPublicationReady"
  | "onPublicationError"
  | "onSelectionAction"
  | "onSelectionChange"
  | "onDecorationActivated"
> & {
  style?: ViewStyle;
  decorations?: DecorationGroup[];
  selectionActions?: SelectionAction[];
};

/**
 * App-owned reader surface; only `services/reader` imports react-native-readium.
 */
export const ReaderSurface = memo(function ReaderSurface({
  style,
  file,
  preferences,
  decorations,
  selectionActions,
  onLocationChange,
  onPublicationReady,
  onPublicationError,
  onDecorationActivated,
  onSelectionChange,
  onSelectionAction,
}: ReaderSurfaceProps) {
  return (
    <View style={[styles.container, style]}>
      <ReadiumView
        style={styles.view}
        file={file}
        preferences={preferences}
        decorations={decorations}
        selectionActions={selectionActions}
        onLocationChange={onLocationChange}
        onPublicationReady={onPublicationReady}
        onPublicationError={onPublicationError}
        onDecorationActivated={onDecorationActivated}
        onSelectionChange={onSelectionChange}
        onSelectionAction={onSelectionAction}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  view: {
    flex: 1,
  },
});