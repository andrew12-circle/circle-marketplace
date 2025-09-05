import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Loader2, LinkIcon } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// shadcn/ui components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// Types & Schema
const yesNo = z.enum(["yes", "no"]);

const PersonalMarketSchema = z.object({
  role: z.enum(["solo", "team_lead", "team_member", "broker_owner"]).optional(),
  markets: z.string().min(2, "Enter your city/area"),
  niche: z.string().optional(),
  avgPriceMarket: z.string().optional(),
});

const ProductionSchema = z.object({
  txLast12: z.string().optional(),
  volumeLast12: z.string().optional(),
  avgSalePrice: z.string().optional(),
  buyerSellerRatio: z.string().optional(),
  topLeadSources: z.string().optional(),
});

const GoalsSchema = z.object({
  productionGoal: z.string().optional(),
  lifestyleGoal: z.string().optional(),
  nicheGoals: z.string().optional(),
});

const DISCSchema = z.object({
  knowsDisc: yesNo.default("no"),
  discType: z.enum(["D","I","S","C","DI","ID","IS","SI","SC","CS","CD","DC"]).optional(),
  wantsToTakeDisc: yesNo.default("no"),
  discStatus: z.enum(["not_started","in_progress","completed"]).default("not_started"),
  discExternalLink: z.string().optional(),
  discScores: z
    .object({ D: z.number().optional(), I: z.number().optional(), S: z.number().optional(), C: z.number().optional() })
    .optional(),
});

export type QuestionnairePayload = z.infer<typeof PersonalMarketSchema>
  & z.infer<typeof ProductionSchema>
  & z.infer<typeof GoalsSchema> & { disc?: z.infer<typeof DISCSchema> };

// Storage Layer
async function loadDraft(userId: string): Promise<Partial<QuestionnairePayload> | null> {
  try {
    const { data, error } = await supabase.functions.invoke('questionnaire-load');
    if (error) throw error;
    return data.data || null;
  } catch (error) {
    console.error('Error loading draft:', error);
    return null;
  }
}

