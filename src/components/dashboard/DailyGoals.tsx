import { motion } from "framer-motion";
import { UtensilsCrossed, Droplets, Minus, Plus, Moon, TrendingUp, Check } from "lucide-react";
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

/** Circular check indicator */
const CheckCircle = ({ done, color }: { done: boolean; color: string }) => (
  <div
    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
      done
        ? "scale-110 shadow-lg"
        : "border-muted-foreground/30 bg-transparent"
    }`}
    style={done ? { borderColor: color, backgroundColor: color, boxShadow: `0 0 12px ${color}40` } : {}}
  >
    {done && <Check size={14} className="text-white" strokeWidth={3} />}
  </div>
);

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

  const mealsDone = mealsCompleted >= totalMeals;
  const waterDone = waterIntake >= waterGoal;
  const sleepDone = sleepHours >= sleepGoal;

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
      
      <div className="space-y-5">
        {/* Refeições Concluídas */}
        <div className="bg-secondary/10 p-5 rounded-3xl border border-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle done={mealsDone} color={mealBarColor} />
              <div>
                <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  <UtensilsCrossed size={14} className={iconAccentClass} /> Refeições
                </span>
                <span className="text-xs text-muted-foreground/60">{mealsCompleted} / {totalMeals} refeições</span>
              </div>
            </div>
            <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${mealsDone ? "bg-green-500/20 text-green-400" : "bg-muted/20 text-muted-foreground"}`}>
              {mealsDone ? "Concluído" : "Pendente"}
            </span>
          </div>
        </div>

        {/* Água (Adição manual) */}
        <div className="bg-secondary/10 p-5 rounded-3xl border border-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle done={waterDone} color={waterBarColor} />
              <div>
                <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  <Droplets size={14} className={dropletsClass} /> Água
                </span>
                <span className="text-xs text-muted-foreground/60">{waterIntake.toFixed(2)}L / {waterGoal}L</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-background/40 p-1.5 rounded-xl border border-border/50">
              <button 
                onClick={() => setWaterIntake(Math.max(0, waterIntake - 0.25))} 
                className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary active:scale-95 transition-transform"
              >
                <Minus size={12} />
              </button>
              <button 
                onClick={() => setWaterIntake(waterIntake + 0.25)} 
                className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary active:scale-95 transition-transform"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Sono */}
        <div className="bg-secondary/10 p-5 rounded-3xl border border-secondary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle done={sleepDone} color={sleepBarColor} />
              <div>
                <span className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                  <Moon size={14} className={iconAccentClass} /> Sono
                </span>
                <span className="text-xs text-muted-foreground/60">{sleepHours} / {sleepGoal}h</span>
              </div>
            </div>
            <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${sleepDone ? "bg-green-500/20 text-green-400" : "bg-muted/20 text-muted-foreground"}`}>
              {sleepDone ? "Concluído" : "Pendente"}
            </span>
          </div>
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
