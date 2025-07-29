import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  serviceId: string;
  title: string;
  price: number;
  vendor: string;
  image_url?: string;
  quantity: number;
  requiresQuote?: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
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
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('circle-cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems(prev => {
      const existingItem = prev.find(cartItem => cartItem.serviceId === item.serviceId);
      
      if (existingItem) {
        toast({
          title: "Updated cart",
          description: `Increased quantity for "${item.title}"`,
        });
        return prev.map(cartItem =>
          cartItem.serviceId === item.serviceId
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

  const removeFromCart = (serviceId: string) => {
    setCartItems(prev => {
      const item = prev.find(cartItem => cartItem.serviceId === serviceId);
      if (item) {
        toast({
          title: "Removed from cart",
          description: `"${item.title}" has been removed from your cart`,
        });
      }
      return prev.filter(cartItem => cartItem.serviceId !== serviceId);
    });
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId);
      return;
    }
    
    setCartItems(prev =>
      prev.map(cartItem =>
        cartItem.serviceId === serviceId
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