async function saveDraft(userId: string, data: Partial<QuestionnairePayload>) {
  try {
    const { error } = await supabase.functions.invoke('questionnaire-save', {
      body: { data, completed: false }
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving draft:', error);
    return false;
  }
}

async function finalizeSubmission(userId: string, data: QuestionnairePayload) {
  try {
    const { error } = await supabase.functions.invoke('questionnaire-save', {
      body: { data, completed: true }
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error finalizing submission:', error);
    return false;
  }
}

async function getDiscStatus(userId: string): Promise<Partial<z.infer<typeof DISCSchema>>> {
  try {
    const { data, error } = await supabase.functions.invoke('disc-status');
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting DISC status:', error);
    return { knowsDisc: "no", discStatus: "not_started" } as any;
  }
}

async function createDiscLink(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('disc-start');
    if (error) throw error;
    return data.url;
  } catch (error) {
    console.error('Error creating DISC link:', error);
    return "#";
  }
}

// UI Helpers
const steps = [
  { key: "personal", label: "Profile" },
  { key: "production", label: "Production" },
  { key: "goals", label: "Goals" },
  { key: "disc", label: "DISC" },
  { key: "review", label: "Review & Submit" },
] as const;

function StepBadge({ index, active, done }: { index: number; active: boolean; done: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-2xl text-sm",
      active ? "bg-primary text-primary-foreground" : done ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
    )}>
      {done ? <Check className="h-4 w-4" /> : <span className="h-2 w-2 rounded-full bg-current" />}
      <span>{steps[index].label}</span>
    </div>
  );
}

// Main Component
export default function AgentQuestionnaire({ onComplete }: { onComplete?: (data: QuestionnairePayload) => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disc, setDisc] = useState<z.infer<typeof DISCSchema>>({ knowsDisc: "no", discStatus: "not_started" } as any);
  const [form, setForm] = useState<Partial<QuestionnairePayload>>({});

  useEffect(() => {
    if (!user) return;
    
    (async () => {
      const draft = await loadDraft(user.id);
      const discInfo = await getDiscStatus(user.id);
      setForm(draft ?? {});
      setDisc({ 
        knowsDisc: discInfo.knowsDisc ?? "no", 
        discStatus: discInfo.discStatus ?? "not_started", 
        discType: (discInfo as any).discType, 
        discScores: (discInfo as any).discScores, 
        discExternalLink: (discInfo as any).discExternalLink 
      });
      setLoading(false);
    })();
  }, [user]);

  const progress = useMemo(() => Math.round(((current + 1) / steps.length) * 100), [current]);

  async function handleNext() {
    if (!user) return;
    
    setSaving(true);
    const success = await saveDraft(user.id, { ...form, disc });
    setSaving(false);
    
    if (success) {
      setCurrent((c) => Math.min(c + 1, steps.length - 1));
    } else {
      toast({
        title: "Save failed",
        description: "Unable to save progress. Please try again.",
        variant: "destructive"
      });
    }
  }

  function handleBack() {
    setCurrent((c) => Math.max(c - 1, 0));
  }

  async function handleSubmit() {
    if (!user) return;
    
    setSaving(true);
    const payload = { ...form, disc } as QuestionnairePayload;
    const success = await finalizeSubmission(user.id, payload);
    setSaving(false);
    
    if (success) {
      toast({
        title: "Questionnaire submitted!",
        description: "Your profile has been saved and recommendations are being generated."
      });
      onComplete?.(payload);
    } else {
      toast({
        title: "Submission failed",
        description: "Unable to submit questionnaire. Please try again.",
        variant: "destructive"
      });
    }
  }

  function update<K extends keyof QuestionnairePayload>(key: K, value: QuestionnairePayload[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Please sign in to access the questionnaire.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Loading your questionnaire...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg border-0">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Let's set your goals</CardTitle>
            <div className="text-sm text-muted-foreground">Autosaves as you go</div>
          </div>
          <Progress value={progress} />
          <div className="flex flex-wrap gap-2 pt-2">
            {steps.map((_, i) => (
              <StepBadge key={i} index={i} active={i === current} done={i < current} />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {current === 0 && (
                <Section title="Personal & Market Profile" subtitle="Give us a quick snapshot of your role and market.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Role</Label>
                      <Select onValueChange={(v) => update("role" as any, v)} defaultValue={(form as any).role}>
                        <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solo">Solo agent</SelectItem>
                          <SelectItem value="team_lead">Team lead</SelectItem>
                          <SelectItem value="team_member">Team member</SelectItem>
                          <SelectItem value="broker_owner">Broker/Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <LabeledInput label="Location / Territory" placeholder="e.g., Franklin, TN · Williamson County" value={(form as any).markets || ""} onChange={(v)=>update("markets" as any, v)} />
                    <LabeledInput label="Primary niche" placeholder="Luxury, first-time buyers, investors, relocation, etc." value={(form as any).niche || ""} onChange={(v)=>update("niche" as any, v)} />
                    <LabeledInput label="Average home price in your market" placeholder="$—" value={(form as any).avgPriceMarket || ""} onChange={(v)=>update("avgPriceMarket" as any, v)} />
                  </div>
                </Section>
              )}

              {current === 1 && (
                <Section title="Current Production" subtitle="Last 12 months — ballparks are fine.">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledInput label="# of transactions" value={(form as any).txLast12 || ""} onChange={(v)=>update("txLast12" as any, v)} />
                    <LabeledInput label="Total volume closed" value={(form as any).volumeLast12 || ""} onChange={(v)=>update("volumeLast12" as any, v)} />
                    <LabeledInput label="Average sale price" value={(form as any).avgSalePrice || ""} onChange={(v)=>update("avgSalePrice" as any, v)} />
                    <LabeledInput label="Buyer : Seller ratio (%)" placeholder="e.g., 60 : 40" value={(form as any).buyerSellerRatio || ""} onChange={(v)=>update("buyerSellerRatio" as any, v)} />
                    <LabeledTextarea className="md:col-span-2" label="Top lead sources" placeholder="Referrals, online leads, open houses, SOI, etc." value={(form as any).topLeadSources || ""} onChange={(v)=>update("topLeadSources" as any, v)} />
                  </div>
                </Section>
              )}

              {current === 2 && (
                <Section title="Goals" subtitle="What does success look like this year?">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <LabeledInput label="Production goal (transactions or GCI)" value={(form as any).productionGoal || ""} onChange={(v)=>update("productionGoal" as any, v)} />
                    <LabeledTextarea label="Lifestyle goal" value={(form as any).lifestyleGoal || ""} onChange={(v)=>update("lifestyleGoal" as any, v)} />
                    <LabeledTextarea className="md:col-span-2" label="Niche goals" value={(form as any).nicheGoals || ""} onChange={(v)=>update("nicheGoals" as any, v)} />
                  </div>
                </Section>
              )}

              {current === 3 && (
                <Section title="DISC Profile" subtitle="Tell us what you know — or take a quick assessment.">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between py-3 px-4 bg-muted rounded-xl">
                      <div>
                        <div className="font-medium">Do you already know your DISC type?</div>
                        <div className="text-sm text-muted-foreground">If yes, select it below. If not, take a quick test.</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="knows">I know it</Label>
                        <Switch id="knows" checked={disc.knowsDisc === "yes"} onCheckedChange={(c)=> setDisc((d)=>({...d, knowsDisc: c?"yes":"no"}))} />
                      </div>
                    </div>

                    {disc.knowsDisc === "yes" && (
                      <div>
                        <Label>My DISC type</Label>
                        <Select value={disc.discType} onValueChange={(v)=> setDisc((d)=>({...d, discType: v as any}))}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {["D","I","S","C","DI","ID","IS","SI","SC","CS","CD","DC"].map(t=> (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <Separator />

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted rounded-xl">
                      <div>
                        <div className="font-medium">Don't know it? Take the DISC test.</div>
                        <div className="text-sm text-muted-foreground">We'll open a short assessment in a new tab. Your results will sync back automatically.</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={async ()=>{
                            if (!user) return;
                            const url = await createDiscLink(user.id);
                            setDisc((d)=>({...d, discStatus: "in_progress", discExternalLink: url }));
                            window.open(url, "_blank");
                          }}
                        >
                          <LinkIcon className="h-4 w-4 mr-2" /> Take DISC
                        </Button>
                        <Button
                          variant="outline"
                          onClick={async ()=>{
                            if (!user) return;
                            const latest = await getDiscStatus(user.id);
                            setDisc((d)=>({...d, ...latest as any }));
                          }}
                        >Refresh status</Button>
                      </div>
                    </div>

                    <div className="text-sm">
                      <div className="font-medium mb-1">Status: <span className={cn(
                        disc.discStatus === "completed" ? "text-green-700" : disc.discStatus === "in_progress" ? "text-yellow-700" : "text-muted-foreground"
                      )}>{disc.discStatus}</span></div>
                      {disc.discType && (
                        <div className="mt-2">Detected type: <span className="font-semibold">{disc.discType}</span></div>
                      )}
                      {disc.discScores && (
                        <div className="mt-2 text-muted-foreground">Scores — D: {disc.discScores.D ?? "-"} · I: {disc.discScores.I ?? "-"} · S: {disc.discScores.S ?? "-"} · C: {disc.discScores.C ?? "-"}</div>
                      )}
                    </div>
                  </div>
                </Section>
              )}

              {current === 4 && (
                <Section title="Review & Submit" subtitle="Quick pass before we generate your plan.">
                  <div className="space-y-4 text-sm">
                    <div className="text-muted-foreground">You can submit now — anything missing can be completed later.</div>
                    <Button onClick={handleSubmit} className="w-full md:w-auto">
                      {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Submit & Generate Plan
                    </Button>
                  </div>
                </Section>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack} disabled={current === 0}>
              <ChevronLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div className="flex items-center gap-3">
              {saving && <span className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>}
              {current < steps.length - 1 ? (
                <Button onClick={handleNext}>
                  Next <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Finish
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Subcomponents
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder, className }: { label: string; value: string; onChange: (v: string)=>void; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}

function LabeledTextarea({ label, value, onChange, placeholder, className }: { label: string; value: string; onChange: (v: string)=>void; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1 block">{label}</Label>
      <Textarea value={value} placeholder={placeholder} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}