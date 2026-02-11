import { useEffect, useMemo, useState } from "react";

type WeightPoint = { date: string; weight: number };

export type MealItem = { id: string; label: string; calories: number; emoji: string };
export type MealGroup = { title: string; items: MealItem[] };

export type DailyLog = {
  date: string; // YYYY-MM-DD
  caloriesConsumed: number;
  checkedItems: string[];
  waterCups: number;
  totalScore: number;
};

type DietState = {
  currentWeight: number;
  targetWeight: number;
  startWeight: number;
  caloriesConsumed: number;
  targetCalories: number;
  checkedItems: Set<string>;
  waterCups: number;
  streak: number;
  successDays: number;
  bestStreak: number;
  totalScore: number;
  weightHistory: WeightPoint[];
  meals: MealGroup[];
  lastResetDate: string; // YYYY-MM-DD
  dailyHistory: DailyLog[];
};

const DEFAULT_MEALS: MealGroup[] = [
  {
    title: "🌅 ארוחת בוקר",
    items: [
      { id: "b1", label: "ביצים מקושקשות (2)", calories: 180, emoji: "🥚" },
      { id: "b2", label: "לחם כוסמין", calories: 120, emoji: "🍞" },
      { id: "b3", label: "ירקות חתוכים", calories: 40, emoji: "🥒" },
      { id: "b4", label: "גבינה 5%", calories: 80, emoji: "🧀" },
    ],
  },
  {
    title: "☀️ ארוחת צהריים",
    items: [
      { id: "l1", label: "חזה עוף צלוי", calories: 250, emoji: "🍗" },
      { id: "l2", label: "אורז מלא", calories: 200, emoji: "🍚" },
      { id: "l3", label: "סלט ירקות", calories: 60, emoji: "🥗" },
      { id: "l4", label: "טחינה (כף)", calories: 90, emoji: "🥄" },
    ],
  },
  {
    title: "🌙 ארוחת ערב",
    items: [
      { id: "d1", label: "דג סלמון", calories: 280, emoji: "🐟" },
      { id: "d2", label: "ירקות מאודים", calories: 70, emoji: "🥦" },
      { id: "d3", label: "קינואה", calories: 150, emoji: "🌾" },
    ],
  },
  {
    title: "🍎 חטיפים",
    items: [
      { id: "s1", label: "תפוח", calories: 80, emoji: "🍎" },
      { id: "s2", label: "יוגורט", calories: 100, emoji: "🥛" },
      { id: "s3", label: "שקדים (10)", calories: 70, emoji: "🥜" },
    ],
  },
];

const STORAGE_KEY = "dietAppState_v1";

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

function serializeState(state: DietState) {
  return {
    ...state,
    checkedItems: Array.from(state.checkedItems),
  };
}

function hydrateState(raw: any, fallback: DietState): DietState {
  const merged = { ...fallback, ...raw };
  return {
    ...merged,
    checkedItems: new Set(raw?.checkedItems ?? []),
    meals: raw?.meals ?? fallback.meals,
    dailyHistory: raw?.dailyHistory ?? [],
    lastResetDate: raw?.lastResetDate ?? getTodayStr(),
  };
}

function performDailyReset(prev: DietState): DietState {
  const today = getTodayStr();
  if (prev.lastResetDate === today) return prev;

  // Save yesterday's data to history
  const log: DailyLog = {
    date: prev.lastResetDate,
    caloriesConsumed: prev.caloriesConsumed,
    checkedItems: Array.from(prev.checkedItems),
    waterCups: prev.waterCups,
    totalScore: prev.totalScore,
  };

  const dailyHistory = [...prev.dailyHistory, log].slice(-90); // keep 90 days

  return {
    ...prev,
    caloriesConsumed: 0,
    checkedItems: new Set<string>(),
    waterCups: 0,
    totalScore: 0,
    lastResetDate: today,
    dailyHistory,
    // Keep: currentWeight, targetWeight, startWeight, targetCalories, weightHistory, meals, streak, successDays, bestStreak
  };
}

