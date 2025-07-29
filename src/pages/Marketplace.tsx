import { useState } from "react";
import { VendorCard } from "@/components/marketplace/VendorCard";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { useToast } from "@/hooks/use-toast";

// Mock data - replace with actual data from Google Sheets/Supabase
const mockVendors = [
  {
    id: "1",
    company: "LeadGen Pro",
    category: "lead-generation",
    retailPrice: 299,
    proPrice: 269,
    avgAgentCost: 89,
    imageUrl: "/placeholder.svg",
    rating: 4.8,
    tags: ["trending", "featured"],
    description: "Advanced lead generation system with AI-powered targeting",
    coMarketingEligible: true,
  },
  {
    id: "2",
    company: "PhotoShoot Elite",
    category: "photography",
    retailPrice: 150,
    proPrice: 135,
    avgAgentCost: 45,
    imageUrl: "/placeholder.svg",
    rating: 4.9,
    tags: ["local gem"],
    description: "Professional real estate photography and virtual tours",
    coMarketingEligible: true,
  },
  {
    id: "3",
    company: "Social Media Boost",
    category: "marketing",
    retailPrice: 89,
    proPrice: 80,
    avgAgentCost: 27,
    imageUrl: "/placeholder.svg",
    rating: 4.6,
    tags: ["trending"],
    description: "Complete social media management for real estate agents",
    coMarketingEligible: false,
  },
  {
    id: "4",
    company: "CRM Master",
    category: "crm",
    retailPrice: 199,
    proPrice: 179,
    avgAgentCost: 60,
    imageUrl: "/placeholder.svg",
    rating: 4.7,
    tags: ["featured"],
    description: "All-in-one CRM solution with automated follow-up",
    coMarketingEligible: true,
  },
];

export const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [rating, setRating] = useState("all");
  const { toast } = useToast();

  const handleAddToWallet = (vendorId: string) => {
    const vendor = mockVendors.find(v => v.id === vendorId);
    toast({
      title: "Added to Wallet",
      description: `${vendor?.company} has been added to your wallet.`,
    });
  };

  const handleRequestCoMarketing = (vendorId: string) => {
    const vendor = mockVendors.find(v => v.id === vendorId);
    toast({
      title: "Co-Marketing Request Sent",
      description: `Co-marketing request sent for ${vendor?.company}.`,
    });
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setPriceRange("all");
    setRating("all");
  };

  // Filter vendors based on current filters
  const filteredVendors = mockVendors.filter(vendor => {
    const matchesSearch = vendor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory;
    
    let matchesPrice = true;
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(p => p.replace("+", ""));
      const price = vendor.proPrice;
      if (max) {
        matchesPrice = price >= parseInt(min) && price <= parseInt(max);
      } else {
        matchesPrice = price >= parseInt(min);
      }
    }
    
    let matchesRating = true;
    if (rating !== "all") {
      const minRating = parseFloat(rating.replace("+", ""));
      matchesRating = vendor.rating ? vendor.rating >= minRating : false;
    }
    
    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Circle Marketplace</h1>
        <p className="text-xl text-muted-foreground">
          Discover and purchase the best real estate growth tools with Circle Pro pricing
        </p>
      </div>

      <MarketplaceFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        priceRange={priceRange}
        onPriceRangeChange={setPriceRange}
        rating={rating}
        onRatingChange={setRating}
        onClearFilters={handleClearFilters}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredVendors.map((vendor) => (
          <VendorCard
            key={vendor.id}
            vendor={vendor}
            onAddToWallet={handleAddToWallet}
            onRequestCoMarketing={handleRequestCoMarketing}
          />
        ))}
      </div>

      {filteredVendors.length === 0 && (
        <div className="text-center py-12">
          <p className="text-xl text-muted-foreground">No vendors found matching your criteria.</p>
          <p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
};