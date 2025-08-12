import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useGoalPlan } from "@/hooks/useGoalPlan";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  goalTitle?: string;
  description?: string;
  timeframeWeeks?: number;
  budgetMin?: number;
  budgetMax?: number;
  onPlanReady?: (plan: any) => void;
}

export const BuildAIPlanButton: React.FC<Props> = ({
  goalTitle,
  description,
  timeframeWeeks,
  budgetMin,
  budgetMax,
  onPlanReady,
}) => {
  const { isBuilding, lastPlan, buildPlan } = useGoalPlan();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleBuild = async () => {
    const plan = await buildPlan({
      goalTitle,
      goalDescription: description,
      timeframeWeeks,
      budgetMin,
      budgetMax,
    });
    if (plan) {
      setOpen(true);
      onPlanReady?.(plan);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="default" onClick={handleBuild} disabled={isBuilding}>
        {isBuilding ? "Building…" : "Build AI Plan"}
      </Button>
      {open && lastPlan && (
        <Card className="p-4 max-w-2xl">
          <h3 className="text-lg font-semibold mb-2">{lastPlan.goal_title}</h3>
          {lastPlan.summary && <p className="mb-3 opacity-80">{lastPlan.summary}</p>}
          <div className="space-y-3">
            {(lastPlan.phases ?? []).map((ph: any, idx: number) => (
              <div key={idx} className="rounded-md border p-3">
                <div className="font-medium">Phase {idx + 1}: {ph.name} ({ph.weeks ?? 1} weeks)</div>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {(ph.steps ?? []).map((st: any, i: number) => (
                    <li key={i}>
                      <span className="font-medium">{st.action}</span>
                      {st.service_ids?.length ? (
                        <span className="opacity-80"> — maps to {st.service_ids.length} service(s)</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default BuildAIPlanButton;
