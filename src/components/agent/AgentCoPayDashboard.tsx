import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCoPayRequests } from '@/hooks/useCoPayRequests';
import { CheckCircle, XCircle, Clock, DollarSign, TrendingUp, Calendar, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const AgentCoPayDashboard = () => {
  const { requests, isLoading, removeRequest, getApprovedRequests, getPendingRequests } = useCoPayRequests();

  const pendingRequests = getPendingRequests();
  const approvedRequests = getApprovedRequests();
  const totalSavings = approvedRequests.reduce((sum, req) => {
    const price = parseFloat(req.services?.retail_price?.replace(/[^0-9.]/g, '') || '0');
    return sum + (price * req.requested_split_percentage / 100);
  }, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved Requests</p>
                <p className="text-2xl font-bold text-green-600">{approvedRequests.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">${totalSavings.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedRequests.length})</TabsTrigger>
          <TabsTrigger value="all">All Requests ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Requests</h3>
                <p className="text-gray-600">All your Circle Match requests have been processed.</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map((request) => (
              <RequestCard key={request.id} request={request} onRemove={removeRequest} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approved Requests</h3>
                <p className="text-gray-600">You don't have any approved Circle Match requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            approvedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Circle Match Requests</h3>
                <p className="text-gray-600">You haven't made any Circle Match requests yet.</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((request) => (
              <RequestCard key={request.id} request={request} onRemove={request.status === 'pending' ? removeRequest : undefined} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface RequestCardProps {
  request: any;
  onRemove?: (id: string) => void;
}

const RequestCard = ({ request, onRemove }: RequestCardProps) => {
  const calculateCoPayAmount = (retailPrice: string, splitPercentage: number) => {
    const price = parseFloat(retailPrice.replace(/[^0-9.]/g, ''));
    return (price * splitPercentage / 100).toFixed(2);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'declined': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Card className={`border-l-4 ${
      request.status === 'approved' ? 'border-l-green-500' : 
      request.status === 'declined' ? 'border-l-red-500' : 
      'border-l-yellow-500'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={request.vendors?.logo_url} />
              <AvatarFallback>
                {request.vendors?.name?.charAt(0) || 'V'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">
                  {request.vendors?.name || 'Unknown Vendor'}
                </h4>
                <Badge className={`${getStatusColor(request.status)}`}>
                  {getStatusIcon(request.status)}
                  <span className="ml-1 capitalize">{request.status}</span>
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">{request.services?.title}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {request.requested_split_percentage}% split
                </span>
              </div>
              {request.vendor_notes && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                  <strong>Vendor Notes:</strong> {request.vendor_notes}
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right flex items-center gap-2">
            <div>
              <div className="text-lg font-bold text-green-600">
                ${calculateCoPayAmount(request.services?.retail_price || '0', request.requested_split_percentage)}
              </div>
              <div className="text-sm text-gray-500">Circle Match amount</div>
            </div>
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(request.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};