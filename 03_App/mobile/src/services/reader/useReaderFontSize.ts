import { useCallback, useEffect, useMemo, useState } from "react";
import type { Preferences } from "react-native-readium";

import { getReaderFontSizeTier, setReaderFontSizeTier } from "@/db/readerSettings";

import {
  DEFAULT_READER_FONT_SIZE_TIER,
  isReaderFontSizeTier,
  readerFontSizeToPreferences,
  type ReaderFontSizeTier,
} from "./readerFontSizeTier";

export function useReaderFontSize() {
  const [tier, setTierState] = useState<ReaderFontSizeTier>(DEFAULT_READER_FONT_SIZE_TIER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void getReaderFontSizeTier()
      .then((stored) => {
        if (cancelled) {
          return;
        }
        setTierState(isReaderFontSizeTier(stored) ? stored : DEFAULT_READER_FONT_SIZE_TIER);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setTier = useCallback(async (next: ReaderFontSizeTier) => {
    setTierState(next);
    await setReaderFontSizeTier(next);
  }, []);

  const preferences: Preferences = useMemo(
    () => readerFontSizeToPreferences(tier),
    [tier],
  );

  return { tier, setTier, preferences, loading };
}