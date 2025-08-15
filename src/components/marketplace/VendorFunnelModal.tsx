
import { useState, useEffect } from "react";
import { VendorFunnelEditor } from './VendorFunnelEditor';
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  Shield,
  Award,
  Handshake,
  X,
  Play,
  Crown,
  AlertTriangle
} from "lucide-react";
import { getRiskBadge, getComplianceAlert, determineServiceRisk } from "./RESPAComplianceSystem";
import { ServiceRepresentativeSelector } from "./ServiceRepresentativeSelector";
import { supabase } from "@/integrations/supabase/client";
import { useVendorQuestions } from "@/hooks/useVendorQuestions";

interface VendorFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  industry?: 'mortgage' | 'insurance' | 'legal' | 'accounting' | 'real-estate' | 'general';
  vendor: {
    id: string;
    name: string;
    description?: string;
    logo_url?: string;
    website_url?: string;
    location?: string;
    rating?: number;
    review_count?: number;
    is_verified?: boolean;
    co_marketing_agents?: number;
    campaigns_funded?: number;
    service_states?: string[];
    mls_areas?: string[];
    service_radius_miles?: number;
    nmls_id?: string;
    vendor_type?: string;
    license_states?: string[];
  };
  onCoMarketingRequest?: (vendorId: string) => void;
  isVendorView?: boolean;
  currentUserId?: string;
}

