import { CheckCircle2, Circle, Clock, Pencil } from "lucide-react";

export interface ChecklistItemData {
  id: string;
  label: string;
  calories: number;
  emoji: string;
  protein?: number;
  carbs?: number;
  fat?: number;
}

interface MealChecklistProps {
  title: string;
  time?: string;
  items: ChecklistItemData[];
  checkedItems: Set<string>;
  onToggle: (id: string, calories: number) => void;
  onEdit?: () => void;
}

export function MealChecklist({ title, time, items, checkedItems, onToggle, onEdit }: MealChecklistProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-card-foreground">{title}</h3>
          {time && (
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {time}
            </span>
          )}
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const checked = checkedItems.has(item.id);
          const hasMacros = (item.protein || item.carbs || item.fat);
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
              <div className="flex-1 min-w-0">
                <span className={`text-sm block ${checked ? "line-through opacity-60" : ""}`}>
                  {item.label}
                </span>
                {hasMacros ? (
                  <span className="flex gap-2 text-[10px] text-muted-foreground/70 mt-0.5">
                    <span>ח {item.protein || 0}g</span>
                    <span>פ {item.carbs || 0}g</span>
                    <span>ש {item.fat || 0}g</span>
                  </span>
                ) : null}
              </div>
              {item.calories > 0 && (
                <span className="text-xs text-muted-foreground shrink-0">{item.calories} קל׳</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
