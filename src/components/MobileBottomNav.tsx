import { Link, useLocation } from "react-router-dom";
import { Apple, CalendarDays, User, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
}

export function MobileBottomNav({ onProfileClick, onSettingsClick }: MobileBottomNavProps) {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const isHistory = pathname.startsWith("/history");

  const itemBase =
    "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors active:scale-95";
  const active = "text-primary";
  const inactive = "text-muted-foreground hover:text-foreground";

  return (
    <nav
      dir="rtl"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-stretch gap-1 border-t border-border bg-card/95 backdrop-blur-md px-2 pt-2 safe-bottom"
    >
      <Link to="/" className={cn(itemBase, isHome ? active : inactive)} aria-label="ראשי">
        <Apple className="h-5 w-5" />
        <span className="text-[10px] font-medium">ראשי</span>
      </Link>
      <Link to="/history" className={cn(itemBase, isHistory ? active : inactive)} aria-label="היסטוריה">
        <CalendarDays className="h-5 w-5" />
        <span className="text-[10px] font-medium">היסטוריה</span>
      </Link>
      <button
        type="button"
        onClick={onProfileClick}
        disabled={!onProfileClick}
        className={cn(itemBase, inactive, !onProfileClick && "opacity-50")}
        aria-label="פרופיל"
      >
        <User className="h-5 w-5" />
        <span className="text-[10px] font-medium">פרופיל</span>
      </button>
      <button
        type="button"
        onClick={onSettingsClick}
        disabled={!onSettingsClick}
        className={cn(itemBase, inactive, !onSettingsClick && "opacity-50")}
        aria-label="הגדרות"
      >
        <Settings2 className="h-5 w-5" />
        <span className="text-[10px] font-medium">הגדרות</span>
      </button>
    </nav>
  );
}