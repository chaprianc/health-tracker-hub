import { useState } from "react";
import { Link } from "react-router-dom";
import { useDietAppState } from "@/hooks/useDietAppState";
import { useAuth } from "@/contexts/AuthContext";
import { StatsCards } from "@/components/StatsCards";
import { WeightChart } from "@/components/WeightChart";
import { WaterTracker } from "@/components/WaterTracker";
import { CalorieBar } from "@/components/CalorieBar";
import { MealChecklist } from "@/components/MealChecklist";
import { SettingsPanel } from "@/components/SettingsPanel";
import { DailySummary } from "@/components/DailySummary";
import { EditMealDialog } from "@/components/EditMealDialog";
import type { MealGroup } from "@/hooks/useDietAppState";
import { Apple, Settings2, CalendarDays, LogOut, User } from "lucide-react";

const Index = () => {
  const { state, computed, actions } = useDietAppState();
  const [editingMeal, setEditingMeal] = useState<number | null>(null);
  const [showCalorieEdit, setShowCalorieEdit] = useState(false);
  const [calorieInput, setCalorieInput] = useState("");

  const handleSaveMeal = (index: number, updated: MealGroup) => {
    const next = [...state.meals];
    next[index] = updated;
    actions.updateMeals(next);
  };

  const handleCalorieSave = () => {
    const val = parseInt(calorieInput);
    if (val >= 500 && val <= 5000) {
      actions.setTargetCalories(val);
      setShowCalorieEdit(false);
      setCalorieInput("");
    }
  };

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
          <Link
            to="/history"
            className="mr-auto flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            היסטוריה
          </Link>
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

        {/* Daily AI Summary */}
        <DailySummary
          currentWeight={state.currentWeight}
          startWeight={state.startWeight}
          targetWeight={state.targetWeight}
          caloriesConsumed={state.caloriesConsumed}
          targetCalories={state.targetCalories}
          waterCups={state.waterCups}
          totalScore={state.totalScore}
          weightLost={computed.weightLost}
        />

        {/* Calorie bar with edit */}
        <div className="relative">
          <CalorieBar
            consumed={state.caloriesConsumed}
            target={state.targetCalories}
            percent={computed.caloriesPercent}
          />
          <button
            onClick={() => {
              setCalorieInput(String(state.targetCalories));
              setShowCalorieEdit(true);
            }}
            className="absolute left-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>

        {/* Calorie target edit popup */}
        {showCalorieEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setShowCalorieEdit(false)}>
            <div dir="rtl" className="mx-4 w-full max-w-xs rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-3 text-lg font-bold text-card-foreground">יעד קלוריות יומי</h3>
              <input
                type="number"
                value={calorieInput}
                onChange={(e) => setCalorieInput(e.target.value)}
                min={500}
                max={5000}
                className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="500 - 5000"
                onKeyDown={(e) => e.key === "Enter" && handleCalorieSave()}
              />
              <div className="flex gap-2">
                <button onClick={handleCalorieSave} className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  שמור
                </button>
                <button onClick={() => setShowCalorieEdit(false)} className="rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground hover:bg-secondary/80">
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

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
          {state.meals.map((meal, idx) => (
            <MealChecklist
              key={`${meal.title}-${idx}`}
              title={meal.title}
              time={meal.time}
              items={meal.items}
              checkedItems={state.checkedItems}
              onToggle={actions.toggleChecklistItem}
              onEdit={() => setEditingMeal(idx)}
            />
          ))}
        </div>

        {/* Edit meal dialog */}
        {editingMeal !== null && (
          <EditMealDialog
            meal={state.meals[editingMeal]}
            mealIndex={editingMeal}
            open={true}
            onClose={() => setEditingMeal(null)}
            onSave={handleSaveMeal}
          />
        )}

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
