import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, TrendingUp, Clock } from 'lucide-react';

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  vendor_confirmed: number;
  vendor_declined: number;
  cancelled: number;
  completed: number;
  today: number;
  this_week: number;
}

interface BookingSummaryStatsProps {
  stats: BookingStats;
}

export const BookingSummaryStats: React.FC<BookingSummaryStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="flex gap-1 mt-2">
            <Badge variant="secondary" className="text-xs">
              {stats.pending} pending
            </Badge>
            <Badge variant="outline" className="text-xs">
              {stats.vendor_confirmed} confirmed
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.today}</div>
          <p className="text-xs text-muted-foreground">New bookings today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.this_week}</div>
          <p className="text-xs text-muted-foreground">Bookings this week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.vendor_declined + stats.pending}
          </div>
          <div className="flex gap-1 mt-2">
            <Badge variant="destructive" className="text-xs">
              {stats.vendor_declined} declined
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {stats.pending} pending
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};