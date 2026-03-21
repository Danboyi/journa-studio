import type { EntryType } from "@/types/journa";

export const dailyPromptPack: string[] = [
  "What is one small moment from today you do not want to lose?",
  "Where did your energy rise, and where did it fall?",
  "Who shaped your day, even in a tiny way?",
  "What did you avoid saying, and why?",
  "What detail would your future self thank you for recording now?",
  "What felt different about today compared to yesterday?",
  "What is something you noticed but didn't react to?",
  "What would you tell a stranger about your day if they really listened?",
];

export const lifeCyclePromptPack: string[] = [
  "What is your earliest memory of feeling fully seen?",
  "What belief did you inherit that you had to unlearn?",
  "Which failure changed your path for the better?",
  "What season of your life felt like survival?",
  "What do you still hope to become, and what stands in the way?",
];

export const entryTypePrompts: Record<EntryType, string[]> = {
  "free-write": [
    "What's on your mind?",
    "What happened today that you want to hold onto?",
    "Write about what you're feeling right now.",
  ],
  "check-in": [
    "One sentence: how are you?",
    "What's the first word that comes to mind?",
    "If today had a color, what would it be and why?",
  ],
  gratitude: [
    "What are you thankful for today?",
    "Who made today easier, even a little?",
    "What's one thing you have that you used to wish for?",
  ],
  letter: [
    "Dear future me, right now I'm...",
    "Dear past me, I wish I could tell you...",
    "To someone I haven't thanked yet...",
  ],
  dream: [
    "Before it fades — what did you see?",
    "Who was there? What did the place look like?",
    "What feeling did the dream leave you with?",
  ],
};

/** Milestone messages shown when streak hits specific counts */
export const streakMilestones: Record<number, string> = {
  3: "3 days in a row. You're building something.",
  7: "A full week. Your future self is going to read this.",
  14: "Two weeks of showing up for yourself.",
  30: "30 days. This is no longer a habit — it's a practice.",
  50: "50 days. You have a real body of writing now.",
  100: "100 days. You've built something extraordinary.",
  365: "One year. An entire year of your inner life, preserved.",
};
