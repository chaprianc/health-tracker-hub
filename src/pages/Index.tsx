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
import { ProfileEditDialog } from "@/components/ProfileEditDialog";
import { RecalculateDialog } from "@/components/RecalculateDialog";
import type { MealGroup } from "@/hooks/useDietAppState";
import { Apple, Settings2, CalendarDays, LogOut, User, Pencil } from "lucide-react";

const Index = () => {
  const { state, computed, actions, loaded } = useDietAppState();
  const { profile, signOut } = useAuth();
  const [editingMeal, setEditingMeal] = useState<number | null>(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showRecalculate, setShowRecalculate] = useState(false);
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
    <div dir="rtl" className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm safe-top">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 md:py-4">
          <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Apple className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-bold text-foreground truncate">הדיאטה שלי</h1>
            <p className="text-[11px] md:text-xs text-muted-foreground">מעקב יומי • תזונה בריאה</p>
          </div>
          <div className="mr-auto flex items-center gap-1.5 md:gap-2">
            <Link
              to="/history"
              className="hidden md:flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              היסטוריה
            </Link>
            <button
              onClick={() => setShowProfileEdit(true)}
              className="flex items-center gap-1 md:gap-1.5 rounded-lg bg-secondary px-2 md:px-3 py-2 text-xs text-muted-foreground hover:bg-secondary/80 transition-colors"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline max-w-[100px] truncate">{profile?.display_name || "משתמש"}</span>
              <Pencil className="h-3 w-3" />
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-1 rounded-lg bg-secondary px-2 md:px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="התנתק"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-border bg-card/95 backdrop-blur-sm px-2 py-2 safe-bottom">
        <Link to="/" className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-primary">
          <Apple className="h-5 w-5" />
          <span className="text-[10px] font-medium">ראשי</span>
        </Link>
        <Link to="/history" className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:text-primary transition-colors">
          <CalendarDays className="h-5 w-5" />
          <span className="text-[10px] font-medium">היסטוריה</span>
        </Link>
        <button onClick={() => setShowProfileEdit(true)} className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:text-primary transition-colors">
          <User className="h-5 w-5" />
          <span className="text-[10px] font-medium">פרופיל</span>
        </button>
        <button onClick={() => setShowRecalculate(true)} className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-muted-foreground hover:text-primary transition-colors">
          <Settings2 className="h-5 w-5" />
          <span className="text-[10px] font-medium">הגדרות</span>
        </button>
      </nav>

        {!loaded ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
        <>
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
            onRecalculate={() => setShowRecalculate(true)}
          />
        </div>

        <ProfileEditDialog open={showProfileEdit} onClose={() => setShowProfileEdit(false)} />
        <RecalculateDialog
          open={showRecalculate}
          onClose={() => setShowRecalculate(false)}
          onApply={(calories, meals, weight, targetWeight) => {
            actions.setTargetCalories(calories);
            actions.updateMeals(meals);
            actions.setState((prev) => ({
              ...prev,
              currentWeight: weight,
              startWeight: weight,
              targetWeight,
            }));
          }}
        />
        </>
        )}
      </main>
    </div>
  );
};

export default Index;
