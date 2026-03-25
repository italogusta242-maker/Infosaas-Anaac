import { supabase } from "@/integrations/supabase/client";
import { toLocalDate } from "@/lib/dateUtils";

/**
 * Motor 1: Immediate Flame Reactivation
 *
 * Call this after:
 * 1. User finishes a workout (saveWorkout onSuccess)
 * 2. User toggles a meal in daily habits (toggleMeal)
 *
 * Checks if the day is now "approved" and updates flame_status accordingly.
 * The useFlameState hook will pick up changes via realtime subscription.
 */
export async function checkAndUpdateFlame(userId: string): Promise<void> {
  const todayStr = toLocalDate(new Date());

  // Check current flame status
  const { data: flame } = await supabase
    .from("flame_status")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  // If already ativa and last_approved_date is today, nothing to do
  if (flame?.state === "ativa" && flame?.last_approved_date === todayStr) {
    return;
  }

  // Check if today is approved
  const approved = await isDayApprovedClient(userId, todayStr);
  if (!approved) return;

  if (!flame) {
    // Create initial record
    await supabase.from("flame_status").upsert({
      user_id: userId,
      state: "ativa",
      streak: 1,
      last_approved_date: todayStr,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    return;
  }

  if (flame.state === "extinta" || flame.state === "normal") {
    // Restart from zero
    await supabase
      .from("flame_status")
      .update({
        state: "ativa",
        streak: 1,
        last_approved_date: todayStr,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
  } else if (flame.state === "tregua") {
    // Reactivate, keep streak
    await supabase
      .from("flame_status")
      .update({
        state: "ativa",
        streak: flame.streak + 1,
        last_approved_date: todayStr,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    
    if ([7, 14, 21, 30, 50, 100].includes(flame.streak + 1)) {
      await triggerMilestonePost(userId, "streak", flame.streak + 1);
    }
  } else if (flame.state === "ativa" && flame.last_approved_date !== todayStr) {
    // Already ativa but new day approved
    await supabase
      .from("flame_status")
      .update({
        streak: flame.streak + 1,
        last_approved_date: todayStr,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if ([7, 14, 21, 30, 50, 100].includes(flame.streak + 1)) {
      await triggerMilestonePost(userId, "streak", flame.streak + 1);
    }
  }
}

/** Automagically insert milestones on Community feed */
export async function triggerMilestonePost(userId: string, type: 'streak' | 'workout' | 'diet', value?: number) {
  let content = "";
  if (type === 'streak') content = `🔥 CHAMA IMPARÁVEL! Acabei de atingir ${value} DIAS de ofensiva seguidos no app!`;
  else if (type === 'workout') content = `💪 TREINO CONCLUÍDO! Mais um dia de plano pago. Quem vem junto?`;
  else if (type === 'diet') content = `🥗 DIETA 100%! Bati todas as minhas metas nutricionais de hoje. Foco no processo!`;

  // Anti-flood: se já postou essa milestone HOJE, pula
  const todayStart = new Date().toISOString().split("T")[0] + "T00:00:00";
  const prefix = content.substring(0, 10);
  const { data: recent } = await supabase
    .from("community_posts")
    .select("id")
    .eq("user_id", userId)
    .like("content", prefix + "%")
    .gte("created_at", todayStart)
    .limit(1);
    
  if (recent && recent.length > 0) return;

  await supabase.from("community_posts").insert({
    user_id: userId,
    content
  });
}

async function isDayApprovedClient(userId: string, dateStr: string): Promise<boolean> {
  // Check workouts
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", userId)
    .not("finished_at", "is", null)
    .gte("finished_at", `${dateStr}T00:00:00`)
    .lt("finished_at", `${dateStr}T23:59:59.999`)
    .limit(1);

  if (workouts && workouts.length > 0) return true;

  // Check diet (50% of meals) — guard against 0/0 false positive
  const { data: dietPlan } = await supabase
    .from("diet_plans")
    .select("meals")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // No active diet plan or empty meals → cannot approve by diet
  const totalMeals = Array.isArray(dietPlan?.meals) ? (dietPlan.meals as any[]).length : 0;
  if (totalMeals === 0) return false;

  const { data: habits } = await supabase
    .from("daily_habits")
    .select("completed_meals")
    .eq("user_id", userId)
    .eq("date", dateStr)
    .maybeSingle();

  if (habits?.completed_meals && Array.isArray(habits.completed_meals)) {
    const percentage = habits.completed_meals.length / totalMeals;
    if (percentage >= 0.5) return true;
  }

  return false;
}
