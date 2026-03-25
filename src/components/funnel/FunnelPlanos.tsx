import { motion } from "framer-motion";
import { Check, Crown, Zap, Star } from "lucide-react";
import { useFunnelStore, DEFAULT_PLANS, type FunnelPlan } from "@/stores/useFunnelStore";

const planIcons = [Zap, Crown, Star];

const FunnelPlanos = () => {
  const { selectedPlan, setSelectedPlan, next } = useFunnelStore();

  const handleSelect = (plan: FunnelPlan) => {
    setSelectedPlan(plan);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#08090C] overflow-y-auto">
      {/* ── Top gradient ── */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[hsl(342,100%,57%)]/8 to-transparent pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* ── Header ── */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2 font-sans">
              Escolha seu plano
            </h1>
            <p className="text-white/50 text-sm">
              Selecione o melhor plano para você
            </p>
          </div>

          {/* ── Plan cards ── */}
          <div className="space-y-3 mb-8">
            {DEFAULT_PLANS.map((plan, i) => {
              const Icon = planIcons[i];
              const isSelected = selectedPlan?.id === plan.id;
              const isHighlight = plan.highlight;

              return (
                <motion.button
                  key={plan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  onClick={() => handleSelect(plan)}
                  className={`
                    w-full relative p-4 rounded-2xl border-2 transition-all duration-200
                    text-left flex items-center gap-4
                    ${isSelected
                      ? "border-[hsl(342,100%,57%)] bg-[hsl(342,100%,57%)]/10"
                      : isHighlight
                        ? "border-[hsl(342,100%,57%)]/40 bg-white/5"
                        : "border-white/10 bg-white/[0.03]"
                    }
                  `}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider text-white"
                      style={{
                        background: "linear-gradient(135deg, hsl(342 100% 57%), hsl(342 100% 47%))",
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  {/* Icon */}
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                      ${isSelected
                        ? "bg-[hsl(342,100%,57%)]/20"
                        : "bg-white/5"
                      }
                    `}
                  >
                    <Icon
                      className={`w-6 h-6 ${isSelected ? "text-[hsl(342,100%,57%)]" : "text-white/40"}`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <h3 className="text-white font-semibold text-base">
                        {plan.label}
                      </h3>
                      <span
                        className={`text-lg font-bold ${
                          isSelected ? "text-[hsl(342,100%,57%)]" : "text-white"
                        }`}
                      >
                        {plan.priceLabel}
                      </span>
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">
                      {plan.months === 1
                        ? "Cobrança mensal"
                        : `${plan.months}x de R$ ${(plan.price / plan.months).toFixed(2).replace(".", ",")}/mês`}
                    </p>
                  </div>

                  {/* Check indicator */}
                  <div
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                      ${isSelected
                        ? "border-[hsl(342,100%,57%)] bg-[hsl(342,100%,57%)]"
                        : "border-white/20"
                      }
                    `}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* ── Checkout button ── */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={selectedPlan ? { scale: 1.02 } : undefined}
            whileTap={selectedPlan ? { scale: 0.98 } : undefined}
            onClick={() => selectedPlan && next()}
            disabled={!selectedPlan}
            className={`
              w-full py-4 rounded-xl font-bold text-base tracking-wide
              flex items-center justify-center gap-2 transition-all duration-300
              ${selectedPlan
                ? "text-white cursor-pointer"
                : "text-white/30 cursor-not-allowed bg-white/5"
              }
            `}
            style={
              selectedPlan
                ? {
                    background:
                      "linear-gradient(135deg, hsl(342 100% 57%), hsl(342 100% 47%))",
                    boxShadow:
                      "0 0 30px hsl(342 100% 57% / 0.3), 0 8px 32px rgba(0,0,0,0.3)",
                  }
                : undefined
            }
          >
            {selectedPlan ? "Ir para Checkout →" : "Selecione um plano"}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default FunnelPlanos;
