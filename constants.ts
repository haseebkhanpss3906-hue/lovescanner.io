
import { Question } from './types';

export const SECTIONS = [
  "Emotional Safety",
  "Responsiveness (Bids for Connection)",
  "Conflict Quality",
  "Trust & Commitment",
  "Respect & Value"
];

export const QUESTIONS: Question[] = [
  { id: 1, section: SECTIONS[0], text: "I can express hurt or fear without my partner attacking or dismissing me." },
  { id: 2, section: SECTIONS[0], text: "When I am emotionally vulnerable, my partner becomes more caring, not distant." },
  { id: 3, section: SECTIONS[1], text: "When I need attention, comfort, or support, my partner usually responds." },
  { id: 4, section: SECTIONS[1], text: "My partner notices small emotional cues (tone, mood, silence) and reacts to them." },
  { id: 5, section: SECTIONS[2], text: "We can disagree without insulting, mocking, or shutting each other down." },
  { id: 6, section: SECTIONS[2], text: "After a fight, we repair and reconnect instead of staying cold or distant." },
  { id: 7, section: SECTIONS[3], text: "I feel secure that my partner will not abandon or emotionally withdraw from me." },
  { id: 8, section: SECTIONS[3], text: "My partner acts in ways that protect our relationship, even when it is inconvenient." },
  { id: 9, section: SECTIONS[4], text: "My partner treats me as important, not replaceable." },
  { id: 10, section: SECTIONS[4], text: "I feel emotionally valued, not just used or tolerated." }
];

export const LIKERT_SCALE = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" }
];
