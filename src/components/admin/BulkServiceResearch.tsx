import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Lightbulb, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DEFAULT_MASTER_PROMPT = `You are the senior research analyst for AgentAdvice.com's premium research team. Generate comprehensive, actionable research for real estate professionals that goes beyond surface-level information.

Your research should mirror the depth and quality of AgentAdvice.com but be even more comprehensive and agent-tier aware. Focus on:

1. **Executive Summary**: Clear, jargon-free overview that answers "What is this and why should I care?"

2. **Who It's Best For**: Segment by agent performance tiers:
   - New Agents (0-10 transactions/year): Focus on foundational tools, cost-effectiveness
   - Rising Agents (11-50 transactions/year): Growth acceleration, efficiency gains
   - Established Agents (51-100 transactions/year): Scale optimization, team building
   - Top 10% Agents (100+ transactions/year): Competitive advantage, market dominance

3. **Where It Works / Where It Fails**: Be brutally honest about limitations, geographic constraints, market dependencies

4. **Performance Benchmarks**: Cite specific metrics, conversion rates, ROI figures with sources

5. **Implementation Plan**: 30/60/90-day milestones with actionable checklists

6. **Pairing & Stack**: What tools/services amplify results when used together

7. **ROI Models**: Conservative, base, and aggressive scenarios with clear assumptions

8. **Budget & Time Investment**: Real cost breakdowns including hidden costs and time commitments

9. **Risks & Compliance**: RESPA considerations, legal implications, potential pitfalls

10. **Geo/Seasonality**: How performance varies by market type and timing

11. **KPIs to Track**: Leading and lagging indicators for success measurement

12. **FAQs & Objections**: Address common concerns and skepticism

13. **Citations**: Include source links and dates for credibility

Write in a professional yet accessible tone. Be data-driven and cite specific examples where possible.`;

