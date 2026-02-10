import { CheckCircle2, Circle } from "lucide-react";

export interface ChecklistItemData {
  id: string;
  label: string;
  calories: number;
  emoji: string;
}

interface MealChecklistProps {
  title: string;
  items: ChecklistItemData[];
  checkedItems: Set<string>;
  onToggle: (id: string, calories: number) => void;
}

export function MealChecklist({ title, items, checkedItems, onToggle }: MealChecklistProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-3 font-semibold text-card-foreground">{title}</h3>
      <div className="space-y-2">
        {items.map((item) => {
          const checked = checkedItems.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id, item.calories)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-right transition-all ${
                checked
                  ? "bg-primary/10 text-card-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              {checked ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground/40" />
              )}
              <span className="text-lg">{item.emoji}</span>
              <span className={`flex-1 text-sm ${checked ? "line-through opacity-60" : ""}`}>
                {item.label}
              </span>
              {item.calories > 0 && (
                <span className="text-xs text-muted-foreground">{item.calories} קל׳</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
