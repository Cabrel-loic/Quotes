import type { Quote } from "@/types/quote";

export const fallbackQuotes: Omit<Quote, "source">[] = [
  { text: "The unexamined life is not worth living.", author: "Socrates" },
  { text: "What we think, we become.", author: "Buddha" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Whether you think you can or think you can’t, you’re right.", author: "Henry Ford" },
  { text: "The best time to plant a tree was twenty years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
  { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" },
  { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
  { text: "Out of clutter, find simplicity.", author: "Albert Einstein" },
];
