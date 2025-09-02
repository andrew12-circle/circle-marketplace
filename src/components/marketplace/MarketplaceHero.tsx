import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Percent, DollarSign } from "lucide-react"

interface MarketplaceHeroProps {
  onExploreClick?: () => void;
}

export default function MarketplaceHero({ onExploreClick }: MarketplaceHeroProps) {
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
    <section className="bg-gradient-to-br from-gray-50 to-white py-20 px-6 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold tracking-tight mb-4">
          The Marketplace<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">Agents Actually Asked For</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Finally, a vetted, agent-approved marketplace with negotiated pricing and proven vendors. Every tool you need—faster, cheaper, without the awkward sales calls.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center p-6">
              <Percent className="w-8 h-8 text-green-500 mb-2" />
              <p className="text-sm font-medium">Save up to 80% on top tools</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center p-6">
              <CheckCircle className="w-8 h-8 text-blue-500 mb-2" />
              <p className="text-sm font-medium">Pre-vetted vendors</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm">
            <CardContent className="flex flex-col items-center p-6">
              <DollarSign className="w-8 h-8 text-purple-500 mb-2" />
              <p className="text-sm font-medium">Vendors co-pay up to 50%</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-md"
            onClick={handleExploreClick}
          >
            Explore Marketplace →
          </Button>
          <Button size="lg" variant="outline" className="rounded-2xl">
            See Vendor Co-Pay →
          </Button>
        </div>

        <p className="mt-6 text-sm text-gray-400 italic">
          Trusted by 500+ agents and counting
        </p>
      </div>
    </section>
  )
}