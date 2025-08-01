import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, MessageCircle, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    const purchasableItems = cartItems.filter(item => !item.requiresQuote);
    const quoteItems = cartItems.filter(item => item.requiresQuote);
    
    if (purchasableItems.length > 0) {
      setIsCheckingOut(true);
      
      try {
        // Get current session to include auth header if user is logged in
        const { data: { session } } = await supabase.auth.getSession();
        
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          body: { 
            items: purchasableItems.map(item => ({
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              vendor: item.vendor,
              image_url: item.image_url
            }))
          },
          headers: session?.access_token ? {
            Authorization: `Bearer ${session.access_token}`,
          } : {},
        });

        if (error) {
          throw error;
        }

        if (data?.url) {
          // Open Stripe checkout in new tab
          window.open(data.url, '_blank');
          
          // Clear purchasable items from cart after successful checkout initiation
          purchasableItems.forEach(item => removeFromCart(item.id));
          
          toast({
            title: "Redirecting to checkout",
            description: "Opening Stripe checkout in new tab...",
          });
        } else {
          throw new Error("No checkout URL received");
        }
      } catch (error) {
        // Log error details for debugging without exposing sensitive information
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        toast({
          title: "Checkout failed",
          description: "Unable to process checkout. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsCheckingOut(false);
      }
    }

    if (quoteItems.length > 0) {
      // Handle quote requests
      toast({
        title: "Quote requested",
        description: `Quote requested for ${quoteItems.length} item(s). You'll be contacted within 24 hours.`,
      });
      
      // Remove quote items from cart after requesting
      quoteItems.forEach(item => removeFromCart(item.id));
    }
  };

  const handleRequestQuotes = () => {
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
      description: "All consultations have been booked and preparation courses completed!",
    });
  };

  const purchasableItems = cartItems.filter(item => !item.requiresQuote);
  const quoteItems = cartItems.filter(item => item.requiresQuote);

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
                      <div className="w-20 h-16 bg-muted rounded-lg overflow-hidden relative">
                         {item.type === 'co-pay-request' ? (
                           <>
                             <img
                               src={item.image_url || "/placeholder.svg"}
                               alt={item.title}
                               className="w-full h-full object-cover"
                             />
                             {/* Show vendor logo overlay */}
                             {typeof item.vendor === 'object' && item.vendor?.logo_url && (
                               <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-white overflow-hidden shadow-sm">
                                 <img
                                   src={item.vendor.logo_url}
                                   alt={item.vendorName}
                                   className="w-full h-full object-cover"
                                 />
                               </div>
                             )}
                           </>
                         ) : (
                           <img
                             src={item.image_url || "/placeholder.svg"}
                             alt={item.title}
                             className="w-full h-full object-cover"
                           />
                         )}
                       </div>
                     
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.type === 'co-pay-request' 
                            ? `Co-Pay with ${item.vendorName || (typeof item.vendor === 'string' ? item.vendor : item.vendor?.name)}` 
                            : item.vendor}
                        </p>
                       
                         {/* Show pricing structure for co-pay requests */}
                         {item.type === 'co-pay-request' && (
                           (() => {
                             let pricing = { retail_price: '$299/mo', co_pay_price: '$209/mo', pro_price: '$269/mo' };
                             try {
                               if (item.description) {
                                 pricing = JSON.parse(item.description);
                               }
                             } catch (e) {
                               // Use default pricing if parsing fails
                             }
                             
                             return (
                               <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                                 <div className="flex justify-between">
                                   <span>Retail Price:</span>
                                   <span className="line-through text-muted-foreground">{pricing.retail_price || '$299/mo'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span>Co-Pay Price:</span>
                                   <span className="text-green-600 font-medium">{pricing.co_pay_price || '$209/mo'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span>Pro Price (if denied):</span>
                                   <span className="text-amber-600">{pricing.pro_price || '$269/mo'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span>Your Split:</span>
                                   <span className="text-blue-600">{100 - (item.requestedSplit || 50)}%</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span>Vendor Split:</span>
                                   <span className="text-orange-600">{item.requestedSplit || 50}%</span>
                                 </div>
                               </div>
                             );
                           })()
                         )}
                       
                       <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {item.type === 'co-pay-request' ? (
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    item.status === 'pending-approval' ? 'text-yellow-600 border-yellow-600' :
                                    item.status === 'approved' ? 'text-green-600 border-green-600' :
                                    'text-red-600 border-red-600'
                                  }`}
                                >
                                  <MessageCircle className="w-3 h-3 mr-1" />
                                  {item.status === 'pending-approval' ? 'Pending Vendor Approval' : 
                                   item.status === 'approved' ? 'Approved' : 'Denied'}
                                </Badge>
                                <span className="font-semibold text-muted-foreground text-xs">
                                  {item.requestedSplit}% split
                                </span>
                                {item.requiresQuote && item.status === 'approved' && (
                                  <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    Consultation Required
                                  </Badge>
                                )}
                              </div>
                            ) : item.requiresQuote ? (
                             <div className="flex items-center gap-2">
                               <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                                 <Calendar className="w-3 h-3 mr-1" />
                                 Consultation
                               </Badge>
                               <span className="font-semibold text-muted-foreground line-through">
                                 ${item.price}
                               </span>
                             </div>
                           ) : (
                             <span className="font-semibold text-circle-primary">
                               ${item.price}
                             </span>
                           )}
                         </div>
                        
                        <div className="flex items-center gap-1">
                          {!item.requiresQuote && item.type !== 'co-pay-request' && (
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
                  
                  {quoteItems.length > 0 && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Consultation items ({quoteItems.length}):
                      </span>
                      <span className="text-blue-600 font-medium">Consultation required</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  {purchasableItems.length > 0 && (
                    <Button 
                      className="w-full" 
                      onClick={handleCheckout}
                      disabled={isCheckingOut}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {isCheckingOut ? "Processing..." : `Checkout ${purchasableItems.length} item(s) - $${getCartTotal()}`}
                    </Button>
                  )}
                  
                   {quoteItems.length > 0 && (
                     <Button 
                       className="w-full"
                       onClick={handleRequestQuotes}
                     >
                       <Calendar className="w-4 h-4 mr-2" />
                       Schedule Consultations ({quoteItems.length} item(s))
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
         consultationItems={quoteItems.map(item => ({
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