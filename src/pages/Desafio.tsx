import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowRight, 
  Play, 
  Utensils, 
  Dumbbell, 
  MessageSquare, 
  BookOpen, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Lock,
  Download,
  MessageCircle,
  Clock,
  ExternalLink,
  Flame,
  Star,
  Send,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import SkeletonLayout from "@/components/SkeletonLayout";

// --- Types ---
interface Challenge {
  id: string;
  title: string;
  description: string;
  banner_image_url: string;
}

interface Banner {
  id: string;
  title_top: string;
  title_main: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  image_url: string;
  features: string[];
  bg_color?: string;
}

interface Module {
  id: string;
  title: string;
  icon: string;
  type: 'lessons' | 'diets' | 'workouts' | 'community';
  is_locked: boolean;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  video_url: string;
  pdf_url?: string;
  description?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    nome: string;
    avatar_url: string;
  };
}

interface DietPlan {
  id: string;
  title: string;
  goal_description: string;
  calories: number;
}

interface TrainingPlan {
  id: string;
  title: string;
  objetivo_mesociclo: string;
}

// Removed mock data arrays as they are now fetched from Supabase

// --- Sub-Components ---

const BannerCarousel = ({ banners }: { banners: Banner[] }) => {
  const visibleBanners = banners.slice(0, 5); // maxItems = 5
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % visibleBanners.length);
  const prev = () => setCurrent((prev) => (prev - 1 + visibleBanners.length) % visibleBanners.length);

  // autoPlay — 4 seconds
  useEffect(() => {
    if (visibleBanners.length <= 1) return;
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [visibleBanners.length, current]);

  if (visibleBanners.length === 0) return null;

  return (
    <div className="relative w-full h-auto min-h-[400px] md:h-[450px] overflow-hidden rounded-[2.5rem] shadow-2xl group border border-white/5">
      <AnimatePresence mode="wait">
        <motion.div
          key={visibleBanners[current].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 flex flex-col md:flex-row items-center justify-between p-8 md:p-14 ${visibleBanners[current].bg_color || "bg-[#0A0A0A]"}`}
        >
          <div className="z-10 max-w-lg w-full md:w-[55%] flex flex-col items-start gap-4">
            
            <div className="flex flex-col mb-2">
              <motion.h3 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/20 font-black font-cinzel text-2xl md:text-3xl tracking-wide uppercase italic leading-tight"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
              >
                {visibleBanners[current].title_top}
              </motion.h3>
              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[32px] md:text-[54px] font-cinzel font-black text-accent leading-[1.1] tracking-tight italic uppercase whitespace-pre-line drop-shadow-[0_0_15px_rgba(255,107,0,0.3)]"
              >
                {visibleBanners[current].title_main}
              </motion.h2>
            </div>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground/80 md:text-white/60 text-sm md:text-base leading-relaxed max-w-[400px]"
            >
              {visibleBanners[current].subtitle}
            </motion.p>

            {visibleBanners[current].features && visibleBanners[current].features.length > 0 && (
              <motion.ul 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="space-y-3 my-4 w-full"
              >
                {visibleBanners[current].features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-white/40">
                    <CheckCircle2 size={16} className="text-accent shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </motion.ul>
            )}

            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={() => {
                if (visibleBanners[current].cta_link) {
                  window.location.href = visibleBanners[current].cta_link;
                }
              }}
              className={`mt-4 px-8 py-3.5 rounded-2xl font-black text-xs md:text-sm tracking-widest uppercase transition-all shadow-xl
                ${current === 1 
                  ? 'bg-white text-black hover:bg-white/90 shadow-white/10' 
                  : 'bg-accent text-white hover:bg-accent/90 shadow-accent/20'}
              `}
            >
              {visibleBanners[current].cta_text}
            </motion.button>
          </div>
          
          <div className="absolute right-0 top-0 h-full w-full md:w-1/2 overflow-hidden pointer-events-none opacity-20 md:opacity-100">
             <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent to-[#0A0A0A] z-10" />
             <div className="absolute inset-0 bg-[#0A0A0A]/40 z-10 mix-blend-multiply" />
             <img 
               src={visibleBanners[current].image_url} 
               className="w-full h-full object-cover scale-105" 
               alt="Banner" 
               style={{ filter: 'grayscale(50%) contrast(1.2)' }}
             />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {visibleBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-accent' : 'w-2 bg-white/20'}`}
          />
        ))}
      </div>

      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hidden md:block">
        <ChevronLeft size={24} />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 hidden md:block">
        <ChevronRight size={24} />
      </button>
    </div>
  );
};




