import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Star, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  // Mock data - replace with actual API calls
  const services = [
    {
      id: 1,
      title: "Real Geeks",
      description: "Lead generation websites and CRM tools designed specifically for real estate professionals.",
      category: "All-in-One",
      retailPrice: "$299.00",
      proPrice: "$269.00",
      coPayPrice: "$188.00",
      discount: "62.88%",
      rating: 4.8,
      image: "https://cdn.cookielaw.org/logos/aa4c6ea2-82de-4ea3-b17d-9d1616eb2a19/0a8da07e-2c48-4b29-b61f-42187c177c70/8f21384d-4e75-4ad0-b8dc-1d3baaf976d7/Real_Geeks_logo.png",
      tags: ["CRM", "Website", "Lead Generation"]
    },
    {
      id: 2,
      title: "Tom Ferry",
      description: "Top-ranked real estate coach providing coaching, training, and tech solutions for agents.",
      category: "Coaching",
      retailPrice: "$1,497.00",
      proPrice: "$1,347.00",
      coPayPrice: "$943.00",
      discount: "62.99%",
      rating: 4.9,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0RwXfXLmbYhwqqBNPxARooTBBuRX8EA2DPA&s",
      tags: ["Coaching", "Training", "Events"]
    },
    {
      id: 3,
      title: "kvCORE",
      description: "All-in-one platform with CRM, IDX websites, and automation tools for real estate agents.",
      category: "All-in-One",
      retailPrice: "$499.00",
      proPrice: "$449.00",
      coPayPrice: "$314.00",
      discount: "62.93%",
      rating: 4.7,
      image: "https://leadsbridge.com/wp-content/themes/leadsbridge/img/integration-lg-logos/logo858.png",
      tags: ["CRM", "Website", "Lead Generation", "Enterprise"]
    }
  ];

  const categories = ["all", "All-in-One", "Coaching", "CRM", "Websites / IDX", "Digital Ads"];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (serviceTitle: string) => {
    toast({
      title: "Added to Cart",
      description: `${serviceTitle} has been added to your cart.`,
    });
  };

  return (
    <ErrorBoundary section="Marketplace">
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Marketplace
              </h1>
              <p className="text-lg md:text-xl mb-8 leading-relaxed">
                Finally, we silenced the noise. Welcome to the Marketplace. Discover premium services for a fraction of the cost. Everything you already use for your business growth for much less, curated and easy to compare and understand what works and does not work based upon verified agents like you in the market. Don't guess anymore, buy outcomes not tools.
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card key={service.id} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">{service.category}</Badge>
                    {service.discount && (
                      <Badge variant="destructive">-{service.discount}</Badge>
                    )}
                  </div>
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-16 object-contain mb-4"
                  />
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex flex-wrap gap-1 mb-4">
                    {service.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium">{service.rating}</span>
                  </div>

                  <div className="mt-auto">
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Retail:</span>
                        <span className="text-sm line-through text-muted-foreground">{service.retailPrice}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Pro Price:</span>
                        <span className="text-lg font-bold text-primary">{service.proPrice}</span>
                      </div>
                      {service.coPayPrice && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-600">Co-Pay:</span>
                          <span className="text-lg font-bold text-green-600">{service.coPayPrice}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddToCart(service.title)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};