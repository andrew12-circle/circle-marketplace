import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ServiceRow {
  id: string;
  title: string;
  sort_order: number;
  metrics: {
    total_views: number;
    total_clicks: number;
    total_bookings: number;
    total_purchases: number;
    revenue_attributed: number;
    conversion_rate: number;
  };
}

export function RankImpactMonitor() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: services, error: sErr } = await supabase
          .from('services')
          .select('id, title, sort_order')
          .order('sort_order', { ascending: true })
          .limit(50);
        if (sErr) throw sErr;

        const results: ServiceRow[] = [];
        for (const s of services || []) {
          const { data: metrics, error: mErr } = await supabase
            .rpc('get_service_tracking_metrics', { p_service_id: s.id, p_time_period: '30d' });
          if (mErr) throw mErr;
          const m = (metrics ?? {}) as any;
          results.push({
            id: s.id,
            title: s.title,
            sort_order: s.sort_order,
            metrics: {
              total_views: Number(m?.total_views ?? 0),
              total_clicks: Number(m?.total_clicks ?? 0),
              total_bookings: Number(m?.total_bookings ?? 0),
              total_purchases: Number(m?.total_purchases ?? 0),
              revenue_attributed: Number(m?.revenue_attributed ?? 0),
              conversion_rate: Number(m?.conversion_rate ?? 0),
            },
          });
        }
        setRows(results);
      } catch (e: any) {
        setError(e?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rank Impact Monitor (Top 50)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !error && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">Purchases</TableHead>
                  <TableHead className="text-right">Conv. Rate</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Badge variant="secondary">#{r.sort_order}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate">{r.title}</TableCell>
                    <TableCell className="text-right">{r.metrics.total_views}</TableCell>
                    <TableCell className="text-right">{r.metrics.total_clicks}</TableCell>
                    <TableCell className="text-right">{r.metrics.total_purchases}</TableCell>
                    <TableCell className="text-right">{r.metrics.conversion_rate}%</TableCell>
                    <TableCell className="text-right">${'{'}r.metrics.revenue_attributed.toFixed(2){'}'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RankImpactMonitor;
