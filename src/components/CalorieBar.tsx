import { Flame } from "lucide-react";

interface CalorieBarProps {
  consumed: number;
  target: number;
  percent: number;
}

export function CalorieBar({ consumed, target, percent }: CalorieBarProps) {
  const remaining = Math.max(0, target - consumed);
  const isOver = consumed > target;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Flame className="h-5 w-5 text-accent" />
        <h3 className="font-semibold text-card-foreground">קלוריות</h3>
      </div>

      <div className="mb-2 flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-card-foreground">{consumed}</span>
          <span className="mr-1 text-sm text-muted-foreground">/ {target}</span>
        </div>
        <span className={`text-sm font-medium ${isOver ? "text-destructive" : "text-success"}`}>
          {isOver ? `עודף ${consumed - target}` : `נותרו ${remaining}`}
        </span>
      </div>

      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isOver ? "bg-destructive" : "bg-accent"
          }`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
