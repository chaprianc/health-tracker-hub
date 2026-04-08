import { useState, useCallback } from "react";
import { X, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
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

const EMOJI_OPTIONS = ["🥚", "🍞", "🥒", "🧀", "🍗", "🍚", "🥗", "🥄", "🐟", "🥦", "🌾", "🍎", "🥛", "🥜", "🥩", "🍕", "🥑", "🍌", "🫘", "🥣"];

export function EditMealDialog({ meal, mealIndex, open, onClose, onSave }: EditMealDialogProps) {
  const [items, setItems] = useState<MealItem[]>(() => meal.items.map((i) => ({ ...i })));
  const [title, setTitle] = useState(meal.title);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  if (!open) return null;

  const addItem = () => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [...prev, { id, label: "", calories: 0, emoji: "🍽️" }]);
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
        className="mx-4 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
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
          className="mb-4 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="שם הארוחה"
        />

        {/* Items */}
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {items.map((item, idx) => (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2">
                {/* Emoji picker */}
                <select
                  value={item.emoji}
                  onChange={(e) => updateItem(idx, "emoji", e.target.value)}
                  className="w-12 rounded bg-background p-1 text-center text-lg"
                >
                  {EMOJI_OPTIONS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>

                {/* Label */}
                <input
                  value={item.label}
                  onChange={(e) => updateItem(idx, "label", e.target.value)}
                  maxLength={100}
                  placeholder="שם הפריט"
                  className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                />

                {/* Calories */}
                <input
                  type="number"
                  value={item.calories || ""}
                  onChange={(e) => updateItem(idx, "calories", Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="קל׳"
                  min={0}
                  max={5000}
                  className="w-16 rounded border border-input bg-background px-2 py-1 text-center text-sm outline-none focus:ring-1 focus:ring-ring"
                />

                {/* AI lookup */}
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

                {/* Delete */}
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
          הוסף פריט
        </button>

        {/* Actions */}
        <div className="mt-5 flex gap-2">
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
