import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import {
  Heart, MessageCircle, Dumbbell, Award, Flame, Trophy,
  MoreHorizontal, User, Flag, Send, ChevronRight,
  TrendingUp, Users, Star, Loader2, Plus, X, ListChecks
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

// ── Types ──
interface CommunityPost {
  id: string;
  content: string;
  media_url?: string;
  created_at: string;
  user_id: string;
  profiles?: { nome: string; avatar_url?: string };
  community_reactions?: { user_id: string; reaction_type: string }[];
}

interface RankEntry {
  user_id: string;
  nome: string;
  avatar_url?: string;
  score: number;
  rank: number;
}

// ── Ranking Query ──
function useRanking() {
  return useQuery<RankEntry[]>({
    queryKey: ["community-ranking"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id, nome, avatar_url, hustle_points")
        .order("hustle_points", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []).map((p: any, i: number) => ({
        user_id: p.id,
        nome: p.nome || "Miri",
        avatar_url: p.avatar_url,
        score: p.hustle_points ?? 0,
        rank: i + 1,
      }));
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ── Profile Modal ──
function ProfileModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["public-profile", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      
      const { data: flame } = await supabase.from("flame_status").select("streak").eq("user_id", userId).maybeSingle();
      
      const { count: workoutsCount } = await supabase
        .from("workouts")
        .select("id", { count: 'exact', head: true })
        .eq("user_id", userId)
        .not("finished_at", "is", null);

      const { data: habits } = await supabase
        .from("daily_habits")
        .select("completed_meals")
        .eq("user_id", userId);
        
      const dietsCount = (habits || []).reduce((acc: number, curr: any) => acc + (curr.completed_meals?.length && curr.completed_meals.length > 3 ? 1 : 0), 0);

      return {
        ...data,
        streakDays: flame?.streak || 0,
        workoutsCount: workoutsCount || 0,
        dietsCount
      };
    },
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 bg-secondary flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.nome} className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="font-cinzel text-lg font-bold text-foreground">{profile?.nome || "—"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{profile?.email || ""}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-4 w-full">
                <div className="text-center bg-secondary/50 rounded-xl p-2">
                  <Flame size={16} className="mx-auto text-orange-500 mb-1" />
                  <p className="text-base font-black text-foreground">{profile?.streakDays ?? 0}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Dias</p>
                </div>
                <div className="text-center bg-secondary/50 rounded-xl p-2">
                  <Dumbbell size={16} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-base font-black text-foreground">{profile?.workoutsCount ?? 0}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Treinos</p>
                </div>
                <div className="text-center bg-secondary/50 rounded-xl p-2">
                  <ListChecks size={16} className="mx-auto text-green-500 mb-1" />
                  <p className="text-base font-black text-foreground">{profile?.dietsCount ?? 0}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Dietas</p>
                </div>
                <div className="text-center bg-secondary/50 rounded-xl p-2">
                  <Trophy size={16} className="mx-auto text-yellow-500 mb-1" />
                  <p className="text-base font-black text-foreground">{profile?.hustle_points ?? 0}</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mt-0.5">Pontos</p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── PostCard ──
function PostCard({ post, onAvatarClick }: { post: CommunityPost; onAvatarClick: (userId: string) => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reactions = post.community_reactions || [];
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState("");

  const hasReacted = (type: string) => reactions.some((r) => r.user_id === user?.id && r.reaction_type === type);
  const getCount = (type: string) => reactions.filter((r) => r.reaction_type === type).length;

  const reactMutation = useMutation({
    mutationFn: async (type: string) => {
      if (!user) return;
      const existing = reactions.find((r) => r.user_id === user.id && r.reaction_type === type);
      if (existing) {
        await (supabase as any).from("community_reactions").delete()
          .eq("post_id", post.id).eq("user_id", user.id).eq("reaction_type", type);
      } else {
        await (supabase as any).from("community_reactions").insert({ post_id: post.id, user_id: user.id, reaction_type: type });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["community-posts"] }),
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !content.trim()) return;
      await (supabase as any).from("post_comments").insert({ post_id: post.id, user_id: user.id, content: content.trim() });
    },
    onSuccess: () => {
      setCommentText("");
      toast.success("Comentário enviado!");
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <button className="flex items-center gap-3" onClick={() => onAvatarClick(post.user_id)}>
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border">
            {post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt={post.profiles.nome} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-muted-foreground" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold font-cinzel text-foreground leading-tight">{post.profiles?.nome || "Miri Anônimo"}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-cinzel">
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
            </p>
          </div>
        </button>
        <button className="p-2 text-muted-foreground hover:text-destructive transition-colors" title="Reportar">
          <Flag size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{post.content}</p>
      </div>

      {/* Media */}
      {post.media_url && (
        <div className="px-4 pb-4">
          <div className="rounded-2xl overflow-hidden border border-border aspect-video bg-secondary/20">
            <img src={post.media_url} alt="Post media" className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 flex items-center gap-3">
        {[
          { type: "fire", icon: <Flame size={16} />, active: "text-orange-500 bg-orange-500/10 border-orange-500/20", hover: "group-hover:text-orange-500" },
          { type: "muscle", icon: <Dumbbell size={16} />, active: "text-blue-500 bg-blue-500/10 border-blue-500/20", hover: "group-hover:text-blue-500" },
          { type: "trophy", icon: <Trophy size={16} />, active: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20", hover: "group-hover:text-yellow-500" },
        ].map(({ type, icon, active, hover }) => (
          <button
            key={type}
            onClick={() => reactMutation.mutate(type)}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-transparent transition-all duration-200 ${hasReacted(type) ? active : "text-muted-foreground hover:bg-secondary"}`}
          >
            <span className={hasReacted(type) ? "" : hover}>{icon}</span>
            <span className="text-xs font-bold">{getCount(type)}</span>
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={() => setShowComment(!showComment)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-transparent transition-colors ${showComment ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
        >
          <MessageCircle size={16} />
          <span className="text-xs font-bold">Comentar</span>
        </button>
      </div>

      {/* Comment box */}
      {showComment && (
        <div className="px-4 pb-4 flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commentMutation.mutate(commentText); } }}
            placeholder="Escreva um comentário..."
            className="flex-1 text-sm bg-secondary/50 border border-border rounded-xl px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={() => commentMutation.mutate(commentText)}
            disabled={!commentText.trim() || commentMutation.isPending}
            className="p-2 rounded-xl bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            {commentMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── New Post Form ──
function NewPostBox({ onPosted }: { onPosted: () => void }) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);

  const postMutation = useMutation({
    mutationFn: async () => {
      if (!user || !content.trim()) return;
      await (supabase as any).from("community_posts").insert({ user_id: user.id, content: content.trim() });
    },
    onSuccess: () => {
      setContent("");
      setOpen(false);
      onPosted();
      toast.success("Publicado!");
    },
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center border border-border overflow-hidden shrink-0">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={18} />}
          </div>
          <span className="text-sm bg-secondary/50 rounded-xl border border-border px-4 py-2 flex-1 text-left">
            Compartilhe sua conquista...
          </span>
          <Plus size={18} className="text-primary shrink-0" />
        </button>
      ) : (
        <div className="space-y-3">
          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="O que você conquistou hoje? Inspire a galera! 🔥"
            rows={3}
            className="w-full text-sm bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setOpen(false)} className="px-4 py-2 text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
            <button
              onClick={() => postMutation.mutate()}
              disabled={!content.trim() || postMutation.isPending}
              className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {postMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Publicar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ranking Strip ──
function RankingStrip({ onAvatarClick }: { onAvatarClick: (userId: string) => void }) {
  const { data: ranking = [], isLoading } = useRanking();

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={16} className="text-primary" />
        <h3 className="font-cinzel text-sm font-bold text-foreground uppercase tracking-wider">Ranking — Top 10</h3>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="animate-spin text-muted-foreground" size={20} /></div>
      ) : (
        <div className="space-y-2">
          {ranking.map((entry) => (
            <button
              key={entry.user_id}
              onClick={() => onAvatarClick(entry.user_id)}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/50 transition-colors group text-left"
            >
              <span className={`w-5 text-xs font-black text-center ${entry.rank <= 3 ? "text-primary" : "text-muted-foreground/50"}`}>
                {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : `${entry.rank}`}
              </span>
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border shrink-0">
                {entry.avatar_url ? <img src={entry.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={16} className="text-muted-foreground" />}
              </div>
              <span className="flex-1 text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{entry.nome}</span>
              <span className="text-xs font-black text-primary">{entry.score.toLocaleString()} pts</span>
            </button>
          ))}
          {ranking.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Nenhum dado de pontuação ainda.</p>}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──
export default function Comunidade() {
  const queryClient = useQueryClient();
  const [profileModal, setProfileModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "ranking">("feed");
  const { user } = useAuth();
  
  const { data: flame } = useQuery({
    queryKey: ["my-flame-status-ribbon", user?.id],
    queryFn: async () => {
      if (!user?.id) return { streak: 0 };
      const { data } = await supabase.from("flame_status").select("streak").eq("user_id", user.id).maybeSingle();
      return data || { streak: 0 };
    },
    enabled: !!user,
  });
  const currentStreak = flame?.streak || 0;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["community-posts"],
    queryFn: async ({ pageParam = 0 }: any) => {
      const { data, error } = await (supabase as any)
        .from("community_posts")
        .select(`*, profiles:user_id (nome, avatar_url), community_reactions (user_id, reaction_type)`)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + 9);
      if (error) throw error;
      return data as CommunityPost[];
    },
    getNextPageParam: (lastPage: CommunityPost[], allPages: CommunityPost[][]) =>
      lastPage.length === 10 ? allPages.length * 10 : undefined,
    initialPageParam: 0,
  });

  const posts = data?.pages.flat() ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 transition-colors duration-500">
      <div className="max-w-xl mx-auto pt-8 px-4 md:px-0 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-sans text-2xl md:text-3xl font-black tracking-tight">Comunidade</h1>
          <div className="flex items-center gap-1 bg-secondary/50 rounded-xl p-1 border border-border">
            {(["feed", "ranking"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === tab ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab === "feed" ? <span className="flex items-center gap-1"><Users size={12} /> Feed</span> : <span className="flex items-center gap-1"><Star size={12} /> Ranking</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Streak Ribbon ── */}
        <div className="w-full bg-card border border-border rounded-2xl p-4 shadow-sm mb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 mb-3">
             <Flame size={16} className="text-orange-500" />
             <h3 className="font-cinzel text-sm font-bold text-foreground tracking-tight uppercase">Trilho de Ofensiva</h3>
             <span className="text-xs font-black text-orange-500 ml-auto bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">{currentStreak} Dias</span>
          </div>
          <div className="flex items-center gap-2 min-w-max pb-1">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
              const isCompleted = day <= currentStreak;
              const isCurrent = day === currentStreak + 1;
              return (
                <div key={day} className="flex flex-col items-center gap-1.5 group cursor-default">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-colors ${isCompleted ? "bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.4)]" : isCurrent ? "bg-secondary border-2 border-orange-500/50 text-orange-500" : "bg-secondary/50 text-muted-foreground border border-border hover:bg-secondary"}`}>
                     {isCompleted ? (
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                     ) : day}
                   </div>
                </div>
              );
            })}
          </div>
        </div>

        {activeTab === "ranking" && (
          <RankingStrip onAvatarClick={(id) => setProfileModal(id)} />
        )}

        {activeTab === "feed" && (
          <>
            <NewPostBox onPosted={() => queryClient.invalidateQueries({ queryKey: ["community-posts"] })} />

            {status === "pending" ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-accent" size={32} /></div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-card/30 rounded-2xl border border-dashed border-border">
                <MessageCircle className="mx-auto mb-4 opacity-10" size={64} />
                <p className="font-cinzel font-bold text-foreground/50">O Feed está silencioso...</p>
                <p className="text-sm">Seja o primeiro a compartilhar sua vitória!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onAvatarClick={(id) => setProfileModal(id)} />
                ))}

                {hasNextPage && (
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full py-4 text-xs text-muted-foreground font-cinzel tracking-widest text-center hover:text-foreground transition-colors flex items-center justify-center gap-2"
                  >
                    {isFetchingNextPage ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
                    {isFetchingNextPage ? "CARREGANDO..." : "VER MAIS"}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {profileModal && (
        <ProfileModal userId={profileModal} onClose={() => setProfileModal(null)} />
      )}
    </div>
  );
}
