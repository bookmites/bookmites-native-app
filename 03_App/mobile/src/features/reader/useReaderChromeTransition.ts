import { useEffect } from "react";
import { useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";

import { readerChromeTransitionMs } from "@/design/tokens";

import type { ReaderChromeMode } from "./useReaderChromeMode";

export function useReaderChromeTransition(chromeMode: ReaderChromeMode): SharedValue<number> {
  const progress = useSharedValue(chromeMode === "nav" ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(chromeMode === "nav" ? 1 : 0, {
      duration: readerChromeTransitionMs,
    });
  }, [chromeMode, progress]);

  return progress;
}