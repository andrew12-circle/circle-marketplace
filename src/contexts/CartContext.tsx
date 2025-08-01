import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  id: string; // Can be serviceId or courseId
  title: string;
  price: number;
  vendor?: string | any; // For marketplace services - can be string or vendor object for co-pay
  creator?: string; // For academy courses
  image_url?: string;
  quantity: number;
  requiresQuote?: boolean;
  type: 'service' | 'course' | 'co-pay-request'; // Added co-pay-request type
  description?: string;
  duration?: string; // For courses
  lessonCount?: number; // For courses
  // Co-pay request specific fields
  status?: 'pending-approval' | 'approved' | 'denied';
  requestedSplit?: number;
  vendorName?: string;
  serviceName?: string;
  createdAt?: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('circle-cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        // Clear invalid cart data and continue silently
        localStorage.removeItem('circle-cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('circle-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Listen for co-pay request events
  useEffect(() => {
    const handleAddCoPayToCart = (event: CustomEvent) => {
      const coPayItem = event.detail;
      const cartItem: CartItem = {
        id: coPayItem.id,
        title: coPayItem.service.title,
        price: 0, // Co-pay requests don't have a direct price
        vendor: coPayItem.vendor, // Store full vendor object
        quantity: 1,
        type: 'co-pay-request',
        status: coPayItem.status,
        requestedSplit: coPayItem.requestedSplit,
        vendorName: coPayItem.vendor.name,
        serviceName: coPayItem.service.title,
        createdAt: coPayItem.createdAt,
        requiresQuote: coPayItem.service.requires_quote || false,
        image_url: coPayItem.service.image_url,
        // Store service pricing data
        description: JSON.stringify({
          retail_price: coPayItem.service.retail_price,
          co_pay_price: coPayItem.service.co_pay_price,
          pro_price: coPayItem.service.pro_price
        })
      };
      
      addToCart(cartItem);
    };

    window.addEventListener('addCoPayToCart', handleAddCoPayToCart as EventListener);
    return () => window.removeEventListener('addCoPayToCart', handleAddCoPayToCart as EventListener);
  }, []);

  // Save cart to localStorage whenever it changes

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      
      if (existingItem) {
        toast({
          title: "Updated cart",
          description: `Increased quantity for "${item.title}"`,
        });
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        toast({
          title: "Added to cart",
          description: `"${item.title}" has been added to your cart`,
        });
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => {
      const item = prev.find(cartItem => cartItem.id === id);
      if (item) {
        toast({
          title: "Removed from cart",
          description: `"${item.title}" has been removed from your cart`,
        });
      }
      return prev.filter(cartItem => cartItem.id !== id);
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCartItems(prev =>
      prev.map(cartItem =>
        cartItem.id === id
          ? { ...cartItem, quantity }
          : cartItem
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    toast({
      title: "Cart cleared",
      description: "All items have been removed from your cart",
    });
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      if (item.requiresQuote) return total; // Don't add quote items to total
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const addCoPayRequest = (coPayItem: any) => {
    const cartItem: CartItem = {
      id: coPayItem.id,
      title: `Co-Pay: ${coPayItem.service.title}`,
      price: 0,
      vendor: coPayItem.vendor.name,
      quantity: 1,
      type: 'co-pay-request',
      status: coPayItem.status,
      requestedSplit: coPayItem.requestedSplit,
      vendorName: coPayItem.vendor.name,
      serviceName: coPayItem.service.title,
      createdAt: coPayItem.createdAt,
      requiresQuote: false
    };
    
    addToCart(cartItem);
  };

  const value: CartContextType = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isOpen,
    setIsOpen,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};