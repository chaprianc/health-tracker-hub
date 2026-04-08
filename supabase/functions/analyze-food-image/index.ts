import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return new Response(JSON.stringify({ error: "תמונה חסרה" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a nutrition expert who analyzes food photos. Given an image of food, identify ALL visible food items and estimate their nutritional values per typical serving shown in the photo.

Return ONLY a JSON object in this exact format:
{"items": [{"label": "<food name in Hebrew>", "calories": <number>, "protein": <number in grams>, "carbs": <number in grams>, "fat": <number in grams>, "serving": "<portion description in Hebrew>", "emoji": "<single relevant food emoji>"}]}

Rules:
- Identify every distinct food item visible in the photo
- Estimate based on the portion size visible in the image
- Use Hebrew for labels and serving descriptions
- Be specific (e.g. "חזה עוף צלוי" not just "עוף")
- If you cannot identify food in the image, return {"items": [], "error": "לא זוהה מזון בתמונה"}
- Do not add any text outside the JSON`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "נתח את התמונה וזהה את כל פריטי המזון",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "יותר מדי בקשות, נסה שוב בעוד כמה שניות" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "נגמר מכסת השימוש ב-AI" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "שגיאה בשירות AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const items = (parsed.items || []).map((item: any) => ({
        label: item.label || "",
        calories: Math.round(item.calories || 0),
        protein: Math.round(item.protein || 0),
        carbs: Math.round(item.carbs || 0),
        fat: Math.round(item.fat || 0),
        serving: item.serving || "",
        emoji: item.emoji || "🍽️",
      }));

      return new Response(JSON.stringify({ items, error: parsed.error || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ items: [], error: "לא הצלחתי לנתח את התמונה" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-food-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});