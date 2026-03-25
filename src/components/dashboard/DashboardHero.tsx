import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DashboardHeroProps {
  hasTrainingPlan: boolean;
  todayScheduleName: string;
  adherence: number;
  streak: number;
  ranking: number;
}

const DashboardHero = ({ 
  hasTrainingPlan, 
  todayScheduleName, 
  adherence, 
  streak, 
  ranking 
}: DashboardHeroProps) => {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 w-full mb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[2.5rem] bg-gradient-to-br from-[#FF2768] to-[#FF4B8B] dark:from-[#0A0A0A] dark:to-[#0A0A0A] border-none dark:border dark:border-white/5 p-8 md:p-12 overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-12"
      >
        {/* Background Glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
        
        <div className="relative z-10 flex-1 space-y-8 w-full">
          <div className="space-y-6">
            <h2 className="font-sans text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
              {hasTrainingPlan ? "TREINO DO DIA" : "SEU DESAFIO COMEÇA AGORA"}
            </h2>
            
            <p className="text-white/80 dark:text-foreground/90 text-sm md:text-base font-medium leading-relaxed max-w-lg uppercase">
              {hasTrainingPlan ? todayScheduleName : "Acesse o painel e escolha seu novo plano para iniciar os resultados."}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => hasTrainingPlan ? navigate("/aluno/treinos") : navigate("/aluno/desafio")}
            className="px-10 py-5 bg-white dark:bg-foreground text-black font-sans font-black text-sm rounded-2xl tracking-wider shadow-xl uppercase"
          >
            {hasTrainingPlan ? "Iniciar Treino" : "Escolha o plano"}
          </motion.button>
        </div>

        {/* Circular Progress Section */}
        <div className="relative z-10 flex flex-col items-center gap-10 pr-6 shrink-0">
           <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border border-white/20 dark:border-white/[0.03] animate-spin-slow" />
             <svg className="w-full h-full -rotate-90">
               <circle
                 cx="50%" cy="50%" r="45%"
                 stroke="currentColor" strokeWidth="8"
                 fill="transparent"
                 className="text-white/30 dark:text-white/5"
               />
               <motion.circle
                 cx="50%" cy="50%" r="45%"
                 stroke="currentColor" strokeWidth="8"
                 fill="transparent"
                 strokeDasharray="100 100"
                 strokeDashoffset={100 - adherence}
                 initial={{ strokeDashoffset: 100 }}
                 animate={{ strokeDashoffset: 100 - adherence }}
                 transition={{ duration: 2, ease: "easeOut" }}
                 strokeLinecap="round"
                 className="text-white dark:text-accent"
                 style={{ strokeDasharray: "283", strokeDashoffset: 283 - (283 * adherence) / 100 }}
               />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <Flame size={48} className="text-white dark:text-accent animate-pulse mb-2 md:mb-3" />
               <span className="text-4xl md:text-6xl font-sans font-bold text-white">{adherence}%</span>
               <span className="text-[10px] md:text-sm font-cinzel font-bold text-white/80 dark:text-accent tracking-[0.4em] mt-2 uppercase">Adesão</span>
             </div>
           </div>
           
           <div className="flex gap-10">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-cinzel font-bold text-white">{streak}</p>
                <p className="text-[10px] text-white/80 dark:text-muted-foreground uppercase tracking-widest">Dias Streak</p>
              </div>
              <div className="w-[1px] h-10 md:h-12 bg-white/30 dark:bg-white/10" />
               <div className="text-center">
                <p className="text-xl md:text-2xl font-cinzel font-bold text-white">{ranking}#</p>
                <p className="text-[10px] text-white/80 dark:text-muted-foreground uppercase tracking-widest">Ranking Atual</p>
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardHero;