export const VendorFunnelModal = ({ 
  isOpen, 
  onClose, 
  industry = 'general',
  vendor, 
  onCoMarketingRequest,
  isVendorView = false,
  currentUserId
}: VendorFunnelModalProps) => {
  console.log('VendorFunnelModal render:', { isOpen, vendor: vendor.name, vendorId: vendor.id });
  
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [quantity, setQuantity] = useState(1);
  const [isEditingFunnel, setIsEditingFunnel] = useState(false);
  const [vendorReviews, setVendorReviews] = useState<any[]>([]);
  const [vendorReviewsLoading, setVendorReviewsLoading] = useState(false);
  const [openItem, setOpenItem] = useState<string>("question-1");
  const { questions: vendorQuestions, loading: questionsLoading } = useVendorQuestions(vendor?.id);

  // Check if current user is the vendor owner
  const isVendorOwner = currentUserId === vendor.id || isVendorView;

  // Industry-specific configurations
  const industryConfig = {
    mortgage: {
      benefits: [
        { title: "Shared Marketing Costs", desc: "Split advertising expenses 50/50" },
        { title: "Co-Branded Materials", desc: "Professional marketing assets" },
        { title: "Lead Generation", desc: "Access to our client database" },
        { title: "Fast Closings", desc: "Close on time, every time" },
        { title: "Premium Placement", desc: "Priority in referral systems" },
        { title: "Training & Support", desc: "Ongoing partner education" }
      ],
      reviewLabel: "Real Estate Agent Reviews"
    },
    general: {
      benefits: [
        { title: "Partnership Benefits", desc: "Mutual business growth" },
        { title: "Resource Sharing", desc: "Access to tools and expertise" },
        { title: "Network Expansion", desc: "Broader client reach" },
        { title: "Quality Service", desc: "Proven track record" },
        { title: "Ongoing Support", desc: "Continuous partnership" }
      ],
      reviewLabel: "Client Reviews"
    }
  };

  const config = industryConfig[industry] || industryConfig.general;

  // Load vendor reviews
  useEffect(() => {
    const loadVendorReviews = async () => {
      if (!vendor?.id) {
        setVendorReviews([]);
        return;
      }
      setVendorReviewsLoading(true);
      try {
        // First get services for this vendor
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('id, title')
          .eq('vendor_id', vendor.id);

        if (servicesError) throw servicesError;
        
        if (!servicesData || servicesData.length === 0) {
          setVendorReviews([]);
          setVendorReviewsLoading(false);
          return;
        }

        const serviceIds = servicesData.map(s => s.id);

        // Then get reviews for those services
        const { data, error } = await supabase
          .from('service_reviews')
          .select(`
            id,
            rating,
            review,
            created_at,
            verified,
            service_id,
            user_id
          `)
          .in('service_id', serviceIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        // Get user profiles separately
        const userIds = [...new Set(data?.map(r => r.user_id) || [])];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const servicesMap = new Map(servicesData.map(s => [s.id, s]));

        const mapped = (data || []).map((r: any) => ({
          id: r.id,
          author: profilesMap.get(r.user_id)?.display_name || 'Anonymous',
          title: servicesMap.get(r.service_id)?.title || 'Service',
          rating: r.rating,
          date: new Date(r.created_at).toLocaleDateString(),
          verified: !!r.verified,
          review: r.review,
        }));
        setVendorReviews(mapped);
      } catch (error) {
        console.error('Failed to load vendor reviews:', error);
        setVendorReviews([]);
      } finally {
        setVendorReviewsLoading(false);
      }
    };

    if (isOpen) {
      loadVendorReviews();
    }
  }, [vendor?.id, isOpen]);

  const handleRequestCoMarketing = () => {
    if (onCoMarketingRequest) {
      onCoMarketingRequest(vendor.id);
    }
    onClose();
  };

  const handleBookConsultation = () => {
    // TODO: Implement consultation booking
    console.log('Book consultation with vendor:', vendor.id);
  };

  const handleViewWebsite = () => {
    if (vendor.website_url) {
      window.open(vendor.website_url, '_blank');
    }
  };

  const renderStarRating = (rating: number, size = "sm") => {
    const sizeClasses = {
      sm: "w-3 h-3",
      md: "w-4 h-4", 
      lg: "w-5 h-5"
    };
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`${sizeClasses[size as keyof typeof sizeClasses]} ${
              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  const isVerified = vendor.is_verified;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-white overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-white" />
        </button>
        
        <div className="h-full overflow-y-auto">
          
          {/* Hero Section */}
          <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10">
          <div className="px-6 pt-8 pb-16">
                <div className="max-w-6xl mx-auto">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-3 mb-6 animate-fade-in">
                    {isVerified ? (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-sm">
                        <Verified className="w-3 h-3 mr-1" />
                        Verified Vendor
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-sm">
                        <X className="w-3 h-3 mr-1" />
                        Not Verified
                      </Badge>
                    )}
                    {vendor.co_marketing_agents && vendor.co_marketing_agents > 5 && (
                      <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-sm">
                        <Trophy className="w-3 h-3 mr-1" />
                        Top Partner
                      </Badge>
                    )}
                  </div>

                  {/* Main Content Grid */}
                  <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-6 animate-fade-in">
                      <h1 className="text-2xl lg:text-3xl font-bold leading-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                        Partner with {vendor.name}
                      </h1>
                      
                      <p className="text-base lg:text-lg text-blue-100 leading-relaxed">
                        {vendor.description || "Join our exclusive co-marketing program and grow your business together"}
                      </p>

                      {vendor.rating && (
                        <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                          <div className="flex items-center gap-2">
                            {renderStarRating(vendor.rating, "lg")}
                            <span className="text-lg font-medium text-white">
                              {vendor.rating}
                            </span>
                          </div>
                          <Separator orientation="vertical" className="h-6 bg-white/30" />
                          <span className="text-sm text-blue-200">
                            {(vendor.review_count || vendorReviews.length || 0) > 0 
                              ? `${vendor.review_count || vendorReviews.length} reviews`
                              : 'No reviews yet'}
                          </span>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                          <div className="text-2xl font-bold text-white">{vendor.co_marketing_agents || 12}</div>
                          <div className="text-xs text-blue-200">Active Partners</div>
                        </div>
                        <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                          <div className="text-2xl font-bold text-white">{vendor.campaigns_funded || 48}</div>
                          <div className="text-xs text-blue-200">Campaigns Funded</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Media/Logo */}
                    <div className="relative animate-fade-in space-y-4">
                      <div className="aspect-video bg-white backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center">
                        {vendor.logo_url ? (
                          <img
                            src={vendor.logo_url}
                            alt={`${vendor.name} logo`}
                            className="max-w-full max-h-full object-contain p-8"
                          />
                        ) : (
                          <div className="text-center space-y-4">
                            <Building className="w-24 h-24 text-white/60 mx-auto" />
                            <p className="text-white/80 text-lg font-medium">{vendor.name}</p>
                          </div>
                        )}
                      </div>

                      {/* 4 Content Spots - Below Main Image */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Content Spot 1 */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg aspect-video flex items-center justify-center group hover:bg-white/20 transition-colors cursor-pointer border border-white/20">
                          <div className="text-center">
                            <Play className="w-5 h-5 text-white mx-auto mb-1 group-hover:scale-110 transition-transform" />
                            <p className="text-xs text-white/90 font-medium">Video</p>
                          </div>
                        </div>

                        {/* Content Spot 2 */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg aspect-video flex items-center justify-center group hover:bg-white/20 transition-colors cursor-pointer border border-white/20">
                          <div className="text-center">
                            <Trophy className="w-5 h-5 text-white mx-auto mb-1 group-hover:scale-110 transition-transform" />
                            <p className="text-xs text-white/90 font-medium">Success</p>
                          </div>
                        </div>

                        {/* Content Spot 3 */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg aspect-video flex items-center justify-center group hover:bg-white/20 transition-colors cursor-pointer border border-white/20">
                          <div className="text-center">
                            <Users className="w-5 h-5 text-white mx-auto mb-1 group-hover:scale-110 transition-transform" />
                            <p className="text-xs text-white/90 font-medium">Reviews</p>
                          </div>
                        </div>

                        {/* Content Spot 4 */}
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg aspect-video flex items-center justify-center group hover:bg-white/20 transition-colors cursor-pointer border border-white/20">
                          <div className="text-center">
                            <Target className="w-5 h-5 text-white mx-auto mb-1 group-hover:scale-110 transition-transform" />
                            <p className="text-xs text-white/90 font-medium">Resources</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Main Content Section - Scrollable */}
          <div className="flex-1 overflow-auto bg-gray-50/50">
            <div className="py-12">
              <div className="max-w-6xl mx-auto px-6">
                <div className="grid lg:grid-cols-3 gap-8">
                  
                  {/* Left Column - Dynamic Questions */}
                  <div className="lg:col-span-2">
                    {questionsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading vendor questions...</p>
                      </div>
                    ) : vendorQuestions && vendorQuestions.length > 0 ? (
                      <Accordion type="single" collapsible value={openItem} onValueChange={setOpenItem} className="space-y-4">
                        {vendorQuestions.map((question, index) => {
                          const colors = [
                            'blue', 'green', 'purple', 'orange', 'red', 'yellow', 'indigo'
                          ];
                          const colorClass = colors[index % colors.length];
                          
                          return (
                            <AccordionItem key={question.id} value={`question-${question.question_number}`}>
                              <AccordionTrigger className={`text-xl font-bold text-gray-900 hover:no-underline border-l-4 border-l-${colorClass}-500 pl-4 bg-white rounded-t-lg shadow-sm`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 bg-${colorClass}-100 rounded-full flex items-center justify-center text-${colorClass}-600 font-bold text-sm`}>
                                    {question.question_number}
                                  </div>
                                  <span className="text-left">{question.question_text}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className={`border-l-4 border-l-${colorClass}-500 pl-4 bg-white rounded-b-lg shadow-sm pt-0`}>
                                <div className="p-6 pt-0">
                                  <div className="space-y-4 pt-[5px]">
                                    <div className="space-y-3">
                                      {question.answer_text ? (
                                        <p className="text-gray-800 leading-relaxed">{question.answer_text}</p>
                                      ) : (
                                        <p className="text-gray-600 text-sm">
                                          This is an important question to consider when evaluating {vendor.name} as a potential partner.
                                        </p>
                                      )}
                                      
                                      {/* Show reviews for question 5 (reputation/proof) */}
                                      {question.question_number === 5 && (
                                        <>
                                          {vendorReviewsLoading ? (
                                            <div className="text-center py-4">
                                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                              <p className="text-gray-500 mt-2 text-sm">Loading reviews...</p>
                                            </div>
                                          ) : vendorReviews.length > 0 ? (
                                            <div className="space-y-3 mt-4">
                                              <h4 className="font-medium text-gray-900">Recent Reviews:</h4>
                                              {vendorReviews.slice(0, 3).map((review) => (
                                                <div key={review.id} className="p-3 bg-gray-50 rounded-lg">
                                                  <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                      <div className="flex items-center gap-2 mb-1">
                                                        {renderStarRating(review.rating)}
                                                        <span className="text-sm font-medium text-gray-900">{review.author}</span>
                                                        {review.verified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                                                      </div>
                                                      <p className="text-xs text-gray-500">{review.date}</p>
                                                    </div>
                                                  </div>
                                                  <p className="text-gray-700 text-sm leading-relaxed">{review.review}</p>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-center py-4">
                                              <Star className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                              <p className="text-gray-500 text-sm">No reviews available yet</p>
                                            </div>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-600">No evaluation questions available for this vendor</div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Simple Action Panel */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-8 space-y-4">
                      
                       <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
                         <CardContent className="p-6">
                           <div className="text-center mb-6">
                             <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to Connect?</h3>
                             <p className="text-gray-600 text-sm">Take the next step with {vendor.name}</p>
                           </div>

                           {/* Action Buttons */}
                           <div className="space-y-3">
                             <Button 
                               onClick={handleBookConsultation}
                               className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
                               size="lg"
                             >
                               <Calendar className="w-4 h-4 mr-2" />
                               Book Consultation
                             </Button>
                             
                             {vendor.website_url && (
                               <Button 
                                 variant="outline" 
                                 className="w-full"
                                 onClick={handleViewWebsite}
                               >
                                 <Building className="w-4 h-4 mr-2" />
                                 View Website
                               </Button>
                             )}

                             <Button 
                               onClick={handleRequestCoMarketing}
                               variant="outline"
                               className="w-full"
                             >
                               <Handshake className="w-4 h-4 mr-2" />
                               Request Partnership
                             </Button>
                           </div>

                           {/* Trust Indicators */}
                           <div className="mt-6 pt-6 border-t border-gray-200">
                             <div className="space-y-3">
                               {isVerified && (
                                 <div className="flex items-center gap-2 text-sm">
                                   <Shield className="w-4 h-4 text-green-500" />
                                   <span className="text-gray-600">Verified Vendor</span>
                                 </div>
                               )}
                               {vendor.service_states && vendor.service_states.length > 0 && (
                                 <div className="flex items-center gap-2 text-sm">
                                   <MapPin className="w-4 h-4 text-blue-500" />
                                   <span className="text-gray-600">Licensed in {vendor.service_states.length} states</span>
                                 </div>
                               )}
                               {vendor.co_marketing_agents && vendor.co_marketing_agents > 0 && (
                                 <div className="flex items-center gap-2 text-sm">
                                   <Users className="w-4 h-4 text-purple-500" />
                                   <span className="text-gray-600">{vendor.co_marketing_agents} active partners</span>
                                 </div>
                               )}
                             </div>
                           </div>
                         </CardContent>
                       </Card>

                        {/* Service Representative Selection */}
                        <ServiceRepresentativeSelector vendor={vendor} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Licenses and Disclaimers Section for Regulated Industries */}
          {(vendor.vendor_type === 'mortgage' || vendor.vendor_type === 'insurance' || vendor.vendor_type === 'title' || vendor.nmls_id || vendor.license_states?.length) && (
            <div className="bg-gray-50/50 border-t">
              <div className="max-w-6xl mx-auto px-6 py-8">
                <Card className="border-amber-200 bg-amber-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Shield className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-amber-800 mb-3">
                          Licenses & Regulatory Information
                        </h3>
                        
                        <div className="space-y-4">
                          {/* NMLS License */}
                          {vendor.nmls_id && (
                            <div className="bg-white rounded-lg p-4 border border-amber-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="h-4 w-4 text-amber-600" />
                                <span className="font-medium text-amber-800">NMLS License</span>
                              </div>
                              <p className="text-sm text-gray-700">
                                NMLS ID: <span className="font-mono font-semibold">{vendor.nmls_id}</span>
                              </p>
                            </div>
                          )}

                          {/* Licensed States */}
                          {vendor.license_states && vendor.license_states.length > 0 && (
                            <div className="bg-white rounded-lg p-4 border border-amber-200">
                              <div className="flex items-center gap-2 mb-2">
                                <MapPin className="h-4 w-4 text-amber-600" />
                                <span className="font-medium text-amber-800">Licensed States</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {vendor.license_states.map((state, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {state}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Industry-Specific Disclaimers */}
                          {vendor.vendor_type === 'mortgage' && (
                            <div className="bg-white rounded-lg p-4 border border-amber-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="font-medium text-amber-800">Important Disclosures</span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-2">
                                <p>
                                  <strong>Equal Housing Lender:</strong> We are committed to fair lending practices and equal housing opportunities for all qualified applicants.
                                </p>
                                <p>
                                  <strong>RESPA Notice:</strong> This referral may result in compensation to Circle Network. All fees and terms will be clearly disclosed before any commitment.
                                </p>
                                <p>
                                  <strong>Rate Disclosure:</strong> Rates and terms are subject to change and depend on individual creditworthiness and property characteristics.
                                </p>
                              </div>
                            </div>
                          )}

                          {vendor.vendor_type === 'insurance' && (
                            <div className="bg-white rounded-lg p-4 border border-amber-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="font-medium text-amber-800">Insurance Disclosures</span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-2">
                                <p>
                                  <strong>Coverage Disclaimer:</strong> Insurance coverage is subject to policy terms, conditions, and exclusions. Review all policy documents carefully.
                                </p>
                                <p>
                                  <strong>Licensing:</strong> All insurance products are offered through licensed agents in accordance with state regulations.
                                </p>
                              </div>
                            </div>
                          )}

                          {vendor.vendor_type === 'title' && (
                            <div className="bg-white rounded-lg p-4 border border-amber-200">
                              <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="font-medium text-amber-800">Title Service Disclosures</span>
                              </div>
                              <div className="text-xs text-gray-600 space-y-2">
                                <p>
                                  <strong>RESPA Compliance:</strong> Settlement services are provided in compliance with the Real Estate Settlement Procedures Act.
                                </p>
                                <p>
                                  <strong>Title Insurance:</strong> Title insurance policies are subject to terms, conditions, and exclusions outlined in the policy.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* General Regulatory Footer */}
                          <div className="pt-2 border-t border-amber-200">
                            <p className="text-xs text-gray-500">
                              For questions about licensing, regulations, or consumer rights, please contact the appropriate state regulatory agency or visit our website for complete disclosure information.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
           )}

           {/* General Disclaimer */}
           <div className="mx-6 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
             <div className="flex items-start gap-3">
               <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
               <div className="text-sm text-gray-600 leading-relaxed">
                 <p className="font-medium text-gray-800 mb-1">Important Disclaimer</p>
                 <div className="space-y-2">
                   <p>
                     Circle Network is not a settlement service provider or broker. We connect real estate professionals with settlement service providers or non-settlement service providers for the purpose of establishing business co-marketing relationships only. We are a directory and you must verify any information yourself.
                   </p>
                   <p>
                     <strong>Non-Endorsement Statement:</strong> Inclusion in the Circle Network Marketplace does not imply endorsement, partnership, or recommendation. Service quality, pricing, and results are the sole responsibility of the vendor.
                   </p>
                   <p>
                     <strong>Due Diligence Responsibility:</strong> Real estate professionals are encouraged to perform their own due diligence before engaging with any vendor listed on this platform.
                   </p>
                   <p>
                     <strong>Compensation Disclosure:</strong> Circle Network may receive compensation from vendors for featured placement, introductions, or other marketing services. This compensation does not influence our presentation of information.
                   </p>
                 </div>
               </div>
             </div>
           </div>
         </div>
         
         {/* Vendor Dashboard Tabs (only for vendor owners) */}
        {isVendorOwner && (
          <Tabs defaultValue="overview" className="border-t bg-white">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger 
                value="overview" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="edit"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
              >
                Edit Funnel
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Active Partners</p>
                        <p className="text-2xl font-bold">{vendor.co_marketing_agents || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Campaigns Funded</p>
                        <p className="text-2xl font-bold">{vendor.campaigns_funded || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Star className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Average Rating</p>
                        <p className="text-2xl font-bold">{vendor.rating || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="edit" className="p-6">
              {isEditingFunnel ? (
                <VendorFunnelEditor
                  vendorId={vendor.id}
                  onSave={() => setIsEditingFunnel(false)}
                  onCancel={() => setIsEditingFunnel(false)}
                />
              ) : (
                <div className="text-center py-12">
                  <Building className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Customize Your Partnership Funnel</h3>
                  <p className="text-gray-600 mb-6">Edit your partnership offerings, pricing, and marketing content</p>
                  <Button onClick={() => setIsEditingFunnel(true)}>
                    Start Editing
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

      </DialogContent>
    </Dialog>
  );
};
