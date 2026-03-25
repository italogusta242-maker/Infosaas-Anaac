import { motion } from "framer-motion";
import {
  CheckCircle2,
  Dumbbell,
  Utensils,
  Users,
  TrendingUp,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { useFunnelStore } from "@/stores/useFunnelStore";

const features = [
  { icon: Dumbbell, label: "Treinos", desc: "Personalizados para você" },
  { icon: Utensils, label: "Dieta", desc: "Plano alimentar completo" },
  { icon: Users, label: "Comunidade", desc: "Alunas e suporte" },
  { icon: TrendingUp, label: "Evolução", desc: "Acompanhe seu progresso" },
  { icon: Trophy, label: "Desafios", desc: "Gamificação diária" },
];

const FunnelMembros = () => {
  const { user, clearCheckout } = useFunnelStore();

  const handleEnter = () => {
    clearCheckout();
    // Navigate to the real app
    window.location.href = "/";
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#08090C] overflow-y-auto">
      {/* ── Top gradient ── */}
      <div className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, hsl(342 100% 57% / 0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          {/* ── Success icon ── */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(342 100% 57%), hsl(342 100% 47%))",
              boxShadow: "0 0 60px hsl(342 100% 57% / 0.3)",
            }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>

          {/* ── Welcome message ── */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white mb-2 font-sans"
          >
            Bem-vinda, {user.nome.split(" ")[0] || "aluna"}! 🎉
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/50 text-sm mb-8"
          >
            Sua conta foi ativada com sucesso. Explore seus recursos exclusivos.
          </motion.p>

          {/* ── Feature grid ── */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {features.map(({ icon: Icon, label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + i * 0.06 }}
                className={`
                  p-4 rounded-2xl bg-white/5 border border-white/10 text-left
                  ${i === features.length - 1 && features.length % 2 !== 0 ? "col-span-2" : ""}
                `}
              >
                <Icon className="w-6 h-6 text-[hsl(342,100%,57%)] mb-2" />
                <p className="text-white font-semibold text-sm">{label}</p>
                <p className="text-white/40 text-xs">{desc}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Enter app button ── */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEnter}
            className="w-full py-4 rounded-xl text-white font-bold text-base tracking-wide flex items-center justify-center gap-2"
            style={{
              background: "linear-gradient(135deg, hsl(342 100% 57%), hsl(342 100% 47%))",
              boxShadow: "0 0 30px hsl(342 100% 57% / 0.3), 0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            Entrar no Aplicativo
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default FunnelMembros;
