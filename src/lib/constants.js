import { Pizza, Beef, Fish, Coffee, Cake, UtensilsCrossed } from "lucide-react";

export const palette = {
  bg: "#15100C",
  sidebar: "#1B1510",
  surface: "#221A13",
  surfaceAlt: "#2B2118",
  border: "#3A2E22",
  text: "#F3E9DA",
  textMuted: "#B9A88E",
  amber: "#E0A83E",
  green: "#7A9B6E",
  red: "#C4685A",
};

export const CATEGORY_META = {
  Pizzaria: { icon: Pizza, color: "#C4633B" },
  Hamburgueria: { icon: Beef, color: "#B07A45" },
  "Japonês": { icon: Fish, color: "#4E7A68" },
  Cafeteria: { icon: Coffee, color: "#8A6339" },
  "Comida brasileira": { icon: UtensilsCrossed, color: "#B98A3E" },
  Doceria: { icon: Cake, color: "#A85C7A" },
};

export const CATEGORIES = Object.keys(CATEGORY_META);

export const MIN_SCORE = 7;
export const MIN_COUNT = 3;

export const TAG_OPTIONS = [
  "Ambiente agradável",
  "Bom para ir em grupo",
  "Atendimento rápido",
  "Boa opção para delivery",
  "Ambiente barulhento",
];

export function average(sum, count) {
  return count > 0 ? sum / count : 0;
}

export function computesGraduation(scoreSum, scoreCount) {
  const avg = average(scoreSum, scoreCount);
  return scoreCount >= MIN_COUNT && avg >= MIN_SCORE;
}
