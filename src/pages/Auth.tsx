import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Apple } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Normalize phone: keep digits only, then build a synthetic email so
  // Supabase email/password auth can be used without an SMS provider.
  const phoneToEmail = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    return `${digits}@phone.local`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 7) {
        throw new Error("מספר טלפון לא תקין");
      }
      const email = phoneToEmail(phone);

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        if (!displayName.trim()) {
          throw new Error("יש להזין שם");
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName, phone: digits },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({
          title: "נרשמת בהצלחה! 🎉",
          description: "אפשר להתחבר עכשיו",
        });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "שגיאה",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Apple className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">הדיאטה שלי</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "התחבר כדי להמשיך" : "צור חשבון חדש"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {!isLogin && (
            <div>
              <label className="mb-1 block text-sm font-medium text-card-foreground">שם</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                placeholder="השם שלך"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">מספר טלפון</label>
            <input
              type="tel"
              inputMode="numeric"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="0501234567"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-card-foreground">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="לפחות 6 תווים"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "..." : isLogin ? "התחבר" : "הרשם"}
          </button>
          {isLogin && (
            <a
              href="/forgot-password"
              className="block text-center text-xs text-muted-foreground hover:text-primary hover:underline"
            >
              שכחת סיסמה?
            </a>
          )}
        </form>

        {/* Toggle */}
        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "אין לך חשבון?" : "כבר יש לך חשבון?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-primary hover:underline"
          >
            {isLogin ? "הרשם כאן" : "התחבר כאן"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
