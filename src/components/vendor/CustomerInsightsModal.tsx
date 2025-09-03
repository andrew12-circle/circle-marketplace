import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Star,
  DollarSign,
  Clock,
  Briefcase,
  Award,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface CustomerInsight {
  id: string;
  user_name: string;
  location?: string;
  industry?: string;
  company_size?: string;
  total_spent: number;
  services_purchased: number;
  last_activity: string;
  rating_given: number;
  satisfaction_score: number;
}

interface CustomerInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
}

export const CustomerInsightsModal = ({ isOpen, onClose, vendorId }: CustomerInsightsModalProps) => {
  const [customers, setCustomers] = useState<CustomerInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_customers: 0,
    avg_order_value: 0,
    customer_lifetime_value: 0,
    repeat_customers: 0,
    satisfaction_rate: 0,
    top_spending_segment: '',
    growth_rate: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchCustomerInsights();
    }
  }, [isOpen, vendorId]);

  const fetchCustomerInsights = async () => {
    try {
      setLoading(true);
      
      // Fetch customer data based on service bookings and reviews
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('consultation_bookings')
        .select(`
          id,
          user_id,
          service_id,
          booking_date,
          created_at,
          status,
          services (
            title,
            retail_price,
            vendor_id
          ),
          profiles (
            display_name,
            business_name
          )
        `)
        .eq('services.vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      }

      // Fetch reviews data for customer satisfaction
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('service_reviews')
        .select(`
          rating,
          user_id,
          service_id,
          created_at,
          services (
            vendor_id
          ),
          profiles (
            display_name
          )
        `)
        .eq('services.vendor_id', vendorId);

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

      // Process and aggregate customer data
      const customerMap = new Map<string, any>();

      // Process bookings
      (bookingsData || []).forEach((booking: any) => {
        const userId = booking.user_id;
        const userName = booking.profiles?.display_name || booking.profiles?.business_name || 'Anonymous User';
        const price = parseFloat(booking.services?.retail_price || '0');

        if (!customerMap.has(userId)) {
          customerMap.set(userId, {
            id: userId,
            user_name: userName,
            total_spent: 0,
            services_purchased: 0,
            last_activity: booking.created_at,
            rating_given: 0,
            satisfaction_score: 0,
            bookings: []
          });
        }

        const customer = customerMap.get(userId);
        customer.total_spent += price;
        customer.services_purchased += 1;
        customer.bookings.push(booking);
        
        // Update last activity if more recent
        if (new Date(booking.created_at) > new Date(customer.last_activity)) {
          customer.last_activity = booking.created_at;
        }
      });

      // Process reviews for satisfaction data
      (reviewsData || []).forEach((review: any) => {
        const userId = review.user_id;
        if (customerMap.has(userId)) {
          const customer = customerMap.get(userId);
          customer.rating_given = review.rating;
          customer.satisfaction_score = (review.rating / 5) * 100;
        }
      });

      const customersArray = Array.from(customerMap.values());
      setCustomers(customersArray);

      // Calculate stats
      const totalCustomers = customersArray.length;
      const totalRevenue = customersArray.reduce((sum, c) => sum + c.total_spent, 0);
      const avgOrderValue = totalCustomers > 0 ? totalRevenue / customersArray.reduce((sum, c) => sum + c.services_purchased, 0) : 0;
      const customerLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
      const repeatCustomers = customersArray.filter(c => c.services_purchased > 1).length;
      const satisfactionRate = customersArray.length > 0 
        ? customersArray.reduce((sum, c) => sum + c.satisfaction_score, 0) / customersArray.length 
        : 0;

      setStats({
        total_customers: totalCustomers,
        avg_order_value: avgOrderValue,
        customer_lifetime_value: customerLifetimeValue,
        repeat_customers: repeatCustomers,
        satisfaction_rate: satisfactionRate,
        top_spending_segment: totalCustomers > 0 ? 'Premium Clients' : 'No data',
        growth_rate: 12 // Mock growth rate - would calculate from historical data
      });

    } catch (error) {
      console.error('Error fetching customer insights:', error);
      toast({
        title: "Error",
        description: "Failed to load customer insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Customer Insights</DialogTitle>
          <p className="text-muted-foreground">
            Understand your customers better with detailed analytics and insights
          </p>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="customers">Customers ({stats.total_customers})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{stats.total_customers}</span>
                    <div className="flex items-center text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">+{stats.growth_rate}%</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Active customers</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${stats.avg_order_value.toFixed(0)}</div>
                  <p className="text-sm text-muted-foreground">Per transaction</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Customer Lifetime Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${stats.customer_lifetime_value.toFixed(0)}</div>
                  <p className="text-sm text-muted-foreground">Average CLV</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Satisfaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Satisfaction</span>
                    <span className="font-medium">{stats.satisfaction_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={stats.satisfaction_rate} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <span>Repeat Customers</span>
                    <span className="font-medium">{stats.repeat_customers}</span>
                  </div>
                  <Progress value={(stats.repeat_customers / Math.max(stats.total_customers, 1)) * 100} className="h-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Customer Segments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Premium Clients</span>
                      <Badge variant="secondary">
                        {Math.round((customers.filter(c => c.total_spent > 500).length / Math.max(customers.length, 1)) * 100)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Regular Customers</span>
                      <Badge variant="secondary">
                        {Math.round((customers.filter(c => c.services_purchased > 1).length / Math.max(customers.length, 1)) * 100)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>New Customers</span>
                      <Badge variant="secondary">
                        {Math.round((customers.filter(c => c.services_purchased === 1).length / Math.max(customers.length, 1)) * 100)}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">Loading customer data...</div>
              ) : customers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No customer data available yet. Customer insights will appear here once you have bookings and reviews.
                </div>
              ) : (
                customers.map((customer) => (
                  <Card key={customer.id}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{customer.user_name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{customer.user_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {customer.services_purchased} services purchased
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${customer.total_spent.toFixed(0)}</div>
                          <div className="text-sm text-muted-foreground">Total spent</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span>Last activity: {formatDistanceToNow(new Date(customer.last_activity), { addSuffix: true })}</span>
                        </div>
                        {customer.rating_given > 0 && (
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{customer.rating_given}/5 rating</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          <span>Satisfaction: {customer.satisfaction_score.toFixed(0)}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span>{customer.services_purchased > 1 ? 'Repeat' : 'New'} customer</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Customer Growth</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-medium">+{stats.growth_rate}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Average Response Time</span>
                      <span className="font-medium">2.3 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Customer Retention</span>
                      <span className="font-medium">{Math.round((stats.repeat_customers / Math.max(stats.total_customers, 1)) * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Segment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Premium Clients</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          ${customers.filter(c => c.total_spent > 500).reduce((sum, c) => sum + c.total_spent, 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Regular Customers</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          ${customers.filter(c => c.total_spent <= 500 && c.total_spent > 100).reduce((sum, c) => sum + c.total_spent, 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>New Customers</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          ${customers.filter(c => c.total_spent <= 100).reduce((sum, c) => sum + c.total_spent, 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};