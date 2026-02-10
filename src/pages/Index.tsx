import { useDietAppState } from "@/hooks/useDietAppState";
import { StatsCards } from "@/components/StatsCards";
import { WeightChart } from "@/components/WeightChart";
import { WaterTracker } from "@/components/WaterTracker";
import { CalorieBar } from "@/components/CalorieBar";
import { MealChecklist, ChecklistItemData } from "@/components/MealChecklist";
import { SettingsPanel } from "@/components/SettingsPanel";
import { Apple } from "lucide-react";

const MEALS: { title: string; items: ChecklistItemData[] }[] = [
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

const Index = () => {
  const { state, computed, actions } = useDietAppState();

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Apple className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">הדיאטה שלי</h1>
            <p className="text-xs text-muted-foreground">מעקב יומי • תזונה בריאה</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 px-4 py-6">
        {/* Stats */}
        <StatsCards
          currentWeight={state.currentWeight}
          weightLost={computed.weightLost}
          caloriesConsumed={state.caloriesConsumed}
          targetCalories={state.targetCalories}
          streak={state.streak}
          totalScore={state.totalScore}
        />

        {/* Calorie bar */}
        <CalorieBar
          consumed={state.caloriesConsumed}
          target={state.targetCalories}
          percent={computed.caloriesPercent}
        />

        {/* Weight chart + Water */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <WeightChart
              weightHistory={state.weightHistory}
              progressPercent={computed.progressPercent}
              targetWeight={state.targetWeight}
              onUpdateWeight={actions.updateWeight}
            />
          </div>
          <WaterTracker
            cups={state.waterCups}
            onSetCups={actions.setWaterCups}
            onReset={actions.resetWater}
          />
        </div>

        {/* Meal checklists */}
        <div className="grid gap-4 sm:grid-cols-2">
          {MEALS.map((meal) => (
            <MealChecklist
              key={meal.title}
              title={meal.title}
              items={meal.items}
              checkedItems={state.checkedItems}
              onToggle={actions.toggleChecklistItem}
            />
          ))}
        </div>

        {/* Settings */}
        <div className="border-t border-border pt-5">
          <SettingsPanel
            onExport={actions.exportJson}
            onImport={actions.importJson}
            onReset={actions.resetAll}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