export default function BulkServiceResearch() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updated, setUpdated] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Form state
  const [masterPrompt, setMasterPrompt] = useState(DEFAULT_MASTER_PROMPT);
  const [mode, setMode] = useState<'overwrite' | 'missing-only'>('missing-only');
  const [marketIntelligence, setMarketIntelligence] = useState(false);
  const [sources, setSources] = useState('');

  const appendLog = (msg: string) => setLogs((l) => [msg, ...l].slice(0, 50));

  const runBatch = async (dryRun = false) => {
    setIsRunning(true);
    setProgress(0);
    setUpdated(0);
    setProcessed(0);
    setSkipped(0);
    setLogs([]);

    try {
      const limit = 10; // Process 10 services per batch to respect rate limits
      let offset = 0;
      let totalProcessed = 0;
      let totalUpdated = 0;
      let totalSkipped = 0;
      let batchIndex = 0;

      // Parse sources
      const sourceList = sources
        .split(/[\n,]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);

      // Loop through all batches until the function reports no more
      // eslint-disable-next-line no-constant-condition
      while (true) {
        batchIndex += 1;
        appendLog(`🚀 Running batch ${batchIndex} (limit ${limit}, offset ${offset})...`);

        const response = await supabase.functions.invoke('bulk-generate-service-research', {
          body: {
            masterPrompt,
            mode,
            limit,
            offset,
            dryRun,
            marketIntelligence,
            sources: sourceList
          },
        });

        // Detailed logging for debugging
        if (response.error) {
          appendLog(`❌ Edge function error: ${JSON.stringify(response.error)}`);
          throw response.error;
        }

        if (!response.data) {
          appendLog(`❌ No data received from edge function`);
          throw new Error('No data received from edge function');
        }

        if (response.data?.error) {
          appendLog(`❌ Function returned error: ${response.data.error}`);
          throw new Error(response.data.error);
        }

        const {
          processed: p = 0,
          updated: u = 0,
          skipped: s = 0,
          nextOffset = offset + limit,
          hasMore = false,
          errors = [],
        } = response.data || {};

        totalProcessed += p;
        totalUpdated += u;
        totalSkipped += s;
        offset = nextOffset;

        setProcessed(totalProcessed);
        setUpdated(totalUpdated);
        setSkipped(totalSkipped);

        if (errors.length) {
          appendLog(`⚠️ Batch ${batchIndex} had ${errors.length} errors`);
          errors.forEach((error: string) => appendLog(`   ${error}`));
        } else {
          appendLog(`✅ Batch ${batchIndex} complete: processed ${p}, updated ${u}, skipped ${s}`);
        }

        // Update progress roughly (assuming ~200 services)
        const estTotal = 200;
        setProgress(Math.min(100, Math.round((totalProcessed / estTotal) * 100)));

        if (!hasMore || p === 0) break;

        // Small delay between batches to be respectful to rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      toast({ 
        title: dryRun ? 'Dry Run Complete' : 'Research Generation Complete', 
        description: `${totalUpdated} services updated, ${totalSkipped} skipped` 
      });
      appendLog(`🎉 All done! Generated research for ${totalUpdated} services.`);
    } catch (e: any) {
      console.error('Batch generation error:', e);
      const errorMessage = e.message || e.toString() || 'Failed to run research generator';
      toast({ 
        title: 'Error', 
        description: errorMessage, 
        variant: 'destructive' 
      });
      appendLog(`❌ Error: ${errorMessage}`);
      
      // Preserve UI state on error - don't reset progress
      setIsRunning(false);
    } finally {
      // Only reset if we completed successfully
      if (!isRunning) {
        setProgress(100);
      }
    }
  };

  const resetToDefaults = () => {
    setMasterPrompt(DEFAULT_MASTER_PROMPT);
    setMode('missing-only');
    setMarketIntelligence(false);
    setSources('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          Bulk AI Research Generator
        </CardTitle>
        <CardDescription>
          Generate comprehensive, agent-tier aware research for all services using AI. 
          Creates deep research entries that mirror AgentAdvice.com quality but better.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Master Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="masterPrompt" className="text-sm font-medium">Master Research Prompt</Label>
            <Button 
              type="button"
              variant="ghost" 
              size="sm" 
              onClick={resetToDefaults}
              className="text-xs"
            >
              Reset to Default
            </Button>
          </div>
          <Textarea
            id="masterPrompt"
            value={masterPrompt}
            onChange={(e) => setMasterPrompt(e.target.value)}
            placeholder="Enter the master prompt that will guide research generation..."
            className="min-h-[200px] text-xs font-mono"
            disabled={isRunning}
          />
          <p className="text-xs text-muted-foreground">
            This prompt defines the research structure and quality expectations. 
            The default is optimized for agent-tier segmentation and ROI focus.
          </p>
        </div>

        <Separator />

        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="mode">Generation Mode</Label>
            <Select value={mode} onValueChange={(value: 'overwrite' | 'missing-only') => setMode(value)} disabled={isRunning}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="missing-only">Missing Only (Safe)</SelectItem>
                <SelectItem value="overwrite">Overwrite Existing</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {mode === 'missing-only' 
                ? 'Only generates research for services without existing research entries'
                : 'Replaces existing research entries (destructive)'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="marketIntelligence"
                checked={marketIntelligence}
                onCheckedChange={setMarketIntelligence}
                disabled={isRunning}
              />
              <Label htmlFor="marketIntelligence" className="text-sm">
                Market Intelligence <Badge variant="outline" className="text-xs">Future</Badge>
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Web-grounded research using Perplexity and Firecrawl (requires additional API keys)
            </p>
          </div>
        </div>

        {/* Sources */}
        <div className="space-y-2">
          <Label htmlFor="sources">Reference Sources (Optional)</Label>
          <Textarea
            id="sources"
            value={sources}
            onChange={(e) => setSources(e.target.value)}
            placeholder="Enter URLs or notes to bias research towards (one per line)&#10;https://agentadvice.com/research/lead-generation&#10;https://narrealtor.org/best-practices&#10;Internal competitive analysis notes..."
            className="min-h-[80px] text-xs"
            disabled={isRunning}
          />
          <p className="text-xs text-muted-foreground">
            Optional URLs, documents, or notes that will be referenced during research generation
          </p>
        </div>

        <Separator />

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              type="button"
              disabled={isRunning} 
              variant="outline" 
              onClick={() => runBatch(true)}
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Dry Run (Preview)
            </Button>
            <Button 
              type="button"
              disabled={isRunning} 
              onClick={() => runBatch(false)}
              className="flex items-center gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              Generate Research
            </Button>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Research generation uses OpenAI GPT-5 and may take several minutes for large batches. 
              Each service gets comprehensive research covering agent tiers, ROI models, implementation plans, and compliance considerations.
            </AlertDescription>
          </Alert>
        </div>

        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Processing services...</span>
              <span>{progress}%</span>
            </div>
          </div>
        )}

        {/* Stats */}
        {(processed > 0 || updated > 0 || skipped > 0) && (
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="outline">Processed: {processed}</Badge>
            <Badge variant="default">Updated: {updated}</Badge>
            <Badge variant="secondary">Skipped: {skipped}</Badge>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Generation Log</Label>
            <div className="max-h-60 overflow-auto bg-slate-50 rounded-md p-3 text-xs font-mono space-y-1">
              {logs.map((log, i) => (
                <div key={i} className="text-slate-700">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-900">Post-Generation Workflow</h4>
              <div className="text-xs text-blue-800 space-y-1">
                <p>• Generated research appears in Services → AI Research tab</p>
                <p>• Review and edit entries using the Service AI Research Editor</p>
                <p>• Research automatically boosts Concierge recommendations</p>
                <p>• Each entry includes agent-tier segmentation and ROI models</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}