import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Apple, ChevronLeft, ChevronRight } from "lucide-react";
import { calcRecommendedCalories, generatePersonalizedMeals } from "@/lib/dietCalculations";

type OnboardingData = {
  age: string;
  height: string;
  weight: string;
  gender: string;
  is_vegetarian: boolean;
  target_weight: string;
  activity_level: string;
};

const STEPS = ["פרטים אישיים", "מטרות", "העדפות"];

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
  });

  const update = (field: keyof OnboardingData, value: any) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const canNext = () => {
    if (step === 0) return data.age && data.height && data.weight && data.gender;
    if (step === 1) return data.target_weight && data.activity_level;
    return true;
  };

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
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast({ title: "הפרופיל נשמר! 🎉", description: "הדיאטה שלך מותאמת אישית" });
      navigate("/", { replace: true });
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

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
              <div
                className={`h-2 w-full rounded-full transition-colors ${
                  i <= step ? "bg-primary" : "bg-muted"
                }`}
              />
              <span className={`text-xs ${i <= step ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
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
              <div className="rounded-xl bg-muted/50 p-4 space-y-2">
                <h3 className="text-sm font-bold text-foreground">סיכום הפרטים שלך</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>גיל: {data.age}</span>
                  <span>גובה: {data.height} ס״מ</span>
                  <span>משקל: {data.weight} ק״ג</span>
                  <span>יעד: {data.target_weight} ק״ג</span>
                  <span>מגדר: {data.gender === "male" ? "גבר" : "אישה"}</span>
                  <span>צמחוני: {data.is_vegetarian ? "כן" : "לא"}</span>
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
            onClick={() => (step < 2 ? setStep((s) => s + 1) : handleSubmit())}
            disabled={!canNext() || loading}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "..." : step < 2 ? (
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
