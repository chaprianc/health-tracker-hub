import { Download, Upload, RotateCcw, Calculator } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

interface SettingsPanelProps {
  onExport: () => string;
  onImport: (text: string) => void;
  onReset: () => void;
  onRecalculate?: () => void;
}

export function SettingsPanel({ onExport, onImport, onReset, onRecalculate }: SettingsPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = onExport();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diet-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("הגיבוי יורד!");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        onImport(reader.result as string);
        toast.success("הנתונים שוחזרו בהצלחה!");
      } catch {
        toast.error("קובץ לא תקין");
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex flex-wrap gap-2">
      {onRecalculate && (
        <button
          onClick={onRecalculate}
          className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Calculator className="h-4 w-4" />
          חישוב מחדש
        </button>
      )}
        onClick={handleExport}
        className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
      >
        <Download className="h-4 w-4" />
        ייצוא גיבוי
      </button>

      <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
        <Upload className="h-4 w-4" />
        ייבוא גיבוי
        <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </label>

      <button
        onClick={() => {
          if (confirm("בטוח שברצונך לאפס את כל הנתונים?")) {
            onReset();
            toast.success("הנתונים אופסו");
          }
        }}
        className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
      >
        <RotateCcw className="h-4 w-4" />
        איפוס
      </button>
    </div>
  );
}
