import { useState, useEffect } from "react";

export type TimeTheme = {
  background: string;
  borderBottom: string;
  textColor: string;
  subTextColor: string;
  greeting: string;
  icon: string;
  cardBackground: string;
  cardBorder: string;
  inputBackground: string;
  inputBorder: string;
  dividerColor: string;
  mutedTextColor: string;
  accentColor: string;
};

const themes: Record<"morning" | "afternoon" | "evening" | "night", TimeTheme> = {
  morning: {
    background: "linear-gradient(135deg, #fef9c3 0%, #ffffff 100%)",
    borderBottom: "1px solid #fef08a",
    textColor: "#1b2a47",
    subTextColor: "#374151",
    greeting: "Good morning",
    icon: "☀️",
    cardBackground: "#fffef0",
    cardBorder: "#fef08a",
    inputBackground: "#fffdf0",
    inputBorder: "#fde68a",
    dividerColor: "#fef08a",
    mutedTextColor: "#6b7280",
    accentColor: "#f59e0b",
  },
  afternoon: {
    background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)",
    borderBottom: "1px solid #fde68a",
    textColor: "#1b2a47",
    subTextColor: "#374151",
    greeting: "Good afternoon",
    icon: "🌤️",
    cardBackground: "#fffbeb",
    cardBorder: "#fde68a",
    inputBackground: "#fffbeb",
    inputBorder: "#fcd34d",
    dividerColor: "#fde68a",
    mutedTextColor: "#6b7280",
    accentColor: "#d97706",
  },
  evening: {
    background: "linear-gradient(135deg, #ffedd5 0%, #fee2e2 50%, #ffffff 100%)",
    borderBottom: "1px solid #fed7aa",
    textColor: "#1b2a47",
    subTextColor: "#374151",
    greeting: "Good evening",
    icon: "🌇",
    cardBackground: "#fff7ed",
    cardBorder: "#fed7aa",
    inputBackground: "#fff7ed",
    inputBorder: "#fdba74",
    dividerColor: "#fed7aa",
    mutedTextColor: "#6b7280",
    accentColor: "#ea580c",
  },
  night: {
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
    borderBottom: "1px solid #334155",
    textColor: "#ffffff",
    subTextColor: "#cbd5e1",
    greeting: "Good night",
    icon: "🌙",
    cardBackground: "#1e293b",
    cardBorder: "#334155",
    inputBackground: "#0f172a",
    inputBorder: "#475569",
    dividerColor: "#334155",
    mutedTextColor: "#94a3b8",
    accentColor: "#818cf8",
  },
};

export function useTimeTheme(): TimeTheme {
  const getTheme = (): TimeTheme => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return themes.morning;
    if (hour >= 12 && hour < 17) return themes.afternoon;
    if (hour >= 17 && hour < 20) return themes.evening;
    return themes.night;
  };

  const [timeTheme, setTimeTheme] = useState<TimeTheme>(getTheme);

  useEffect(() => {
    setTimeTheme(getTheme());

    // Recalculate at the next hour boundary
    const now = new Date();
    const msUntilNextHour =
      (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;

    const timeout = setTimeout(() => {
      setTimeTheme(getTheme());
    }, msUntilNextHour);

    return () => clearTimeout(timeout);
  }, []);

  return timeTheme;
}