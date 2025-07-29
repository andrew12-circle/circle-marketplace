import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Monitor, Mail, Share2, Video, Calendar, Gift, Brain } from "lucide-react";

interface CategoryMegaMenuProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const categoryGroups = [
  {
    title: "Digital Marketing",
    icon: Monitor,
    items: [
      "Digital Ads",
      "Retargeting Ads", 
      "Google Business Profile Opt.",
      "Lead Capture Funnels",
      "Real Estate Drip Emails",
      "AI Text Follow-Up Sequences",
      "SEO Campaigns",
      "Landing Page Creation",
      "Chatbot or AI SMS Bot Setup"
    ]
  },
  {
    title: "Print Marketing",
    icon: Mail,
    items: [
      "Just Listed / Just Sold Postcards",
      "Geo-Farm Postcard Campaigns", 
      "Expired/FSBO Direct Mail",
      "Client Anniversary Mailers",
      "Luxury Listing Brochures",
      "Door Hangers / Leave-Behinds",
      "Business Cards / Signs"
    ]
  },
  {
    title: "Social Media Management",
    icon: Share2,
    items: [
      "Done-for-You Weekly Posting",
      "Instagram Reels / TikTok Editing",
      "Facebook Group Management", 
      "LinkedIn Branding & Posts",
      "Content Calendar & Hashtags"
    ]
  },
  {
    title: "Video & Content",
    icon: Video,
    items: [
      "Social Media Video Packs",
      "Listing Videos / Walkthroughs",
      "Drone Footage",
      "Lifestyle/Brand Promo Videos",
      "About Me Agent Intro Videos", 
      "Client Testimonial Editing",
      "AI-Generated Scripted Video"
    ]
  },
  {
    title: "Event & Open House",
    icon: Calendar,
    items: [
      "Open House Kit",
      "Client Appreciation Events",
      "Pop-By Gifts Coordination",
      "Housewarming Gift Packs",
      "Homebuyer Seminar Marketing"
    ]
  },
  {
    title: "Client Retention",
    icon: Gift,
    items: [
      "Closing Gifts Fulfillment",
      "Birthday & Holiday Automation",
      "Referral Gift Packs",
      "Past Client Re-Engagement",
      "Custom Branded Swag"
    ]
  },
  {
    title: "Coaching & Strategy",
    icon: Brain,
    items: [
      "1-on-1 Marketing Strategy",
      "Business Planning & Audit",
      "Monthly Accountability",
      "Circle Jumpstart Workshop"
    ]
  }
];

export const CategoryMegaMenu = ({ selectedCategory, onCategorySelect }: CategoryMegaMenuProps) => {
  const [open, setOpen] = useState(false);

  const handleCategorySelect = (category: string) => {
    onCategorySelect(category);
    setOpen(false);
  };

  const getDisplayText = () => {
    if (selectedCategory === "all") return "All Categories";
    return selectedCategory;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {getDisplayText()}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[800px] p-0 z-50" align="start">
        <div className="bg-background border rounded-lg shadow-lg">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Select Category</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleCategorySelect("all")}
                className={selectedCategory === "all" ? "bg-accent" : ""}
              >
                All Categories
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 p-6">
            {categoryGroups.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <Icon className="h-4 w-4 text-circle-primary" />
                    <h4 className="font-medium text-sm text-foreground">{group.title}</h4>
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleCategorySelect(item)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors ${
                          selectedCategory === item ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedCategory && selectedCategory !== "all" && (
            <div className="p-4 border-t bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Selected:</span>
                  <Badge variant="secondary">{selectedCategory}</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleCategorySelect("all")}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};