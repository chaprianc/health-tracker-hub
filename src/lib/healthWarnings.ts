// Maps health conditions to food keywords that should trigger warnings
const CONDITION_FOOD_WARNINGS: Record<string, { keywords: string[]; warning: string }> = {
  diabetes: {
    keywords: ["סוכר", "דבש", "ממתק", "עוגה", "שוקולד", "גלידה", "מיץ", "קולה", "ממתקים", "וופל", "עוגיה", "עוגיות", "פנקייק", "ריבה", "סירופ", "דונאט", "קרמבו"],
    warning: "⚠️ מזון עתיר סוכר – לא מומלץ עבור חולי סוכרת",
  },
  high_blood_pressure: {
    keywords: ["מלח", "מלוח", "חטיף", "נקניק", "נקניקיה", "סלמי", "זיתים", "חמוצים", "סויה", "רוטב סויה", "צ'יפס", "קרקר"],
    warning: "⚠️ מזון עתיר מלח – לא מומלץ עבור בעלי לחץ דם גבוה",
  },
  high_cholesterol: {
    keywords: ["מטוגן", "טיגון", "שניצל מטוגן", "צ'יפס", "חמאה", "שמנת", "קרם", "נקניק", "סלמי", "בשר שומני"],
    warning: "⚠️ מזון עתיר שומן רווי – לא מומלץ עבור בעלי כולסטרול גבוה",
  },
  celiac: {
    keywords: ["לחם", "פיתה", "פסטה", "קוסקוס", "בורגול", "עוגה", "עוגיה", "ביסקוויט", "קרקר", "חיטה", "שיפון", "שעורה", "גלוטן", "מאפה"],
    warning: "⚠️ מזון המכיל גלוטן – לא מתאים לחולי צליאק",
  },
  kidney_disease: {
    keywords: ["בננה", "תפוז", "עגבנייה", "תפוח אדמה", "אבוקדו", "תמר", "שקד", "בוטן", "אגוז"],
    warning: "⚠️ מזון עשיר באשלגן – יש להיזהר עם מחלות כליות",
  },
};

export function getFoodWarnings(foodLabel: string, healthConditions: string[]): string[] {
  if (!healthConditions?.length || !foodLabel) return [];

  const label = foodLabel.toLowerCase();
  const warnings: string[] = [];

  for (const condition of healthConditions) {
    const rule = CONDITION_FOOD_WARNINGS[condition];
    if (!rule) continue;
    if (rule.keywords.some((kw) => label.includes(kw))) {
      warnings.push(rule.warning);
    }
  }

  return warnings;
}
