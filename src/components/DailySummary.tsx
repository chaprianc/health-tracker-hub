import { useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DailySummaryProps {
  currentWeight: number;
  startWeight: number;
  targetWeight: number;
  caloriesConsumed: number;
  targetCalories: number;
  waterCups: number;
  totalScore: number;
  weightLost: number;
}

export function DailySummary(props: DailySummaryProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("daily-summary", {
        body: props,
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setMessage(data.message);
    } catch (e: any) {
      console.error(e);
      toast.error("לא הצלחתי לקבל סיכום, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-card-foreground">סיכום יומי</h3>
        </div>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          {message ? "רענן" : "קבל סיכום"}
        </button>
      </div>

      {message ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">{message}</p>
      ) : (
        <p className="text-sm text-muted-foreground">
          לחץ על &quot;קבל סיכום&quot; כדי לקבל הודעת מוטיבציה מותאמת אישית על בסיס ההתקדמות שלך 🌟
        </p>
      )}
    </div>
  );
}
