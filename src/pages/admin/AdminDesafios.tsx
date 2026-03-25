import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, ImageIcon, Loader2, ArrowLeft, Save, CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BuilderHeader } from "@/components/admin/BuilderHeader";
import { ChallengeView } from "@/components/admin/ChallengeView";
import { ModuleDrawer } from "@/components/admin/ModuleDrawer";

// --- Types ---
interface ChallengeBanner {
  id: string;
  image_url: string;
  sort_order: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  banner_image_url?: string;
  is_active: boolean;
  banners?: ChallengeBanner[];
  start_date: string;
  end_date: string;
  created_at: string;
}

interface Module {
  id: string;
  challenge_id: string;
  title: string;
  description: string;
  icon: string;
  sort_order: number;
  type: string;
  is_locked: boolean;
}

// ============================
// MAIN COMPONENT
// ============================
const AdminDesafios = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "builder">("list");
  const [editorMode, setEditorMode] = useState<"edit" | "view">("edit");
  const [localChallenge, setLocalChallenge] = useState<any>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const editingModule = localChallenge?.modules?.find((m: any) => m.id === editingModuleId);

  // Queries
  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select(`
          *,
          banners:challenge_banners(*)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Challenge[];
    },
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["admin-modules", localChallenge?.id],
    queryFn: async () => {
      if (!localChallenge?.id) return [];
      const { data, error } = await supabase
        .from("challenge_modules")
        .select(`
          *,
          lessons:challenge_lessons(*)
        `)
        .eq("challenge_id", localChallenge.id)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!localChallenge?.id && view === "builder",
  });

  // Effect to sync local challenge with modules
  useEffect(() => {
    if (view === "builder" && localChallenge && modules.length > 0) {
      if (!localChallenge.modules || localChallenge.modules.length !== modules.length) {
        setLocalChallenge((prev: any) => ({ ...prev, modules }));
      }
    }
  }, [modules, view]);

  // Mutations
  // Mutations
  const saveAllM = useMutation({
    mutationFn: async (challenge: any) => {
      // 1. Save Challenge Base
      let challengeId = challenge.id;
      const challengeBaseData = {
        title: challenge.title,
        description: challenge.description,
        is_active: challenge.is_active,
        banner_image_url: challenge.banner_image_url // Keep for compatibility if needed
      };

      if (challengeId && !challengeId.startsWith("temp-")) {
        const { error } = await supabase.from("challenges").update(challengeBaseData).eq("id", challengeId);
        if (error) throw error;
      } else {
        const { data: newC, error } = await supabase.from("challenges").insert([challengeBaseData]).select().single();
        if (error) throw error;
        challengeId = newC.id;
      }

      // 2. Sync Banners
      const banners = challenge.banners || [];
      const currentBannerIds = banners.filter((b: any) => !b.id.startsWith('temp-')).map((b: any) => b.id);
      
      const { data: existingBanners } = await supabase.from('challenge_banners').select('id').eq('challenge_id', challengeId);
      const bannersToDelete = existingBanners?.filter(eb => !currentBannerIds.includes(eb.id)).map(eb => eb.id) || [];
      
      if (bannersToDelete.length > 0) {
        await supabase.from('challenge_banners').delete().in('id', bannersToDelete);
      }

      for (const banner of banners) {
        const isNew = banner.id.startsWith('temp-');
        const bannerData = {
          challenge_id: challengeId,
          image_url: banner.image_url,
          sort_order: banner.sort_order,
          title_main: challenge.title
        };
        if (isNew) {
           await supabase.from('challenge_banners').insert(bannerData);
        } else {
           await supabase.from('challenge_banners').update(bannerData).eq('id', banner.id);
        }
      }

      // 3. Sync Modules
      const modules = challenge.modules || [];
      const currentModuleIds = modules.filter((m: any) => !m.id.startsWith('temp-')).map((m: any) => m.id);
      
      const { data: existingModules } = await supabase.from('challenge_modules').select('id').eq('challenge_id', challengeId);
      const modulesToDelete = existingModules?.filter(em => !currentModuleIds.includes(em.id)).map(em => em.id) || [];

      if (modulesToDelete.length > 0) {
        await supabase.from('challenge_modules').delete().in('id', modulesToDelete);
      }

      // 3. Prepare Batch Upserts
      const modulesToUpsert = modules.map(mod => ({
        id: mod.id.startsWith('temp-') ? undefined : mod.id,
        challenge_id: challengeId,
        title: mod.title,
        description: mod.description,
        type: mod.type,
        icon: mod.icon || 'BookOpen',
        sort_order: mod.sort_order,
        cover_image: mod.cover_image,
        is_locked: mod.access_restricted,
        unlock_type: mod.unlock_type,
        unlock_at: mod.unlock_at
      }));

      const { data: syncedModules, error: modError } = await supabase
        .from('challenge_modules')
        .upsert(modulesToUpsert)
        .select();

      if (modError) throw modError;

      // 4. Sync Lessons (Batch)
      const allLessonsToUpsert: any[] = [];
      const moduleMap = new Map(syncedModules.map((m, idx) => [modules[idx].id, m.id]));

      for (const mod of modules) {
        const dbModuleId = moduleMap.get(mod.id);
        if (!dbModuleId) continue;

        const lessons = mod.lessons || [];
        const currentLessonIds = lessons.filter((l: any) => !l.id.startsWith('temp-')).map((l: any) => l.id);
        
        // Cleanup deleted lessons for this module
        const { data: existingLessons } = await supabase.from('challenge_lessons').select('id').eq('module_id', dbModuleId);
        const lessonsToDelete = existingLessons?.filter(el => !currentLessonIds.includes(el.id)).map(el => el.id) || [];
        if (lessonsToDelete.length > 0) {
          await supabase.from('challenge_lessons').delete().in('id', lessonsToDelete);
        }

        lessons.forEach((lesson: any) => {
          allLessonsToUpsert.push({
            id: lesson.id.startsWith('temp-') ? undefined : lesson.id,
            module_id: dbModuleId,
            title: lesson.title,
            description: lesson.description || '',
            video_url: lesson.video_url || '',
            pdf_url: lesson.pdf_url || '',
            duration: lesson.duration || '05:00',
            sort_order: lesson.sort_order || 0
          });
        });
      }

      if (allLessonsToUpsert.length > 0) {
        const { error: lessonError } = await supabase
          .from('challenge_lessons')
          .upsert(allLessonsToUpsert);
        if (lessonError) throw lessonError;
      }

      return { ...challenge, id: challengeId };
    },
    onSuccess: (savedChallenge) => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["admin-modules", savedChallenge.id] });
      setIsDirty(false);
      setLocalChallenge(savedChallenge);
      toast.success("Design e conteúdos salvos com sucesso!");
    },
    onError: (err: any) => toast.error("Erro ao sincronizar: " + err.message),
  });

  // --- Image Upload Helper ---
  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `challenge-banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('challenge-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('challenge-images')
        .getPublicUrl(filePath);

      setLocalChallenge((prev: any) => {
        const newBanners = [...(prev.banners || [])];
        newBanners.push({
          id: `temp-b-${Date.now()}`,
          image_url: publicUrl,
          sort_order: newBanners.length
        });
        return { ...prev, banners: newBanners };
      });
      setIsDirty(true);
      toast.success("Banner adicionado ao carrossel!");
    } catch (error: any) {
      toast.error("Erro inesperado: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleBack = () => {
    if (isDirty) {
      if (confirm("Você tem alterações não salvas. Deseja sair?")) {
        setView("list");
        setIsDirty(false);
      }
    } else {
      setView("list");
    }
  };

  const openBuilder = (c?: Challenge) => {
    setLocalChallenge(c || { title: "Novo Desafio", description: "", is_active: true, modules: [] });
    setEditorMode("edit");
    setIsDirty(false);
    setView("builder");
  };

  const handleChange = (partial: any) => {
    setLocalChallenge((prev: any) => ({ ...prev, ...partial }));
    setIsDirty(true);
  };

  const handleAddModule = () => {
    const newMod = {
      id: `temp-${Date.now()}`,
      title: "Novo Módulo",
      type: "lessons",
      icon: "BookOpen",
      sort_order: (localChallenge?.modules?.length || 0),
    };
    setLocalChallenge((prev: any) => ({
      ...prev,
      modules: [...(prev.modules || []), newMod]
    }));
    setIsDirty(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (view === "list") {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-cinzel text-2xl font-bold text-foreground tracking-tight">Gestão de Desafios</h1>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Dashboard Administrativo</p>
          </div>
          <Button onClick={() => openBuilder()} className="gap-2 bg-accent hover:bg-accent/90 text-white font-black uppercase text-xs tracking-widest px-6 h-12 rounded-2xl shadow-glow">
            <Plus size={18} /> Novo Desafio
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((c) => (
            <Card key={c.id} className="bg-card border-border overflow-hidden group hover:border-accent/40 transition-all cursor-pointer rounded-[2rem] shadow-sm hover:shadow-xl" onClick={() => openBuilder(c)}>
              <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                {c.banner_image_url ? (
                  <img src={c.banner_image_url} alt={c.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground/20"><ImageIcon size={64} /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className={`absolute top-4 left-4 font-black tracking-widest text-[10px] ${c.is_active ? "bg-green-500 text-white" : "bg-zinc-800 text-white"}`}>
                  {c.is_active ? "ATIVO" : "RASCUNHO"}
                </Badge>
              </div>
              <CardHeader className="p-6">
                <CardTitle className="text-xl font-black italic tracking-tight">{c.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs font-medium uppercase tracking-wider text-muted-foreground mt-1">
                  {c.description || "Sem descrição definida"}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}

          <button
            onClick={() => openBuilder()}
            className="aspect-[16/10] rounded-[2rem] border-2 border-dashed border-border hover:border-accent/40 transition-all flex flex-col items-center justify-center gap-4 text-muted-foreground hover:text-accent group bg-muted/5"
          >
            <div className="w-16 h-16 rounded-3xl bg-muted/50 group-hover:bg-accent/10 flex items-center justify-center transition-all group-hover:scale-110">
              <Plus size={32} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Criar Experiência</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen -mt-10 -mx-4 md:-mx-8">
      <BuilderHeader
        editorMode={editorMode}
        onToggleMode={() => setEditorMode(editorMode === "edit" ? "view" : "edit")}
        onSave={() => saveAllM.mutate(localChallenge)}
        isDirty={isDirty}
        title={localChallenge?.title}
        status={localChallenge?.is_active ? 'PUBLISHED' : 'DRAFT'}
        onStatusChange={(newStatus) => {
          setLocalChallenge((prev: any) => ({ ...prev, is_active: newStatus === 'PUBLISHED' }));
          setIsDirty(true);
        }}
        onBack={() => {
          if (isDirty) {
            if (confirm("Você tem alterações não salvas. Deseja realmente sair?")) {
              setView("list");
              setLocalChallenge(null);
              setIsDirty(false);
            }
          } else {
            setView("list");
            setLocalChallenge(null);
          }
        }}
      />
      
      <main className="bg-background animate-in fade-in duration-500 pb-20">
        <ChallengeView
          challenge={localChallenge}
          editorMode={editorMode}
          onChange={handleChange}
          onAddModule={handleAddModule}
          onUploadBanner={handleImageUpload}
          onEditModule={(id) => setEditingModuleId(id)}
        />

        <ModuleDrawer
          module={editingModule}
          isOpen={!!editingModuleId}
          onClose={() => setEditingModuleId(null)}
          onSave={(updatedMod) => {
            setLocalChallenge((prev: any) => ({
              ...prev,
              modules: prev.modules.map((m: any) => m.id === updatedMod.id ? updatedMod : m)
            }));
            setIsDirty(true);
          }}
          onDelete={(id) => {
            setLocalChallenge((prev: any) => ({
              ...prev,
              modules: prev.modules.filter((m: any) => m.id !== id)
            }));
            setIsDirty(true);
            setEditingModuleId(null);
          }}
        />
      </main>
    </div>
  );
};

export default AdminDesafios;
