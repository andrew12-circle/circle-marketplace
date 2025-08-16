import React from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export const HelpWidgetTest: React.FC = () => {
  const handleClick = () => {
    alert('Help button clicked!');
  };

  return (
    <div 
      className="fixed bottom-6 right-6 z-[9999] w-12 h-12 bg-red-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
      onClick={handleClick}
      style={{ 
        position: 'fixed', 
        bottom: '24px', 
        right: '24px', 
        zIndex: 9999,
        backgroundColor: 'red',
        width: '48px',
        height: '48px'
      }}
    >
      <HelpCircle className="w-6 h-6 text-white" />
    </div>
  );
};