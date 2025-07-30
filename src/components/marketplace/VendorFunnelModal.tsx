import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign, 
  CheckCircle, 
  Target,
  Zap,
  Trophy,
  ArrowRight,
  Building,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ShoppingCart,
  Heart,
  Share2,
  Plus,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Verified
} from "lucide-react";
import { getRiskBadge, getComplianceAlert, determineServiceRisk } from "./RESPAComplianceSystem";

interface VendorFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: {
    id: string;
    name: string;
    description: string;
    logo_url?: string;
    website_url?: string;
    location?: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
    co_marketing_agents: number;
    campaigns_funded: number;
    service_states?: string[];
    mls_areas?: string[];
    service_radius_miles?: number;
  };
  onRequestCoMarketing: (vendorId: string) => void;
}

export const VendorFunnelModal = ({ 
  isOpen, 
  onClose, 
  vendor, 
  onRequestCoMarketing 
}: VendorFunnelModalProps) => {
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [quantity, setQuantity] = useState(1);
  const riskLevel = determineServiceRisk(vendor.name, vendor.description);
  
  // Mock services/packages data (like Amazon product variations)
  const packages = [
    {
      id: "basic",
      name: "Basic Co-Marketing Package",
      price: 299,
      originalPrice: 399,
      description: "Essential marketing support for new partnerships",
      features: ["Social media campaign", "Email marketing template", "Basic analytics"]
    },
    {
      id: "standard",
      name: "Standard Co-Marketing Package", 
      price: 599,
      originalPrice: 799,
      description: "Complete marketing solution for serious growth",
      features: ["Everything in Basic", "Paid advertising campaigns", "Custom landing pages", "Advanced analytics"],
      popular: true
    },
    {
      id: "premium",
      name: "Premium Co-Marketing Package",
      price: 999,
      originalPrice: 1299,
      description: "Full-service marketing partnership with dedicated support",
      features: ["Everything in Standard", "Dedicated account manager", "Video marketing", "Priority support"]
    }
  ];

  const selectedPkg = packages.find(pkg => pkg.id === selectedPackage) || packages[1];

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      author: "Sarah Johnson",
      title: "Top Producer, Metro Realty",
      rating: 5,
      date: "December 15, 2024",
      verified: true,
      review: "Outstanding results! This co-marketing partnership increased my lead generation by 200% in just 3 months. The team is professional and the campaigns are well-executed.",
      helpful: 24,
      images: []
    },
    {
      id: 2,
      author: "Mike Chen",
      title: "RE/MAX Premier",
      rating: 5,
      date: "November 28, 2024",
      verified: true,
      review: "Best investment I've made in my real estate business. The ROI has been incredible and the support team is always available to help optimize campaigns.",
      helpful: 18,
      images: []
    },
    {
      id: 3,
      author: "Lisa Rodriguez",
      title: "Coldwell Banker",
      rating: 4,
      date: "November 10, 2024",
      verified: true,
      review: "Great partnership overall. Saw significant improvement in lead quality and conversion rates. Minor delays in campaign setup but worth the wait.",
      helpful: 12,
      images: []
    }
  ];

  const handleRequestCoMarketing = () => {
    onRequestCoMarketing(vendor.id);
    onClose();
  };

  const renderStarRating = (rating: number, size = "sm") => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => {
          const isFullStar = i < Math.floor(rating);
          const isPartialStar = i === Math.floor(rating) && rating % 1 !== 0;
          const fillPercentage = isPartialStar ? (rating <= 4.9 ? 50 : (rating % 1) * 100) : 0;
          
          return (
            <div key={i} className={`relative ${size === "lg" ? "h-5 w-5" : "h-4 w-4"}`}>
              <Star className={`${size === "lg" ? "h-5 w-5" : "h-4 w-4"} text-gray-300 absolute`} />
              {isFullStar && (
                <Star className={`${size === "lg" ? "h-5 w-5" : "h-4 w-4"} fill-yellow-400 text-yellow-400 absolute`} />
              )}
              {isPartialStar && (
                <div 
                  className="overflow-hidden absolute"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star className={`${size === "lg" ? "h-5 w-5" : "h-4 w-4"} fill-yellow-400 text-yellow-400`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <span>Vendor Partnership Details</span>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-5">
            <div className="sticky top-6">
              {/* Main Image */}
              <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                {vendor.logo_url ? (
                  <img 
                    src={vendor.logo_url} 
                    alt={vendor.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Building className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square bg-muted rounded border-2 border-transparent hover:border-primary cursor-pointer">
                    <div className="w-full h-full flex items-center justify-center">
                      <Building className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Middle Column - Product Details */}
          <div className="lg:col-span-4 space-y-4">
            {/* Title and Rating */}
            <div>
              <h1 className="text-2xl font-bold mb-2">{vendor.name}</h1>
              <div className="flex items-center gap-2 mb-2">
                {renderStarRating(vendor.rating)}
                <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                  {vendor.rating} ({vendor.review_count} ratings)
                </span>
                {vendor.is_verified && (
                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                    <Verified className="w-3 h-3 mr-1" />
                    Verified Partner
                  </Badge>
                )}
              </div>
              {getRiskBadge(riskLevel)}
            </div>

            <Separator />

            {/* Price Section */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">List Price:</span>
                <span className="text-sm text-muted-foreground line-through">
                  ${selectedPkg.originalPrice}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">
                  ${selectedPkg.price}
                </span>
                <Badge className="bg-red-500 text-white">
                  Save ${selectedPkg.originalPrice - selectedPkg.price}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                FREE delivery and setup included
              </p>
            </div>

            <Separator />

            {/* Package Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold">Choose your package:</h3>
              {packages.map((pkg) => (
                <div 
                  key={pkg.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    selectedPackage === pkg.id ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                  } ${pkg.popular ? 'relative' : ''}`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2 left-3 bg-orange-500">
                      Most Popular
                    </Badge>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{pkg.name}</span>
                    <span className="font-bold">${pkg.price}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{pkg.description}</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {pkg.features.slice(0, 2).map((feature, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <Separator />

            {/* Key Features */}
            <div className="space-y-3">
              <h3 className="font-semibold">About this partnership:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Split marketing costs 50/50 with proven ROI</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Access to {vendor.co_marketing_agents} agent network</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>{vendor.service_radius_miles || 50} mile radius coverage</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Average 147% increase in lead generation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Purchase Options */}
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">${selectedPkg.price}</span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${selectedPkg.originalPrice}
                    </span>
                  </div>
                  <p className="text-sm text-green-600 font-medium">In Stock</p>
                  <p className="text-xs text-muted-foreground">
                    FREE delivery by {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>

                <Separator />

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Campaigns:</label>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-8 w-8"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-12 text-center border rounded px-2 py-1 text-sm">
                      {quantity}
                    </span>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-8 w-8"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button 
                    onClick={handleRequestCoMarketing}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
                    size="lg"
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    onClick={handleRequestCoMarketing}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Buy Now
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Heart className="w-4 h-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1">
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>✓ 30-day money back guarantee</p>
                  <p>✓ Secure payment processing</p>
                  <p>✓ RESPA compliant partnership</p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom Section - Tabs */}
        <div className="border-t bg-muted/20">
          <div className="p-6">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Product Details</TabsTrigger>
                <TabsTrigger value="reviews">Customer Reviews</TabsTrigger>
                <TabsTrigger value="agent-reviews">Agent Reviews</TabsTrigger>
                <TabsTrigger value="qa">Q&A</TabsTrigger>
                <TabsTrigger value="related">Related Services</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Partnership Benefits</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Split marketing costs 50/50</li>
                      <li>• Access to established client network</li>
                      <li>• Professional campaign management</li>
                      <li>• Real-time analytics and reporting</li>
                      <li>• Dedicated account support</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Service Coverage</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Location:</strong> {vendor.location || "Multiple markets"}</p>
                      <p><strong>Radius:</strong> {vendor.service_radius_miles || 50} miles</p>
                      <p><strong>Active Partners:</strong> {vendor.co_marketing_agents}</p>
                      <p><strong>Campaigns Completed:</strong> {vendor.campaigns_funded}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{vendor.rating}</div>
                      {renderStarRating(vendor.rating, "lg")}
                      <p className="text-sm text-muted-foreground">{vendor.review_count} global ratings</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {[5, 4, 3, 2, 1].map((stars) => (
                        <div key={stars} className="flex items-center gap-2 text-sm">
                          <span>{stars} star</span>
                          <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-yellow-400" 
                              style={{ width: `${stars === 5 ? 70 : stars === 4 ? 20 : 5}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground">{stars === 5 ? '70' : stars === 4 ? '20' : '5'}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Individual Reviews */}
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                            {review.author.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{review.author}</span>
                              {review.verified && (
                                <Badge variant="outline" className="text-xs">
                                  ✓ Verified Purchase
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              {renderStarRating(review.rating)}
                              <span className="text-sm text-muted-foreground">{review.date}</span>
                            </div>
                            <p className="text-sm mb-3">{review.review}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsUp className="w-3 h-3" />
                                Helpful ({review.helpful})
                              </button>
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsDown className="w-3 h-3" />
                                Not helpful
                              </button>
                              <button className="hover:text-foreground">
                                Comment
                              </button>
                            </div>
                            
                            {/* Comments Section */}
                            <div className="mt-3 ml-4 space-y-2">
                              <div className="text-xs bg-muted/50 p-2 rounded">
                                <span className="font-medium">Mike T.</span> replied: "Completely agree! The ROI has been amazing for our team too."
                              </div>
                              <div className="text-xs bg-muted/50 p-2 rounded">
                                <span className="font-medium">Jennifer K.</span> replied: "How long did it take to see results?"
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="agent-reviews" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Real Estate Agent Reviews</h3>
                    <Button size="sm">Write Agent Review</Button>
                  </div>
                  
                  {/* Agent Reviews */}
                  <div className="space-y-6">
                    {[
                      {
                        id: 1,
                        agentName: "David Rodriguez",
                        agentTitle: "Senior Agent, Keller Williams",
                        license: "CA DRE #01234567",
                        yearsExperience: 8,
                        rating: 5,
                        date: "January 10, 2025",
                        review: "This co-marketing partnership transformed my business. In 6 months, I went from 2-3 listings per month to 8-10. The lead quality is exceptional and the campaign management is professional.",
                        helpful: 15,
                        comments: [
                          { author: "Ashley M.", text: "What was your favorite part of the partnership?" },
                          { author: "David Rodriguez", text: "The targeted lead generation - the quality was so much better than other services I've tried." }
                        ]
                      },
                      {
                        id: 2,
                        agentName: "Maria Santos",
                        agentTitle: "Top Producer, Century 21",
                        license: "TX RE #987654321",
                        yearsExperience: 12,
                        rating: 5,
                        date: "December 28, 2024",
                        review: "Best ROI I've ever seen from a marketing partnership. The team understood the local market dynamics and created campaigns that really resonated with our target demographic.",
                        helpful: 22,
                        comments: [
                          { author: "Tom K.", text: "How much did you invest initially?" },
                          { author: "Maria Santos", text: "Started with the Standard package and upgraded to Premium after seeing the results." }
                        ]
                      }
                    ].map((agentReview) => (
                      <div key={agentReview.id} className="border rounded-lg p-4 bg-background">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {agentReview.agentName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{agentReview.agentName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    ✓ Verified Agent
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">{agentReview.agentTitle}</p>
                                <p className="text-xs text-muted-foreground">
                                  License: {agentReview.license} • {agentReview.yearsExperience} years experience
                                </p>
                              </div>
                              <div className="text-right">
                                {renderStarRating(agentReview.rating)}
                                <p className="text-xs text-muted-foreground mt-1">{agentReview.date}</p>
                              </div>
                            </div>
                            
                            <p className="text-sm mb-3">{agentReview.review}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsUp className="w-3 h-3" />
                                Helpful ({agentReview.helpful})
                              </button>
                              <button className="flex items-center gap-1 hover:text-foreground">
                                <ThumbsDown className="w-3 h-3" />
                                Not helpful
                              </button>
                              <button className="hover:text-foreground">
                                Comment
                              </button>
                            </div>
                            
                            {/* Agent Comments */}
                            <div className="space-y-2">
                              {agentReview.comments.map((comment, i) => (
                                <div key={i} className="bg-muted/30 p-3 rounded-lg text-sm">
                                  <span className="font-medium text-primary">{comment.author}:</span>
                                  <span className="ml-2">{comment.text}</span>
                                </div>
                              ))}
                              <Button variant="ghost" size="sm" className="text-xs">
                                Add a comment
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="qa" className="mt-6">
                <p className="text-muted-foreground">Questions & Answers section coming soon...</p>
              </TabsContent>
              
              <TabsContent value="related" className="mt-6">
                <div className="space-y-6">
                  {/* More Products Section */}
                  <div>
                    <h3 className="font-semibold mb-4">More Products from {vendor.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-4">
                          <div className="aspect-square bg-muted rounded mb-3">
                            <div className="w-full h-full flex items-center justify-center">
                              <Building className="w-12 h-12 text-muted-foreground" />
                            </div>
                          </div>
                          <h4 className="font-medium mb-2">Digital Marketing Package {i}</h4>
                          <p className="text-sm text-muted-foreground mb-2">Complete online presence solution</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">${299 + (i * 200)}</span>
                            <Button size="sm">View Details</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Videos Section */}
                  <div>
                    <h3 className="font-semibold mb-4">Product Videos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="p-4">
                          <div className="aspect-video bg-muted rounded mb-3 relative cursor-pointer hover:bg-muted/80 transition-colors">
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-16 h-16 bg-black/20 rounded-full flex items-center justify-center">
                                <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1"></div>
                              </div>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              {i}:3{i}
                            </div>
                          </div>
                          <h4 className="font-medium mb-1">How Co-Marketing Works - Part {i}</h4>
                          <p className="text-sm text-muted-foreground">Learn about our partnership process</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};