import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { SmartSearchAutocomplete } from "@/components/marketplace/SmartSearchAutocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Sparkles,
  BarChart3,
  Users,
  GraduationCap,
  BadgeCheck,
  Megaphone,
  ShoppingCart,
  Brain,
  PhoneCall,
  Send,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ConsultationBookingModal } from "@/components/marketplace/ConsultationBookingModal";

const categories = [
  { label: "CRM", icon: Users, color: "bg-sky-100 text-sky-600" },
  { label: "Marketing Tools", icon: Megaphone, color: "bg-pink-100 text-pink-600" },
  { label: "Lead Generation", icon: Sparkles, color: "bg-purple-100 text-purple-600" },
  { label: "Real Estate Schools", icon: GraduationCap, color: "bg-green-100 text-green-600" },
  { label: "Licensing", icon: BadgeCheck, color: "bg-orange-100 text-orange-600" },
  { label: "Coaching", icon: BarChart3, color: "bg-indigo-100 text-indigo-600" },
  { label: "Marketplace", icon: ShoppingCart, color: "bg-yellow-100 text-yellow-600" },
];

interface ShortcutProps {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick: () => void;
}

function Shortcut({ label, Icon, color, onClick }: ShortcutProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex flex-col items-center gap-2"
      aria-label={label}
      onClick={onClick}
    >
      <div
        className={`h-12 w-12 md:h-16 md:w-16 rounded-full shadow-md grid place-items-center ${color} ring-1 ring-black/5 hover:ring-2 hover:ring-current transition`}>
        <Icon className="h-5 w-5 md:h-7 md:w-7" aria-hidden />
      </div>
      <span className="text-sm font-medium text-center max-w-[8rem] leading-tight">
        {label}
      </span>
    </motion.button>
  );
}

