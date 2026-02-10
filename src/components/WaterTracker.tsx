import { Droplets, RotateCcw } from "lucide-react";

interface WaterTrackerProps {
  cups: number;
  onSetCups: (n: number) => void;
  onReset: () => void;
}

export function WaterTracker({ cups, onSetCups, onReset }: WaterTrackerProps) {
  const maxCups = 8;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5 text-water" />
          <h3 className="font-semibold text-card-foreground">מים</h3>
        </div>
        <button onClick={onReset} className="text-muted-foreground transition-colors hover:text-foreground">
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-3 text-center text-3xl font-bold text-water">
        {cups} <span className="text-base font-normal text-muted-foreground">/ {maxCups} כוסות</span>
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {Array.from({ length: maxCups }).map((_, i) => (
          <button
            key={i}
            onClick={() => onSetCups(i < cups ? i : i + 1)}
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition-all ${
              i < cups
                ? "bg-water text-water-foreground shadow-sm"
                : "bg-secondary text-muted-foreground hover:bg-water/20"
            }`}
          >
            💧
          </button>
        ))}
      </div>
    </div>
  );
}
