import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AcademyFiltersProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  selectedCreator: string;
  onCreatorChange: (creator: string) => void;
  duration: string;
  onDurationChange: (duration: string) => void;
  showProOnly: boolean;
  onProOnlyChange: (proOnly: boolean) => void;
  onClearFilters: () => void;
}

export const AcademyFilters = ({
  searchTerm,
  onSearchChange,
  selectedTopic,
  onTopicChange,
  selectedCreator,
  onCreatorChange,
  duration,
  onDurationChange,
  showProOnly,
  onProOnlyChange,
  onClearFilters,
}: AcademyFiltersProps) => {
  return (
    <div className="bg-card border rounded-lg p-2 mb-3">
      <div className="flex items-center justify-end mb-1">
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          Clear All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedTopic} onValueChange={onTopicChange}>
          <SelectTrigger>
            <SelectValue placeholder="Topic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            <SelectItem value="lead-generation">Lead Generation</SelectItem>
            <SelectItem value="branding">Branding</SelectItem>
            <SelectItem value="conversions">Conversions</SelectItem>
            <SelectItem value="mindset">Mindset</SelectItem>
            <SelectItem value="social-media">Social Media</SelectItem>
            <SelectItem value="negotiation">Negotiation</SelectItem>
            <SelectItem value="listings">Listings</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedCreator} onValueChange={onCreatorChange}>
          <SelectTrigger>
            <SelectValue placeholder="Creator" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Creators</SelectItem>
            <SelectItem value="circle-team">Circle Team</SelectItem>
            <SelectItem value="top-agents">Top Agents</SelectItem>
            <SelectItem value="industry-experts">Industry Experts</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={duration} onValueChange={onDurationChange}>
          <SelectTrigger>
            <SelectValue placeholder="Duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Durations</SelectItem>
            <SelectItem value="0-30">Under 30 min</SelectItem>
            <SelectItem value="30-60">30-60 min</SelectItem>
            <SelectItem value="60-120">1-2 hours</SelectItem>
            <SelectItem value="120+">2+ hours</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2 mt-2">
        <Switch 
          id="pro-only" 
          checked={showProOnly}
          onCheckedChange={onProOnlyChange}
        />
        <Label htmlFor="pro-only" className="text-sm">Show Pro content only</Label>
      </div>
    </div>
  );
};