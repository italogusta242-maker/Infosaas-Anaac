import { motion } from "framer-motion";
import { UtensilsCrossed, Droplets, Minus, Plus, Moon, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { DayPerformance } from "@/hooks/useRealPerformance";

interface DailyGoalsProps {
  mealsCompleted: number;
  totalMeals: number;
  waterIntake: number;
  waterGoal: number;
  sleepHours: number;
  sleepGoal: number;
  setWaterIntake: (val: number) => void;
  iconAccentClass: string;
  dropletsClass: string;
  mealBarColor: string;
  waterBarColor: string;
  sleepBarColor: string;
  /** Last 7 days performance data — for the mini history strip */
  performanceData?: DayPerformance[];
}

const DailyGoals = ({
  mealsCompleted,
  totalMeals,
  waterIntake,
  waterGoal,
  sleepHours,
  sleepGoal,
  setWaterIntake,
  iconAccentClass,
  dropletsClass,
  mealBarColor,
  waterBarColor,
  sleepBarColor,
  performanceData = [],
}: DailyGoalsProps) => {
  const last7 = performanceData.slice(-7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-card rounded-[2.5rem] border border-border p-8 shadow-xl flex flex-col gap-8 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cinzel text-xl font-bold text-primary">Metas Diárias</h3>
      </div>
      
      <div className="space-y-8">
        {/* Refeições Concluídas */}
        <div className="bg-secondary/10 p-6 rounded-3xl border border-secondary/20">
          <div className="flex justify-between text-sm text-muted-foreground mb-3 font-medium uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <UtensilsCrossed size={16} className={iconAccentClass} /> Refeições do Cardápio
            </span>
            <span className="font-black text-foreground">{mealsCompleted} / {totalMeals}</span>
          </div>
          <Progress value={(mealsCompleted / totalMeals) * 100} className="h-3" indicatorColor={mealBarColor} />
        </div>

        {/* Água (Adição manual) */}
        <div className="bg-secondary/10 p-6 rounded-3xl border border-secondary/20">
          <div className="flex justify-between items-center text-sm text-muted-foreground mb-3 font-medium uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Droplets size={16} className={dropletsClass} /> Consumo de Água
            </span>
            <div className="flex items-center gap-3 bg-background/40 p-1.5 rounded-xl border border-border/50">
              <button 
                onClick={() => setWaterIntake(Math.max(0, waterIntake - 0.25))} 
                className="p-1 rounded-lg bg-secondary/50 hover:bg-secondary active:scale-95 transition-transform"
              >
                <Minus size={14} />
              </button>
              <span className="font-black text-foreground w-20 text-center">{waterIntake.toFixed(2)}L <span className="text-muted-foreground font-normal text-[10px]">/ {waterGoal}L</span></span>
              <button 
                onClick={() => setWaterIntake(waterIntake + 0.25)} 
                className="p-1 rounded-lg bg-secondary/50 hover:bg-secondary active:scale-95 transition-transform"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <Progress value={(waterIntake / waterGoal) * 100} className="h-3" indicatorColor={waterBarColor} />
        </div>
        
        {/* Sono */}
        <div className="bg-secondary/10 p-6 rounded-3xl border border-secondary/20">
          <div className="flex justify-between text-sm text-muted-foreground mb-3 font-medium uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Moon size={16} className={iconAccentClass} /> Sono Otimizado
            </span>
            <span className="font-black text-foreground">{sleepHours} / {sleepGoal}h</span>
          </div>
          <Progress value={(sleepHours / sleepGoal) * 100} className="h-3" indicatorColor={sleepBarColor} />
        </div>

        {/* ── Histórico 7 Dias ── */}
        {last7.length > 0 && (
          <div className="bg-secondary/10 p-5 rounded-3xl border border-secondary/20">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={14} className={iconAccentClass} />
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Histórico 7 Dias</span>
            </div>
            <div className="flex items-end justify-between gap-1.5 h-16">
              {last7.map((d, i) => {
                const pct = Math.max(4, d.score);
                const isToday = i === last7.length - 1;
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: "48px" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${pct}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
                        style={{ width: "100%", height: `${pct}%` }}
                        className={`rounded-t-md transition-colors ${
                          isToday
                            ? "bg-primary"
                            : d.score >= 70
                            ? "bg-emerald-500/60"
                            : d.score >= 40
                            ? "bg-amber-500/50"
                            : "bg-muted/40"
                        }`}
                        title={`${d.day}: ${d.score}pts`}
                      />
                    </div>
                    <span className={`text-[8px] font-bold uppercase tracking-wider truncate ${isToday ? "text-primary" : "text-muted-foreground/60"}`}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DailyGoals;
