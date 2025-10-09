import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import marketplaceHeroImage from "@/assets/marketplace-hero.png"

interface MarketplaceHeroProps {
  onExploreClick?: () => void;
}

export default function MarketplaceHero({ onExploreClick }: MarketplaceHeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Don't show hero section if user is logged in
  if (user) {
    return null;
  }
  
  const handleExploreClick = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      // Default scroll behavior if no callback provided
      const servicesGrid = document.getElementById('services-grid');
      if (servicesGrid) {
        servicesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <section className="w-full">
      <img 
        src={marketplaceHeroImage} 
        alt="Agent Marketplace - Wholesale discounts on every tool you need" 
        className="w-full h-auto block"
        loading="eager"
      />
    </section>
  )
}