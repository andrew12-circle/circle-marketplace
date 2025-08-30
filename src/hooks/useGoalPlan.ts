// @ts-nocheck
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface BuildPlanArgs {
  goalTitle?: string;
  goalDescription?: string;
  timeframeWeeks?: number;
  budgetMin?: number;
  budgetMax?: number;
  webGrounded?: boolean;
}

export function useGoalPlan() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [lastPlan, setLastPlan] = useState<any>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const buildPlan = async (args: BuildPlanArgs = {}) => {
    if (!user?.id) {
      toast({ title: "Sign in required", description: "Please sign in to build an AI plan.", variant: "destructive" });
      return null;
    }
    try {
      setIsBuilding(true);
      const { data, error } = await supabase.functions.invoke("generate-goal-plan", {
        body: args,
      });
      if (error) throw error;
      if (data?.plan) {
        setLastPlan(data.plan);
        toast({ title: "AI plan ready", description: "A personalized plan was generated." });
        return data.plan;
      }
      toast({ title: "No plan generated", description: "Please try again.", variant: "destructive" });
      return null;
    } catch (e: any) {
      console.error("buildPlan error", e);
      toast({ title: "AI error", description: e?.message ?? "Unexpected error", variant: "destructive" });
      return null;
    } finally {
      setIsBuilding(false);
    }
  };

  return { isBuilding, lastPlan, buildPlan };
}