export function useDietAppState() {
  const initial: DietState = useMemo(
    () => ({
      currentWeight: 98,
      targetWeight: 85,
      startWeight: 98,
      caloriesConsumed: 0,
      targetCalories: 1750,
      checkedItems: new Set<string>(),
      waterCups: 0,
      streak: 0,
      successDays: 0,
      bestStreak: 0,
      totalScore: 0,
      weightHistory: [
        { date: "10/01", weight: 98 },
        { date: "17/01", weight: 97.4 },
        { date: "24/01", weight: 96.2 },
        { date: "31/01", weight: 95.5 },
        { date: "07/02", weight: 94.8 },
        { date: "10/02", weight: 94.2 },
      ],
      meals: DEFAULT_MEALS,
      lastResetDate: getTodayStr(),
      dailyHistory: [],
    }),
    []
  );

  const [state, setState] = useState<DietState>(initial);

  // Load and check for daily reset
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const raw = JSON.parse(saved);
      const hydrated = hydrateState(raw, initial);
      const afterReset = performDailyReset(hydrated);
      setState(afterReset);
    } catch (e) {
      console.error("Failed to load state", e);
    }
  }, []);

  // Check for midnight reset periodically
  useEffect(() => {
    const check = () => {
      setState((prev) => performDailyReset(prev));
    };
    // Calculate ms until next midnight
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      check();
      // Then check every minute
      const interval = setInterval(check, 60_000);
      return () => clearInterval(interval);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state)));
    } catch (e) {
      console.error("Failed to save state", e);
    }
  }, [state]);

  const computed = useMemo(() => {
    const weightLost = state.startWeight - state.currentWeight;
    const totalToLose = state.startWeight - state.targetWeight;
    const progressPercent =
      totalToLose > 0 ? Math.max(0, Math.min(100, (weightLost / totalToLose) * 100)) : 0;
    const caloriesPercent =
      state.targetCalories > 0
        ? Math.max(0, Math.min(100, (state.caloriesConsumed / state.targetCalories) * 100))
        : 0;
    return { weightLost, progressPercent, caloriesPercent };
  }, [state]);

  function toggleChecklistItem(id: string, calories: number) {
    setState((prev) => {
      const next = { ...prev, checkedItems: new Set(prev.checkedItems) };
      const isDone = next.checkedItems.has(id);
      if (isDone) {
        next.checkedItems.delete(id);
        next.caloriesConsumed = Math.max(0, next.caloriesConsumed - (calories || 0));
        next.totalScore -= calories > 0 ? 10 : 3;
      } else {
        next.checkedItems.add(id);
        next.caloriesConsumed += calories || 0;
        next.totalScore += calories > 0 ? 10 : 3;
      }
      return next;
    });
  }

  function setWaterCups(count: number) {
    setState((prev) => ({ ...prev, waterCups: Math.max(0, Math.min(10, count)) }));
  }

  function resetWater() {
    setState((prev) => ({ ...prev, waterCups: 0 }));
  }

  function updateWeight(newWeight: number) {
    if (!newWeight || newWeight <= 0 || newWeight > 250) return;
    setState((prev) => {
      const old = prev.currentWeight;
      const today = new Date();
      const dateStr = `${today.getDate()}/${today.getMonth() + 1}`;
      const nextHistory = [...prev.weightHistory, { date: dateStr, weight: newWeight }].slice(-8);
      let score = prev.totalScore;
      if (newWeight < old) score += 50;
      return {
        ...prev,
        currentWeight: newWeight,
        totalScore: score,
        weightHistory: nextHistory,
      };
    });
  }

  function setTargetCalories(target: number) {
    if (target < 500 || target > 5000) return;
    setState((prev) => ({ ...prev, targetCalories: target }));
  }

  function updateMeals(meals: MealGroup[]) {
    setState((prev) => ({ ...prev, meals }));
  }

  function exportJson() {
    const payload = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      state: serializeState(state),
    };
    return JSON.stringify(payload, null, 2);
  }

  function importJson(text: string) {
    const raw = JSON.parse(text);
    if (!raw?.state || !raw?.version) throw new Error("Invalid backup file");
    setState((prev) => hydrateState(raw.state, prev));
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setState(initial);
  }

  return {
    state,
    computed,
    actions: {
      toggleChecklistItem,
      setWaterCups,
      resetWater,
      updateWeight,
      setTargetCalories,
      updateMeals,
      exportJson,
      importJson,
      resetAll,
      setState,
    },
  };
}
