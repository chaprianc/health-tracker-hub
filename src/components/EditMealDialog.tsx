import { useState } from "react";
import { X, Plus, Trash2, Sparkles, Loader2, Search } from "lucide-react";
import type { MealItem, MealGroup } from "@/hooks/useDietAppState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EditMealDialogProps {
  meal: MealGroup;
  mealIndex: number;
  open: boolean;
  onClose: () => void;
  onSave: (index: number, updated: MealGroup) => void;
}

interface FoodSuggestion {
  label: string;
  calories: number;
  serving: string;
  emoji: string;
}

const EMOJI_OPTIONS = ["🥚", "🍞", "🥒", "🧀", "🍗", "🍚", "🥗", "🥄", "🐟", "🥦", "🌾", "🍎", "🥛", "🥜", "🥩", "🍕", "🥑", "🍌", "🫘", "🥣"];

export function EditMealDialog({ meal, mealIndex, open, onClose, onSave }: EditMealDialogProps) {
  const [items, setItems] = useState<MealItem[]>(() => meal.items.map((i) => ({ ...i })));
  const [title, setTitle] = useState(meal.title);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  // Food search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  if (!open) return null;

  const addItem = () => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [...prev, { id, label: "", calories: 0, emoji: "🍽️" }]);
  };

  const addItemFromSuggestion = (suggestion: FoodSuggestion) => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [...prev, {
      id,
      label: suggestion.label,
      calories: suggestion.calories,
      emoji: suggestion.emoji || "🍽️",
    }]);
    toast({
      title: `${suggestion.label} נוסף`,
      description: `${suggestion.calories} קלוריות · ${suggestion.serving}`,
    });
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof MealItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const lookupCalories = async (idx: number) => {
    const item = items[idx];
    if (!item?.label?.trim() || item.label.trim().length < 2) {
      toast({ title: "הזן שם מזון לפני חיפוש קלוריות", variant: "destructive" });
      return;
    }

    setLoadingIdx(idx);
    try {
      const { data, error } = await supabase.functions.invoke("lookup-calories", {
        body: { foodName: item.label.trim() },
      });

      if (error) throw error;

      if (data?.calories && data.calories > 0) {
        updateItem(idx, "calories", data.calories);
        toast({
          title: `${data.calories} קלוריות`,
          description: data.serving ? `מנה: ${data.serving}` : undefined,
        });
      } else {
        toast({ title: "לא הצלחתי למצוא מידע תזונתי", variant: "destructive" });
      }
    } catch (e) {
      console.error("Calorie lookup error:", e);
      toast({ title: "שגיאה בחיפוש קלוריות", variant: "destructive" });
    } finally {
      setLoadingIdx(null);
    }
  };

  const searchFoods = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      toast({ title: "הזן לפחות 2 תווים לחיפוש", variant: "destructive" });
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("search-foods", {
        body: { query: searchQuery.trim() },
      });

      if (error) throw error;

      if (data?.results?.length > 0) {
        setSearchResults(data.results);
      } else {
        toast({ title: "לא נמצאו תוצאות", variant: "destructive" });
      }
    } catch (e) {
      console.error("Food search error:", e);
      toast({ title: "שגיאה בחיפוש מזון", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = () => {
    const cleaned = items
      .filter((i) => i.label.trim().length > 0)
      .map((i) => ({
        ...i,
        label: i.label.trim().slice(0, 100),
        calories: Math.max(0, Math.min(5000, i.calories)),
      }));
    onSave(mealIndex, { title: title.trim().slice(0, 50) || meal.title, items: cleaned });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        dir="rtl"
        className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-card-foreground">עריכת ארוחה</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={50}
          className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="שם הארוחה"
        />

        {/* AI Food Search */}
        <div className="mb-3">
          <button
            onClick={() => { setShowSearch(!showSearch); setSearchResults([]); setSearchQuery(""); }}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Search className="h-4 w-4" />
            חיפוש מזון חכם עם AI
          </button>

          {showSearch && (
            <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchFoods()}
                  placeholder='חפש מזון, למשל "חומוס", "שניצל"...'
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={searchFoods}
                  disabled={isSearching}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>

              {/* Results */}
              {searchResults.length > 0 && (
                <div className="max-h-48 space-y-1 overflow-y-auto">
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => addItemFromSuggestion(result)}
                      className="flex w-full items-center gap-2 rounded-lg p-2 text-right transition-colors hover:bg-accent"
                    >
                      <span className="text-lg">{result.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-card-foreground truncate">{result.label}</div>
                        <div className="text-xs text-muted-foreground">{result.serving}</div>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {result.calories} קל׳
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="flex-1 min-h-0 max-h-48 space-y-3 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2">
                <select
                  value={item.emoji}
                  onChange={(e) => updateItem(idx, "emoji", e.target.value)}
                  className="w-12 rounded bg-background p-1 text-center text-lg"
                >
                  {EMOJI_OPTIONS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>

                <input
                  value={item.label}
                  onChange={(e) => updateItem(idx, "label", e.target.value)}
                  maxLength={100}
                  placeholder="שם הפריט"
                  className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                />

                <input
                  type="number"
                  value={item.calories || ""}
                  onChange={(e) => updateItem(idx, "calories", Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="קל׳"
                  min={0}
                  max={5000}
                  className="w-16 rounded border border-input bg-background px-2 py-1 text-center text-sm outline-none focus:ring-1 focus:ring-ring"
                />

                <button
                  onClick={() => lookupCalories(idx)}
                  disabled={loadingIdx !== null}
                  className="rounded p-1 text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                  title="השלם קלוריות באמצעות AI"
                >
                  {loadingIdx === idx ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                </button>

                <button onClick={() => removeItem(idx)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add item */}
        <button
          onClick={addItem}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Plus className="h-4 w-4" />
          הוסף פריט ידנית
        </button>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            שמור
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
}
