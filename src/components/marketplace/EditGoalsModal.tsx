import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Target } from "lucide-react";

interface EditGoalsModalProps {
  children: React.ReactNode;
}

export function EditGoalsModal({ children }: EditGoalsModalProps) {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    annual_goal_transactions: "",
    primary_challenge: "",
    budget_preference: "",
    marketing_time_per_week: ""
  });

  useEffect(() => {
    if (profile && isOpen) {
      const profileData = profile as any;
      setFormData({
        annual_goal_transactions: profileData.annual_goal_transactions?.toString() || "",
        primary_challenge: profileData.primary_challenge || "",
        budget_preference: profileData.budget_preference || "",
        marketing_time_per_week: profileData.marketing_time_per_week?.toString() || ""
      });
    }
  }, [profile, isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedData = {
        ...profile,
        annual_goal_transactions: formData.annual_goal_transactions ? parseInt(formData.annual_goal_transactions) : null,
        primary_challenge: formData.primary_challenge,
        budget_preference: formData.budget_preference,
        marketing_time_per_week: formData.marketing_time_per_week ? parseInt(formData.marketing_time_per_week) : null
      };

      await updateProfile(updatedData);
      
      toast({
        title: "Goals Updated",
        description: "Your business goals have been successfully updated."
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating goals:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update your goals. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const primaryChallenges = [
    "lead_generation",
    "closing_more_deals", 
    "time_management",
    "marketing_roi",
    "client_retention",
    "transaction_volume",
    "market_expansion"
  ];

  const budgetOptions = [
    "conservative",
    "balanced", 
    "aggressive"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Edit Your Business Goals
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="annual_goal_transactions">Annual Transaction Goal</Label>
            <Input
              id="annual_goal_transactions"
              type="number"
              placeholder="e.g., 24"
              value={formData.annual_goal_transactions}
              onChange={(e) => setFormData(prev => ({ ...prev, annual_goal_transactions: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_challenge">Primary Business Challenge</Label>
            <Select
              value={formData.primary_challenge}
              onValueChange={(value) => setFormData(prev => ({ ...prev, primary_challenge: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your main challenge" />
              </SelectTrigger>
              <SelectContent>
                {primaryChallenges.map((challenge) => (
                  <SelectItem key={challenge} value={challenge}>
                    {challenge.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget_preference">Monthly Marketing Budget</Label>
            <Select
              value={formData.budget_preference}
              onValueChange={(value) => setFormData(prev => ({ ...prev, budget_preference: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your budget range" />
              </SelectTrigger>
              <SelectContent>
                {budgetOptions.map((budget) => (
                  <SelectItem key={budget} value={budget}>
                    {budget === "conservative" ? "Conservative" :
                     budget === "balanced" ? "Balanced" :
                     "Aggressive"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketing_time_per_week">Hours per Week for Marketing</Label>
            <Input
              id="marketing_time_per_week"
              type="number"
              placeholder="e.g., 10"
              value={formData.marketing_time_per_week}
              onChange={(e) => setFormData(prev => ({ ...prev, marketing_time_per_week: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Goals"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}