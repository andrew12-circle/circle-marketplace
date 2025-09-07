import React, { useRef, useState } from "react";
import EnhancedChat from "./EnhancedChat";
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
  Paperclip,
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
  role: "system" | "user" | "assistant" | "typing";
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
  const [isFromSearchQuery, setIsFromSearchQuery] = useState(false);
  const [pending, setPending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [isSmartChatOpen, setIsSmartChatOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  async function startConversation(initialTopic: string) {
    console.log('🚀 Starting simple conversation with topic:', initialTopic);
    
    setTopic(initialTopic);
    setIsChatOpen(true);
    setIsChatMinimized(false);
    setPending(false);

    // Create simple working chat
    setSessionId('simple-chat');
    setCurrentStep('welcome');
    
    setMessages([
      { 
        role: "assistant", 
        content: `Hello! I'm your AI assistant. I can help you with ${initialTopic} or discuss anything else you'd like. What can I help you with?` 
      }
    ]);
    
    setQuickReplies([
      `What's the best ${initialTopic} solution?`,
      "Show me pricing options",
      "How do I get started?"
    ]);
    
    console.log('✅ Simple chat started successfully');
  }

  async function startConversationFromQuery(userQuery: string) {
    setPending(true);
    setSessionId('simple-chat'); // Simple session ID

    try {
      // Add user message to chat
      setMessages(prev => [...prev, { role: "user", content: userQuery }]);
      
      // Call simple OpenAI chat
      const { data, error } = await supabase.functions.invoke('simple-openai-chat', {
        body: { 
          message: userQuery,
          context: {
            messageCount: messages.length,
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) throw error;

      const aiResponse = data?.message || "I'd be happy to help with that! Can you tell me more?";
      await typeOutReply(aiResponse, 22);
      
    } catch (error: any) {
      console.error('Error starting conversation from query:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to start conversation",
        variant: "destructive"
      });
      await typeOutReply("Sorry — I couldn't connect right now. Try again in a moment.", 22);
    } finally {
      setPending(false);
    }
  }

  // Add messages with realistic human-like delays
  async function addMessagesWithDelay(messages: any[]) {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      
      if (i > 0) {
        // Add delay before each message (except the first user message)
        const delay = message.role === 'assistant' 
          ? Math.max(1500, message.content.length * 30) // 30ms per character, minimum 1.5s
          : 500; // Short delay for user messages
        
        // Show typing indicator for assistant messages
        if (message.role === 'assistant') {
          setMessages(prev => [...prev, { role: "typing", content: "..." }]);
          await new Promise(resolve => setTimeout(resolve, delay));
          // Remove typing indicator
          setMessages(prev => prev.slice(0, -1));
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Add the actual message
      setMessages(prev => [...prev, {
        role: message.role as "user" | "assistant",
        content: message.content
      }]);
      
      // Small pause after adding message
      await new Promise(resolve => setTimeout(resolve, 200));
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
    console.log('🚀 sendMessage called with:', text);
    if (!text.trim()) {
      console.log('❌ Empty message, returning');
      return;
    }
    
    // Show the user's message immediately
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setPending(true);
    
    try {
      console.log('💬 Sending message to OpenAI:', text);
      
      // Call Circle Concierge system
      const { data, error } = await supabase.functions.invoke('concierge-respond', {
        body: {
          user_id: user?.id || null,
          thread_id: sessionId || 'simple-chat',
          text
        }
      });

      if (error) throw error;
      
      const aiResponse = data?.message || "I'd be happy to help with that! Can you tell me more?";
      await typeOutReply(aiResponse, 22);
      
      // Handle quick replies if available
      if (data?.quick_replies) {
        setQuickReplies(data.quick_replies);
      }
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
      await typeOutReply("Sorry — I couldn't connect right now. Try again in a moment.", 22);
    } finally {
      setPending(false);
      setIsFromSearchQuery(false); // Reset flag after message processing
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // File handling functions
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  function openChatFromSearch() {
    if (!query.trim()) return;
    const q = query;
    setQuery("");
    
    // Ensure chat opens expanded
    console.log('🔄 Opening chat expanded from search');
    setIsFromSearchQuery(true);
    setIsChatOpen(true);
    setIsChatMinimized(false);
    
    // Set up new session for search query
    setSessionId('search-' + Date.now());
    setMessages([]);
    setTopic(null);
    setQuickReplies([]);
    setServices([]);
    setCurrentStep("welcome");
    
    // Start conversation and let AI respond to the user's question
    // The startConversationFromQuery function will handle adding the message
    startConversationFromQuery(q);
  }

  function scrollToMarketplace() {
    // Minimize chat first
    console.log('🔽 Minimizing chat from scrollToMarketplace');
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
    <div className="min-h-[100dvh] bg-background">
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
                <Button
                  variant="default"
                  className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                  aria-label="Open Smart Chat"
                  onClick={() => {
                    if (query.trim()) {
                      setIsSmartChatOpen(true);
                    } else {
                      setIsSmartChatOpen(true);
                    }
                  }}
                >
                  <Brain className="h-5 w-5 text-white" />
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

      {/* Minimized chat icon - shows when chat is minimized */}
      {isChatOpen && isChatMinimized && (
        <div className="fixed bottom-4 left-4 z-50">
          <Button
            onClick={() => setIsChatMinimized(false)}
            className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-lg animate-[pulse_3s_ease-in-out_infinite]"
            size="icon"
          >
            <Brain className="h-12 w-12 text-white" />
          </Button>
        </div>
      )}

      {/* Chat Sheet - Fixed position when minimized */}
      <Sheet open={isChatOpen && !isChatMinimized} onOpenChange={(open) => {
        if (!open) {
          setIsChatOpen(false);
          setIsChatMinimized(false);
        }
      }}>
        <SheetContent 
          side="bottom" 
          className="p-0 border-0 h-[80vh] bg-transparent"
        >
          {/* Full chat interface */}
          <div className="w-full h-full flex items-end justify-center pb-6">
              <div className="w-full max-w-[640px] h-[74vh] bg-white border rounded-2xl shadow-xl flex flex-col overflow-hidden relative">
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => {
                      // Prevent auto-minimization if chat was opened from search query
                      if (isFromSearchQuery) {
                        console.log('🚫 Preventing auto-minimize during search query');
                        return;
                      }
                      console.log('🔽 Minimizing chat from minimize button');
                      setIsChatMinimized(true);
                    }}
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
                            : m.role === "typing" 
                            ? "bg-gray-100 shadow border animate-pulse" 
                            : "bg-white shadow border")
                        }
                      >
                        {m.role === "typing" ? (
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        ) : (
                          m.content
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Removed thinking indicator */}
                  
                  {/* Service Recommendations */}
                  {services.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mt-4">
                      <h4 className="font-semibold text-sm mb-3 text-blue-900">Recommended Services</h4>
                      <div className="space-y-3">
                        {services.slice(0, 3).map((service, i) => (
                          <div key={service.id || i} className="bg-white border border-blue-100 rounded-lg p-3 hover:bg-blue-50/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-medium text-sm text-gray-900">{service.title}</h5>
                                <p className="text-xs text-gray-600 mt-1">{service.vendors?.name || 'Circle Partner'}</p>
                                {service.description && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {service.description.substring(0, 80)}...
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-3">
                                <p className="text-sm font-semibold text-blue-600">
                                  {service.pro_price || service.retail_price || 'Contact'}
                                </p>
                                <p className="text-xs text-gray-500">Circle Pro</p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-3">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs h-7 px-3"
                                onClick={() => window.open(`https://circle.com/marketplace/service/${service.id}`, '_blank')}
                              >
                                View Details
                              </Button>
                              <Button 
                                size="sm" 
                                className="text-xs h-7 px-3"
                                onClick={() => sendMessage(`Tell me more about ${service.title}`)}
                              >
                                Ask About This
                              </Button>
                            </div>
                          </div>
                        ))}
                        {services.length > 3 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-xs mt-2"
                            onClick={() => sendMessage('Show me all options')}
                          >
                            See {services.length - 3} more options
                          </Button>
                        )}
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
                            onClick={() => {
                              console.log('🔽 Minimizing chat from minimize & browse button');
                              setIsChatMinimized(true);
                            }}
                          >
                            Minimize & Browse
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <SheetFooter className="px-4 pb-4 pt-2">
                  <div className="w-full space-y-2">
                    {/* File upload area */}
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                        className="hidden"
                        multiple
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-8"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      {uploadedFiles.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center gap-1 bg-sky-100 text-sky-800 px-2 py-1 rounded text-xs">
                              {file.type.startsWith('image/') ? '🖼️' : '📄'}
                              <span className="max-w-[80px] truncate">{file.name}</span>
                              <button onClick={() => removeFile(index)} className="text-sky-600 hover:text-sky-800">×</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Message input */}
                    <div className="flex items-end gap-2">
                      <Textarea
                        ref={inputRef}
                        placeholder="Ask me anything about real estate, upload images to analyze, or get marketplace insights..."
                        className="min-h-[44px] max-h-40 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            const message = (e.target as HTMLTextAreaElement).value.trim();
                            console.log('🔥 Enter pressed, message:', message);
                            if (message || uploadedFiles.length > 0) {
                              sendMessage(message);
                              (e.target as HTMLTextAreaElement).value = "";
                            }
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
                </div>
                </SheetFooter>
              </div>
            </div>
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

      {/* Enhanced ChatGPT-like AI Assistant */}
      <EnhancedChat 
        isOpen={isSmartChatOpen}
        onClose={() => setIsSmartChatOpen(false)}
        initialMessage={query}
      />
    </div>
  );
}
