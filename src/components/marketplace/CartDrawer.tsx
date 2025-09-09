import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, MessageCircle, Calendar, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { sbInvoke } from "@/utils/sb";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ConsultationSequenceFlow } from "./ConsultationSequenceFlow";

export const CartDrawer = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getCartTotal, 
    getCartCount, 
    isOpen, 
    setIsOpen 
  } = useCart();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isConsultationFlowOpen, setIsConsultationFlowOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Listen for openCart event
  useEffect(() => {
    const handleOpenCart = () => {
      setIsOpen(true);
    };

    window.addEventListener('openCart', handleOpenCart);
    return () => window.removeEventListener('openCart', handleOpenCart);
  }, [setIsOpen]);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to complete your purchase.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (cartItems.length === 0) return;
    setIsCheckingOut(true);

    try {
      // Check for items that need coverage selection first
      const itemsNeedingCoverage = cartItems.filter(item => 
        !item.coverageType || item.coverageStatus === 'pending-selection'
      );

      if (itemsNeedingCoverage.length > 0) {
        toast({
          title: "Coverage Selection Required",
          description: "Please select how you want to cover each service before checkout.",
          variant: "destructive",
        });
        setIsCheckingOut(false);
        return;
      }

      // Separate items by coverage type and special handling
      const proItems = cartItems.filter(item => 
        item.coverageType === 'pro' && !item.affiliateUrl && !item.requiresConsultation
      );
      
      const affiliateProItems = cartItems.filter(item => 
        item.coverageType === 'pro' && item.affiliateUrl
      );
      
      const coPayItems = cartItems.filter(item => 
        item.coverageType === 'copay'
      );
      
      const consultationItems = cartItems.filter(item => 
        item.requiresConsultation || item.requiresQuote
      );

      // Handle consultation items first
      if (consultationItems.length > 0) {
        setIsConsultationFlowOpen(true);
        return;
      }

      // Handle affiliate items with pro coverage - redirect to vendor
      for (const item of affiliateProItems) {
        if (item.affiliateUrl) {
          window.open(item.affiliateUrl, '_blank');
          removeFromCart(item.id);
          toast({
            title: "Redirected to vendor",
            description: `Complete your purchase of "${item.title}" on the vendor's website.`,
          });
        }
      }

      // Handle co-pay items (affiliate or regular)
      if (coPayItems.length > 0) {
        for (const item of coPayItems) {
          if (item.affiliateUrl) {
            window.open(item.affiliateUrl, '_blank');
            toast({
              title: "Purchase initiated",
              description: `Proceed with purchase. Vendor coverage for "${item.title}" is pending approval.`,
            });
          }
        }

        // Handle regular co-pay checkout for non-affiliate items
        const regularCoPayItems = coPayItems.filter(item => !item.affiliateUrl);
        if (regularCoPayItems.length > 0) {
          const { data, error } = await sbInvoke('copay-checkout', {
            body: {
              items: regularCoPayItems.map(item => ({
                co_pay_request_id: item.id,
                agent_notes: item.description || ''
              }))
            }
          });

          if (error) throw error;

          if (data?.url) {
            window.open(data.url, '_blank');
          }
        }
      }

      // Handle standard pro payment items
      if (proItems.length > 0) {
        const { data, error } = await sbInvoke('create-checkout', {
          body: {
            items: proItems.map(item => ({
              service_id: item.id,
              quantity: item.quantity,
              price_override: item.price
            }))
          }
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, '_blank');
        }
      }

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error?.message || "Failed to process checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleRequestQuotes = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to schedule consultations.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    const quoteItems = cartItems.filter(item => item.requiresQuote);
    if (quoteItems.length > 0) {
      setIsConsultationFlowOpen(true);
      setIsOpen(false);
    }
  };

  const handleConsultationComplete = () => {
    const quoteItems = cartItems.filter(item => item.requiresQuote);
    quoteItems.forEach(item => removeFromCart(item.id));
    toast({
      title: "Consultations Scheduled",
      description: "All consultations have been booked!",
    });
  };

  const getStatusBadge = (item: any) => {
    if (item.coverageStatus === 'pending-selection') {
      // Check if user is pro member - if not, show upgrade message instead
      const isProMember = user?.user_metadata?.is_pro || false;
      if (!isProMember) {
        const potentialSavings = item.price ? Math.round(item.price * 0.3) : 30; // Assume 30% savings
        return (
          <Badge 
            variant="outline" 
            className="text-primary font-medium cursor-pointer hover:bg-primary/10 transition-colors"
            onClick={() => navigate('/pricing')}
          >
            Get Vendor Help - Save ${potentialSavings}+ with Pro
          </Badge>
        );
      }
      return <Badge variant="outline" className="text-amber-600">Needs Coverage Selection</Badge>;
    }
    if (item.coverageType === 'copay' && item.coverageStatus === 'pending-vendor-approval') {
      return <Badge variant="outline" className="text-blue-600">Pending Vendor Approval</Badge>;
    }
    if (item.coverageType === 'copay' && item.coverageStatus === 'approved') {
      return <Badge variant="outline" className="text-green-600">Vendor Approved</Badge>;
    }
    if (item.affiliateUrl) {
      return <Badge variant="outline" className="text-purple-600">Vendor Website</Badge>;
    }
    if (item.requiresConsultation) {
      return <Badge variant="outline" className="text-blue-600">Consultation Required</Badge>;
    }
    return null;
  };

  const purchasableItems = cartItems.filter(item => 
    item.coverageType === 'pro' && !item.requiresConsultation
  );
  const consultationItems = cartItems.filter(item => 
    item.requiresConsultation || item.requiresQuote
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="w-4 h-4" />
          {getCartCount() > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {getCartCount()}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg z-[110]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Your Cart ({getCartCount()} items)
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground">Add some services to get started!</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto py-4 space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                    <div className="w-20 h-16 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">
                        {item.title}
                      </h4>
                      {item.coverageType === 'copay' && item.selectedVendor && (
                        <p className="text-xs text-muted-foreground">
                          Co-Pay with {item.selectedVendor?.name || 'Selected Vendor'}
                        </p>
                      )}
                      
                      {/* Status Badge */}
                      <div className="mt-1">
                        {getStatusBadge(item)}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {item.affiliateUrl ? (
                            <div className="flex items-center gap-1 text-purple-600">
                              <ExternalLink className="w-3 h-3" />
                              <span className="text-xs">Vendor Site</span>
                            </div>
                          ) : (
                            <span className="font-semibold text-primary">
                              ${item.price}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!item.requiresQuote && (
                            <>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-4">
                {/* Summary */}
                <div className="space-y-2">
                  {purchasableItems.length > 0 && (
                    <div className="flex justify-between">
                      <span>Subtotal ({purchasableItems.reduce((count, item) => count + item.quantity, 0)} items):</span>
                      <span className="font-semibold">${getCartTotal()}</span>
                    </div>
                  )}
                  
                  {consultationItems.length > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Consultation items ({consultationItems.length}):
                      </span>
                      <span className="text-blue-600 font-medium">Consultation required</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    onClick={handleCheckout}
                    disabled={isCheckingOut || cartItems.length === 0}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isCheckingOut ? "Processing..." : "Proceed with Cart"}
                  </Button>
                  
                  {consultationItems.length > 0 && (
                    <Button 
                      className="w-full"
                      onClick={handleRequestQuotes}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Consultations ({consultationItems.length} item(s))
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
      
      <ConsultationSequenceFlow
        isOpen={isConsultationFlowOpen}
        onClose={() => setIsConsultationFlowOpen(false)}
        consultationItems={consultationItems.map(item => ({
          serviceId: item.id,
          title: item.title,
          vendor: item.vendor,
          image_url: item.image_url,
          price: item.price
        }))}
        onComplete={handleConsultationComplete}
      />
    </Sheet>
  );
};