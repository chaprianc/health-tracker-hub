import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Apple, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { calcRecommendedCalories, generatePersonalizedMeals } from "@/lib/dietCalculations";
import type { MealGroup } from "@/hooks/useDietAppState";

type OnboardingData = {
  age: string;
  height: string;
  weight: string;
  gender: string;
  is_vegetarian: boolean;
  target_weight: string;
  activity_level: string;
  health_conditions: string[];
  medications: string[];
};

const STEPS = ["פרטים אישיים", "מטרות", "בריאות", "העדפות"];

const HEALTH_CONDITIONS = [
  { value: "diabetes", label: "סוכרת", emoji: "💉", warning: "יש להימנע ממזונות עתירי סוכר ופחמימות פשוטות" },
  { value: "high_blood_pressure", label: "לחץ דם גבוה", emoji: "❤️", warning: "יש להגביל צריכת מלח ומזונות מעובדים" },
  { value: "high_cholesterol", label: "כולסטרול גבוה", emoji: "🫀", warning: "יש להימנע משומנים רווּיים ומזון מטוגן" },
  { value: "celiac", label: "צליאק", emoji: "🌾", warning: "יש להימנע ממזונות המכילים גלוטן" },
  { value: "heart_disease", label: "מחלות לב", emoji: "💔", warning: "יש להקפיד על תזונה דלת שומן ומלח" },
  { value: "kidney_disease", label: "מחלות כליות", emoji: "🫘", warning: "יש להגביל חלבון, אשלגן ומלח" },
  { value: "thyroid", label: "בלוטת תריס", emoji: "🦋", warning: "יש להתאים תזונה בהתאם לסוג הבעיה" },
  { value: "anemia", label: "אנמיה", emoji: "🩸", warning: "יש להקפיד על מזונות עשירים בברזל" },
];

