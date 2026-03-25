import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PerformanceEvolutionProps {
  performanceData: any[];
  chartColor: string;
  setShowPerformanceModal: (val: boolean) => void;
  cardBg: string;
  cardBorder: string;
}

const PerformanceEvolution = ({
  performanceData,
  chartColor,
  setShowPerformanceModal,
  cardBg,
  cardBorder,
}: PerformanceEvolutionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`${cardBg} rounded-[2.5rem] border ${cardBorder} p-8 shadow-xl h-full flex flex-col`}
    >
      <button onClick={() => setShowPerformanceModal(true)} className="w-full h-full text-left flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-cinzel text-xl font-bold text-primary italic">Evolução de Performance</h3>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-[0.2em]">Sua trajetória rumo ao topo do Desafio</p>
          </div>
          <span className="whitespace-nowrap text-[10px] text-muted-foreground px-4 py-2 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors font-cinzel font-black tracking-widest border border-border/50">
            DETALHES →
          </span>
        </div>
        
        <div className="flex-1 min-h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="perfGradDesktop" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: "11px" }} />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke={chartColor} 
                fill="url(#perfGradDesktop)" 
                strokeWidth={3} 
                dot={{ fill: chartColor, r: 4, stroke: 'hsl(var(--background))', strokeWidth: 2 }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </button>
    </motion.div>
  );
};

export default PerformanceEvolution;
