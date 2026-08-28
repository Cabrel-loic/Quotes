import { fallbackQuotes } from "@/data/fallbackQuotes";
import { epochDay } from "@/lib/date";
import type { Quote } from "@/types/quote";

const API_URL = "https://dummyjson.com/quotes";

function offlineQuote(seed: number): Quote {
  const quote = fallbackQuotes[Math.abs(seed) % fallbackQuotes.length];
  return { ...quote, source: "offline" };
}

export async function fetchDailyQuote(): Promise<Quote> {
  try {
    const totalResponse = await fetch(`${API_URL}?limit=1`);
    if (!totalResponse.ok) throw new Error("Could not load quote count");
    const { total = 1454 } = (await totalResponse.json()) as { total?: number };
    const response = await fetch(`${API_URL}/${(epochDay() % total) + 1}`);
    if (!response.ok) throw new Error("Could not load daily quote");
    const data = (await response.json()) as { quote: string; author: string; id: number };
    return { text: data.quote, author: data.author, id: data.id, source: "dummyjson" };
  } catch {
    return offlineQuote(epochDay());
  }
}

export async function fetchRandomQuote(): Promise<Quote> {
  try {
    const response = await fetch(`${API_URL}/random`);
    if (!response.ok) throw new Error("Could not load random quote");
    const data = (await response.json()) as { quote: string; author: string; id: number };
    return { text: data.quote, author: data.author, id: data.id, source: "dummyjson" };
  } catch {
    return offlineQuote(Math.floor(Math.random() * fallbackQuotes.length));
  }
}
