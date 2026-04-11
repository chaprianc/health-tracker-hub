import { useState, useRef } from "react";
import { X, Plus, Trash2, Sparkles, Loader2, Search, Camera, ImageIcon, Pencil, Check } from "lucide-react";
import type { MealItem, MealGroup } from "@/hooks/useDietAppState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface EditMealDialogProps {
  meal: MealGroup;
  mealIndex: number;
  allMeals?: MealGroup[];
  open: boolean;
  onClose: () => void;
  onSave: (index: number, updated: MealGroup) => void;
}

interface FoodSuggestion {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  emoji: string;
}

interface AnalyzedItem {
  label: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  emoji: string;
  selected: boolean;
  editing: boolean;
  quantity: number;
}

const EMOJI_OPTIONS = ["🥚", "🍞", "🥒", "🧀", "🍗", "🍚", "🥗", "🥄", "🐟", "🥦", "🌾", "🍎", "🥛", "🥜", "🥩", "🍕", "🥑", "🍌", "🫘", "🥣"];

export function EditMealDialog({ meal, mealIndex, allMeals, open, onClose, onSave }: EditMealDialogProps) {
  const [items, setItems] = useState<MealItem[]>(() => meal.items.map((i) => ({ ...i })));
  const [title, setTitle] = useState(meal.title);
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Photo analysis state
  const [showPhotoAnalysis, setShowPhotoAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState<AnalyzedItem[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetMealIndex, setTargetMealIndex] = useState<number>(mealIndex);

  if (!open) return null;

  const addItem = () => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [...prev, { id, label: "", calories: 0, emoji: "🍽️", protein: 0, carbs: 0, fat: 0 }]);
  };

  const addItemFromSuggestion = (suggestion: FoodSuggestion) => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [...prev, {
      id,
      label: suggestion.label,
      calories: suggestion.calories,
      protein: suggestion.protein,
      carbs: suggestion.carbs,
      fat: suggestion.fat,
      emoji: suggestion.emoji || "🍽️",
    }]);
    toast({
      title: `${suggestion.label} נוסף`,
      description: `${suggestion.calories} קל׳ · ח ${suggestion.protein}g · פ ${suggestion.carbs}g · ש ${suggestion.fat}g`,
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
        setItems((prev) =>
          prev.map((it, i) =>
            i === idx
              ? { ...it, calories: data.calories, protein: data.protein || 0, carbs: data.carbs || 0, fat: data.fat || 0 }
              : it
          )
        );
        toast({
          title: `${data.calories} קלוריות`,
          description: `ח ${data.protein || 0}g · פ ${data.carbs || 0}g · ש ${data.fat || 0}g${data.serving ? ` · ${data.serving}` : ""}`,
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

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "אנא בחר קובץ תמונה", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "התמונה גדולה מדי (מקסימום 10MB)", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPhotoPreview(base64);
      setIsAnalyzing(true);
      setAnalyzedItems([]);

      try {
        const { data, error } = await supabase.functions.invoke("analyze-food-image", {
          body: { imageBase64: base64 },
        });

        if (error) throw error;

        if (data?.error) {
          toast({ title: data.error, variant: "destructive" });
          return;
        }

        if (data?.items?.length > 0) {
          setAnalyzedItems(data.items.map((item: any) => ({ ...item, selected: true, editing: false, quantity: 1 })));
          toast({ title: `זוהו ${data.items.length} פריטי מזון! 📸` });
        } else {
          toast({ title: "לא זוהו פריטי מזון בתמונה", variant: "destructive" });
        }
      } catch (e) {
        console.error("Photo analysis error:", e);
        toast({ title: "שגיאה בניתוח התמונה", variant: "destructive" });
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleAnalyzedItem = (idx: number) => {
    setAnalyzedItems((prev) => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  };

  const toggleEditAnalyzedItem = (idx: number) => {
    setAnalyzedItems((prev) => prev.map((item, i) => i === idx ? { ...item, editing: !item.editing } : item));
  };

  const updateAnalyzedItem = (idx: number, field: string, value: string | number) => {
    setAnalyzedItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addAnalyzedItemsToMeal = () => {
    const selected = analyzedItems.filter((item) => item.selected);
    if (selected.length === 0) {
      toast({ title: "בחר לפחות פריט אחד להוספה", variant: "destructive" });
      return;
    }
    const newItems = selected.map((item) => ({
      id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      label: item.quantity !== 1 ? `${item.label} (×${item.quantity})` : item.label,
      calories: Math.round(item.calories * item.quantity),
      protein: Math.round(item.protein * item.quantity),
      carbs: Math.round(item.carbs * item.quantity),
      fat: Math.round(item.fat * item.quantity),
      emoji: item.emoji,
    }));

    if (targetMealIndex === mealIndex) {
      // Add to current meal
      setItems((prev) => [...prev, ...newItems]);
    } else if (allMeals) {
      // Save to a different meal
      const targetMeal = allMeals[targetMealIndex];
      onSave(targetMealIndex, { ...targetMeal, items: [...targetMeal.items, ...newItems] });
    }

    const targetName = allMeals?.[targetMealIndex]?.title || meal.title;
    toast({ title: `נוספו ${selected.length} פריטים ל${targetName} ✅` });
    setShowPhotoAnalysis(false);
    setAnalyzedItems([]);
    setPhotoPreview(null);
  };

  const totalAnalyzedCalories = analyzedItems
    .filter((item) => item.selected)
    .reduce((sum, item) => sum + item.calories, 0);

  const handleSave = () => {
    const cleaned = items
      .filter((i) => i.label.trim().length > 0)
      .map((i) => ({
        ...i,
        label: i.label.trim().slice(0, 100),
        calories: Math.max(0, Math.min(5000, i.calories)),
        protein: Math.max(0, i.protein || 0),
        carbs: Math.max(0, i.carbs || 0),
        fat: Math.max(0, i.fat || 0),
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

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={50}
          className="mb-3 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="שם הארוחה"
        />

        {/* AI Food Search */}
        <div className="mb-3">
          <div className="flex gap-2">
            <button
              onClick={() => { setShowSearch(!showSearch); setSearchResults([]); setSearchQuery(""); setShowPhotoAnalysis(false); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary/10 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Search className="h-4 w-4" />
              חיפוש מזון
            </button>
            <button
              onClick={() => { setShowPhotoAnalysis(!showPhotoAnalysis); setShowSearch(false); setAnalyzedItems([]); setPhotoPreview(null); }}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent py-2 text-sm font-medium text-primary transition-colors hover:bg-accent/80"
            >
              <Camera className="h-4 w-4" />
              צלם ארוחה
            </button>
          </div>

          {/* Photo Analysis Panel */}
          {showPhotoAnalysis && (
            <div className="mt-2 rounded-lg border border-border bg-secondary/30 p-3 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                  e.target.value = "";
                }}
              />

              {!photoPreview && !isAnalyzing && (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">צלם או העלה תמונה של ארוחה<br />וה-AI יזהה את פריטי המזון</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Camera className="h-4 w-4" />
                      צלם / בחר תמונה
                    </button>
                  </div>
                </div>
              )}

              {photoPreview && (
                <div className="relative">
                  <img src={photoPreview} alt="ארוחה" className="w-full max-h-40 rounded-lg object-cover" />
                  <button
                    onClick={() => { setPhotoPreview(null); setAnalyzedItems([]); }}
                    className="absolute top-1 left-1 rounded-full bg-foreground/60 p-1 text-background hover:bg-foreground/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">מנתח את התמונה...</span>
                </div>
              )}

              {analyzedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-card-foreground">פריטים שזוהו:</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-primary hover:underline"
                    >
                      צלם שוב
                    </button>
                  </div>
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {analyzedItems.map((item, i) => (
                      <div key={i} className={`rounded-lg border p-2 transition-colors ${item.selected ? "border-primary bg-primary/5" : "border-border bg-background opacity-60"}`}>
                        {item.editing ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <input
                                value={item.label}
                                onChange={(e) => updateAnalyzedItem(i, "label", e.target.value)}
                                className="min-w-0 flex-1 rounded border border-input bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                              />
                              <button onClick={() => toggleEditAnalyzedItem(i)} className="rounded p-1 text-primary hover:bg-primary/10">
                                <Check className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                              <div>
                                <label className="text-[10px] text-muted-foreground">קל׳</label>
                                <input type="number" value={item.calories} onChange={(e) => updateAnalyzedItem(i, "calories", Math.max(0, parseInt(e.target.value) || 0))} className="w-full rounded border border-input bg-background px-1 py-0.5 text-center text-xs outline-none" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground">חלבון</label>
                                <input type="number" value={item.protein} onChange={(e) => updateAnalyzedItem(i, "protein", Math.max(0, parseInt(e.target.value) || 0))} className="w-full rounded border border-input bg-background px-1 py-0.5 text-center text-xs outline-none" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground">פחמימות</label>
                                <input type="number" value={item.carbs} onChange={(e) => updateAnalyzedItem(i, "carbs", Math.max(0, parseInt(e.target.value) || 0))} className="w-full rounded border border-input bg-background px-1 py-0.5 text-center text-xs outline-none" />
                              </div>
                              <div>
                                <label className="text-[10px] text-muted-foreground">שומן</label>
                                <input type="number" value={item.fat} onChange={(e) => updateAnalyzedItem(i, "fat", Math.max(0, parseInt(e.target.value) || 0))} className="w-full rounded border border-input bg-background px-1 py-0.5 text-center text-xs outline-none" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleAnalyzedItem(i)} className={`shrink-0 flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${item.selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>
                              {item.selected && <Check className="h-3 w-3" />}
                            </button>
                            <span className="text-lg">{item.emoji}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-card-foreground truncate">{item.label}</div>
                              <div className="text-xs text-muted-foreground">{item.serving}</div>
                              <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                                <span>ח {item.protein}g</span>
                                <span>פ {item.carbs}g</span>
                                <span>ש {item.fat}g</span>
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{item.calories} קל׳</span>
                            <button onClick={() => toggleEditAnalyzedItem(i)} className="shrink-0 rounded p-1 text-muted-foreground hover:text-primary">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Total calories summary */}
                  <div className="rounded-lg bg-primary/10 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-primary">סה״כ קלוריות: {totalAnalyzedCalories}</span>
                      <span className="text-xs text-muted-foreground mr-2">({analyzedItems.filter(i => i.selected).length} פריטים)</span>
                    </div>
                  </div>

                  {/* Meal selector */}
                  {allMeals && allMeals.length > 1 && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground whitespace-nowrap">הוסף לארוחה:</label>
                      <select
                        value={targetMealIndex}
                        onChange={(e) => setTargetMealIndex(Number(e.target.value))}
                        className="flex-1 rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                      >
                        {allMeals.map((m, i) => (
                          <option key={i} value={i}>{m.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={addAnalyzedItemsToMeal}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    הוסף {analyzedItems.filter(i => i.selected).length} פריטים לארוחה
                  </button>
                </div>
              )}
            </div>
          )}

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
                        <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>ח {result.protein}g</span>
                          <span>פ {result.carbs}g</span>
                          <span>ש {result.fat}g</span>
                        </div>
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
                  title="השלם ערכים תזונתיים באמצעות AI"
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
              {/* Macros row */}
              {(item.protein || item.carbs || item.fat) ? (
                <div className="flex gap-3 px-2 text-[11px] text-muted-foreground">
                  <span>חלבון: {item.protein || 0}g</span>
                  <span>פחמימות: {item.carbs || 0}g</span>
                  <span>שומן: {item.fat || 0}g</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Plus className="h-4 w-4" />
          הוסף פריט ידנית
        </button>

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
