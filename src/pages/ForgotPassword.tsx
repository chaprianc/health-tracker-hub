import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Apple, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Apple className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">שכחת סיסמה?</h1>
          <p className="text-sm text-muted-foreground text-center">
            {sent ? "נשלח! בדוק את האימייל שלך" : "הזן את האימייל שלך ונשלח לך קישור לאיפוס"}
          </p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">אימייל</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="your@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "..." : "שלח קישור איפוס"}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm text-center space-y-3">
            <div className="text-4xl">📧</div>
            <p className="text-sm text-card-foreground">
              שלחנו קישור לאיפוס סיסמה ל-<strong>{email}</strong>
            </p>
            <p className="text-xs text-muted-foreground">לא קיבלת? בדוק בתיקיית הספאם</p>
          </div>
        )}

        <Link
          to="/auth"
          className="flex items-center justify-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה להתחברות
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
