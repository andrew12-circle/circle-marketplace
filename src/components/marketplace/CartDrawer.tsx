import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, MessageCircle } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
          purchasableItems.forEach(item => removeFromCart(item.serviceId));
          
          toast({
            title: "Redirecting to checkout",
            description: "Opening Stripe checkout in new tab...",
          });
        } else {
          throw new Error("No checkout URL received");
        }
      } catch (error) {
        console.error("Checkout error:", error);
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
      quoteItems.forEach(item => removeFromCart(item.serviceId));
    }
  };

  const handleRequestQuotes = () => {
    const quoteItems = cartItems.filter(item => item.requiresQuote);
    if (quoteItems.length > 0) {
      alert(`Quote requested for ${quoteItems.length} item(s). You'll be contacted within 24 hours.`);
      // Remove quote items from cart after requesting
      quoteItems.forEach(item => removeFromCart(item.serviceId));
    }
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
      
      <SheetContent className="w-full sm:max-w-lg">
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
                  <div key={item.serviceId} className="flex gap-3 p-3 border rounded-lg">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.vendor}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {item.requiresQuote ? (
                            <Badge variant="outline" className="text-xs">
                              Custom Quote
                            </Badge>
                          ) : (
                            <span className="font-semibold text-circle-primary">
                              ${item.price}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.serviceId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.serviceId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => removeFromCart(item.serviceId)}
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
                      <span>Quote items ({quoteItems.reduce((count, item) => count + item.quantity, 0)}):</span>
                      <span className="text-muted-foreground">Custom pricing</span>
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
                      variant="outline" 
                      className="w-full"
                      onClick={handleRequestQuotes}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Request Quote for {quoteItems.length} item(s)
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
    </Sheet>
  );
};