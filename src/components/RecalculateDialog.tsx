import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { calcRecommendedCalories, generatePersonalizedMeals } from "@/lib/dietCalculations";
import { X, Calculator, Loader2 } from "lucide-react";
import type { MealGroup } from "@/hooks/useDietAppState";

type Props = {
  open: boolean;
  onClose: () => void;
  onApply: (calories: number, meals: MealGroup[], weight: number, targetWeight: number) => void;
};

export function RecalculateDialog({ open, onClose, onApply }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    age: "",
    height: "",
    weight: "",
    gender: "male",
    is_vegetarian: false,
    target_weight: "",
    activity_level: "moderate",
  });

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("profiles")
      .select("age, height, weight, gender, is_vegetarian, target_weight, activity_level")
      .eq("id", user.id)
      .single()
      .then(({ data: p }) => {
        if (p) {
          setData({
            age: String(p.age ?? ""),
            height: String(p.height ?? ""),
            weight: String(p.weight ?? ""),
            gender: p.gender ?? "male",
            is_vegetarian: p.is_vegetarian ?? false,
            target_weight: String(p.target_weight ?? ""),
            activity_level: p.activity_level ?? "moderate",
          });
        }
        setLoading(false);
      });
  }, [open, user]);

  if (!open) return null;

  const profileData = {
    age: parseInt(data.age) || 25,
    height: parseInt(data.height) || 170,
    weight: parseFloat(data.weight) || 80,
    gender: data.gender as "male" | "female",
    activity_level: data.activity_level,
    target_weight: parseFloat(data.target_weight) || 70,
    is_vegetarian: data.is_vegetarian,
  };

  const recommendedCalories = calcRecommendedCalories(profileData);
  const canSave = data.age && data.height && data.weight && data.target_weight && data.gender;

  const update = (field: string, value: any) => setData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age: parseInt(data.age),
          height: parseInt(data.height),
          weight: parseFloat(data.weight),
          gender: data.gender,
          is_vegetarian: data.is_vegetarian,
          target_weight: parseFloat(data.target_weight),
          activity_level: data.activity_level,
        })
        .eq("id", user.id);
      if (error) throw error;

      const meals = generatePersonalizedMeals(profileData, recommendedCalories);
      onApply(recommendedCalories, meals, profileData.weight, profileData.target_weight);
      toast({ title: "עודכן בהצלחה! ✅", description: `יעד קלוריות חדש: ${recommendedCalories} קק״ל` });
      onClose();
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activityOptions = [
    { value: "sedentary", label: "🪑 יושבני" },
    { value: "light", label: "🚶 קל" },
    { value: "moderate", label: "🏃 בינוני" },
    { value: "active", label: "💪 פעיל" },
    { value: "very_active", label: "🔥 מאוד פעיל" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        dir="rtl"
        className="mx-4 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-card-foreground flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            חישוב מחדש
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">עדכן את הנתונים שלך וקבל יעד קלוריות ותפריט חדשים</p>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-card-foreground">גיל</label>
                <input type="number" value={data.age} onChange={(e) => update("age", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-card-foreground">גובה (ס״מ)</label>
                <input type="number" value={data.height} onChange={(e) => update("height", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-card-foreground">משקל (ק״ג)</label>
                <input type="number" value={data.weight} onChange={(e) => update("weight", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" step={0.1} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-card-foreground">משקל יעד (ק״ג)</label>
                <input type="number" value={data.target_weight} onChange={(e) => update("target_weight", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" step={0.1} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-card-foreground">מגדר</label>
                <div className="flex gap-2">
                  {[{ v: "male", l: "👨" }, { v: "female", l: "👩" }].map((o) => (
                    <button key={o.v} onClick={() => update("gender", o.v)}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm transition-all ${data.gender === o.v ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"}`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-card-foreground">רמת פעילות</label>
              <div className="flex flex-wrap gap-2">
                {activityOptions.map((o) => (
                  <button key={o.value} onClick={() => update("activity_level", o.value)}
                    className={`rounded-lg border-2 px-3 py-1.5 text-xs transition-all ${data.activity_level === o.value ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background text-card-foreground hover:border-primary/40"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-card-foreground">צמחוני/ת</label>
              <div className="flex gap-2">
                {[{ v: false, l: "🥩 לא" }, { v: true, l: "🥬 כן" }].map((o) => (
                  <button key={String(o.v)} onClick={() => update("is_vegetarian", o.v)}
                    className={`rounded-lg border-2 px-3 py-1.5 text-xs transition-all ${data.is_vegetarian === o.v ? "border-primary bg-primary/10 text-primary font-medium" : "border-border bg-background text-card-foreground hover:border-primary/40"}`}>
                    {o.l}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {canSave && (
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">יעד קלוריות יומי מומלץ</p>
                <p className="text-2xl font-bold text-primary">{recommendedCalories}</p>
                <p className="text-xs text-muted-foreground">קק״ל ליום</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={!canSave || loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "עדכן תפריט ויעד"}
              </button>
              <button onClick={onClose} className="rounded-lg bg-secondary px-4 py-2.5 text-sm text-secondary-foreground hover:bg-secondary/80">
                ביטול
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
