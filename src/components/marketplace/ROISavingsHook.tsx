import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, Calculator } from "lucide-react";
import { ROICalculator } from "./ROICalculator";
import { logger } from "@/utils/logger";

export const ROISavingsHook = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenCalculator = () => {
    logger.log('roi_hook_opened', { source: 'savings_banner' });
    setIsDialogOpen(true);
  };

  return (
    <div className="mb-8">
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-foreground">
                  See How Much Agents Like You Save
                </h3>
                <p className="text-muted-foreground">
                  Calculate your potential savings with our member pricing
                </p>
              </div>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenCalculator} className="gap-2">
                  <Calculator className="w-4 h-4" />
                  Calculate Savings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>ROI Calculator</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  <ROICalculator />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};