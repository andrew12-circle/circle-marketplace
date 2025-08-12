import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function BulkFAQGenerator() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [updated, setUpdated] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const appendLog = (msg: string) => setLogs((l) => [msg, ...l].slice(0, 50));

  const runBatch = async (dryRun = false) => {
    setIsRunning(true);
    setProgress(0);
    setUpdated(0);
    setProcessed(0);
    setLogs([]);

    try {
      const limit = 50;
      let offset = 0;
      let totalProcessed = 0;
      let totalUpdated = 0;
      let batchIndex = 0;

      // Loop through all batches until the function reports no more
      // eslint-disable-next-line no-constant-condition
      while (true) {
        batchIndex += 1;
        appendLog(`Running batch ${batchIndex} (limit ${limit}, offset ${offset})...`);

        const { data, error } = await supabase.functions.invoke('bulk-generate-faqs', {
          body: { mode: 'overwrite', limit, offset, dryRun },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const {
          processed: p = 0,
          updated: u = 0,
          nextOffset = offset + limit,
          hasMore = false,
          errors = [],
        } = data || {};

        totalProcessed += p;
        totalUpdated += u;
        offset = nextOffset;

        setProcessed(totalProcessed);
        setUpdated(totalUpdated);

        if (errors.length) {
          appendLog(`Batch ${batchIndex} had ${errors.length} errors`);
        } else {
          appendLog(`Batch ${batchIndex} complete: processed ${p}, updated ${u}`);
        }

        // Update progress roughly (assuming ~150 services)
        const estTotal = 150;
        setProgress(Math.min(100, Math.round((totalProcessed / estTotal) * 100)));

        if (!hasMore || p === 0) break;
      }

      toast({ title: dryRun ? 'Dry Run Complete' : 'FAQ Generation Complete', description: `${totalUpdated} services updated` });
      appendLog('All done.');
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to run generator', variant: 'destructive' });
      appendLog(`Error: ${e.message || e}`);
    } finally {
      setIsRunning(false);
      setProgress(100);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>FAQ Baseline Generator</CardTitle>
        <CardDescription>
          Overwrite and auto-populate the 7-question FAQ for all services. Admin-only. Re-run anytime.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button disabled={isRunning} variant="outline" onClick={() => runBatch(true)}>
            Dry run (no changes)
          </Button>
          <Button disabled={isRunning} onClick={() => runBatch(false)}>
            Generate 7-FAQ Baseline (Overwrite)
          </Button>
        </div>
        <Progress value={progress} />
        <div className="text-sm text-muted-foreground">Processed: {processed} • Updated: {updated}</div>
        {logs.length > 0 && (
          <div className="max-h-40 overflow-auto text-xs">
            <ul className="list-disc pl-4 space-y-1">
              {logs.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
