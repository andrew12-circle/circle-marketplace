import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SecureAdminGuard } from '@/components/admin/SecureAdminGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp } from 'lucide-react';

interface TrackingEventRow {
  id: string;
  service_id: string;
  vendor_id: string | null;
  user_id: string | null;
  event_type: 'view' | 'click' | 'booking' | 'purchase' | 'conversion';
  event_data: Record<string, any> | null;
  revenue_attributed: number | null;
  created_at: string;
}

interface ServiceRow { id: string; title: string; vendor_id: string | null; }
interface VendorRow { id: string; name: string | null; circle_commission_percentage: number | null; }

const timeOptions = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
];

export default function AdminCommissions() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [days, setDays] = useState('30');
  const [events, setEvents] = useState<TrackingEventRow[]>([]);
  const [services, setServices] = useState<Record<string, ServiceRow>>({});
  const [vendors, setVendors] = useState<Record<string, VendorRow>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Commissions Tracking | Admin';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const since = new Date();
        since.setDate(since.getDate() - parseInt(days));

        const { data: evData, error: evErr } = await supabase
          .from('service_tracking_events')
          .select('*')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false });
        if (evErr) throw evErr;

        const ev = (evData || []) as any as TrackingEventRow[];
        setEvents(ev);

        const serviceIds = Array.from(new Set(ev.map(e => e.service_id).filter(Boolean)));
        const vendorIds = Array.from(new Set(ev.map(e => e.vendor_id).filter(Boolean))) as string[];

        if (serviceIds.length) {
          const { data: sData } = await supabase
            .from('services')
            .select('id,title,vendor_id')
            .in('id', serviceIds);
          const map: Record<string, ServiceRow> = {};
          (sData || []).forEach((s: any) => (map[s.id] = s));
          setServices(map);
        } else {
          setServices({});
        }

        if (vendorIds.length) {
          const { data: vData } = await supabase
            .from('vendors')
            .select('id,name,circle_commission_percentage')
            .in('id', vendorIds);
          const map: Record<string, VendorRow> = {};
          (vData || []).forEach((v: any) => (map[v.id] = v));
          setVendors(map);
        } else {
          setVendors({});
        }
      } catch (e) {
        console.error('Failed loading commission data', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days]);

  const kpis = useMemo(() => {
    const websiteClicks = events.filter(e => e.event_type === 'click' && (e.event_data?.context === 'vendor_website')).length;
    const uniqueAgents = new Set(events.map(e => e.user_id).filter(Boolean)).size;
    const bookings = events.filter(e => e.event_type === 'booking');
    const purchases = events.filter(e => e.event_type === 'purchase');
    const revenue = purchases.reduce((sum, e) => sum + (e.revenue_attributed || 0), 0);

    // Estimated commission using vendor percentages when available
    const commission = purchases.reduce((sum, e) => {
      const v = e.vendor_id ? vendors[e.vendor_id] : undefined;
      const pct = v?.circle_commission_percentage ?? 0;
      return sum + ((e.revenue_attributed || 0) * (pct / 100));
    }, 0);

    return { websiteClicks, uniqueAgents, bookings: bookings.length, purchases: purchases.length, revenue, commission };
  }, [events, vendors]);

  const breakdownByVendor = useMemo(() => {
    const map: Record<string, { vendor: VendorRow | undefined; clicks: number; bookings: number; purchases: number; revenue: number; commission: number; }>
      = {};
    for (const e of events) {
      const key = e.vendor_id || 'unknown';
      map[key] ||= { vendor: e.vendor_id ? vendors[e.vendor_id] : undefined, clicks: 0, bookings: 0, purchases: 0, revenue: 0, commission: 0 };
      if (e.event_type === 'click' && e.event_data?.context === 'vendor_website') map[key].clicks++;
      if (e.event_type === 'booking') map[key].bookings++;
      if (e.event_type === 'purchase') {
        map[key].purchases++;
        map[key].revenue += (e.revenue_attributed || 0);
        const pct = map[key].vendor?.circle_commission_percentage ?? 0;
        map[key].commission += (e.revenue_attributed || 0) * (pct / 100);
      }
    }
    return Object.entries(map).map(([id, v]) => ({ id, ...v }));
  }, [events, vendors]);

  const breakdownByService = useMemo(() => {
    const map: Record<string, { service: ServiceRow | undefined; clicks: number; bookings: number; purchases: number; revenue: number; }>
      = {};
    for (const e of events) {
      const key = e.service_id;
      map[key] ||= { service: services[key], clicks: 0, bookings: 0, purchases: 0, revenue: 0 };
      if (e.event_type === 'click' && e.event_data?.context === 'vendor_website') map[key].clicks++;
      if (e.event_type === 'booking') map[key].bookings++;
      if (e.event_type === 'purchase') {
        map[key].purchases++;
        map[key].revenue += (e.revenue_attributed || 0);
      }
    }
    return Object.entries(map).map(([id, v]) => ({ id, ...v }));
  }, [events, services]);

  const exportCSV = () => {
    const rows = [['Vendor','Clicks','Bookings','Purchases','Revenue','Commission']];
    breakdownByVendor.forEach(r => rows.push([
      r.vendor?.name || 'Unknown',
      String(r.clicks),
      String(r.bookings),
      String(r.purchases),
      String(r.revenue.toFixed(2)),
      String(r.commission.toFixed(2))
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commissions_${days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user || !profile?.is_admin) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <SecureAdminGuard requireElevatedPrivileges>
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Commissions Tracking</h1>
          <div className="flex items-center gap-3">
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={exportCSV} variant="secondary">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader><CardTitle>Website Clicks</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{kpis.websiteClicks}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Unique Agents</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{kpis.uniqueAgents}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Purchases</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{kpis.purchases}</CardContent>
          </Card>
          <Card>
            <CardHeader className="flex items-center justify-between"><CardTitle>Est. Commission</CardTitle><TrendingUp className="w-4 h-4" /></CardHeader>
            <CardContent className="text-3xl font-bold">${kpis.commission.toFixed(2)}</CardContent>
          </Card>
        </div>

        {/* Breakdown by Vendor */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Vendor Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Est. Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdownByVendor.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.vendor?.name || 'Unknown'}</TableCell>
                    <TableCell>{row.clicks}</TableCell>
                    <TableCell>{row.bookings}</TableCell>
                    <TableCell>{row.purchases}</TableCell>
                    <TableCell>${row.revenue.toFixed(2)}</TableCell>
                    <TableCell>${row.commission.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>Only includes events in the selected time range.</TableCaption>
            </Table>
          </CardContent>
        </Card>

        {/* Breakdown by Service */}
        <Card>
          <CardHeader>
            <CardTitle>Service Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breakdownByService.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{row.service?.title || row.id}</TableCell>
                    <TableCell>{row.clicks}</TableCell>
                    <TableCell>{row.bookings}</TableCell>
                    <TableCell>{row.purchases}</TableCell>
                    <TableCell>${row.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {loading && <p className="mt-6 text-sm text-muted-foreground">Loading data...</p>}
      </div>
    </SecureAdminGuard>
  );
}
