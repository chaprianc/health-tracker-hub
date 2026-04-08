import { TrendingDown, Flame, Trophy, Zap } from "lucide-react";

interface StatsCardsProps {
  currentWeight: number;
  weightLost: number;
  caloriesConsumed: number;
  targetCalories: number;
  streak: number;
  totalScore: number;
}

export function StatsCards({
  currentWeight,
  weightLost,
  caloriesConsumed,
  targetCalories,
  streak,
  totalScore,
}: StatsCardsProps) {
  const cards = [
    {
      icon: TrendingDown,
      label: "משקל נוכחי",
      value: `${currentWeight} ק״ג`,
      sub: `ירדת ${weightLost.toFixed(1)} ק״ג`,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Flame,
      label: "קלוריות היום",
      value: `${caloriesConsumed}`,
      sub: `מתוך ${targetCalories}`,
      color: "text-accent-foreground",
      bg: "bg-accent/15",
    },
    {
      icon: Zap,
      label: "רצף ימים",
      value: `${streak}`,
      sub: "ימים רצופים",
      color: "text-warning",
      bg: "bg-warning/15",
    },
    {
      icon: Trophy,
      label: "ניקוד כולל",
      value: `${totalScore}`,
      sub: "נקודות",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-card p-3 md:p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-1.5 md:mb-2 flex items-center gap-2">
            <div className={`rounded-lg p-1.5 md:p-2 ${card.bg}`}>
              <card.icon className={`h-3.5 w-3.5 md:h-4 md:w-4 ${card.color}`} />
            </div>
          </div>
          <p className="text-xl md:text-2xl font-bold text-card-foreground">{card.value}</p>
          <p className="text-[11px] md:text-xs text-muted-foreground">{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
