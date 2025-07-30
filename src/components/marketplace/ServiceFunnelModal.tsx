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
  Verified,
  Crown
} from "lucide-react";
import { getRiskBadge, getComplianceAlert, determineServiceRisk } from "./RESPAComplianceSystem";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  original_price?: string;
  discount_percentage?: string;
  retail_price?: string;
  pro_price?: string;
  co_pay_price?: string;
  image_url?: string;
  tags?: string[];
  is_featured: boolean;
  is_top_pick: boolean;
  contribution_amount: string;
  estimated_roi?: number;
  duration?: string;
  requires_quote?: boolean;
  vendor: {
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
  };
}

interface ServiceFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

export const ServiceFunnelModal = ({ 
  isOpen, 
  onClose, 
  service
}: ServiceFunnelModalProps) => {
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { profile } = useAuth();
  const isProMember = profile?.is_pro_member || false;
  const riskLevel = determineServiceRisk(service.title, service.description);
  
  // Service packages/variations (like Amazon product variations)
  const packages = [
    {
      id: "basic",
      name: "Basic Package",
      price: parseFloat(service.retail_price || service.price) * 0.75,
      originalPrice: parseFloat(service.retail_price || service.price),
      description: "Essential service features for getting started",
      features: ["Core service delivery", "Email support", "Basic reporting"]
    },
    {
      id: "standard",
      name: "Standard Package", 
      price: parseFloat(service.retail_price || service.price),
      originalPrice: parseFloat(service.retail_price || service.price) * 1.33,
      description: "Complete solution for most needs",
      features: ["Everything in Basic", "Priority support", "Advanced reporting", "Custom consultation"],
      popular: true
    },
    {
      id: "premium",
      name: "Premium Package",
      price: parseFloat(service.retail_price || service.price) * 1.5,
      originalPrice: parseFloat(service.retail_price || service.price) * 2,
      description: "Full-service solution with dedicated support",
      features: ["Everything in Standard", "Dedicated account manager", "24/7 support", "Custom integrations"]
    }
  ];

  const selectedPkg = packages.find(pkg => pkg.id === selectedPackage) || packages[1];

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      author: "Jennifer Martinez",
      title: "Top Producer, Realty One Group",
      rating: 5,
      date: "January 15, 2025",
      verified: true,
      review: "This service completely transformed my marketing approach. Saw a 150% increase in qualified leads within the first month. The team was professional and delivered exactly what they promised.",
      helpful: 28,
      comments: [
        { author: "Mike R.", text: "What was your favorite feature of the service?" },
        { author: "Jennifer Martinez", text: "The automated lead nurturing system was a game-changer for my workflow." }
      ]
    },
    {
      id: 2,
      author: "Robert Chen",
      title: "Century 21 Elite",
      rating: 5,
      date: "December 22, 2024",
      verified: true,
      review: "Outstanding ROI and excellent customer service. The implementation was smooth and the results exceeded my expectations. Highly recommend for any serious real estate professional.",
      helpful: 19,
      comments: [
        { author: "Sarah K.", text: "How long did implementation take?" },
        { author: "Robert Chen", text: "About 2 weeks from start to full deployment. Very smooth process." }
      ]
    },
    {
      id: 3,
      author: "Amanda Thompson",
      title: "Keller Williams Premier",
      rating: 4,
      date: "November 30, 2024",
      verified: true,
      review: "Great service overall with solid results. The only minor issue was initial setup took longer than expected, but support was very helpful throughout.",
      helpful: 15,
      comments: [
        { author: "Tom W.", text: "Would you purchase again?" },
        { author: "Amanda Thompson", text: "Absolutely! Already planning to upgrade to the premium package." }
      ]
    }
  ];

  const handleAddToCart = () => {
    addToCart({
      id: service.id,
      title: `${service.title} - ${selectedPkg.name}`,
      price: selectedPkg.price * quantity,
      vendor: service.vendor.name,
      image_url: service.image_url,
      requiresQuote: service.requires_quote,
      type: 'service'
    });
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
          <span>Service Details</span>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Column - Images */}
          <div className="lg:col-span-5">
            <div className="sticky top-6">
              {/* Main Image */}
              <div className="aspect-square bg-muted rounded-lg mb-4 overflow-hidden">
                {service.image_url ? (
                  <img 
                    src={service.image_url} 
                    alt={service.title}
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
              <h1 className="text-2xl font-bold mb-2">{service.title}</h1>
              <div className="flex items-center gap-2 mb-2">
                {renderStarRating(service.vendor.rating)}
                <span className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                  {service.vendor.rating} ({service.vendor.review_count} ratings)
                </span>
                {service.vendor.is_verified && (
                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                    <Verified className="w-3 h-3 mr-1" />
                    Verified Provider
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">by {service.vendor.name}</p>
              {getRiskBadge(riskLevel)}
            </div>

            <Separator />

            {/* Price Section */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">List Price:</span>
                <span className="text-sm text-muted-foreground line-through">
                  ${selectedPkg.originalPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-red-600">
                  ${selectedPkg.price.toFixed(2)}
                </span>
                <Badge className="bg-red-500 text-white">
                  Save ${(selectedPkg.originalPrice - selectedPkg.price).toFixed(2)}
                </Badge>
              </div>
              {isProMember && service.pro_price && (
                <div className="flex items-baseline gap-2">
                  <Crown className="w-4 h-4 text-circle-primary" />
                  <span className="text-lg font-bold text-circle-primary">
                    Circle Pro: ${service.pro_price}
                  </span>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                FREE setup and onboarding included
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
                    <span className="font-bold">${pkg.price.toFixed(2)}</span>
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
              <h3 className="font-semibold">About this service:</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Professional implementation and setup</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Dedicated support throughout the process</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>{service.duration || "Flexible timeline"} delivery</span>
                </li>
                {service.estimated_roi && (
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Estimated {service.estimated_roi}x return on investment</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Right Column - Purchase Options */}
          <div className="lg:col-span-3">
            <div className="sticky top-6">
              <Card className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold">${(selectedPkg.price * quantity).toFixed(2)}</span>
                    <span className="text-sm text-muted-foreground line-through">
                      ${(selectedPkg.originalPrice * quantity).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm text-green-600 font-medium">Available Now</p>
                  <p className="text-xs text-muted-foreground">
                    Setup begins within 2 business days
                  </p>
                </div>

                <Separator />

                {/* Quantity */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity:</label>
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
                    onClick={handleAddToCart}
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
                    size="lg"
                  >
                    Add to Cart
                  </Button>
                  <Button 
                    onClick={handleAddToCart}
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
                  <p>✓ 30-day satisfaction guarantee</p>
                  <p>✓ Secure payment processing</p>
                  <p>✓ RESPA compliant service</p>
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
                <TabsTrigger value="details">Service Details</TabsTrigger>
                <TabsTrigger value="reviews">Customer Reviews</TabsTrigger>
                <TabsTrigger value="agent-reviews">Agent Reviews</TabsTrigger>
                <TabsTrigger value="qa">Q&A</TabsTrigger>
                <TabsTrigger value="related">Related Services</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Service Benefits</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Professional implementation</li>
                      <li>• Dedicated support team</li>
                      <li>• Custom configuration</li>
                      <li>• Performance monitoring</li>
                      <li>• Regular optimization</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Service Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><strong>Category:</strong> {service.category}</p>
                      <p><strong>Duration:</strong> {service.duration || "Flexible"}</p>
                      <p><strong>Provider:</strong> {service.vendor.name}</p>
                      {service.estimated_roi && (
                        <p><strong>Est. ROI:</strong> {service.estimated_roi}x</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="reviews" className="mt-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{service.vendor.rating}</div>
                      {renderStarRating(service.vendor.rating, "lg")}
                      <p className="text-sm text-muted-foreground">{service.vendor.review_count} global ratings</p>
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
                              {review.comments.map((comment, i) => (
                                <div key={i} className="text-xs bg-muted/50 p-2 rounded">
                                  <span className="font-medium">{comment.author}</span> replied: "{comment.text}"
                                </div>
                              ))}
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
                        agentName: "Patricia Williams",
                        agentTitle: "Senior Agent, Coldwell Banker",
                        license: "FL RE #BK3456789",
                        yearsExperience: 10,
                        rating: 5,
                        date: "January 12, 2025",
                        review: "This service revolutionized my client presentation process. The quality of deliverables is outstanding and it's helped me close 3 additional deals this quarter.",
                        helpful: 18,
                        comments: [
                          { author: "Mark T.", text: "How easy was the setup process?" },
                          { author: "Patricia Williams", text: "Very straightforward! The onboarding team walked me through everything step by step." }
                        ]
                      },
                      {
                        id: 2,
                        agentName: "Carlos Rodriguez",
                        agentTitle: "Top Producer, RE/MAX Excellence",
                        license: "TX RE #123456789",
                        yearsExperience: 7,
                        rating: 5,
                        date: "December 30, 2024",
                        review: "Incredible value for the investment. My clients are impressed with the professional quality and it's definitely given me a competitive edge in listings.",
                        helpful: 25,
                        comments: [
                          { author: "Lisa K.", text: "Would you recommend the premium package?" },
                          { author: "Carlos Rodriguez", text: "Absolutely! The premium features are worth every penny for serious agents." }
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
                  {/* More Services Section */}
                  <div>
                    <h3 className="font-semibold mb-4">Related Services from {service.vendor.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-4">
                          <div className="aspect-square bg-muted rounded mb-3">
                            <div className="w-full h-full flex items-center justify-center">
                              <Building className="w-12 h-12 text-muted-foreground" />
                            </div>
                          </div>
                          <h4 className="font-medium mb-2">{service.category} Solution {i}</h4>
                          <p className="text-sm text-muted-foreground mb-2">Complementary service for your needs</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold">${(parseFloat(service.price) * (0.8 + i * 0.3)).toFixed(0)}</span>
                            <Button size="sm">View Details</Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Videos Section */}
                  <div>
                    <h3 className="font-semibold mb-4">Service Videos</h3>
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
                              {i + 2}:1{i}
                            </div>
                          </div>
                          <h4 className="font-medium mb-1">How {service.category} Works - Part {i}</h4>
                          <p className="text-sm text-muted-foreground">Learn about our service process</p>
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