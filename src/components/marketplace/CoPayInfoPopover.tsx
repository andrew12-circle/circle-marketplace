import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export function CoPayInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5" aria-label="Co-pay info">
          <Info className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-sm">
        <div className="space-y-3">
          <p className="font-medium">Co-Pay Coverage Explained</p>
          
          <div className="space-y-2">
            <div>
              <p className="font-medium text-green-700">SSP Vendors (50% typical)</p>
              <p className="text-gray-600">Settlement Service Providers like lenders, title companies, escrow companies. RESPA-regulated with limited co-pay rates.</p>
            </div>
            
            <div>
              <p className="font-medium text-blue-700">Non-SSP Vendors (up to 70%+)</p>
              <p className="text-gray-600">Inspectors, contractors, photographers, staging companies, software providers. Can offer higher co-pay rates.</p>
            </div>
          </div>
          
          <div className="border-t pt-2 text-xs text-gray-500">
            <p>• "As low as" shows best possible scenario</p>
            <p>• Actual coverage requires vendor partnership approval</p>
            <p>• Not all vendors participate in co-pay programs</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}