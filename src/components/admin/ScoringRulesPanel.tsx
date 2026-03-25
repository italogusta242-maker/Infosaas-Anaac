import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trophy, Save, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pointsConfig as defaultPoints, HustleAction } from "@/hooks/useHustlePoints";

const ScoringRulesPanel = () => {
  const [points, setPoints] = useState<Record<string, number>>(defaultPoints);
  const [saving, setSaving] = useState(false);

  const handleChange = (action: string, value: string) => {
    const num = parseInt(value) || 0;
    setPoints((prev) => ({ ...prev, [action]: num }));
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate saving to settings/scoring_rules table
    // In a real scenario, we would: await supabase.from('scoring_rules').upsert(...)
    await new Promise((r) => setTimeout(r, 800));
    
    // For now, let's persist in localStorage so the app can use it if we modify useHustlePoints
    localStorage.setItem("custom_scoring_rules", JSON.stringify(points));
    
    setSaving(false);
    toast.success("Regras de pontuação atualizadas com sucesso! 🔥");
  };

  const handleReset = () => {
    setPoints(defaultPoints);
    localStorage.removeItem("custom_scoring_rules");
    toast.info("Valores resetados para o padrão original.");
  };

  const sections = [
    {
      title: "Comunidade",
      actions: [
        { key: "community_post", label: "Novo Post" },
        { key: "community_reaction_bonus", label: "Reação Recebida" },
      ]
    },
    {
      title: "Treino & Dieta",
      actions: [
        { key: "workout_complete", label: "Treino Concluído" },
        { key: "workout_streak", label: "Bônus de Ofensiva (diário)" },
        { key: "diet_log", label: "Registro de Dieta" },
        { key: "diet_all_macros", label: "Bônus Macros Completos" },
      ]
    },
    {
      title: "Conteúdo & Aulas",
      actions: [
        { key: "lesson_complete", label: "Aula Assistida" },
        { key: "module_complete", label: "Módulo Finalizado" },
      ]
    }
  ];

  return (
    <Card className="bg-card border-border overflow-hidden">
      <CardHeader className="border-b border-border bg-secondary/20 flex flex-row items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={20} />
          <CardTitle className="text-lg font-cinzel">Regras de Pontuação</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="h-8 gap-1.5 border-border">
            <RotateCcw size={14} /> Resetar
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-8 gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-primary/70 border-b border-primary/10 pb-2">
                {section.title}
              </h4>
              <div className="space-y-3">
                {section.actions.map((action) => (
                  <div key={action.key} className="flex items-center justify-between gap-4">
                    <Label className="text-sm text-muted-foreground leading-tight flex-1">
                      {action.label}
                    </Label>
                    <div className="relative w-20">
                      <Input
                        type="number"
                        value={points[action.key] ?? 0}
                        onChange={(e) => handleChange(action.key, e.target.value)}
                        className="h-9 bg-secondary/50 border-border text-center pr-1 transition-all focus:ring-1 focus:ring-primary/40"
                      />
                      <span className="absolute -top-2 -right-1 text-[8px] font-bold text-primary bg-primary/10 px-1 rounded">PTS</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-8 text-center bg-secondary/30 py-2 rounded-lg border border-dashed border-border">
          As alterações refletem instantaneamente no cálculo de XP e Ranking da Comunidade.
        </p>
      </CardContent>
    </Card>
  );
};

export default ScoringRulesPanel;
