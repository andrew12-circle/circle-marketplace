import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
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
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
        className={`h-16 w-16 rounded-full shadow-md grid place-items-center ${color} ring-1 ring-black/5 hover:ring-2 hover:ring-current transition`}>
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <span className="text-sm font-medium text-center max-w-[8rem] leading-tight">
        {label}
      </span>
    </motion.button>
  );
}

// Build a fresh system prompt based on the chosen topic (avoids stale state)
function getSystemForTopic(t: string) {
  const base =
    "You are an Agent Concierge for Circle. Give clear, vendor-agnostic advice first, then recommend SKUs available in the Circle Marketplace with pros/cons, who it's best for, and price ranges. Avoid cold calls and hype. If user mentions city, tailor examples.";
  switch (t) {
    case "CRM":
      return (
        base +
        " Focus on real-estate CRMs (e.g., Follow Up Boss, kvCORE, Lofty, LionDesk, Real Geeks CRM if applicable). Map options by production level (0-12, 12-36, 36-100, 100+ deals/year), team vs solo, budget, and integrations (IDX, dialer, texting)."
      );
    case "Marketing Tools":
      return base + " Cover design tools, ads, landing pages, video, and automation; anchor to top-performer stacks.";
    case "Lead Generation":
      return base + " Compare paid leads vs. sphere expansion; emphasize ROI tracking and local proof.";
    case "Real Estate Schools":
      return base + " Provide licensing steps and reputable schools by state (avoid legal advice).";
    case "Licensing":
      return base + " Outline steps, timelines, costs, and reciprocity basics; link to Marketplace where relevant.";
    case "Coaching":
      return base + " Match coaching companies and programs to goals, schedule, and budget.";
    case "Marketplace":
      return base + " Help the user find the right vendors and bundles; explain member pricing.";
    default:
      return base;
  }
}

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function NeedAdviceHome() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  async function startConversation(initialTopic: string) {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to start your growth planning session.",
        variant: "destructive"
      });
      return;
    }

    setTopic(initialTopic);
    setIsChatOpen(true);
    setIsChatMinimized(false); // Start expanded by default
    setPending(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-concierge-chat', {
        body: { action: 'start' }
      });

      if (error) throw error;

      setSessionId(data.sessionId);
      setCurrentStep(data.step);
      setQuickReplies(data.quickReplies || []);
      setMessages([
        { role: "system", content: getSystemForTopic(initialTopic) },
        { role: "assistant", content: data.message }
      ]);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to start conversation",
        variant: "destructive"
      });
    } finally {
      setPending(false);
    }
  }

  // Typewriter animation for assistant replies
  function typeOutReply(fullText: string, speedMs = 18) {
    return new Promise<void>((resolve) => {
      // Create an empty assistant message we will fill
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
      let i = 0;
      const id = setInterval(() => {
        i += 1;
        setMessages((prev) => {
          const arr = [...prev];
          // Replace the last message with progressively more text
          const last = arr.length - 1;
          if (arr[last]) {
            arr[last] = { role: "assistant", content: fullText.slice(0, i) };
          }
          return arr;
        });
        if (i >= fullText.length) {
          clearInterval(id);
          resolve();
        }
      }, speedMs);
    });
  }

  async function sendMessage(text: string) {
    if (!text.trim() || !sessionId) return;
    
    // Show the user's message immediately
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setPending(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-concierge-chat', {
        body: {
          action: 'respond',
          sessionId,
          message: text,
          stepName: currentStep
        }
      });

      if (error) throw error;

      if (data.isComplete && messages.length > 2) {
        // Only auto-complete if we've had a real conversation (more than just initial message)
        setIsComplete(true);
        setPlan(data.plan);
        setQuickReplies([]);
        // Show completion message
        await typeOutReply("Great! I've created a personalized plan for you. You can find related services in our marketplace below. Let me scroll you down to see what's available.", 22);
        
        // Auto-scroll to marketplace after short delay, but keep chat expanded
        setTimeout(() => {
          const marketplaceSection = document.querySelector('[data-testid="marketplace-grid"]') || 
                                    document.querySelector('.marketplace-grid') ||
                                    document.querySelector('#marketplace');
          if (marketplaceSection) {
            marketplaceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
          }
        }, 2000);
      } else {
        // Continue conversation
        setCurrentStep(data.step);
        setQuickReplies(data.quickReplies || []);
        setPending(false);
        await typeOutReply(data.message, 22);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
      await typeOutReply("Sorry — I couldn't reach the concierge service. Try again in a moment.", 22);
    } finally {
      setPending(false);
      if (inputRef.current) inputRef.current.focus();
    }
  }

  function openChatFromSearch() {
    if (!query.trim()) return;
    const q = query;
    setQuery("");
    // Default to CRM flow for search-bar questions
    startConversation("CRM").then(() => {
      // Give React a tick to apply the conversation state, then send the user's message
      setTimeout(() => sendMessage(q), 100);
    });
  }

  function scrollToMarketplace() {
    // Minimize chat first
    setIsChatMinimized(true);
    
    // Scroll to marketplace section
    setTimeout(() => {
      const marketplaceSection = document.querySelector('[data-testid="marketplace-grid"]') || 
                                document.querySelector('.marketplace-grid') ||
                                document.querySelector('#marketplace');
      if (marketplaceSection) {
        marketplaceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        // If no specific marketplace section found, scroll down to show services
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
      }
    }, 300);
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
        setTimeout(() => openChatFromSearch(), 500);
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
      if (inputRef.current) inputRef.current.value = transcript;
      // Auto-send the transcript for a hands-free feel
      sendMessage(transcript);
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
    <div className="min-h-[100dvh] bg-gradient-to-b from-white to-slate-50">
      {/* Header / Logo */}
      <header className="pt-20 pb-8 flex flex-col items-center select-none">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-5xl font-semibold tracking-tight flex items-center gap-3"
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
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openChatFromSearch();
                  }}
                  placeholder="Search or ask us anything…"
                  className="h-14 pl-12 pr-24 rounded-full shadow-sm"
                />
                <Button
                  variant="ghost"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-10 w-10"
                  aria-label="Voice input"
                  onClick={() => {
                    if (query.trim()) {
                      openChatFromSearch();
                    } else {
                      toggleSearchMicrophone();
                    }
                  }}
                >
                  {isRecording ? <MicOff className="h-5 w-5 text-red-500" /> : <Mic className="h-5 w-5" />}
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
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-y-10 gap-x-6 justify-items-center"
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
      <footer className="mt-16 pb-10 flex justify-center">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Advice powered by curated data and AI
        </div>
      </footer>

      {/* Chat Sheet - Fixed position when minimized */}
      <Sheet open={isChatOpen} onOpenChange={(open) => {
        if (!open) {
          setIsChatOpen(false);
          setIsChatMinimized(false);
        }
      }}>
        <SheetContent 
          side="bottom" 
          className={`p-0 border-0 transition-all duration-300 ${
            isChatMinimized 
              ? 'h-16 bg-white/95 backdrop-blur-sm' 
              : 'h-[80vh] bg-transparent'
          }`}
        >
          {isChatMinimized ? (
            // Minimized chat bar
            <div className="h-16 flex items-center justify-between px-4 mx-0 sm:mx-6 md:mx-12 lg:mx-24 xl:mx-32 bg-white border-t shadow-lg rounded-t-lg sm:rounded-t-xl">
              <div className="flex items-center gap-3">
                <Brain className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-medium">Agent Concierge — {topic}</span>
                {pending && <div className="text-xs text-muted-foreground">Thinking...</div>}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChatMinimized(false)}
                  className="text-xs"
                >
                  Expand
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            // Full chat interface
            <div className="w-full h-full flex items-end justify-center pb-6">
              <div className="w-full max-w-[640px] h-[74vh] bg-white border rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setIsChatMinimized(true)}
                    aria-label="Minimize chat"
                  >
                    ─
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setIsChatOpen(false)}
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <SheetHeader className="pt-4 px-4">
                  <SheetTitle className="text-base text-center pr-20 flex items-center justify-center gap-2">
                    <Brain className="h-4 w-4 text-sky-600" />
                    Agent Concierge — {topic || "Conversation"}
                  </SheetTitle>
                </SheetHeader>

                <div className="px-4 mt-2 space-y-3 overflow-y-auto flex-1">
                  {messages.filter(m => m.role !== 'system').map((m, i) => (
                    <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                      <div
                        className={
                          "inline-block rounded-2xl px-4 py-2 text-sm max-w-[86%] " +
                          (m.role === "user"
                            ? "bg-sky-600 text-white"
                            : "bg-white shadow border")
                        }
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {pending && (
                    <div className="text-left">
                      <div className="inline-block rounded-2xl px-4 py-2 text-sm bg-white shadow border opacity-80 max-w-[86%]">
                        Thinking…
                      </div>
                    </div>
                  )}
                  
                  {/* Quick replies */}
                  {quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {quickReplies.map((reply, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => sendMessage(reply)}
                        >
                          {reply}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Plan completion actions */}
                  {isComplete && plan && (
                    <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-4 mt-4">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Your Growth Plan is Ready!</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            size="sm" 
                            onClick={scrollToMarketplace}
                            className="bg-primary hover:bg-primary/90"
                          >
                            View Recommended Services
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setIsChatMinimized(true)}
                          >
                            Minimize & Browse
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <SheetFooter className="px-4 pb-4 pt-2">
                  <div className="w-full flex items-end gap-2">
                    <Textarea
                      ref={inputRef}
                      placeholder="Type your message…"
                      className="min-h-[44px] max-h-40"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage((e.target as HTMLTextAreaElement).value);
                          (e.target as HTMLTextAreaElement).value = "";
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      className="h-11 w-11"
                      onClick={toggleDictation}
                      title="Voice input"
                      aria-label={isRecording ? "Stop voice input" : "Start voice input"}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={() => {
                        const val = inputRef.current?.value || "";
                        sendMessage(val);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                      className="h-11"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </SheetFooter>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

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