export interface MeaningTheme {
  name: string;
  words: string[];
  simple: string;
  deeper: string;
  reflection: string;
}

export const meaningThemes: MeaningTheme[] = [
  {
    name: "Courage and growth",
    words: ["difficulty", "opportunity", "courage", "wounds", "wisdom", "begin", "grow", "stop"],
    simple: "This quote is about meeting difficulty as a place where growth can begin.",
    deeper: "It does not deny that change is hard. It suggests that your response to hardship can turn experience into direction, strength, or wisdom.",
    reflection: "What difficult thing might be teaching you something useful right now?",
  },
  {
    name: "Thought and mindset",
    words: ["think", "thought", "mind", "believe", "can", "cannot", "dream", "fear"],
    simple: "This quote is about the power of the mind. The way you think can open possibilities or quietly close them.",
    deeper: "It asks you to notice the beliefs underneath your choices. Some limits are real, but others begin as repeated thoughts that were never questioned.",
    reflection: "Which belief is helping you, and which one is holding you back?",
  },
  {
    name: "Purposeful work",
    words: ["work", "great", "purpose", "passion", "create", "effort", "success", "goal"],
    simple: "This quote is about giving your effort to something meaningful, not merely something that keeps you busy.",
    deeper: "Care gives work a deeper reason. That reason can carry you through ordinary days when inspiration is nowhere to be found.",
    reflection: "What work feels connected to the person you want to become?",
  },
  {
    name: "Path and self-trust",
    words: ["path", "trail", "wander", "lost", "journey", "road", "direction", "walk"],
    simple: "This quote is about trusting your direction, especially when your life does not look like everyone else’s.",
    deeper: "Clarity often comes through movement. Sometimes you discover the road by walking, not by waiting until every answer is certain.",
    reflection: "Where do you need a little more trust in your own path?",
  },
  {
    name: "Simplicity",
    words: ["simple", "simplicity", "clutter", "less", "enough", "clear", "focus", "essential"],
    simple: "This quote is about removing what is unnecessary so what truly matters can stand out.",
    deeper: "Simplicity is not emptiness. It is the discipline of choosing the essential over the distracting.",
    reflection: "What could you remove to make space for what matters?",
  },
  {
    name: "Character and values",
    words: ["life", "live", "change", "world", "truth", "honest", "justice", "good", "character"],
    simple: "This quote is about the person you are becoming through your choices.",
    deeper: "Big ideals become real through small repeated actions: how you speak, choose, forgive, work, and treat people.",
    reflection: "What value do you want your actions to show today?",
  },
  {
    name: "Love and connection",
    words: ["love", "heart", "friend", "give", "kindness", "forgive", "human", "together", "care"],
    simple: "This quote is about the way love, kindness, or care changes how we understand life.",
    deeper: "Meaning is not found only in achievement or control. Sometimes it lives in tenderness, attention, and how we meet another person.",
    reflection: "Where could you respond with more care today?",
  },
];
