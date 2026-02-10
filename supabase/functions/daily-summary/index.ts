import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { currentWeight, startWeight, targetWeight, caloriesConsumed, targetCalories, waterCups, totalScore, weightLost } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const progressPercent = startWeight > targetWeight
      ? Math.round(((startWeight - currentWeight) / (startWeight - targetWeight)) * 100)
      : 0;

    const caloriesRemaining = targetCalories - caloriesConsumed;
    const isOverCalories = caloriesConsumed > targetCalories;

    const systemPrompt = `אתה מאמן דיאטה מוטיבציוני שמדבר בעברית. התפקיד שלך לתת סיכום יומי קצר ומעודד.
כללים:
- כתוב בעברית בלבד
- תן סיכום של 2-3 משפטים קצרים
- השתמש באימוג'ים רלוונטיים
- אם המשתמש בכיוון טוב - עודד אותו
- אם יש מקום לשיפור - תן טיפ קטן ומעודד בלי לשפוט
- התייחס לנתונים הספציפיים שקיבלת`;

    const userPrompt = `הנה הנתונים שלי להיום:
- משקל נוכחי: ${currentWeight} ק"ג (ירדתי ${weightLost.toFixed(1)} ק"ג מתוך יעד של ${(startWeight - targetWeight).toFixed(0)} ק"ג)
- התקדמות: ${progressPercent}%
- קלוריות: ${caloriesConsumed} מתוך ${targetCalories} (${isOverCalories ? `עודף של ${caloriesConsumed - targetCalories}` : `נותרו ${caloriesRemaining}`})
- כוסות מים: ${waterCups} מתוך 8
- ניקוד כולל: ${totalScore}

תן לי סיכום יומי מוטיבציוני קצר.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד דקה" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נדרש חידוש קרדיטים" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "שגיאה בשירות AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content || "המשך כך! 💪";

    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("daily-summary error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