const Challenge = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [addedItems, setAddedItems] = useState<string[]>([]);

  // Queries
  const { data: challenges = [], isLoading: loadingChallenges } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("is_active", true)
        .limit(1);
      if (error) throw error;
      return data as Challenge[];
    },
  });

  const activeChallenge = challenges[0];

  const { data: challengeBanners = [], isLoading: loadingBanners } = useQuery({
    queryKey: ["banners", activeChallenge?.id],
    queryFn: async () => {
      if (!activeChallenge) return [];
      const { data, error } = await supabase
        .from("challenge_banners")
        .select("*")
        .eq("challenge_id", activeChallenge.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Banner[];
    },
    enabled: !!activeChallenge,
  });

  const { data: challengeModules = [], isLoading: loadingModules } = useQuery({
    queryKey: ["modules", activeChallenge?.id],
    queryFn: async () => {
      if (!activeChallenge) return [];
      const { data, error } = await supabase
        .from("challenge_modules")
        .select("*")
        .eq("challenge_id", activeChallenge.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Module[];
    },
    enabled: !!activeChallenge,
  });

  // Set default selected module
  useEffect(() => {
    if (challengeModules.length > 0 && !selectedModuleId) {
      setSelectedModuleId(challengeModules[0].id);
    }
  }, [challengeModules, selectedModuleId]);

  const selectedModule = challengeModules.find(m => m.id === selectedModuleId) || challengeModules[0];

  const { data: moduleLessons = [], isLoading: loadingLessons } = useQuery({
    queryKey: ["lessons", selectedModuleId],
    queryFn: async () => {
      if (!selectedModuleId) return [];
      const { data, error } = await supabase
        .from("challenge_lessons")
        .select("*")
        .eq("module_id", selectedModuleId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!selectedModuleId && selectedModule?.type !== 'community',
  });

  // Set default active lesson
  useEffect(() => {
    if (moduleLessons.length > 0 && !activeLessonId) {
      setActiveLessonId(moduleLessons[0].id);
    }
  }, [moduleLessons, activeLessonId]);

  const activeLesson = moduleLessons.find(l => l.id === activeLessonId) || moduleLessons[0];

  const { data: progress = [], isLoading: loadingProgress } = useQuery({
    queryKey: ["lesson-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: lessonComments = [], isLoading: loadingComments } = useQuery({
    queryKey: ["comments", activeLessonId],
    queryFn: async () => {
      if (!activeLessonId) return [];
      const { data, error } = await supabase
        .from("lesson_comments")
        .select(`
          id, content, created_at, user_id,
          profiles ( nome, avatar_url )
        `)
        .eq("lesson_id", activeLessonId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any as Comment[];
    },
    enabled: !!activeLessonId,
  });

  const { data: dietPlans = [] } = useQuery({
    queryKey: ["all-diets", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diet_plans")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DietPlan[];
    },
    enabled: !!user && selectedModule?.type === 'diets',
  });

  const { data: trainingPlans = [] } = useQuery({
    queryKey: ["all-workouts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_plans")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as TrainingPlan[];
    },
    enabled: !!user && selectedModule?.type === 'workouts',
  });

  // Mutations
  const toggleProgressMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) return;
      const existing = progress.find((p: any) => p.lesson_id === lessonId);
      const newStatus = existing?.status === 'completed' ? 'in_progress' : 'completed';
      
      const { error } = await supabase
        .from("lesson_progress")
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          status: newStatus,
          completed_at: newStatus === 'completed' ? new Date().toISOString() : null
        }, { onConflict: 'user_id,lesson_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lesson-progress", user?.id] });
      toast.success("Progresso atualizado!");
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !activeLessonId) return;
      const { error } = await supabase
        .from("lesson_comments")
        .insert([{
          lesson_id: activeLessonId,
          user_id: user.id,
          content
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", activeLessonId] });
      toast.success("Comentário publicado!");
    },
  });

  const calculateCycleDay = () => {
    if (!user?.created_at) return 1;
    const createdDate = new Date(user.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    let currentDay = (diffDays % 30) + 1;
    return currentDay;
  };
  
  const cycleDay = calculateCycleDay();

  const getModuleOfTheMonth = () => {
    const months = [
      "Mindset Guardião", "Nutrição Metabólica", "Força Pura", "Resistência",
      "Flexibilidade e Mobilidade", "Biohacking Diário", "Foco Extremo",
      "Recuperação Ativa", "Hipertrofia Glúteos", "Definição Abdominal",
      "Alta Performance", "Revisão do Ano"
    ];
    return months[new Date().getMonth()];
  };

  const toggleItem = (id: string, type: 'dieta' | 'treino') => {
    if (addedItems.includes(id)) return;
    setAddedItems([...addedItems, id]);
    toast.success(`${type === 'dieta' ? 'Dieta' : 'Treino'} adicionado ao seu painel principal!`, {
      description: "Agora você pode acessá-lo na aba correspondente.",
      icon: <CheckCircle2 className="text-accent" />
    });
  };

  const isCompleted = (lessonId: string) => {
    return progress.some((p: any) => p.lesson_id === lessonId && p.status === 'completed');
  };

  if (loadingChallenges || loadingModules) {
    return <SkeletonLayout />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 pt-12">
        
        {/* Header - Sutil */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-cinzel font-black tracking-tighter italic text-gold">
              ÁREA DE <span className="text-accent">MEMBROS</span>
            </h1>
            <p className="text-muted mt-2 uppercase tracking-[0.3em] font-medium text-sm">
              {activeChallenge?.title || "Desafio Miri No Foco"}
            </p>
          </div>
          
          {/* Contador de Ciclo Mensal */}
          <div className="bg-background border border-border px-6 py-4 rounded-3xl flex flex-col gap-3 min-w-[280px] shadow-sm">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Seu Ciclo Mensal</span>
                <span className="text-sm font-bold text-accent">Dia {cycleDay} <span className="text-foreground/40 font-normal">de 30</span></span>
             </div>
             <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${(cycleDay/30)*100}%` }} />
             </div>
          </div>
        </div>

        {/* Carousel */}
        <div className="mb-10">
          <BannerCarousel banners={challengeBanners} />
        </div>

        {/* Módulo Dinâmico do Mês */}
        <div className="mb-16">
          <div className="bg-accent/10 border border-accent/20 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
            <div className="relative z-10 flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent shrink-0 border border-accent/30 shadow-[0_0_30px_rgba(255,107,0,0.3)]">
                  <Star size={32} />
               </div>
               <div>
                  <h4 className="text-xs font-black uppercase text-accent tracking-[0.3em] mb-1">Conteúdo Exclusivo Mensal</h4>
                  <h3 className="text-2xl font-bold italic text-foreground tracking-tight">{getModuleOfTheMonth()}</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">Novo módulo liberado todos os meses. Aproveite o foco deste mês para elevar seu nível.</p>
               </div>
            </div>
            <button className="relative z-10 shrink-0 bg-white hover:bg-white/90 text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 shadow-xl">
               Acessar Módulo
            </button>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="mb-12">
          <h3 className="text-sm font-black text-foreground/30 dark:text-white/50 uppercase tracking-[0.4em] mb-6 px-2">SELECIONE O MÓDULO</h3>
          <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar scroll-smooth">
            {challengeModules.map((mod) => {
              const Icon = mod.icon === 'Utensils' ? Utensils : mod.icon === 'Dumbbell' ? Dumbbell : mod.icon === 'Users' ? Users : mod.icon === 'Flame' ? Flame : BookOpen;
              return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleId(mod.id)}
                className={`flex-shrink-0 w-36 md:w-48 aspect-[3/4] rounded-3xl relative overflow-hidden group transition-all duration-300 border-2 bg-muted/20 dark:bg-transparent ${
                  selectedModule?.id === mod.id ? 'border-accent scale-95 shadow-glow' : 'border-border dark:border-white/5'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10`} />
                <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-20">
                  {selectedModule?.id === mod.id && (
                    <motion.span 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-4 bg-accent text-[8px] font-black px-2 py-0.5 rounded-full text-white tracking-tighter"
                    >
                      EM ANDAMENTO
                    </motion.span>
                  )}
                  <Icon 
                    size={32} 
                    className={`mb-4 transition-all duration-300 ${selectedModule?.id === mod.id ? 'text-accent scale-110' : 'text-foreground/40 dark:text-white/60'}`} 
                  />
                  <span className="text-xs md:text-sm font-black font-cinzel tracking-wider text-center leading-tight transition-colors group-hover:text-white">
                    {mod.title}
                  </span>
                </div>
                
                {selectedModule?.id === mod.id && (
                  <motion.div layoutId="glow" className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-accent/40 blur-[40px]" />
                )}
              </button>
            )})}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden min-h-[600px] shadow-3xl flex flex-col items-center justify-center transition-colors">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedModule?.id || 'empty'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full h-full p-6 md:p-12"
            >
              {selectedModule?.type === "community" ? (
                <div className="flex flex-col items-center justify-center py-12 text-center max-w-2xl mx-auto">
                   <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mb-8 border-2 border-accent/20 animate-pulse">
                      <Users size={48} className="text-accent" />
                   </div>
                   <h2 className="text-4xl font-black font-cinzel italic mb-4">ANAAC <span className="text-accent">COMMUNITY</span></h2>
                   <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                     Junte-se a centenas de alunas que estão trilhando o mesmo caminho que você. 
                     Acompanhe o percurso, a evolução e incentive a comunidade na nossa plataforma nativa.
                   </p>
                   <div className="mt-6 w-full max-w-md bg-accent/5 border border-accent/10 rounded-3xl p-6 flex flex-col items-center gap-4 group hover:bg-accent/10 transition-all">
                      <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent">
                         <Users size={24} />
                      </div>
                      <div className="text-center">
                         <h4 className="text-sm font-black uppercase text-accent tracking-widest">Placar e Interações</h4>
                         <p className="text-xs text-muted-foreground mt-2">Veja como outras alunas estão indo no desafio através da guia "Comunidade" no menu lateral.</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Video Player + Detail */}
                  <div className="lg:col-span-2 space-y-6">
                    {activeLesson ? (
                      <>
                        <div className="aspect-video bg-obsidian rounded-3xl border border-border overflow-hidden shadow-2xl relative flex items-center justify-center">
                          {activeLesson.video_url ? (
                            (() => {
                              const ytId = activeLesson.video_url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];
                              if (ytId) {
                                return (
                                  <a href={`https://youtube.com/watch?v=${ytId}`} target="_blank" rel="noreferrer" className="w-full h-full relative group block overflow-hidden rounded-3xl">
                                    <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center group-hover:bg-black/30 transition-all">
                                      <div className="w-20 h-16 bg-red-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_25px_rgba(220,38,38,0.5)]">
                                        <Play size={32} className="text-white fill-white" />
                                      </div>
                                      <span className="mt-4 bg-black/60 backdrop-blur border border-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full text-white/90">Assistir Aula Original</span>
                                    </div>
                                  </a>
                                );
                              }
                              return (
                                <a href={activeLesson.video_url} target="_blank" rel="noreferrer" className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] hover:bg-[#1a1a1a] transition-all group">
                                    <Play size={48} className="text-accent mb-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 border border-accent/20 text-accent rounded-full bg-accent/5">Acessar Videoexterno</span>
                                </a>
                              );
                            })()
                          ) : activeLesson.pdf_url ? (
                            <div className="flex flex-col items-center gap-6 p-12 text-center">
                               <div className="w-20 h-20 rounded-3xl bg-accent/20 flex items-center justify-center text-accent shadow-glow">
                                  <Download size={40} />
                               </div>
                               <div>
                                  <h3 className="text-xl font-bold italic">{activeLesson.title}</h3>
                                  <p className="text-xs text-white/40 uppercase tracking-widest mt-2">Documento PDF disponível para download</p>
                               </div>
                               <Button asChild className="bg-accent hover:bg-accent/90 text-white rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest shadow-glow">
                                  <a href={activeLesson.pdf_url} target="_blank" rel="noreferrer">Baixar PDF</a>
                               </Button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-4 text-white/10">
                               <Play size={64} />
                               <p className="font-bold text-[10px] uppercase tracking-[0.3em]">Aguardando Conteúdo</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
                          <div>
                            <h2 className="text-2xl font-bold italic">{activeLesson.title}</h2>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                               <span className="flex items-center gap-1.5 text-accent"><Clock size={14}/> {activeLesson.duration}</span>
                               <span className="h-1 w-1 bg-white/20 rounded-full" />
                               <span className="text-white/40">Módulo: {selectedModule?.title}</span>
                            </div>
                          </div>
                          <Button 
                            onClick={() => toggleProgressMutation.mutate(activeLesson.id)}
                            className={`rounded-2xl gap-2 font-bold ${isCompleted(activeLesson.id) ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-primary text-white'}`}
                          >
                            {isCompleted(activeLesson.id) ? <CheckCircle2 size={18}/> : <Star size={18}/>}
                            {isCompleted(activeLesson.id) ? 'CONCLUÍDA' : 'MARCAR COMO CONCLUÍDA'}
                          </Button>
                        </div>
                        
                        <div className="bg-background/40 rounded-3xl p-8 border border-border">
                           <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.3em] mb-4">Material da Aula</h4>
                           <div className="text-muted-foreground leading-relaxed space-y-4 prose prose-invert max-w-none text-sm">
                             {activeLesson.description ? (
                               <p>{activeLesson.description}</p>
                             ) : (
                               <p>Nesta aula fundamental, mergulhamos nas estratégias do Desafio para garantir seu sucesso. Foco total em consistência.</p>
                             )}
                           </div>
                        </div>
                      </>
                    ) : (
                      <div className="aspect-video flex items-center justify-center text-muted-foreground border border-dashed border-border rounded-3xl italic text-sm">
                        Selecione uma aula para começar.
                      </div>
                    )}

                    {/* Show grid components for diets/workouts if needed underneath */}
                    {selectedModule?.type === 'diets' && dietPlans.length > 0 && (
                      <div className="pt-12 mt-12 border-t border-border/20">
                         <h3 className="text-lg font-bold italic mb-6">OPÇÕES DE CARDÁPIO</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {dietPlans.map(diet => (
                              <div key={diet.id} className="p-4 bg-muted/10 border border-border/40 rounded-2xl flex items-center justify-between">
                                 <div>
                                    <p className="text-xs font-bold">{diet.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{diet.calories} kcal</p>
                                 </div>
                                 <Button size="sm" variant="ghost" className="text-accent" onClick={() => toggleItem(`diet-${diet.id}`, 'dieta')}>
                                    <ExternalLink size={14} />
                                 </Button>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}

                    {selectedModule?.type === 'workouts' && trainingPlans.length > 0 && (
                      <div className="pt-12 mt-12 border-t border-border/20">
                         <h3 className="text-lg font-bold italic mb-6">OPÇÕES DE TREINO</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {trainingPlans.map(plan => (
                              <div key={plan.id} className="p-4 bg-muted/10 border border-border/40 rounded-2xl flex items-center justify-between">
                                 <div>
                                    <p className="text-xs font-bold">{plan.title}</p>
                                    <p className="text-[10px] text-muted-foreground">{plan.objetivo_mesociclo}</p>
                                 </div>
                                 <Button size="sm" variant="ghost" className="text-accent" onClick={() => toggleItem(`workout-${plan.id}`, 'treino')}>
                                    <ExternalLink size={14} />
                                 </Button>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>


                  {/* Lessons List */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold italic border-l-4 border-accent pl-4">CONTEÚDO</h3>
                    <div className="space-y-3">
                      {moduleLessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => setActiveLessonId(lesson.id)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                            activeLessonId === lesson.id 
                              ? 'bg-accent/10 border-accent/20' 
                              : 'bg-card/40 border-border hover:border-accent/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${
                               isCompleted(lesson.id) 
                                 ? 'bg-green-500/20 text-green-500' 
                                 : 'bg-accent/20 text-accent'
                             }`}>
                                {isCompleted(lesson.id) ? <CheckCircle2 size={18} /> : lesson.pdf_url ? <Download size={18} /> : <Play size={18} />}
                             </div>
                             <div className="text-left">
                               <p className="text-sm font-bold tracking-tight line-clamp-1">{lesson.title}</p>
                               <span className="text-[10px] text-white/40 uppercase tracking-widest">{lesson.duration || '05:00'}</span>
                             </div>
                          </div>
                          {activeLessonId === lesson.id && (
                            <motion.div layoutId="active-dot" className="w-1.5 h-1.5 rounded-full bg-accent shadow-glow" />
                          )}
                        </button>
                      ))}
                      {moduleLessons.length === 0 && (
                        <p className="text-center py-10 text-muted-foreground italic text-xs border border-dashed border-border rounded-2xl">Aguardando conteúdo...</p>
                      )}
                    </div>

                    <div className="pt-8 border-t border-border/50">
                       <h4 className="text-[10px] font-black uppercase text-accent tracking-[0.3em] mb-4">Comentários da Aula</h4>
                       <div className="flex gap-3 mb-6">
                           <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-black text-accent shrink-0 uppercase">
                               {user?.email?.substring(0,2) || "TU"}
                           </div>
                           <div className="flex-1 flex gap-2">
                             <input 
                                type="text" 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && newComment.trim() && addCommentMutation.mutate(newComment)}
                                placeholder="Comente..." 
                                className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-accent/40"
                             />
                             <Button 
                                size="icon" 
                                className="rounded-xl h-8 w-8"
                                onClick={() => newComment.trim() && addCommentMutation.mutate(newComment)}
                                disabled={addCommentMutation.isPending || !newComment.trim()}
                             >
                                <Send size={14} />
                             </Button>
                           </div>
                       </div>
                       <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                          {lessonComments.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                               <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/40 shrink-0 overflow-hidden">
                                  {comment.profiles?.avatar_url ? (
                                    <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{comment.profiles?.nome?.substring(0,2).toUpperCase() || "??"}</span>
                                  )}
                               </div>
                               <div>
                                  <p className="text-[10px] font-bold text-accent">
                                    {comment.profiles?.nome || "Usuário"} 
                                    <span className="text-white/20 ml-2 font-normal">
                                      {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-muted-foreground leading-snug">{comment.content}</p>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>


        {/* Comments Section (Static Bottom) */}
        <div className="w-full mt-8 bg-card border border-border rounded-3xl p-6 flex flex-col shadow-sm mb-20">
           <div className="flex items-center justify-between mb-4 shrink-0 px-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-accent" size={18} />
                <h3 className="text-sm font-black italic uppercase tracking-wider">Comunidade VIP</h3>
              </div>
              <span className="text-xs text-muted-foreground">{lessonComments.length} comentários</span>
           </div>

           <div className="flex-1 overflow-y-auto w-full no-scrollbar space-y-4 px-2 mb-4">
               {lessonComments.length === 0 ? (
                 <div className="text-center py-6 text-muted-foreground italic text-xs">Seja a primeira a comentar!</div>
               ) : (
                 lessonComments.map((comment) => (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     key={comment.id} 
                     className="flex gap-3"
                   >
                     <div className="w-8 h-8 rounded-full overflow-hidden bg-accent/20 flex items-center justify-center text-accent font-black border border-accent/20 shrink-0 text-xs">
                       {comment.profiles?.avatar_url ? (
                         <img src={comment.profiles.avatar_url} alt={comment.profiles.nome} className="w-full h-full object-cover" />
                       ) : (
                         comment.profiles?.nome?.charAt(0) || 'U'
                       )}
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-accent text-xs">{comment.profiles?.nome || 'Aluna Miri'}</span>
                          <span className="text-[10px] text-white/30">
                            {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-white/80 text-xs leading-relaxed">
                          {comment.content}
                        </p>
                     </div>
                   </motion.div>
                 ))
               )}
            </div>

            {/* Input Box Static Bottom */}
            <div className="shrink-0 flex gap-2 pt-2 border-t border-white/5 px-2">
              <input 
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newComment.trim() && addCommentMutation.mutate(newComment)}
                placeholder="Adicione um comentário..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent/40 transition-colors h-10"
              />
              <button 
                disabled={!newComment.trim() || addCommentMutation.isPending}
                onClick={() => addCommentMutation.mutate(newComment)}
                className="bg-accent text-white h-10 px-5 rounded-full font-bold text-xs hover:scale-105 transition-all shadow-md shadow-accent/20 disabled:opacity-50 disabled:hover:scale-100 uppercase tracking-wider shrink-0"
              >
                 {addCommentMutation.isPending ? '...' : 'Enviar'}
              </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Challenge;
