import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Percent, DollarSign } from "lucide-react"

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
    <section className="bg-gradient-to-br from-gray-50 to-white py-8 sm:py-20 px-4 sm:px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-6xl font-bold tracking-tight mb-3 sm:mb-4 max-w-xs sm:max-w-none mx-auto leading-tight sm:leading-none">
          {t('heroTitle')}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">{t('heroSubtitle')}</span>
        </h1>
        <p className="text-sm sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-sm sm:max-w-none mx-auto leading-relaxed">
          {t('heroDescription')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-10">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center p-4 sm:p-6">
              <Percent className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-2" />
              <p className="text-xs sm:text-sm font-medium">Save up to 80% on EVERYTHING to power your business at wholesale pricing</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center p-4 sm:p-6">
              <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2" />
              <p className="text-xs sm:text-sm font-medium">Agent Advice backed by nationwide data on what top realtors use</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center p-4 sm:p-6">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mb-2" />
              <p className="text-xs sm:text-sm font-medium">Vendors lined up ready to help cover up to 50% of your costs</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button 
            size="default" 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md sm:text-base text-sm"
            onClick={handleExploreClick}
          >
            {t('exploreMarketplace')}
          </Button>
          <Button 
            size="default" 
            variant="outline" 
            className="rounded-2xl sm:text-base text-sm"
            onClick={() => navigate('/pricing')}
          >
            Create Free Account
          </Button>
        </div>

        <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-gray-400 italic">
          {t('trustedByAgents')}
        </p>
      </div>
      
      {/* Media Logos */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex justify-center">
          <img 
            src="https://storage.googleapis.com/msgsndr/UjxJODh2Df0UKjTnKpcP/media/6879b4f857dd60a40d8545af.png" 
            alt="As Seen On Media Bar" 
            className="max-h-[60px] w-auto"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  )
}