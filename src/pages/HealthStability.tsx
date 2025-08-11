import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { performanceMonitor } from '@/utils/performanceMonitor';

interface EdgeFuncStatus { name: string; ok: boolean; ms: number; error?: string }

export default function HealthStability() {
  const [edgeStatus, setEdgeStatus] = useState<EdgeFuncStatus[]>([]);
  const [clientErrorCount24h, setClientErrorCount24h] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const perf = useMemo(() => performanceMonitor.getStats(), []);

  useEffect(() => {
    // SEO
    const title = 'Health & Stability Dashboard';
    const desc = 'System health, errors, performance, and edge function status overview.';
    document.title = title;

    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = desc;
    document.head.appendChild(meta);

    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = window.location.origin + '/health';
    document.head.appendChild(canonical);

    return () => {
      try { document.head.removeChild(meta); } catch {}
      try { document.head.removeChild(canonical); } catch {}
    };
  }, []);

  const checkEdges = async () => {
    setLoading(true);
    const names = ['get-marketplace-data', 'warm-marketplace-cache', 'backup-monitor'];
    const results: EdgeFuncStatus[] = [];

    await Promise.all(names.map(async (name) => {
      const start = performance.now();
      try {
        const { error } = await supabase.functions.invoke(name, { body: { healthcheck: true } });
        results.push({ name, ok: !error, ms: Math.round(performance.now() - start), error: error?.message });
      } catch (e: any) {
        results.push({ name, ok: false, ms: Math.round(performance.now() - start), error: e?.message || 'invoke failed' });
      }
    }));

    setEdgeStatus(results);
    setLoading(false);
  };

  const loadClientErrorCount = async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await (supabase.from as any)('client_errors')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);
    setClientErrorCount24h(count ?? 0);
  };

  useEffect(() => {
    checkEdges();
    loadClientErrorCount();
  }, []);

  return (
    <main className="container mx-auto py-8 px-4 space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Health & Stability</h1>
        <p className="text-muted-foreground">Live status of errors, performance, and edge functions</p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Client Errors (24h)</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="text-3xl font-semibold">{clientErrorCount24h}</div>
            <Badge variant={clientErrorCount24h > 0 ? 'destructive' : 'secondary'}>
              {clientErrorCount24h > 0 ? 'Attention' : 'Clear'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span>{perf.totalRequests} requests</span>
              <span>{perf.successRate}%</span>
            </div>
            <Progress value={perf.successRate} />
            <p className="mt-2 text-xs text-muted-foreground">Avg {perf.averageResponseTime}ms • Cache {perf.cacheHitRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edge Functions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {edgeStatus.map((e) => (
              <div key={e.name} className="flex items-center justify-between text-sm">
                <span className="font-medium">{e.name}</span>
                <span className={e.ok ? 'text-green-600' : 'text-red-600'}>
                  {e.ok ? `OK ${e.ms}ms` : `Fail ${e.ms}ms`}
                </span>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={checkEdges} disabled={loading}>
              {loading ? 'Checking...' : 'Re-check'}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Slowest Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {perf.slowestRequests.length === 0 && (
              <p className="text-sm text-muted-foreground">No request data yet.</p>
            )}
            {perf.slowestRequests.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span>{r.method} {r.endpoint}</span>
                <span className="text-muted-foreground">{Math.round(r.duration)}ms</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