const COMMON_MEDICATIONS = [
  { value: "diabetes_meds", label: "תרופות לסוכרת", emoji: "💊" },
  { value: "blood_pressure_meds", label: "תרופות ללחץ דם", emoji: "💊" },
  { value: "cholesterol_meds", label: "תרופות לכולסטרול", emoji: "💊" },
  { value: "blood_thinners", label: "מדללי דם", emoji: "💊" },
  { value: "thyroid_meds", label: "תרופות לבלוטת תריס", emoji: "💊" },
  { value: "iron_supplements", label: "תוספי ברזל", emoji: "💊" },
  { value: "insulin", label: "אינסולין", emoji: "💉" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    age: "",
    height: "",
    weight: "",
    gender: "",
    is_vegetarian: false,
    target_weight: "",
    activity_level: "moderate",
    health_conditions: [],
    medications: [],
  });

  const update = (field: keyof OnboardingData, value: any) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const toggleArrayItem = (field: "health_conditions" | "medications", value: string) => {
    setData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const canNext = () => {
    if (step === 0) return data.age && data.height && data.weight && data.gender;
    if (step === 1) return data.target_weight && data.activity_level;
    // Step 2 (health) and step 3 (preferences) are always valid (optional)
    return true;
  };

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

  const handleSubmit = async () => {
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
          health_conditions: data.health_conditions,
          medications: data.medications,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      const meals: MealGroup[] = generatePersonalizedMeals(profileData, recommendedCalories);
      await supabase.from("user_settings").upsert({
        user_id: user.id,
        target_calories: recommendedCalories,
        current_weight: profileData.weight,
        start_weight: profileData.weight,
        target_weight: profileData.target_weight,
        meals: meals as any,
        weight_history: [] as any,
      }, { onConflict: "user_id" });

      localStorage.removeItem("dietAppState_v1");

      await refreshProfile();
      toast({ title: "הפרופיל נשמר! 🎉", description: `יעד קלוריות מומלץ: ${recommendedCalories} קק״ל` });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeWarnings = HEALTH_CONDITIONS.filter((c) => data.health_conditions.includes(c.value));

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Apple className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">בואו נתחיל!</h1>
          <p className="text-sm text-muted-foreground">ספר לנו קצת על עצמך כדי שנתאים לך דיאטה</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <div className={`h-2 w-full rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
              <span className={`text-xs ${i <= step ? "text-primary font-medium" : "text-muted-foreground"}`}>{s}</span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5 max-h-[60vh] overflow-y-auto">
          {step === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">גיל</label>
                  <input
                    type="number"
                    value={data.age}
                    onChange={(e) => update("age", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="25"
                    min={10}
                    max={120}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-card-foreground">גובה (ס״מ)</label>
                  <input
                    type="number"
                    value={data.height}
                    onChange={(e) => update("height", e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    placeholder="175"
                    min={100}
                    max={250}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">משקל נוכחי (ק״ג)</label>
                <input
                  type="number"
                  value={data.weight}
                  onChange={(e) => update("weight", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="85"
                  min={30}
                  max={300}
                  step={0.1}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">מגדר</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "male", label: "👨 גבר" },
                    { value: "female", label: "👩 אישה" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => update("gender", opt.value)}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        data.gender === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-card-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-card-foreground">משקל יעד (ק״ג)</label>
                <input
                  type="number"
                  value={data.target_weight}
                  onChange={(e) => update("target_weight", e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  placeholder="75"
                  min={30}
                  max={300}
                  step={0.1}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">רמת פעילות גופנית</label>
                <div className="grid gap-3">
                  {[
                    { value: "sedentary", label: "🪑 יושבני", desc: "עבודה משרדית, מעט תנועה" },
                    { value: "light", label: "🚶 קל", desc: "הליכות, פעילות קלה 1-2 בשבוע" },
                    { value: "moderate", label: "🏃 בינוני", desc: "אימונים 3-4 פעמים בשבוע" },
                    { value: "active", label: "💪 פעיל", desc: "אימונים 5-6 פעמים בשבוע" },
                    { value: "very_active", label: "🔥 מאוד פעיל", desc: "אימונים יומיים אינטנסיביים" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => update("activity_level", opt.value)}
                      className={`flex flex-col items-start rounded-xl border-2 px-4 py-3 text-right transition-all ${
                        data.activity_level === opt.value
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <span className={`text-sm font-medium ${data.activity_level === opt.value ? "text-primary" : "text-card-foreground"}`}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  האם יש לך מחלות ידועות? <span className="text-xs text-muted-foreground">(ניתן לדלג)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {HEALTH_CONDITIONS.map((cond) => (
                    <button
                      key={cond.value}
                      onClick={() => toggleArrayItem("health_conditions", cond.value)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all text-right ${
                        data.health_conditions.includes(cond.value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-card-foreground hover:border-primary/40"
                      }`}
                    >
                      <span>{cond.emoji}</span>
                      <span className="truncate">{cond.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  האם את/ה לוקח/ת תרופות באופן קבוע? <span className="text-xs text-muted-foreground">(ניתן לדלג)</span>
                </label>
                <div className="grid gap-2">
                  {COMMON_MEDICATIONS.map((med) => (
                    <button
                      key={med.value}
                      onClick={() => toggleArrayItem("medications", med.value)}
                      className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all text-right ${
                        data.medications.includes(med.value)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-card-foreground hover:border-primary/40"
                      }`}
                    >
                      <span>{med.emoji}</span>
                      <span>{med.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Health warnings preview */}
              {activeWarnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-card-foreground flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    המלצות תזונתיות חשובות:
                  </p>
                  {activeWarnings.map((w) => (
                    <div key={w.value} className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-2.5">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">{w.emoji} {w.label}</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{w.warning}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">האם את/ה צמחוני/ת?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: false, label: "🥩 לא" },
                    { value: true, label: "🥬 כן" },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => update("is_vegetarian", opt.value)}
                      className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        data.is_vegetarian === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-card-foreground hover:border-primary/40"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                <h3 className="text-sm font-bold text-foreground">סיכום הפרטים שלך</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>גיל: {data.age}</span>
                  <span>גובה: {data.height} ס״מ</span>
                  <span>משקל: {data.weight} ק״ג</span>
                  <span>יעד: {data.target_weight} ק״ג</span>
                  <span>מגדר: {data.gender === "male" ? "גבר" : "אישה"}</span>
                  <span>צמחוני: {data.is_vegetarian ? "כן" : "לא"}</span>
                </div>
                {data.health_conditions.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">מחלות: </span>
                    {data.health_conditions.map((c) => HEALTH_CONDITIONS.find((h) => h.value === c)?.label).filter(Boolean).join(", ")}
                  </div>
                )}
                {data.medications.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">תרופות: </span>
                    {data.medications.map((m) => COMMON_MEDICATIONS.find((med) => med.value === m)?.label).filter(Boolean).join(", ")}
                  </div>
                )}
                <div className="rounded-lg bg-primary/10 border border-primary/20 p-3 text-center">
                  <p className="text-xs text-muted-foreground">יעד קלוריות יומי מומלץ</p>
                  <p className="text-2xl font-bold text-primary">{recommendedCalories}</p>
                  <p className="text-xs text-muted-foreground">קק״ל ליום</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 rounded-lg bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
            >
              <ChevronRight className="h-4 w-4" />
              הקודם
            </button>
          )}
          <button
            onClick={() => (step < 3 ? setStep((s) => s + 1) : handleSubmit())}
            disabled={!canNext() || loading}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "..." : step < 3 ? (
              <>
                הבא
                <ChevronLeft className="h-4 w-4" />
              </>
            ) : (
              "סיים והתחל! 🚀"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
