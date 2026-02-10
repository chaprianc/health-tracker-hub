import { useEffect, useMemo, useState } from "react";

type WeightPoint = { date: string; weight: number };

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
};

const STORAGE_KEY = "dietAppState_v1";

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
    }),
    []
  );

  const [state, setState] = useState<DietState>(initial);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    try {
      const raw = JSON.parse(saved);
      setState((prev) => hydrateState(raw, prev));
    } catch (e) {
      console.error("Failed to load state", e);
    }
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
      exportJson,
      importJson,
      resetAll,
      setState,
    },
  };
}
