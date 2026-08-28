import { meaningThemes } from "@/data/meaningThemes";
import type { Quote, QuoteMeaning } from "@/types/quote";

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

const exactMeanings: Record<string, Omit<QuoteMeaning, "title">> = {
  "the unexamined life is not worth living": {
    simple: "Life becomes richer when we question our choices, values, and habits instead of moving through each day automatically.",
    deeper: "Socrates is not asking for endless overthinking. He is pointing to honest self-awareness: noticing why you live the way you do, and whether that life matches what you believe is good.",
    reflection: "What part of your life deserves a more honest look right now?",
  },
  "what we think we become": {
    simple: "Repeated thoughts shape our attention, choices, and actions—and over time those patterns help shape who we become.",
    deeper: "The quote is not saying every thought magically becomes reality. It asks us to take responsibility for the mental habits we rehearse and the direction they give our lives.",
    reflection: "What thought would you like to practice more deliberately?",
  },
};

export function buildMeaning(quote: Quote): QuoteMeaning {
  const normalized = normalize(quote.text);
  const exact = Object.entries(exactMeanings).find(([text]) => normalized.includes(text));
  if (exact) return { title: "A simpler way to read it", ...exact[1] };

  const ranked = meaningThemes
    .map((theme) => ({ theme, score: theme.words.filter((word) => normalized.includes(word)).length }))
    .sort((a, b) => b.score - a.score);
  const primary = ranked[0];

  if (primary?.score) {
    return {
      title: primary.theme.name,
      simple: primary.theme.simple,
      deeper: primary.theme.deeper,
      reflection: primary.theme.reflection,
    };
  }

  return {
    title: "A simpler way to read it",
    simple: "This quote invites you to slow down and look beneath the surface. Its value may be less about one fixed answer and more about the truth it awakens in you.",
    deeper: "Read it as a small mirror. The author may be pointing toward patience, courage, self-knowledge, love, or perspective. The most useful meaning is often the one that meets your life honestly today.",
    reflection: "What part of this quote feels true, uncomfortable, or important to you right now?",
  };
}
