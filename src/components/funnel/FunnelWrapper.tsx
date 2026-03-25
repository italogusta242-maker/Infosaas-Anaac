import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFunnelStore, type FunnelStep } from "@/stores/useFunnelStore";

// Lazy load each step for code-splitting
const FunnelVSL = lazy(() => import("./FunnelVSL"));
const FunnelCadastro = lazy(() => import("./FunnelCadastro"));
const FunnelPlanos = lazy(() => import("./FunnelPlanos"));
const FunnelCheckout = lazy(() => import("./FunnelCheckout"));
const FunnelMembros = lazy(() => import("./FunnelMembros"));

// ── Step-to-Component map ──
const STEP_COMPONENTS: Record<FunnelStep, React.LazyExoticComponent<React.ComponentType>> = {
  vsl: FunnelVSL,
  cadastro: FunnelCadastro,
  planos: FunnelPlanos,
  checkout: FunnelCheckout,
  membros: FunnelMembros,
};

// ── Skeleton loader while lazy component loads ──
const StepSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center bg-[#08090C]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-white/20 animate-spin" />
      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-white/30 rounded-full animate-loading-bar" />
      </div>
    </div>
  </div>
);

// ── Transition variants ──
const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
};

const FunnelWrapper = () => {
  const step = useFunnelStore((s) => s.step);
  const restoreCheckout = useFunnelStore((s) => s.restoreCheckout);

  // Restore checkout state on mount (Pix resilience)
  useEffect(() => {
    restoreCheckout();
  }, [restoreCheckout]);

  // Lock body scroll while funnel is active
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div
      className="funnel-container"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        overflow: "hidden",
        backgroundColor: "#08090C",
        zIndex: 9999,
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="w-full h-full"
        >
          <Suspense fallback={<StepSkeleton />}>
            <StepComponent />
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FunnelWrapper;
