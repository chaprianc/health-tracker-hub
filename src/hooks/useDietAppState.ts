import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type WeightPoint = { date: string; weight: number };

export type MealItem = { id: string; label: string; calories: number; emoji: string; protein?: number; carbs?: number; fat?: number };
export type MealGroup = { title: string; time?: string; items: MealItem[] };

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
    time: "07:00 - 09:00",
    items: [
      { id: "b1", label: "ביצים מקושקשות (2)", calories: 180, emoji: "🥚" },
      { id: "b2", label: "לחם כוסמין", calories: 120, emoji: "🍞" },
      { id: "b3", label: "ירקות חתוכים", calories: 40, emoji: "🥒" },
      { id: "b4", label: "גבינה 5%", calories: 80, emoji: "🧀" },
    ],
  },
  {
    title: "☀️ ארוחת צהריים",
    time: "12:00 - 14:00",
    items: [
      { id: "l1", label: "חזה עוף צלוי", calories: 250, emoji: "🍗" },
      { id: "l2", label: "אורז מלא", calories: 200, emoji: "🍚" },
      { id: "l3", label: "סלט ירקות", calories: 60, emoji: "🥗" },
      { id: "l4", label: "טחינה (כף)", calories: 90, emoji: "🥄" },
    ],
  },
  {
    title: "🌙 ארוחת ערב",
    time: "18:00 - 20:00",
    items: [
      { id: "d1", label: "דג סלמון", calories: 280, emoji: "🐟" },
      { id: "d2", label: "ירקות מאודים", calories: 70, emoji: "🥦" },
      { id: "d3", label: "קינואה", calories: 150, emoji: "🌾" },
    ],
  },
  {
    title: "🍎 חטיפים",
    time: "10:30 / 16:00",
    items: [
      { id: "s1", label: "תפוח", calories: 80, emoji: "🍎" },
      { id: "s2", label: "יוגורט", calories: 100, emoji: "🥛" },
      { id: "s3", label: "שקדים (10)", calories: 70, emoji: "🥜" },
    ],
  },
];

