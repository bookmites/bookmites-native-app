import type { DecorationGroup, Locator, SelectionAction } from "react-native-readium";

import type { BookQuoteRow } from "@/db/schema";

export const BOOK_QUOTE_DECORATION_GROUP = "bookmite-highlights" as const;
export const READER_HIGHLIGHT_ACTION_ID = "bookmite-highlight" as const;

const HIGHLIGHT_TINT = "rgba(255, 214, 102, 0.55)";

export function parseQuoteLocator(locatorJson: string): Locator | null {
  try {
    return JSON.parse(locatorJson) as Locator;
  } catch {
    console.warn("Skipping BookQuote with corrupt locator_json");
    return null;
  }
}

export function bookQuotesToDecorationGroup(
  quotes: BookQuoteRow[],
  activeQuoteId?: string | null,
): DecorationGroup {
  const decorations = quotes.flatMap((quote) => {
    const locator = parseQuoteLocator(quote.locatorJson);
    if (!locator) {
      return [];
    }

    return [
      {
        id: quote.quoteId,
        locator,
        style: {
          type: "highlight",
          tint: HIGHLIGHT_TINT,
          isActive: activeQuoteId === quote.quoteId,
        },
        extras: { snippet: quote.snippet },
      },
    ];
  });

  return {
    name: BOOK_QUOTE_DECORATION_GROUP,
    decorations,
  };
}

export const readerHighlightSelectionActions: SelectionAction[] = [
  { id: READER_HIGHLIGHT_ACTION_ID, label: "Highlight" },
];