import { useDietAppState } from "@/hooks/useDietAppState";
import type { DailyLog } from "@/hooks/useDietAppState";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Droplets, Flame, Trophy } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    return dateStr;
  }
}

function formatDateFull(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const days = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
    return `יום ${days[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}

export default function History() {
  const { state, loaded } = useDietAppState();
  const logs = [...state.dailyHistory].reverse();

  const chartData = [...state.dailyHistory].slice(-14).map((log) => ({
    date: formatDate(log.date),
    קלוריות: log.caloriesConsumed,
    מים: log.waterCups,
    ניקוד: log.totalScore,
  }));

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">היסטוריה יומית</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {logs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">
              עדיין אין היסטוריה. הנתונים יישמרו אוטומטית בכל חצות 🌙
            </p>
          </div>
        ) : (
          <>
            {/* Charts */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-card-foreground">
                14 ימים אחרונים
              </h2>

              {/* Calories chart */}
              <div className="mb-6">
                <h3 className="mb-2 text-sm text-muted-foreground">קלוריות</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 13,
                        }}
                      />
                      <Bar dataKey="קלוריות" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Water + Score chart */}
              <div>
                <h3 className="mb-2 text-sm text-muted-foreground">מים וניקוד</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: 13,
                        }}
                      />
                      <Legend />
                      <Bar dataKey="מים" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ניקוד" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        <CalendarDays className="inline h-3.5 w-3.5 ml-1" />
                        תאריך
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                        <Flame className="inline h-3.5 w-3.5 ml-1" />
                        קלוריות
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                        <Droplets className="inline h-3.5 w-3.5 ml-1" />
                        מים
                      </th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                        <Trophy className="inline h-3.5 w-3.5 ml-1" />
                        ניקוד
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr
                        key={log.date}
                        className={`border-b border-border last:border-0 ${
                          i % 2 === 0 ? "bg-card" : "bg-secondary/20"
                        }`}
                      >
                        <td className="px-4 py-3 text-right text-card-foreground">
                          {formatDateFull(log.date)}
                        </td>
                        <td className="px-4 py-3 text-center text-card-foreground font-medium">
                          {log.caloriesConsumed}
                        </td>
                        <td className="px-4 py-3 text-center text-card-foreground">
                          {log.waterCups} / 8 💧
                        </td>
                        <td className="px-4 py-3 text-center text-card-foreground font-medium">
                          {log.totalScore}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
