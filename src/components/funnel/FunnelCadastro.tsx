import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { useFunnelStore } from "@/stores/useFunnelStore";

const FunnelCadastro = () => {
  const { setUser, next } = useFunnelStore();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    senha: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const handleChange = (field: string, value: string) => {
    if (field === "telefone") {
      value = formatPhone(value);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Informe seu nome";
    if (!form.email.includes("@")) e.email = "Email inválido";
    if (form.telefone.replace(/\D/g, "").length < 10) e.telefone = "Telefone inválido";
    if (form.senha.length < 6) e.senha = "Mínimo 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // Simulate brief network delay
    await new Promise((r) => setTimeout(r, 600));

    setUser(form);
    setLoading(false);
    next();
  };

  const inputFields = [
    {
      key: "nome",
      label: "Nome completo",
      type: "text",
      icon: User,
      autoComplete: "name",
    },
    {
      key: "email",
      label: "Email",
      type: "email",
      icon: Mail,
      autoComplete: "email",
    },
    {
      key: "telefone",
      label: "Telefone",
      type: "tel",
      icon: Phone,
      autoComplete: "tel",
    },
    {
      key: "senha",
      label: "Senha",
      type: showPassword ? "text" : "password",
      icon: Lock,
      autoComplete: "new-password",
      hasToggle: true,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col bg-[#08090C] overflow-y-auto">
      {/* ── Top decorative gradient ── */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[hsl(342,100%,57%)]/10 via-transparent to-transparent pointer-events-none" />

      {/* ── Content ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* ── Header ── */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, hsl(342 100% 57%), hsl(342 100% 47%))",
                boxShadow: "0 0 40px hsl(342 100% 57% / 0.3)",
              }}
            >
              <User className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-1 font-sans">
              Crie sua conta
            </h1>
            <p className="text-white/50 text-sm">
              Preencha seus dados para acessar o aplicativo
            </p>
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {inputFields.map(({ key, label, type, icon: Icon, autoComplete, hasToggle }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <div className="relative">
                  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <input
                    type={type}
                    placeholder={label}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => handleChange(key, e.target.value)}
                    autoComplete={autoComplete}
                    className={`
                      w-full pl-12 pr-${hasToggle ? "12" : "4"} py-4 
                      bg-white/5 border rounded-xl
                      text-white placeholder-white/30
                      text-base transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-[hsl(342,100%,57%)]/50 focus:border-[hsl(342,100%,57%)]/50
                      ${errors[key] ? "border-red-500/50" : "border-white/10"}
                    `}
                  />
                  {hasToggle && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
                {errors[key] && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs mt-1 pl-4"
                  >
                    {errors[key]}
                  </motion.p>
                )}
              </motion.div>
            ))}

            {/* ── Submit button ── */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-xl text-white font-bold text-base tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, hsl(342 100% 57%), hsl(342 100% 47%))",
                boxShadow: "0 0 30px hsl(342 100% 57% / 0.3), 0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  Criar Conta
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* ── Footer ── */}
          <p className="text-center text-white/20 text-xs mt-6">
            Seus dados estão protegidos e seguros 🔒
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default FunnelCadastro;
