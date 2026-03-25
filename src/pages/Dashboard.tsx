import { useState, useEffect, useMemo, useCallback } from "react";
import { SFX } from "@/hooks/useSoundEffects";
import { optimisticFlameUpdate } from "@/lib/flameOptimistic";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Dumbbell, UtensilsCrossed, MessageCircle, TrendingUp, Calendar, AlertTriangle, ClipboardList, ChevronRight, X, Droplets, Plus, Minus, Flame, Bell, User, Check, Moon } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import InsanoLogo from "@/components/InsanoLogo";
import DailyCheckIn, { type MentalState, mentalStateLabels, type CheckInResult } from "@/components/DailyCheckIn";
import { useIsMobile } from "@/hooks/use-mobile";
import { XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, BarChart, Bar, Cell, ReferenceLine } from "recharts";
import { useProfile } from "@/hooks/useProfile";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRealPerformance } from "@/hooks/useRealPerformance";
import PerformanceDetailModal from "@/components/PerformanceDetailModal";
// ThemeToggle removed as app is now light mode only
import { useAuth } from "@/contexts/AuthContext";
import { getToday, getDailyValue, setDailyValue } from "@/lib/dateUtils";
import { useDailyHabits } from "@/hooks/useDailyHabits";
import { useFlameState } from "@/hooks/useFlameState";
// FlameCard removed as it's now integrated into the hero card
import FlameBanner from "@/components/FlameBanner";
import AnamneseRequestAlert from "@/components/AnamneseRequestAlert";
import DashboardHero from "@/components/dashboard/DashboardHero";
import DailyGoals from "@/components/dashboard/DailyGoals";
import PerformanceEvolution from "@/components/dashboard/PerformanceEvolution";
import WeeklyVolume from "@/components/dashboard/WeeklyVolume";
import SkeletonLayout from "@/components/SkeletonLayout";

// ── Daily goals config ──
const dailyGoalsBase = {
  waterGoal: 3,
  sleepGoal: 8,
};
// Limites por grupo (editáveis pelo especialista — mock)
const volumeLimits: Record<string, { min: number; max: number }> = {
  "Peito": { min: 10, max: 20 },
  "Costas": { min: 10, max: 20 },
  "Ombro": { min: 10, max: 20 },
  "Bíceps": { min: 8, max: 16 },
  "Tríceps": { min: 8, max: 16 },
  "Trapézio": { min: 6, max: 14 },
  "Antebraço": { min: 4, max: 10 },
  "Quadríceps": { min: 10, max: 20 },
  "Posterior": { min: 10, max: 20 },
  "Glúteos": { min: 8, max: 16 },
  "Panturrilha": { min: 6, max: 12 },
  "Abdômen": { min: 6, max: 12 },
  "Core": { min: 6, max: 12 },
};

const getVolumeColor = (series: number, active: boolean, min = 10, max = 20) => {
  if (!active) return "hsl(270, 30%, 35%)";
  if (series < min) return "hsl(0, 70%, 45%)";
  if (series <= max) return "hsl(140, 60%, 40%)";
  return "hsl(40, 80%, 50%)";
};

const getVolumeLabel = (series: number, min = 10, max = 20) => {
  if (series < min) return "Abaixo do ideal";
  if (series <= max) return "Faixa ideal";
  return "Acima do ideal";
};

const VolumeTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    const val = payload[0].value;
    const limits = volumeLimits[entry.grupo];
    const min = limits?.min ?? 10;
    const max = limits?.max ?? 20;
    return (
      <div style={{ background: "hsl(0, 0%, 10%)", border: "1px solid hsl(0, 0%, 16%)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "hsl(43, 30%, 85%)" }}>
        <p className="font-semibold">{val} séries</p>
        <p style={{ fontSize: "10px", color: val < min ? "hsl(0, 70%, 55%)" : val <= max ? "hsl(140, 60%, 50%)" : "hsl(40, 80%, 60%)" }}>
          {getVolumeLabel(val, min, max)} ({min}-{max})
        </p>
      </div>
    );
  }
  return null;
};

