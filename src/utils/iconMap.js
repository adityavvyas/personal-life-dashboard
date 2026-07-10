import React from 'react';
import { 
  ShoppingCart, Fuel, Home, Briefcase, Coffee, Utensils,
  Car, Train, Plane, Smartphone, Monitor, Book, FileText, 
  Gamepad2, Music, Heart, Smile, CheckCircle, Circle,
  Star, TrendingUp, TrendingDown, DollarSign, CreditCard
} from 'lucide-react';

export const emojiToLucide = (emojiStr) => {
  // Common categories/emojis to Lucide mapping
  const mapping = {
    '🛒': ShoppingCart,
    '⛽': Fuel,
    '🏠': Home,
    '💼': Briefcase,
    '☕': Coffee,
    '🍽️': Utensils,
    '🍔': Utensils,
    '🚗': Car,
    '🚆': Train,
    '✈️': Plane,
    '📱': Smartphone,
    '💻': Monitor,
    '📚': Book,
    '📄': FileText,
    '🎮': Gamepad2,
    '🎵': Music,
    '❤️': Heart,
    '🏥': Heart,
    '💊': Heart,
    '😀': Smile,
    '✔️': CheckCircle,
    '⭐': Star,
    '📈': TrendingUp,
    '📉': TrendingDown,
    '💰': DollarSign,
    '💳': CreditCard
  };

  const IconComponent = mapping[emojiStr] || FileText; // Default to FileText
  return <IconComponent size={18} />;
};
