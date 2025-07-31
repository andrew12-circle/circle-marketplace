import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface CoPayCartItem {
  id: string;
  service: {
    title: string;
    image_url?: string;
    pro_price?: string;
    retail_price?: string;
  };
  vendor?: {
    name: string;
    logo_url?: string;
  };
  status: 'pending' | 'approved' | 'declined' | 'expired';
  requested_split_percentage: number;
  expires_at: string;
  co_pay_amount: number;
  agent_notes?: string;
  vendor_notes?: string;
}

interface CoPayCartItemProps {
  item: CoPayCartItem;
  onRemove: (itemId: string) => void;
  onCheckout?: (itemId: string) => void;
  onContactVendor?: (itemId: string) => void;
}

export const CoPayCartItem = ({ 
  item, 
  onRemove, 
  onCheckout, 
  onContactVendor 
}: CoPayCartItemProps) => {
  const getStatusIcon = () => {
    switch (item.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'expired':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800", 
      declined: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge className={variants[item.status]}>
        {getStatusIcon()}
        <span className="ml-1 capitalize">{item.status}</span>
      </Badge>
    );
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Expires today";
    if (diffDays === 1) return "Expires tomorrow";
    return `Expires in ${diffDays} days`;
  };

  const getActionButton = () => {
    switch (item.status) {
      case 'approved':
        return (
          <Button 
            onClick={() => onCheckout?.(item.id)}
            className="bg-green-600 hover:bg-green-700"
          >
            Proceed to Checkout
          </Button>
        );
      case 'pending':
        return (
          <Button 
            variant="outline"
            onClick={() => onContactVendor?.(item.id)}
          >
            Contact Vendor
          </Button>
        );
      case 'declined':
        return (
          <Button variant="outline" disabled>
            Request Declined
          </Button>
        );
      case 'expired':
        return (
          <Button variant="outline" disabled>
            Request Expired
          </Button>
        );
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Service Image */}
          <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
            {item.service.image_url ? (
              <img 
                src={item.service.image_url} 
                alt={item.service.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm truncate">{item.service.title}</h3>
              {getStatusBadge()}
            </div>

            {/* Vendor Info */}
            {item.vendor && (
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Co-pay partner: {item.vendor.name}
                </span>
              </div>
            )}

            {/* Pricing Info */}
            <div className="space-y-1 mb-2">
              <div className="text-xs">
                <span className="text-muted-foreground">Your co-pay: </span>
                <span className="font-semibold text-green-600">
                  ${item.co_pay_amount.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Vendor covers {item.requested_split_percentage}% of cost
              </div>
            </div>

            {/* Status Details */}
            <div className="text-xs text-muted-foreground mb-3">
              {item.status === 'pending' && formatExpiryDate(item.expires_at)}
              {item.status === 'approved' && "Ready for checkout!"}
              {item.status === 'declined' && item.vendor_notes && `Reason: ${item.vendor_notes}`}
              {item.status === 'expired' && "Request has expired"}
            </div>

            {/* Notes */}
            {item.agent_notes && (
              <div className="text-xs bg-muted/50 p-2 rounded mb-3">
                <span className="font-medium">Your notes: </span>
                {item.agent_notes}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {getActionButton()}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onRemove(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};