function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function useDietAppState() {
  const { user } = useAuth();
  const userId = user?.id;

  const initial: DietState = useMemo(
    () => ({
      currentWeight: 80,
      targetWeight: 70,
      startWeight: 80,
      caloriesConsumed: 0,
      targetCalories: 1750,
      checkedItems: new Set<string>(),
      waterCups: 0,
      streak: 0,
      successDays: 0,
      bestStreak: 0,
      totalScore: 0,
      weightHistory: [],
      meals: DEFAULT_MEALS,
      lastResetDate: getTodayStr(),
      dailyHistory: [],
    }),
    []
  );

  const [state, setState] = useState<DietState>(initial);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load from cloud ───
  useEffect(() => {
    if (!userId) {
      setLoaded(true);
      return;
    }

    let active = true;
    const fallback = setTimeout(() => {
      if (active) setLoaded(true);
    }, 5000);

    const load = async () => {
      try {
        // Load settings
        const { data: settings } = await supabase
          .from("user_settings")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        // Load today's log
        const today = getTodayStr();
        const { data: todayLog } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", userId)
          .eq("log_date", today)
          .maybeSingle();

        // Load history (last 90 days, excluding today)
        const { data: historyLogs } = await supabase
          .from("daily_logs")
          .select("*")
          .eq("user_id", userId)
          .neq("log_date", today)
          .order("log_date", { ascending: true })
          .limit(90);

        const dailyHistory: DailyLog[] = (historyLogs || []).map((l: any) => ({
          date: l.log_date,
          caloriesConsumed: l.calories_consumed,
          checkedItems: l.checked_items || [],
          waterCups: l.water_cups,
          totalScore: l.total_score,
        }));

        // Also check localStorage for migration
        const STORAGE_KEY = "dietAppState_v1";
        const localRaw = localStorage.getItem(STORAGE_KEY);
        let localData: any = null;
        if (localRaw) {
          try { localData = JSON.parse(localRaw); } catch {}
        }

        if (settings) {
          // Cloud data exists
          const meals = (settings.meals as any[])?.length > 0 ? settings.meals as unknown as MealGroup[] : DEFAULT_MEALS;
          const weightHistory = (settings.weight_history as any[]) || [];

          // Sync currentWeight from latest weight history entry if it diverged
          let currentWeight = Number(settings.current_weight);
          if (weightHistory.length > 0) {
            const latestWeight = (weightHistory[weightHistory.length - 1] as any)?.weight;
            if (latestWeight && typeof latestWeight === 'number' && latestWeight !== currentWeight) {
              currentWeight = latestWeight;
              supabase.from("user_settings").update({ current_weight: currentWeight }).eq("user_id", userId);
            }
          }

          if (!active) return;

          setState({
            currentWeight,
            targetWeight: Number(settings.target_weight),
            startWeight: Number(settings.start_weight),
            targetCalories: settings.target_calories,
            streak: settings.streak,
            successDays: settings.success_days,
            bestStreak: settings.best_streak,
            meals,
            weightHistory: weightHistory as WeightPoint[],
            caloriesConsumed: todayLog?.calories_consumed ?? 0,
            checkedItems: new Set(todayLog?.checked_items ?? []),
            waterCups: todayLog?.water_cups ?? 0,
            totalScore: todayLog?.total_score ?? 0,
            lastResetDate: today,
            dailyHistory,
          });
        } else if (localData) {
          // Migrate from localStorage
          const migrated: DietState = {
            currentWeight: localData.currentWeight ?? initial.currentWeight,
            targetWeight: localData.targetWeight ?? initial.targetWeight,
            startWeight: localData.startWeight ?? initial.startWeight,
            targetCalories: localData.targetCalories ?? initial.targetCalories,
            streak: localData.streak ?? 0,
            successDays: localData.successDays ?? 0,
            bestStreak: localData.bestStreak ?? 0,
            meals: localData.meals ?? DEFAULT_MEALS,
            weightHistory: localData.weightHistory ?? [],
            caloriesConsumed: localData.caloriesConsumed ?? 0,
            checkedItems: new Set(localData.checkedItems ?? []),
            waterCups: localData.waterCups ?? 0,
            totalScore: localData.totalScore ?? 0,
            lastResetDate: localData.lastResetDate ?? today,
            dailyHistory: localData.dailyHistory ?? [],
          };

          if (!active) return;

          setState(migrated);

          // Save to cloud
          await supabase.from("user_settings").upsert({
            user_id: userId,
            target_calories: migrated.targetCalories,
            current_weight: migrated.currentWeight,
            start_weight: migrated.startWeight,
            target_weight: migrated.targetWeight,
            streak: migrated.streak,
            success_days: migrated.successDays,
            best_streak: migrated.bestStreak,
            meals: migrated.meals as any,
            weight_history: migrated.weightHistory as any,
          }, { onConflict: "user_id" });

          // Save today's log
          await supabase.from("daily_logs").upsert({
            user_id: userId,
            log_date: today,
            calories_consumed: migrated.caloriesConsumed,
            checked_items: Array.from(migrated.checkedItems),
            water_cups: migrated.waterCups,
            total_score: migrated.totalScore,
          }, { onConflict: "user_id,log_date" });

          // Migrate history
          if (migrated.dailyHistory.length > 0) {
            const historyRows = migrated.dailyHistory.map((log) => ({
              user_id: userId,
              log_date: log.date,
              calories_consumed: log.caloriesConsumed,
              checked_items: log.checkedItems,
              water_cups: log.waterCups,
              total_score: log.totalScore,
            }));
            await supabase.from("daily_logs").upsert(historyRows, { onConflict: "user_id,log_date" });
          }

          // Clear localStorage after migration
          localStorage.removeItem(STORAGE_KEY);
        } else {
          // No data anywhere - create defaults
          if (!active) return;

          setState(initial);
          await supabase.from("user_settings").upsert({
            user_id: userId,
            target_calories: initial.targetCalories,
            current_weight: initial.currentWeight,
            start_weight: initial.startWeight,
            target_weight: initial.targetWeight,
            meals: initial.meals as any,
            weight_history: initial.weightHistory as any,
          }, { onConflict: "user_id" });
        }

        if (active) setLoaded(true);
      } catch (e) {
        console.error("Failed to load cloud state", e);
        if (active) setLoaded(true);
      }
    };

    load();

    return () => {
      active = false;
      clearTimeout(fallback);
    };
  }, [userId]);

  // ─── Debounced save to cloud ───
  const saveToCloud = useCallback(
    (newState: DietState) => {
      if (!userId || !loaded) return;

      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const today = getTodayStr();

          // Save settings
          await supabase.from("user_settings").upsert({
            user_id: userId,
            target_calories: newState.targetCalories,
            current_weight: newState.currentWeight,
            start_weight: newState.startWeight,
            target_weight: newState.targetWeight,
            streak: newState.streak,
            success_days: newState.successDays,
            best_streak: newState.bestStreak,
            meals: newState.meals as any,
            weight_history: newState.weightHistory as any,
          }, { onConflict: "user_id" });

          // Save today's log
          await supabase.from("daily_logs").upsert({
            user_id: userId,
            log_date: today,
            calories_consumed: newState.caloriesConsumed,
            checked_items: Array.from(newState.checkedItems),
            water_cups: newState.waterCups,
            total_score: newState.totalScore,
          }, { onConflict: "user_id,log_date" });
        } catch (e) {
          console.error("Failed to save to cloud", e);
        }
      }, 800);
    },
    [userId, loaded]
  );

  // Save whenever state changes
  useEffect(() => {
    if (loaded) saveToCloud(state);
  }, [state, loaded, saveToCloud]);

  // Midnight reset check
  useEffect(() => {
    const check = () => {
      const today = getTodayStr();
      setState((prev) => {
        if (prev.lastResetDate === today) return prev;

        // Archive previous day
        const log: DailyLog = {
          date: prev.lastResetDate,
          caloriesConsumed: prev.caloriesConsumed,
          checkedItems: Array.from(prev.checkedItems),
          waterCups: prev.waterCups,
          totalScore: prev.totalScore,
        };

        return {
          ...prev,
          caloriesConsumed: 0,
          checkedItems: new Set<string>(),
          waterCups: 0,
          totalScore: 0,
          lastResetDate: today,
          dailyHistory: [...prev.dailyHistory, log].slice(-90),
        };
      });
    };

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timeout = setTimeout(() => {
      check();
      const interval = setInterval(check, 60_000);
      return () => clearInterval(interval);
    }, msUntilMidnight);

    return () => clearTimeout(timeout);
  }, []);

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
      const newState = {
        ...prev,
        currentWeight: newWeight,
        totalScore: score,
        weightHistory: nextHistory,
      };

      // Immediately persist weight to cloud to prevent loss on reload
      if (userId) {
        supabase.from("user_settings").upsert({
          user_id: userId,
          current_weight: newWeight,
          weight_history: nextHistory as any,
        }, { onConflict: "user_id" }).then(({ error }) => {
          if (error) console.error("Failed to save weight update", error);
        });
      }

      return newState;
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
      state: {
        ...state,
        checkedItems: Array.from(state.checkedItems),
      },
    };
    return JSON.stringify(payload, null, 2);
  }

  function importJson(text: string) {
    const raw = JSON.parse(text);
    if (!raw?.state || !raw?.version) throw new Error("Invalid backup file");
    const s = raw.state;
    setState((prev) => ({
      ...prev,
      ...s,
      checkedItems: new Set(s.checkedItems ?? []),
      meals: s.meals ?? prev.meals,
    }));
  }

  async function resetAll() {
    setState(initial);
    if (userId) {
      await supabase.from("daily_logs").delete().eq("user_id", userId);
      await supabase.from("user_settings").delete().eq("user_id", userId);
    }
    localStorage.removeItem("dietAppState_v1");
  }

  return {
    state,
    computed,
    loaded,
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