const VolumeLegend = () => (
  <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(0, 70%, 45%)" }} /> Abaixo</span>
    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(140, 60%, 40%)" }} /> Ideal</span>
    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "hsl(40, 80%, 50%)" }} /> Acima</span>
  </div>
);

const VolumeResumoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const entry = payload[0].payload;
    return (
      <div style={{ background: "hsl(0, 0%, 10%)", border: "1px solid hsl(0, 0%, 16%)", borderRadius: "8px", padding: "8px 12px", fontSize: "12px", color: "hsl(43, 30%, 85%)" }}>
        <p className="font-semibold">{entry.grupo}: {entry.series} séries totais</p>
        <p style={{ fontSize: "10px", color: "hsl(43, 10%, 55%)" }}>{entry.total} grupos musculares</p>
      </div>
    );
  }
  return null;
};

// ── Removed stoic quotes ──

const hasDietPlan = true;

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = getToday();

  // Real performance data
  const {
    trainingScore,
    dietScore,
    waterScore,
    sleepScore,
    performanceScore,
    volumeDetalhado,
    volumeResumido,
    performanceData,
    performanceData30,
    todaySchedule,
    hasTrainingPlan,
    todayCheckin,
  } = useRealPerformance();

  const { state: flameStateReal, streak: streakReal, adherence: adherenceReal, isLoading: isFlameLoading } = useFlameState();
  
  // Debug: allow cycling through flame states by clicking the streak badge
  const flameStates: Array<"ativa" | "tregua" | "extinta"> = ["ativa", "tregua", "extinta"];
  const [debugFlameIndex, setDebugFlameIndex] = useState<number | null>(null);
  const flameState = debugFlameIndex !== null ? flameStates[debugFlameIndex] : flameStateReal;
  const streak = debugFlameIndex !== null ? (flameStates[debugFlameIndex] === "extinta" ? 0 : 5) : streakReal;
  const adherence = debugFlameIndex !== null ? (flameStates[debugFlameIndex] === "extinta" ? 0 : 75) : adherenceReal;
  const cycleFlameState = () => {
    setDebugFlameIndex((prev) => {
      const next = prev === null ? 0 : (prev + 1) % flameStates.length;
      return next;
    });
  };

  // --- Habit Tracker State ---
  const todayKey = `habits_${new Date().toISOString().split('T')[0]}_${user?.id || 'guest'}`;
  const [habits, setHabits] = useState({ treinou: false, dieta: false, agua: false, sono: false });
  useEffect(() => {
    const saved = localStorage.getItem(todayKey);
    if (saved) {
      try { setHabits(JSON.parse(saved)); } catch (e) {}
    }
  }, [todayKey]);

  const updateHabit = (key: keyof typeof habits, value: boolean) => {
    const newHabits = { ...habits, [key]: value };
    setHabits(newHabits);
    localStorage.setItem(todayKey, JSON.stringify(newHabits));
    if (value) {
      try { SFX.tap(); } catch (e) {}
    }
  };

  const HabitCheckbox = ({ label, checked, onChange, Icon }: any) => (
    <button 
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
        checked 
          ? 'bg-accent/10 border-accent/30 shadow-[0_0_15px_rgba(255,107,0,0.1)]' 
          : 'bg-secondary/20 border-border hover:border-accent/30'
      }`}
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
        checked ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-background/50 text-muted-foreground'
      }`}>
        {checked ? <Check size={16} strokeWidth={3} /> : <Icon size={16} />}
      </div>
      <span className={`text-sm font-bold tracking-tight transition-colors ${checked ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </button>
  );

  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  // Daily check-in
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [volumeExpanded, setVolumeExpanded] = useState(false);
  const [volumeFilter, setVolumeFilter] = useState<"all" | "superior" | "inferior">("all");
  const moodToMentalState = (mood: number): MentalState => {
    if (mood >= 5) return "energizado";
    if (mood >= 4) return "focado";
    if (mood >= 3) return "neutro";
    if (mood >= 2) return "cansado";
    return "desanimado";
  };
  const [mentalState, setMentalState] = useState<MentalState>("focado");
  
  useEffect(() => {
    if (todayCheckin?.mood) {
      setMentalState(moodToMentalState(Number(todayCheckin.mood)));
    }
  }, [todayCheckin]);
  
  const filteredVolume = useMemo(() => {
    return volumeFilter === "all" ? volumeDetalhado : volumeDetalhado.filter(v => v.regiao === volumeFilter);
  }, [volumeFilter, volumeDetalhado]);

  // Water & meals from database
  const { waterIntake, setWater: setWaterIntake, mealsCompletedCount: mealsCompleted } = useDailyHabits();

  // Fetch diet plan to get real total meals count
  const { data: dietPlanData } = useQuery({
    queryKey: ["diet-plan", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("diet_plans")
        .select("meals")
        .eq("user_id", user.id)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalMealsFromPlan = useMemo(() => {
    if (!dietPlanData?.meals) return 6;
    try {
      return (dietPlanData.meals as any[]).length || 6;
    } catch {
      return 6;
    }
  }, [dietPlanData]);

  const dailyGoals = { ...dailyGoalsBase, totalMeals: totalMealsFromPlan };
  
  const sleepHours = todayCheckin?.sleep_hours ? Number(todayCheckin.sleep_hours) : 0;

  const checkedIn = !!todayCheckin || localStorage.getItem("lastCheckIn") === new Date().toDateString();

  useEffect(() => {
    if (!checkedIn) {
      const timer = setTimeout(() => setShowCheckIn(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [checkedIn]);

// Stoic Quote removed

  // Visual styles based on flame state
  const isExtinta = flameState === "extinta";
  const isTregua = flameState === "tregua";
  const cardBg = isExtinta ? "bg-[hsl(var(--dishonor-card))]" : isTregua ? "bg-[hsl(var(--truce-card))]" : "bg-card";
  const cardBorder = isExtinta ? "border-[hsl(var(--dishonor-border))]" : isTregua ? "border-[hsl(var(--truce-border))]" : "border-border";
  const textMuted = "text-muted-foreground";

  // Button gradient based on flame state
  const buttonGradient = isExtinta
    ? "linear-gradient(135deg, hsl(270, 30%, 35%), hsl(270, 35%, 45%))"
    : isTregua
    ? "linear-gradient(135deg, hsl(210, 50%, 40%), hsl(210, 60%, 50%))"
    : "linear-gradient(135deg, hsl(var(--crimson)), hsl(var(--crimson-glow)))";
  const buttonShadow = isExtinta
    ? "0 0 20px hsl(270, 30%, 35%, 0.3)"
    : isTregua
    ? "0 0 20px hsl(210, 50%, 40%, 0.3)"
    : "0 0 20px hsl(var(--crimson) / 0.3)";

  // Chart/progress accent color based on flame state
  const chartColor = isExtinta ? "hsl(270, 25%, 45%)" : isTregua ? "hsl(210, 50%, 50%)" : "hsl(342, 100%, 57%)";
  
  // Progress bar colors for daily goals
  const mealBarColor = isExtinta ? "hsl(270, 25%, 40%)" : isTregua ? "hsl(210, 50%, 45%)" : "hsl(var(--primary))";
  const sleepBarColor = isExtinta ? "hsl(270, 20%, 38%)" : isTregua ? "hsl(210, 40%, 42%)" : "hsl(270, 60%, 50%)";
  const waterBarColor = isExtinta ? "hsl(270, 22%, 42%)" : isTregua ? "hsl(210, 45%, 48%)" : "hsl(220, 60%, 50%)";
  
  // Quote accent color
  const quoteAccent = isExtinta ? "hsl(270, 30%, 50%)" : isTregua ? "hsl(210, 50%, 55%)" : "hsl(var(--accent))";
  const quoteBorder = isExtinta ? "hsl(270, 15%, 18%)" : isTregua ? "hsl(210, 18%, 20%)" : "hsl(var(--border) / 0.5)";
  const quoteTextColor = isExtinta ? "hsl(270, 15%, 60%)" : isTregua ? "hsl(210, 20%, 65%)" : "hsl(var(--foreground) / 0.8)";
  
  // Volume bar color override
  const volumeBarColor = isExtinta ? "hsl(270, 20%, 35%)" : isTregua ? "hsl(210, 40%, 40%)" : "hsl(140, 60%, 40%)";
  
  // Background color based on flame state
  const pageBg = isExtinta ? "hsl(260, 20%, 6%)" : isTregua ? "hsl(210, 25%, 7%)" : undefined;
  
  // Stat badge colors
  const statBorderColor = isExtinta ? "hsl(270, 12%, 18%)" : isTregua ? "hsl(210, 18%, 20%)" : undefined;
  
  // Icon accent color for misc icons (TrendingUp, Droplets, etc.)
  const iconAccentColor = isExtinta ? "hsl(270, 30%, 45%)" : isTregua ? "hsl(210, 50%, 50%)" : undefined;
  const iconAccentClass = isExtinta ? "text-[hsl(270,30%,45%)]" : isTregua ? "text-[hsl(210,50%,50%)]" : "text-accent";
  const dropletsClass = isExtinta ? "text-[hsl(270,25%,45%)]" : isTregua ? "text-[hsl(210,50%,50%)]" : "text-[hsl(220,60%,50%)]";

  const PendingPlanAlert = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`${cardBg} rounded-xl border border-accent/30 p-4`}
    >
      <div className="flex items-center gap-3">
        <Calendar size={20} className="text-accent" />
        <div>
          <p className="font-cinzel text-sm font-bold text-foreground">Seu plano está sendo preparado</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nossa equipe de especialistas está analisando sua anamnese. Prazo: até 72h.
          </p>
        </div>
      </div>
    </motion.div>
  );

  // Fetch real last assessment date
  const { data: lastAssessmentDate } = useQuery({
    queryKey: ["last-assessment"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: monthly } = await supabase
        .from("monthly_assessments" as any)
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (monthly) return new Date((monthly as any).created_at);
      const { data: anamnese } = await supabase
        .from("anamnese")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (anamnese) return new Date(anamnese.created_at);
      return null;
    },
  });
  const daysSinceAnamnese = lastAssessmentDate
    ? Math.floor((Date.now() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;
  const showAnamnese = daysSinceAnamnese >= 30;

  const MonthlyAnamnesisBanner = () => {
    if (!showAnamnese) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${cardBg} rounded-xl border border-accent/40 p-4 relative z-10`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <ClipboardList size={20} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-cinzel text-sm font-bold text-foreground">Nova Anamnese Disponível</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Já se passaram {daysSinceAnamnese} dias. Atualize seus dados para otimizar seu plano.
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/reavaliacao")}
          className="w-full mt-3 py-2.5 rounded-lg font-cinzel text-sm font-semibold text-foreground flex items-center justify-center gap-2"
          style={{ background: "hsl(var(--accent) / 0.15)", border: "1px solid hsl(var(--accent) / 0.3)" }}
        >
          <ClipboardList size={16} />
          FAZER ANAMNESE MENSAL
        </motion.button>
      </motion.div>
    );
  };

