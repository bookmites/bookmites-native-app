import { useEffect, useState } from "react";

import { resolveBookCoverUri } from "@/services/library";

export function useBookCoverUri(bookId: string) {
  const [coverUri, setCoverUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setCoverUri(null);

    void resolveBookCoverUri(bookId).then((uri) => {
      if (active) {
        setCoverUri(uri);
      }
    });

    return () => {
      active = false;
    };
  }, [bookId]);

  return coverUri;
}