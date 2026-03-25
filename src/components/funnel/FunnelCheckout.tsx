import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  QrCode,
  CreditCard,
  Copy,
  Check,
  Clock,
  Shield,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { useFunnelStore } from "@/stores/useFunnelStore";

// ── Fake Pix code for demo ──
const FAKE_PIX_CODE =
  "00020126580014br.gov.bcb.pix0136a1b2c3d4-e5f6-7890-abcd-ef1234567890520400005303986540559.905802BR5925INFOSAAS6009SAO PAULO62070503***6304ABCD";

const FunnelCheckout = () => {
  const navigate = useNavigate();
  const {
    user,
    selectedPlan,
    checkout,
    setCheckout,
    goTo,
    next,
    persistCheckout,
  } = useFunnelStore();

  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(0);

  // ── Initialize Pix code + expiry on mount if not set ──
  useEffect(() => {
    if (!checkout.pixCode) {
      const expiry = Date.now() + 30 * 60 * 1000; // 30 minutes
      setCheckout({
        pixCode: FAKE_PIX_CODE,
        pixExpiry: expiry,
      });
    }
  }, [checkout.pixCode, setCheckout]);

  // ── Persist on every checkout change (Pix resilience) ──
  useEffect(() => {
    persistCheckout();
  }, [checkout, persistCheckout]);

  // ── Pix countdown timer ──
  useEffect(() => {
    if (!checkout.pixExpiry) return;

    const tick = () => {
      const left = Math.max(0, Math.floor((checkout.pixExpiry! - Date.now()) / 1000));
      setPixTimeLeft(left);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [checkout.pixExpiry]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── Copy Pix code ──
  const handleCopy = useCallback(() => {
    if (checkout.pixCode) {
      navigator.clipboard.writeText(checkout.pixCode).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [checkout.pixCode]);

  // ── Process payment (simulated) ──
  const handlePayment = async () => {
    if (!checkout.termsAccepted) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 2000));
    setProcessing(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Redirect to student area after successful payment
      navigate("/aluno/desafio");
    }, 2500);
  };

  const isPix = checkout.method === "pix";

  return (
    <div className="w-full h-full flex flex-col bg-[#08090C] overflow-y-auto">
      {/* ── Header ── */}
      <div className="sticky top-0 z-20 bg-[#08090C]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-4 max-w-md mx-auto w-full">
          <button
            onClick={() => goTo("planos")}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </button>
          <h2 className="text-white font-semibold text-base">Checkout</h2>
          <div className="w-16" /> {/* spacer */}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full space-y-6">
        {/* ── Plan summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white/50 text-xs">Plano selecionado</p>
              <p className="text-white font-semibold">{selectedPlan?.label}</p>
            </div>
            <span className="text-[hsl(342,100%,57%)] font-bold text-lg">
              {selectedPlan?.priceLabel}
            </span>
          </div>
        </motion.div>

        {/* ── Pre-filled user info ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">
            Seus dados
          </p>
          {[
            { label: "Nome", value: user.nome },
            { label: "Email", value: user.email },
            { label: "Telefone", value: user.telefone },
          ].map(({ label, value }) => (
            <div key={label} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/30 text-[10px] uppercase tracking-wider">{label}</p>
              <p className="text-white text-sm">{value || "—"}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Payment method tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-3">
            Forma de pagamento
          </p>
          <div className="flex gap-2">
            {[
              { method: "pix" as const, icon: QrCode, label: "Pix" },
              { method: "cartao" as const, icon: CreditCard, label: "Cartão" },
            ].map(({ method, icon: Icon, label }) => (
              <button
                key={method}
                onClick={() => setCheckout({ method })}
                className={`
                  flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2
                  transition-all duration-200 text-sm font-medium
                  ${
                    checkout.method === method
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20"
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 ${
                    checkout.method === method ? "text-emerald-400" : "text-white/30"
                  }`}
                />
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Pix section ── */}
        <AnimatePresence mode="wait">
          {isPix ? (
            <motion.div
              key="pix"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* QR Code placeholder */}
              <div className="flex flex-col items-center">
                <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center p-4 mb-3">
                  <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0id2hpdGUiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiI+UVIgQ29kZTwvdGV4dD48L3N2Zz4=')] bg-contain bg-center bg-no-repeat grid grid-cols-8 grid-rows-8 gap-0.5">
                    {/* Simulated QR pattern */}
                    {Array.from({ length: 64 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`rounded-[1px] ${
                          Math.random() > 0.45 ? "bg-black" : "bg-transparent"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Timer */}
                <div className="flex items-center gap-2 text-amber-400 mb-3">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-mono font-semibold">
                    {formatTimer(pixTimeLeft)}
                  </span>
                  <span className="text-white/30 text-xs">para expirar</span>
                </div>
              </div>

              {/* Copy code */}
              <button
                onClick={handleCopy}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3 transition-all hover:bg-white/10"
              >
                <div className="flex-1 overflow-hidden">
                  <p className="text-white/30 text-[10px] uppercase tracking-wider">
                    Código Pix copia e cola
                  </p>
                  <p className="text-white/70 text-xs truncate font-mono">
                    {checkout.pixCode?.slice(0, 40)}...
                  </p>
                </div>
                {copied ? (
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <Copy className="w-5 h-5 text-white/40 flex-shrink-0" />
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="cartao"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {[
                {
                  label: "Número do cartão",
                  key: "cardNumber",
                  placeholder: "0000 0000 0000 0000",
                  type: "text",
                },
                {
                  label: "Nome no cartão",
                  key: "cardName",
                  placeholder: "Como está no cartão",
                  type: "text",
                },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">
                    {label}
                  </label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={(checkout as any)[key]}
                    onChange={(e) => setCheckout({ [key]: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                  />
                </div>
              ))}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">
                    Validade
                  </label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    value={checkout.cardExpiry}
                    onChange={(e) => setCheckout({ cardExpiry: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-white/30 text-[10px] uppercase tracking-wider block mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="000"
                    value={checkout.cardCvv}
                    onChange={(e) => setCheckout({ cardCvv: e.target.value })}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Terms checkbox ── */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <div
            className={`
              w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
              ${checkout.termsAccepted
                ? "border-emerald-500 bg-emerald-500"
                : "border-white/20 group-hover:border-white/40"
              }
            `}
            onClick={() => setCheckout({ termsAccepted: !checkout.termsAccepted })}
          >
            {checkout.termsAccepted && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-white/50 text-xs leading-relaxed">
            Aceito os{" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                // TODO: open terms modal
                alert("Termos e Condições — conteúdo a definir");
              }}
              className="text-[hsl(342,100%,57%)] underline hover:text-[hsl(342,100%,67%)]"
            >
              Termos e Condições
            </button>
          </span>
        </label>

        {/* ── Security badge ── */}
        <div className="flex items-center justify-center gap-2 text-white/20 text-xs">
          <Shield className="w-4 h-4" />
          <span>Pagamento 100% seguro e criptografado</span>
        </div>

        {/* ── Pay button ── */}
        <motion.button
          whileHover={checkout.termsAccepted ? { scale: 1.02 } : undefined}
          whileTap={checkout.termsAccepted ? { scale: 0.98 } : undefined}
          onClick={handlePayment}
          disabled={!checkout.termsAccepted || processing}
          className={`
            w-full py-4 rounded-xl font-bold text-base tracking-wide
            flex items-center justify-center gap-2 transition-all duration-300
            ${checkout.termsAccepted && !processing
              ? "text-white cursor-pointer"
              : "text-white/30 cursor-not-allowed bg-white/5"
            }
          `}
          style={
            checkout.termsAccepted && !processing
              ? {
                  background:
                    "linear-gradient(135deg, hsl(145 60% 40%), hsl(145 60% 35%))",
                  boxShadow:
                    "0 0 30px hsl(145 60% 40% / 0.3), 0 8px 32px rgba(0,0,0,0.3)",
                }
              : undefined
          }
        >
          {processing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            `Pagar ${selectedPlan?.priceLabel || ""}`
          )}
        </motion.button>

        {/* bottom spacer for scroll */}
        <div className="h-6" />
      </div>

      {/* ── Success popup ── */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#111214] border border-white/10 rounded-3xl p-8 max-w-sm mx-4 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(145 60% 40%), hsl(145 60% 50%))",
                  boxShadow: "0 0 40px hsl(145 60% 40% / 0.4)",
                }}
              >
                <CheckCircle2 className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-white text-xl font-bold mb-2">
                Pagamento Confirmado! 🎉
              </h2>
              <p className="text-white/50 text-sm">
                Preparando seu acesso ao aplicativo...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FunnelCheckout;
