import type { MealGroup } from "@/hooks/useDietAppState";

type ProfileData = {
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: "male" | "female";
  activity_level: string;
  target_weight: number;
  is_vegetarian: boolean;
};

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Mifflin-St Jeor BMR */
function calcBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === "female") {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
}

/** TDEE = BMR × activity multiplier */
function calcTDEE(bmr: number, activityLevel: string): number {
  return bmr * (ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55);
}

/** Recommended daily calories for weight loss (500 kcal deficit, min 1200) */
export function calcRecommendedCalories(profile: ProfileData): number {
  const bmr = calcBMR(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calcTDEE(bmr, profile.activity_level);
  const needsLoss = profile.target_weight < profile.weight;
  const deficit = needsLoss ? 500 : 0;
  const target = Math.round(tdee - deficit);
  return Math.max(1200, Math.min(3500, target));
}

// ─── Meal templates ───

const REGULAR_MEALS = {
  breakfast: [
    { id: "b1", label: "ביצים מקושקשות (2)", calories: 180, emoji: "🥚" },
    { id: "b2", label: "לחם כוסמין", calories: 120, emoji: "🍞" },
    { id: "b3", label: "ירקות חתוכים", calories: 40, emoji: "🥒" },
    { id: "b4", label: "גבינה 5%", calories: 80, emoji: "🧀" },
  ],
  lunch: [
    { id: "l1", label: "חזה עוף צלוי", calories: 250, emoji: "🍗" },
    { id: "l2", label: "אורז מלא", calories: 200, emoji: "🍚" },
    { id: "l3", label: "סלט ירקות", calories: 60, emoji: "🥗" },
    { id: "l4", label: "טחינה (כף)", calories: 90, emoji: "🥄" },
  ],
  dinner: [
    { id: "d1", label: "דג סלמון", calories: 280, emoji: "🐟" },
    { id: "d2", label: "ירקות מאודים", calories: 70, emoji: "🥦" },
    { id: "d3", label: "קינואה", calories: 150, emoji: "🌾" },
  ],
  snacks: [
    { id: "s1", label: "תפוח", calories: 80, emoji: "🍎" },
    { id: "s2", label: "יוגורט", calories: 100, emoji: "🥛" },
    { id: "s3", label: "שקדים (10)", calories: 70, emoji: "🥜" },
  ],
};

const VEGETARIAN_MEALS = {
  breakfast: [
    { id: "b1", label: "ביצים מקושקשות (2)", calories: 180, emoji: "🥚" },
    { id: "b2", label: "לחם כוסמין", calories: 120, emoji: "🍞" },
    { id: "b3", label: "אבוקדו (חצי)", calories: 120, emoji: "🥑" },
    { id: "b4", label: "ירקות חתוכים", calories: 40, emoji: "🥒" },
  ],
  lunch: [
    { id: "l1", label: "טופו צלוי", calories: 200, emoji: "🧈" },
    { id: "l2", label: "אורז מלא", calories: 200, emoji: "🍚" },
    { id: "l3", label: "סלט ירקות עם חומוס", calories: 150, emoji: "🥗" },
    { id: "l4", label: "טחינה (כף)", calories: 90, emoji: "🥄" },
  ],
  dinner: [
    { id: "d1", label: "מרק עדשים", calories: 220, emoji: "🍲" },
    { id: "d2", label: "ירקות מאודים", calories: 70, emoji: "🥦" },
    { id: "d3", label: "קינואה", calories: 150, emoji: "🌾" },
  ],
  snacks: [
    { id: "s1", label: "תפוח", calories: 80, emoji: "🍎" },
    { id: "s2", label: "יוגורט סויה", calories: 90, emoji: "🥛" },
    { id: "s3", label: "חמאת בוטנים + פרוסת לחם", calories: 180, emoji: "🥜" },
  ],
};

/** Scale portion sizes to fit calorie target */
function scaleMeals(items: typeof REGULAR_MEALS, targetCal: number): typeof REGULAR_MEALS {
  const totalBase =
    Object.values(items).flat().reduce((sum, i) => sum + i.calories, 0);
  if (totalBase === 0) return items;
  const ratio = targetCal / totalBase;

  const scale = (arr: typeof REGULAR_MEALS.breakfast) =>
    arr.map((item) => ({ ...item, calories: Math.round(item.calories * ratio) }));

  return {
    breakfast: scale(items.breakfast),
    lunch: scale(items.lunch),
    dinner: scale(items.dinner),
    snacks: scale(items.snacks),
  };
}

export function generatePersonalizedMeals(profile: ProfileData, targetCalories: number): MealGroup[] {
  const base = profile.is_vegetarian ? VEGETARIAN_MEALS : REGULAR_MEALS;
  const scaled = scaleMeals(base, targetCalories);

  return [
    { title: "🌅 ארוחת בוקר", time: "07:00 - 09:00", items: scaled.breakfast },
    { title: "☀️ ארוחת צהריים", time: "12:00 - 14:00", items: scaled.lunch },
    { title: "🌙 ארוחת ערב", time: "18:00 - 20:00", items: scaled.dinner },
    { title: "🍎 חטיפים", time: "10:30 / 16:00", items: scaled.snacks },
  ];
}
