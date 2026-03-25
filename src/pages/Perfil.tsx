import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Weight, Ruler, Calendar, Percent, Camera, CreditCard, LogOut, ChevronRight, TrendingDown, Upload, Shield, Clock, MessageCircle, AlertTriangle, Bell, KeyRound, Check, Target } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import PhotoSourcePicker from "@/components/PhotoSourcePicker";
import { useChangePasswordTrigger } from "@/components/ChangePasswordSection";

const Perfil = () => {
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const nome = profile?.nome ?? "MIRI";
  
  // Mock data for completed months
  const completedMonths = [
    { title: "Janeiro ✓", id: 1 },
    { title: "Fevereiro ✓", id: 2 }
  ];

  const [editOpen, setEditOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { open: pwOpen, setOpen: setPwOpen, ChangePasswordSheet } = useChangePasswordTrigger();

  const weight = profile?.peso ? Number(profile.peso) : 0;
  const height = profile?.altura ? Number(profile.altura) : 0;
  const avatarUrl = profile?.avatar_url ?? null;

  // Fetch plan info from invites - search by auth email, profile email, and CPF
  const { data: inviteData } = useQuery({
    queryKey: ["invite-plan", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Get profile email and CPF
      const { data: prof } = await supabase
        .from("profiles")
        .select("email, cpf")
        .eq("id", user.id)
        .maybeSingle();
      
      const emails = new Set<string>();
      if (user.email) emails.add(user.email);
      if (prof?.email) emails.add(prof.email);
      
      let invite: any = null;
      // Try each email (any status, prioritize most recent)
      for (const email of emails) {
        const { data } = await supabase
          .from("invites")
          .select("plan_value, name, product_id, payment_status, status")
          .eq("email", email)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.plan_value) { invite = data; break; }
      }
      // Fallback: search by CPF
      if (!invite && prof?.cpf) {
        const { data } = await supabase
          .from("invites")
          .select("plan_value, name, product_id, payment_status, status")
          .eq("cpf", prof.cpf)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.plan_value) invite = data;
      }
      if (!invite) return null;
      // Fetch product name if product_id exists
      let productName: string | null = null;
      if (invite.product_id) {
        const { data: product } = await supabase
          .from("products")
          .select("name")
          .eq("id", invite.product_id)
          .maybeSingle();
        productName = product?.name || null;
      }
      return { ...invite, productName };
    },
    enabled: !!user,
  });

  // Derive plan name from product or plan_value
  const derivePlanName = () => {
    if (inviteData?.productName) return inviteData.productName;
    if (!inviteData?.plan_value) return "Treino e Dieta";
    const val = Number(inviteData.plan_value);
    if (val === 567) return "Trimestral PIX";
    if (val === 597) return "Trimestral Cartão";
    if (val === 297) return "Recorrente Mensal";
    return "Treino e Dieta";
  };
  const planName = derivePlanName();
  const planLabel = `Anaac Club ${planName}`;

  // Edit form state
  const [editForm, setEditForm] = useState({ nome: "", weight: 0, height: 0, targetWeight: 0, age: 0 });

  useEffect(() => {
    if (profile) {
      setEditForm({
        nome: profile.nome || "",
        weight: profile.peso ? Number(profile.peso) : 0,
        height: profile.altura ? Number(profile.altura) : 0,
        targetWeight: (profile as any).meta_peso ? Number((profile as any).meta_peso) : 0,
        age: (profile as any).nascimento ? (() => { const a = Math.floor((Date.now() - new Date((profile as any).nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000)); return a > 0 && a <= 120 ? a : 0; })() : 0,
      });
    }
  }, [profile]);

  const weightDiff = editForm.targetWeight > 0 && weight > 0 ? weight - editForm.targetWeight : 0;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    // Derive nascimento from age (e.g. Jan 1 of the birth year)
    const nascimentoFromAge = editForm.age > 0
      ? `${new Date().getFullYear() - editForm.age}-01-01`
      : undefined;
    const updates: Record<string, any> = {
      peso: String(editForm.weight),
      altura: String(editForm.height),
      meta_peso: String(editForm.targetWeight),
    };
    if (editForm.nome.trim()) updates.nome = editForm.nome.trim();
    if (nascimentoFromAge) updates.nascimento = nascimentoFromAge;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar medidas");
    } else {
      toast.success("Perfil atualizado!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditOpen(false);
    }
  };

  const handleAvatarFile = async (file: File) => {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar foto");
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id);

    if (updateError) {
      toast.error("Erro ao atualizar perfil");
    } else {
      toast.success("Avatar atualizado!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  };


  const memberSince = (profile as any)?.created_at
    ? new Date((profile as any).created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : "—";

  const menuItems = [
    { icon: Ruler, label: "Atualizar Medidas", sub: "Peso, altura, meta", action: () => setEditOpen(true) },
    { icon: CreditCard, label: "Gerenciar Assinatura", sub: `Plano ${planLabel}`, action: () => setSubscriptionOpen(true) },
    { icon: KeyRound, label: "Alterar Senha", sub: "Mude sua senha de acesso", action: () => setPwOpen(true) },
  ];

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4 pb-24">
      <h1 className="font-cinzel text-2xl font-bold text-foreground pt-2">PERFIL</h1>

      {/* Avatar + Identity */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border p-5 flex flex-col items-center relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-transparent" />
        </div>

        <div className="relative mb-3 group">
          <PhotoSourcePicker onFile={handleAvatarFile}>
            <button className="relative cursor-pointer">
              <Avatar className="w-24 h-24 border-4 border-primary/30 shadow-lg shadow-primary/20">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60">
                  <User size={40} className="text-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload size={20} className="text-foreground" />
              </div>
            </button>
          </PhotoSourcePicker>
        </div>

        <h2 className="font-cinzel text-xl font-bold text-foreground">{nome.toUpperCase()}</h2>
        
        {/* Month Badges */}
        {completedMonths.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-3 mb-1">
            {completedMonths.map(m => (
              <Badge key={m.id} className="bg-accent/20 text-accent border border-accent/30 px-3 py-1 shadow-sm">
                {m.title}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-semibold">
            {planLabel}
          </Badge>
          <span className="text-[11px] text-muted-foreground">No foco desde {memberSince}</span>
        </div>
      </motion.div>

      {/* Biometrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            icon: Weight,
            label: "Peso Atual",
            value: weight > 0 ? `${weight}kg` : "—",
            sub: weight > 0 ? "Atualizado recentemente" : "Defina nas medidas",
            color: "text-primary",
          },
          { 
            icon: Target, 
            label: "Meta de Peso", 
            value: editForm.targetWeight > 0 ? `${editForm.targetWeight}kg` : "—", 
            sub: editForm.targetWeight > 0 && weight > 0 ? `${weightDiff > 0 ? `-${weightDiff.toFixed(1)}` : `+${Math.abs(weightDiff).toFixed(1)}`}kg para a meta` : "Defina sua meta", 
            color: "text-accent" 
          },
          { icon: Ruler, label: "Altura", value: height > 0 ? `${(height / 100).toFixed(2)}m` : "—", sub: height > 0 ? `${height} cm` : "Defina nas medidas", color: "text-primary" },
          { icon: Calendar, label: "Idade", value: editForm.age > 0 ? `${editForm.age}` : "—", sub: "anos", color: "text-accent" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl border border-border p-4"
          >
            <stat.icon size={20} className={`${stat.color} mb-2`} />
            <p className="font-cinzel text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            <div className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Histórico de Meses Completados */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border p-5 mt-4 group"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-cinzel text-sm font-bold text-foreground">Histórico de Ciclos</h3>
          <Calendar size={18} className="text-muted-foreground" />
        </div>
        <div className="space-y-3">
           {completedMonths.map(m => (
             <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                     <Check size={14} />
                  </div>
                  <span className="text-sm font-bold text-foreground">{m.title.replace(' ✓', '')}</span>
                </div>
                <span className="text-[10px] font-black tracking-widest text-accent uppercase bg-accent/10 px-3 py-1 rounded-full">100% Concluído</span>
             </div>
           ))}
        </div>
      </motion.div>

      {/* Action Menu */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border"
      >
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <item.icon size={18} className="text-foreground/60 dark:text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-[11px] text-muted-foreground">{item.sub}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground/40 shrink-0" />
          </button>
        ))}
      </motion.div>

      <ChangePasswordSheet />

      {/* Sign out */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={signOut}
        className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
      >
        <LogOut size={20} className="text-muted-foreground" />
        <span className="text-sm text-foreground">Sair da conta</span>
      </motion.button>

      {/* Edit Biometrics Sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-cinzel text-foreground">Atualizar Perfil</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {/* Nome */}
            <div>
              <Label className="text-muted-foreground text-xs">Nome</Label>
              <Input
                className="bg-secondary border-border mt-1"
                placeholder="Seu nome"
                value={editForm.nome}
                onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground text-xs">Peso (kg)</Label>
                <Input type="number" className="bg-secondary border-border mt-1" value={editForm.weight || ""}
                  onChange={(e) => setEditForm({ ...editForm, weight: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Meta (kg)</Label>
                <Input type="number" className="bg-secondary border-border mt-1" value={editForm.targetWeight || ""}
                  onChange={(e) => setEditForm({ ...editForm, targetWeight: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Altura (cm)</Label>
                <Input type="number" className="bg-secondary border-border mt-1" value={editForm.height || ""}
                  onChange={(e) => setEditForm({ ...editForm, height: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Idade (anos)</Label>
                <Input type="number" className="bg-secondary border-border mt-1" value={editForm.age || ""}
                  onChange={(e) => setEditForm({ ...editForm, age: Number(e.target.value) })} />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full font-bold" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Subscription Management Sheet */}
      <Sheet open={subscriptionOpen} onOpenChange={setSubscriptionOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-sans text-xl font-black text-foreground uppercase tracking-tight">Gerenciar Assinatura</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6">
            {/* Plan card */}
            <div className="rounded-2xl border border-border bg-secondary/30 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">Plano Atual</p>
                    <span className="font-sans text-base font-bold text-foreground">{planLabel}</span>
                  </div>
                </div>
                <Badge className="bg-green-500/20 text-green-500 border border-green-500/30 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">Ativo</Badge>
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ciclo atual</span>
                  <span className="font-medium text-foreground">
                    Até {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Para maiores detalhes de faturamento, entre em contato através de nosso canal de suporte.
            </p>

            {/* Cancel button */}
            <button
              onClick={() => setCancelConfirmOpen(true)}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 transition-colors border border-transparent hover:border-border rounded-lg mt-2"
            >
              Desejo cancelar minha assinatura
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Confirmation Sheet */}
      <Sheet open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl">
          <SheetHeader>
            <SheetTitle className="font-cinzel text-foreground">Cancelar Assinatura</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
              <AlertTriangle size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Sentiremos sua falta!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Para cancelar, fale com nosso suporte. Queremos entender o que podemos melhorar e encontrar a melhor solução para você.
                </p>
              </div>
            </div>

            <a
              href="https://api.whatsapp.com/send?phone=5561999281490&text=Quero%20cancelar%20a%20minha%20assinatura%20do%20APP%20Shape%20Insano"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setCancelConfirmOpen(false);
                setSubscriptionOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium no-underline hover:bg-primary/90 transition-colors"
            >
              <MessageCircle size={16} />
              Falar com Suporte via WhatsApp
            </a>

            <button
              onClick={() => setCancelConfirmOpen(false)}
              className="w-full text-center text-xs text-muted-foreground py-2"
            >
              Voltar
            </button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};

export default Perfil;
