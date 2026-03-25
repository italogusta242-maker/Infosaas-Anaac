import { create } from "zustand";

// ── Types ──────────────────────────────────────────────
export type FunnelStep = "vsl" | "cadastro" | "planos" | "checkout" | "membros";

export interface FunnelUser {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}

export interface FunnelPlan {
  id: string;
  label: string;
  months: number;
  price: number;       // preço em reais
  priceLabel: string;  // ex: "R$ 59,90"
  highlight?: boolean;
  badge?: string;
}

export type PaymentMethod = "pix" | "cartao";

export interface CheckoutState {
  method: PaymentMethod;
  pixCode: string | null;
  pixExpiry: number | null;   // timestamp de expiração
  termsAccepted: boolean;
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  cardCvv: string;
}

interface FunnelState {
  // ── Step control ──
  step: FunnelStep;
  goTo: (step: FunnelStep) => void;
  next: () => void;

  // ── User (lead) ──
  user: FunnelUser;
  setUser: (partial: Partial<FunnelUser>) => void;

  // ── Plan selection ──
  selectedPlan: FunnelPlan | null;
  setSelectedPlan: (plan: FunnelPlan) => void;

  // ── Checkout ──
  checkout: CheckoutState;
  setCheckout: (partial: Partial<CheckoutState>) => void;

  // ── Persistence for Pix resilience ──
  persistCheckout: () => void;
  restoreCheckout: () => void;
  clearCheckout: () => void;

  // ── Reset ──
  reset: () => void;
}

// ── Step order ────────────────────────────────────────
const STEP_ORDER: FunnelStep[] = ["vsl", "cadastro", "planos", "checkout", "membros"];

// ── Default plans (placeholders — easy to swap later) ──
export const DEFAULT_PLANS: FunnelPlan[] = [
  {
    id: "mensal",
    label: "Mensal",
    months: 1,
    price: 39.9,
    priceLabel: "R$ 39,90",
  },
  {
    id: "trimestral",
    label: "3 Meses",
    months: 3,
    price: 59.9,
    priceLabel: "R$ 59,90",
    highlight: true,
    badge: "MELHOR CUSTO-BENEFÍCIO",
  },
  {
    id: "semestral",
    label: "6 Meses",
    months: 6,
    price: 99.9,
    priceLabel: "R$ 99,90",
  },
];

// ── Initial states ────────────────────────────────────
const initialUser: FunnelUser = { nome: "", email: "", telefone: "", senha: "" };

const initialCheckout: CheckoutState = {
  method: "pix",
  pixCode: null,
  pixExpiry: null,
  termsAccepted: false,
  cardNumber: "",
  cardName: "",
  cardExpiry: "",
  cardCvv: "",
};

const STORAGE_KEY = "funnel_checkout_state";

// ── Store ──────────────────────────────────────────────
export const useFunnelStore = create<FunnelState>((set, get) => ({
  step: "vsl",

  goTo: (step) => set({ step }),

  next: () => {
    const idx = STEP_ORDER.indexOf(get().step);
    if (idx < STEP_ORDER.length - 1) {
      set({ step: STEP_ORDER[idx + 1] });
    }
  },

  user: { ...initialUser },
  setUser: (partial) => set((s) => ({ user: { ...s.user, ...partial } })),

  selectedPlan: null,
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),

  checkout: { ...initialCheckout },
  setCheckout: (partial) =>
    set((s) => ({ checkout: { ...s.checkout, ...partial } })),

  persistCheckout: () => {
    const { checkout, selectedPlan, user } = get();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ checkout, selectedPlan, user })
      );
    } catch {
      // silently fail on quota
    }
  },

  restoreCheckout: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.checkout) set({ checkout: data.checkout });
      if (data.selectedPlan) set({ selectedPlan: data.selectedPlan });
      if (data.user) set((s) => ({ user: { ...s.user, ...data.user } }));
    } catch {
      // corrupted data
    }
  },

  clearCheckout: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  reset: () =>
    set({
      step: "vsl",
      user: { ...initialUser },
      selectedPlan: null,
      checkout: { ...initialCheckout },
    }),
}));
