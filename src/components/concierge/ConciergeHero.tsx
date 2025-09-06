import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConsultationBookingModal } from "@/components/marketplace/ConsultationBookingModal";
import { HelpCircle } from "lucide-react";

type Signals = {
  goalTargetVolume?: number | null;
  persona?: "extrovert" | "introvert" | "balanced" | null;
};

function getCtaLabel(goal?: number | null) {
  if (!goal || goal < 1) return "Build my plan (2 min)";
  return `Build my ${goal}-deal plan (2 min)`;
}

function getPlaybookTitle(persona?: Signals["persona"]) {
  switch (persona) {
    case "extrovert": return "Your Extrovert Playbook: Events + Prospecting";
    case "introvert": return "Your Introvert Playbook: Content + Systems";
    default: return "Your Growth Playbook";
  }
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function ConciergeHero({
  userFirstName = "there",
  signals,
  onStart,
  onOpenGuide,
  onBookHuman,
}: {
  userFirstName?: string;
  signals: Signals;
  onStart: () => void;
  onOpenGuide: () => void;
  onBookHuman?: () => void;
}) {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const cta = getCtaLabel(signals.goalTargetVolume);
  const playbookTitle = getPlaybookTitle(signals.persona);

  const handleBookingConfirmed = (consultationId: string) => {
    console.log('Consultation booked successfully:', consultationId);
    setIsBookingModalOpen(false);
  };

  // Service object for the booking modal - representing Circle's advisory service
  const advisoryService = {
    id: 'ad4ec4d4-fc66-4286-9e92-209b11dab58d', // Circle's internal advisory service from services table
    title: 'Circle Marketplace Advisory Consultation',
    vendor: {
      name: 'Circle Marketplace Team'
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 p-6 md:p-8 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Greeting */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{getTimeOfDayGreeting()}, {userFirstName}.</p>
          <h1 className="mt-1 text-2xl md:text-3xl font-semibold">Let's map your next 12 months</h1>
          <p className="mt-2 text-muted-foreground">
            Advice for real estate agents, <span className="font-medium">backed by data and real results</span>.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Free for agents. No spam. Takes ~2 minutes.</p>
        </div>

        {/* Micro-FAQ */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="FAQ">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 text-sm">
            <p className="font-medium mb-2">Quick FAQ</p>
            <ul className="space-y-2">
              <li><span className="font-medium">What happens next?</span> Answer ~12 questions → playbook + 3–5 picks.</li>
              <li><span className="font-medium">Do I pay anything now?</span> No — it's free for agents.</li>
              <li><span className="font-medium">Can I talk to a person?</span> Yes — book a 15-min advisor.</li>
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      {/* Primary actions */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button onClick={onStart} className="px-5">{cta}</Button>
        <Button variant="secondary" onClick={onOpenGuide}>See my AI strategy guide</Button>
        <div className="text-xs text-muted-foreground">
          <span className="mr-3">1) Share goals</span>
          <span className="mr-3">2) See your plan</span>
          <span>3) Take action</span>
        </div>
      </div>

      {/* Trust row */}
      <div className="mt-4 text-xs text-muted-foreground flex flex-wrap gap-3">
        <span>✅ Trusted by thousands of agents</span>
        <span>✅ Free for agents</span>
        <span>✅ No spam</span>
      </div>

      {/* Playbook heading */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold">{playbookTitle}</h2>
        <p className="text-sm text-muted-foreground">AI-powered recommendations based on your goals and market data.</p>
      </div>

      {/* Human advisor booking button */}
      <div className="mt-4">
        <Button 
          variant="link" 
          className="px-0 text-sm" 
          onClick={() => {
            if (onBookHuman) {
              onBookHuman();
            } else {
              setIsBookingModalOpen(true);
            }
          }}
        >
          Prefer a 15-min human advisor?
        </Button>
      </div>

      {/* Consultation Booking Modal */}
      <ConsultationBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        service={advisoryService}
        onBookingConfirmed={handleBookingConfirmed}
      />
    </div>
  );
}