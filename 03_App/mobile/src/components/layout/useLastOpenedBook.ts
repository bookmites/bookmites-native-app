import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import { getValidLastOpenedBookId } from "@/db/readerSettings";

export function useLastOpenedBook() {
  const [bookId, setBookId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const id = await getValidLastOpenedBookId();
    setBookId(id);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { lastBookId: bookId, reloadLastBook: reload };
}