export default function NeedAdviceHome() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  function startConversation(initialTopic: string) {
    // Special handling for Marketplace - scroll to show categories then services
    if (initialTopic === 'Marketplace') {
      scrollToMarketplaceWithPause();
      return;
    }

    // Trigger the global modal to open with this topic as initial message
    const event = new CustomEvent('openConciergeModal', { 
      detail: { 
        initialMessage: `I need help with ${initialTopic}`,
        expandToken: Date.now()
      }
    });
    window.dispatchEvent(event);
  }

  async function scrollToMarketplaceWithPause() {
    // First scroll to categories
    const categoryBlocks = document.querySelector('[data-section="category-blocks"]');
    if (categoryBlocks) {
      categoryBlocks.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add visual highlight to categories
      categoryBlocks.classList.add('animate-pulse');
      
      // Wait 1.5 seconds to show categories
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Remove highlight
      categoryBlocks.classList.remove('animate-pulse');
      
      // Then scroll to services grid
      const servicesGrid = document.querySelector('#services-grid');
      if (servicesGrid) {
        servicesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  function openChatFromSearch(searchQuery?: string) {
    const queryToUse = searchQuery || query;
    if (!queryToUse.trim()) return;
    
    console.log('🔍 openChatFromSearch called with query:', queryToUse);
    
    // Trigger the global modal to open with this search query
    const event = new CustomEvent('openConciergeModal', { 
      detail: { 
        initialMessage: queryToUse,
        expandToken: Date.now()
      }
    });
    
    console.log('📤 Dispatching openConciergeModal event:', event.detail);
    window.dispatchEvent(event);
    
    // Clear the query state after use
    setQuery("");
  }

  function hasSpeech() {
    if (typeof window === "undefined") return false;
    return (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
  }

  function toggleSearchMicrophone() {
    if (!hasSpeech()) {
      toast({
        title: "Voice not supported",
        description: "Voice input isn't supported in this browser. Try Chrome desktop or Android.",
        variant: "destructive"
      });
      return;
    }
    if (isRecording) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0]?.transcript || "";
        if (i < e.results.length - 1) transcript += " ";
      }
      transcript = transcript.trim();
      setQuery(transcript);
      // Auto-start conversation with the voice input
      if (transcript) {
        openChatFromSearch();
      }
    };
    rec.onerror = () => {
      setIsRecording(false);
    };
    rec.onend = () => {
      setIsRecording(false);
    };
    setIsRecording(true);
    rec.start();
  }

  function toggleDictation() {
    if (!hasSpeech()) {
      toast({
        title: "Voice not supported",
        description: "Voice input isn't supported in this browser. Try Chrome desktop or Android.",
        variant: "destructive"
      });
      return;
    }
    if (isRecording) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0]?.transcript || "";
        if (i < e.results.length - 1) transcript += " ";
      }
      transcript = transcript.trim();
      // Trigger the global modal to open with voice input
      const event = new CustomEvent('openConciergeModal', { 
        detail: { 
          initialMessage: transcript,
          expandToken: Date.now()
        }
      });
      window.dispatchEvent(event);
    };
    rec.onerror = () => {
      setIsRecording(false);
    };
    rec.onend = () => {
      setIsRecording(false);
    };
    setIsRecording(true);
    rec.start();
  }

  // Service object for the booking modal
  const advisoryService = {
    id: '00000000-0000-0000-0000-000000000001',
    title: 'Circle Marketplace Advisory Consultation',
    vendor: {
      name: 'Circle Marketplace Team'
    }
  };

  return (
    <div className="min-h-[calc(100dvh-50px)] bg-background">
      {/* Header / Logo */}
      <header className="pt-6 md:pt-12 pb-4 md:pb-8 flex flex-col items-center select-none">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl md:text-5xl font-semibold tracking-tight flex items-center gap-3"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 to-blue-700">
            Need Advice?
          </span>
          <span className="text-xs uppercase bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-md font-bold tracking-wide">
            Beta
          </span>
        </motion.h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-4xl text-center px-6">
          Built on real purchase data from top agents. Buy most everything at member pricing and choose what actually works. No cold calls. No spam. Clear choices you can trust. Advice you can lean on.
        </p>
      </header>

      {/* Search */}
      <main className="mx-auto max-w-4xl px-6">
        <Card className="border-none shadow-none bg-transparent">
          <CardContent className="p-0">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <Brain className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-600" />
                <SmartSearchAutocomplete
                  placeholder="Search or ask us anything…"
                  onSearch={(query) => openChatFromSearch(query)}
                  className="h-14 pl-12 pr-24 rounded-full shadow-sm placeholder:text-sm md:placeholder:text-base"
                />
                <Button
                  variant="ghost"
                  className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 p-0"
                  onClick={toggleSearchMicrophone}
                  aria-label={isRecording ? "Stop voice input" : "Start voice input"}
                >
                  <Mic className={`h-4 w-4 ${isRecording ? 'text-green-500' : ''}`} />
                </Button>
                <Button
                  variant="default"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                  aria-label="Send message"
                  onClick={() => openChatFromSearch(query)}
                >
                  <Send className="h-5 w-5 text-white" />
                </Button>
              </div>
            </motion.div>

            <div className="mt-3 text-xs text-muted-foreground pl-1">
              Try: <em>best CRM for 20 deals a year</em>
            </div>

            {/* Shortcuts row */}
            <section className="mt-10">
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0, y: 6 },
                  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.04 } },
                }}
                className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-y-10 gap-x-6 justify-items-center"
              >
                {categories.map((c) => (
                  <motion.div
                    key={c.label}
                    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                  >
                    <Shortcut
                      label={c.label}
                      Icon={c.icon}
                      color={c.color}
                      onClick={() => startConversation(c.label)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </section>

            {/* Speak to a human button */}
            <div className="mt-12 flex justify-center">
              <Button
                variant="outline"
                className="rounded-full px-5 py-2 flex items-center gap-2 text-sky-700 border-sky-300 hover:bg-sky-50"
                onClick={() => setIsBookingModalOpen(true)}
              >
                <PhoneCall className="h-5 w-5" />
                Book with an Agent Concierge
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Helper blurb */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          Not sure where to start? Ask something specific like
          <span className="font-medium"> "How do I get to 100 deals a year from 20 in Nashville TN"</span>
          and we will map the proven path based on real agent data
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 pb-4 flex justify-center">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Advice powered by curated data and Live Agent Interviews
        </div>
      </footer>

      {/* Consultation Booking Modal */}
      <ConsultationBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        service={advisoryService}
        onBookingConfirmed={() => {
          setIsBookingModalOpen(false);
          toast({
            title: "Consultation booked!",
            description: "You'll receive a confirmation email shortly.",
          });
        }}
      />
    </div>
  );
}