// Stoic Quote component removed


  // Show skeleton while loading
  if (isFlameLoading || isProfileLoading) {
    return <SkeletonLayout />;
  }

  // ========== MOBILE LAYOUT ==========
  if (isMobile) {
    return (
      <div className="p-4 max-w-lg mx-auto space-y-4 relative min-h-screen transition-colors duration-500" style={{ backgroundColor: pageBg }}>
        {/* Banner more subtle now */}
        <FlameBanner state={flameState} />

        {/* Header Redesigned */}
        <div className="flex items-center justify-between pt-2 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div>
              <p className={`text-[10px] font-sans font-semibold tracking-widest text-muted-foreground mb-0.5 uppercase`}>BEM-VINDO AO CLUBE</p>
              <h1 className="font-sans text-lg font-bold flex items-center gap-2">
                <span className="text-foreground">{profile?.nome?.split(' ')[0] || "ATLETA"}</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* ThemeToggle removed */}
            <Link to="/aluno/chat">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 flex items-center justify-center text-foreground hover:text-accent transition-colors"
              >
                <MessageCircle size={22} />
              </motion.button>
            </Link>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 flex items-center justify-center relative group"
            >
              <Bell size={22} className="text-foreground transition-colors group-hover:text-accent" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-accent rounded-full border-2 border-background" />
            </motion.button>

            <Link to="/aluno/perfil">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 flex items-center justify-center text-foreground hover:text-accent transition-colors"
              >
                <User size={22} />
              </motion.button>
            </Link>
          </div>
        </div>


        <DashboardHero 
          hasTrainingPlan={hasTrainingPlan}
          todayScheduleName={todaySchedule.name}
          adherence={adherence}
          streak={streak}
          ranking={(profile as any)?.ranking || 1}
        />

        <div className="grid grid-cols-1 gap-6">
          <DailyGoals 
            mealsCompleted={mealsCompleted}
            totalMeals={dailyGoals.totalMeals}
            waterIntake={waterIntake}
            waterGoal={dailyGoals.waterGoal}
            sleepHours={sleepHours}
            sleepGoal={dailyGoals.sleepGoal}
            setWaterIntake={setWaterIntake}
            iconAccentClass={iconAccentClass}
            dropletsClass={dropletsClass}
            mealBarColor={mealBarColor}
            waterBarColor={waterBarColor}
            sleepBarColor={sleepBarColor}
            performanceData={performanceData}
          />
          
          <PerformanceEvolution 
            performanceData={performanceData}
            chartColor={chartColor}
            setShowPerformanceModal={setShowPerformanceModal}
            cardBg={cardBg}
            cardBorder={cardBorder}
          />

          <WeeklyVolume 
            volumeResumido={volumeResumido}
            volumeDetalhado={volumeDetalhado}
            volumeLimits={volumeLimits}
            volumeBarColor={volumeBarColor}
            setVolumeFilter={setVolumeFilter}
            setVolumeExpanded={setVolumeExpanded}
            iconAccentClass={iconAccentClass}
            cardBg={cardBg}
            cardBorder={cardBorder}
          />
        </div>

        {/* Volume Expandido Modal - Mobile */}
        <AnimatePresence>
          {volumeExpanded && (() => {
            const filteredVolume = volumeFilter === "all" ? volumeDetalhado : volumeDetalhado.filter(v => v.regiao === volumeFilter);
            return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 overflow-auto"
            >
              <div className="max-w-lg mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-cinzel text-lg font-bold text-foreground">Volume Semanal Detalhado</h3>
                  <button onClick={() => setVolumeExpanded(false)} className="p-2 rounded-lg bg-secondary/50">
                    <X size={18} className="text-foreground" />
                  </button>
                </div>
                <p className="text-xs text-muted mb-3">Limites definidos pelo especialista</p>
                <div className="flex gap-2 mb-4">
                  {(["superior", "inferior"] as const).map((f) => (
                    <button key={f} onClick={() => setVolumeFilter(f)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-cinzel font-semibold transition-colors ${volumeFilter === f ? "bg-accent/20 text-accent border border-accent/30" : "bg-secondary/30 text-muted-foreground"}`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
                <div style={{ height: `${Math.max(filteredVolume.length * 34, 180)}px` }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredVolume} layout="vertical" margin={{ left: 5 }}>
                      <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(43, 10%, 55%)" }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 5']} />
                      <YAxis type="category" dataKey="grupo" tick={{ fontSize: 9, fill: "hsl(43, 10%, 55%)" }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip content={<VolumeTooltip />} />
                      <Bar dataKey="series" radius={[0, 4, 4, 0]}>
                        {filteredVolume.map((entry, i) => {
                          const limits = volumeLimits[entry.grupo] ?? { min: 10, max: 20 };
                          return <Cell key={i} fill={getVolumeColor(entry.series, true, limits.min, limits.max)} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <VolumeLegend />
                <div className="mt-4 space-y-2">
                  {filteredVolume.map((v) => {
                    const limits = volumeLimits[v.grupo] ?? { min: 10, max: 20 };
                    const color = getVolumeColor(v.series, true, limits.min, limits.max);
                    return (
                      <div key={v.grupo} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-sm text-foreground">{v.grupo}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-foreground">{v.series}</span>
                          <span className="text-[10px] text-muted-foreground ml-1">/ {limits.min}-{limits.max}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Skeletons handled above if loading */}




        <DailyCheckIn
          open={showCheckIn}
          onComplete={async (result) => {
            setMentalState(result.mentalState);
            localStorage.setItem("lastCheckIn", new Date().toDateString());
            setShowCheckIn(false);
            if (user) {
              try {
                await supabase.from("psych_checkins").insert({
                  user_id: user.id,
                  sleep_hours: result.sleepDuration,
                  sleep_quality: result.mentalState === "energizado" ? 4 : result.mentalState === "focado" ? 3 : result.mentalState === "neutro" ? 2 : 1,
                  mood: result.mentalState === "energizado" ? 5 : result.mentalState === "focado" ? 4 : result.mentalState === "neutro" ? 3 : result.mentalState === "cansado" ? 2 : 1,
                  stress: result.mentalState === "desanimado" ? 5 : result.mentalState === "cansado" ? 4 : 3,
                });
                // REGRA 1+2: Cancel flame queries, then inject optimistic update
                await queryClient.cancelQueries({ queryKey: ["flame-state", user.id] });
                optimisticFlameUpdate(queryClient, user.id, { adherenceDelta: 10 });
                // Safe to invalidate checkin caches (not flame-related)
                queryClient.invalidateQueries({ queryKey: ["today-checkin"] });
                queryClient.invalidateQueries({ queryKey: ["last30-checkins"] });
              } catch (e) {
                console.error("Failed to save check-in:", e);
              }
            }
          }}
          onClose={() => setShowCheckIn(false)}
        />
        <PerformanceDetailModal
          open={showPerformanceModal}
          onClose={() => setShowPerformanceModal(false)}
          weekData={performanceData}
          monthData={performanceData30}
        />
      </div>
    );
  }

  // ========== DESKTOP LAYOUT ==========
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative min-h-screen transition-colors duration-500" style={{ backgroundColor: pageBg }}>
      {/* Flame Banner - Desktop */}
      <FlameBanner state={flameState} />

      {/* Desktop Header Redesigned */}
      <div className="flex items-center justify-between relative z-10 pb-6 border-b border-white/5">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center p-1.5 border border-accent/40 shadow-[0_0_25px_rgba(255,107,0,0.15)]">
             <div className="w-full h-full rounded-full bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center">
               <img src="/insano-logo-branco.svg" alt="Icon" className="w-8 h-8" />
             </div>
           </div>
           <div>
            <p className="text-xs font-sans font-semibold tracking-widest text-muted-foreground uppercase mb-1">BEM-VINDO AO CLUBE</p>
            <h1 className="font-sans text-3xl font-bold flex items-center">
              <span className="text-foreground">{profile?.nome?.toUpperCase() || "MIRI"}</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 flex items-center justify-center relative group"
          >
            <Bell size={28} className="text-foreground transition-colors group-hover:text-accent" />
            <span className="absolute top-2 right-2 w-3 h-3 bg-accent rounded-full border-2 border-background" />
          </motion.button>
        </div>
      </div>

      <DashboardHero 
        hasTrainingPlan={hasTrainingPlan}
        todayScheduleName={todaySchedule.name}
        adherence={adherence}
        streak={streak}
        ranking={(profile as any)?.ranking || 1}
      />

      {/* Balanced 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <DailyGoals 
          mealsCompleted={mealsCompleted}
          totalMeals={dailyGoals.totalMeals}
          waterIntake={waterIntake}
          waterGoal={dailyGoals.waterGoal}
          sleepHours={sleepHours}
          sleepGoal={dailyGoals.sleepGoal}
          setWaterIntake={setWaterIntake}
          iconAccentClass={iconAccentClass}
          dropletsClass={dropletsClass}
          mealBarColor={mealBarColor}
          waterBarColor={waterBarColor}
          sleepBarColor={sleepBarColor}
          performanceData={performanceData}
        />

        <PerformanceEvolution 
          performanceData={performanceData}
          chartColor={chartColor}
          setShowPerformanceModal={setShowPerformanceModal}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />

        <WeeklyVolume 
          volumeResumido={volumeResumido}
          volumeDetalhado={volumeDetalhado}
          volumeLimits={volumeLimits}
          volumeBarColor={volumeBarColor}
          setVolumeFilter={setVolumeFilter}
          setVolumeExpanded={setVolumeExpanded}
          iconAccentClass={iconAccentClass}
          cardBg={cardBg}
          cardBorder={cardBorder}
        />
      </div>


      {/* Volume Expandido Modal - Desktop */}
      <AnimatePresence>
        {volumeExpanded && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setVolumeExpanded(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className={`${cardBg} rounded-3xl border ${cardBorder} p-8 max-w-xl w-full max-h-[80vh] overflow-auto shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-cinzel text-xl font-bold text-primary">Volume Semanal Detalhado</h3>
                <button onClick={() => setVolumeExpanded(false)} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors">
                  <X size={20} className="text-primary" />
                </button>
              </div>
              <p className="text-xs text-muted mb-4 uppercase tracking-widest">Limites definidos pelo especialista</p>
              <div className="flex gap-2 mb-6">
                {(["superior", "inferior"] as const).map((f) => (
                  <button key={f} onClick={() => setVolumeFilter(f)}
                    className={`px-6 py-2 rounded-xl text-xs font-cinzel font-semibold transition-colors ${volumeFilter === f ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-secondary text-muted hover:bg-secondary/70"}`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div style={{ height: `${Math.max(filteredVolume.length * 34, 200)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredVolume} layout="vertical" margin={{ left: 10 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(43, 10%, 55%)" }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 5']} />
                    <YAxis type="category" dataKey="grupo" tick={{ fontSize: 10, fill: "hsl(43, 10%, 55%)" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<VolumeTooltip />} />
                    <Bar dataKey="series" radius={[0, 4, 4, 0]}>
                      {filteredVolume.map((entry, i) => {
                        const limits = volumeLimits[entry.grupo] ?? { min: 10, max: 20 };
                        return <Cell key={i} fill={getVolumeColor(entry.series, true, limits.min, limits.max)} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 space-y-3">
                {filteredVolume.map((v) => {
                  const limits = volumeLimits[v.grupo] ?? { min: 10, max: 20 };
                  const color = getVolumeColor(v.series, true, limits.min, limits.max);
                  return (
                    <div key={v.grupo} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-border">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: color }} />
                        <span className="text-sm font-medium text-primary">{v.grupo}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-primary">{v.series}</span>
                        <span className="text-[10px] text-muted ml-1 uppercase tracking-tighter">/ {limits.min}-{limits.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DailyCheckIn
        open={showCheckIn}
        plannerType={(profile as any)?.planner_type}
        onComplete={async (result) => {
          setMentalState(result.mentalState);
          localStorage.setItem("lastCheckIn", new Date().toDateString());
          setShowCheckIn(false);
          if (user) {
            try {
              await supabase.from("psych_checkins").insert({
                user_id: user.id,
                sleep_hours: result.sleepDuration,
                sleep_quality: result.mentalState === "energizado" ? 4 : result.mentalState === "focado" ? 3 : result.mentalState === "neutro" ? 2 : 1,
                mood: result.mentalState === "energizado" ? 5 : result.mentalState === "focado" ? 4 : result.mentalState === "neutro" ? 3 : result.mentalState === "cansado" ? 2 : 1,
                stress: result.mentalState === "desanimado" ? 5 : result.mentalState === "cansado" ? 4 : 3,
              });
              await queryClient.cancelQueries({ queryKey: ["flame-state", user.id] });
              optimisticFlameUpdate(queryClient, user.id, { adherenceDelta: 10 });
              queryClient.invalidateQueries({ queryKey: ["today-checkin"] });
              queryClient.invalidateQueries({ queryKey: ["last30-checkins"] });
            } catch (e) {
              console.error("Failed to save check-in:", e);
            }
          }
        }}
        onClose={() => setShowCheckIn(false)}
      />
      <PerformanceDetailModal
        open={showPerformanceModal}
        onClose={() => setShowPerformanceModal(false)}
        weekData={performanceData}
        monthData={performanceData30}
      />
    </div>
  );
};

export default Dashboard;
