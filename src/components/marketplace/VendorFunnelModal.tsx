import { useState, useEffect } from "react";
import { VendorFunnelEditor } from './VendorFunnelEditor';
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
  Shield,
  Award,
  Handshake
} from "lucide-react";
import { getRiskBadge, getComplianceAlert, determineServiceRisk } from "./RESPAComplianceSystem";
import { supabase } from "@/integrations/supabase/client";

interface VendorFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  industry?: 'mortgage' | 'insurance' | 'legal' | 'accounting' | 'real-estate' | 'general';
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
    nmls_id?: string;
  };
  onRequestCoMarketing: (vendorId: string, packageType: string, duration: number) => void;
  isVendorView?: boolean; // New prop to indicate if vendor is viewing their own modal
  currentUserId?: string; // To check if current user is the vendor
}

export const VendorFunnelModal = ({ 
  isOpen, 
  onClose, 
  industry = 'general',
  vendor, 
  onRequestCoMarketing,
  isVendorView = false,
  currentUserId
}: VendorFunnelModalProps) => {
  const [selectedPackage, setSelectedPackage] = useState("standard");
  const [quantity, setQuantity] = useState(1);
  const [isEditingFunnel, setIsEditingFunnel] = useState(false);
  const riskLevel = determineServiceRisk(vendor.name, vendor.description);

  // Check if current user is the vendor owner
  const isVendorOwner = currentUserId === vendor.id || isVendorView;

  // Industry-specific configurations
  const industryConfig = {
    mortgage: {
      teamTitle: "Our Loan Officers",
      partnerLabel: "Agent Partners",
      processLabel: "Closings",
      mainMetric: "On-Time Closings Guaranteed",
      successLabel: "Agent Success Stories",
      reviewLabel: "Real Estate Agent Reviews",
      teamMembers: [
        { title: "Senior Loan Officer", metric: "closings", description: "Years of mortgage expertise" },
        { title: "Loan Officer", metric: "closings", description: "Dedicated loan processing" }
      ],
      benefits: [
        { title: "Shared Marketing Costs", desc: "Split advertising expenses 50/50" },
        { title: "Co-Branded Materials", desc: "Professional marketing assets" },
        { title: "Lead Generation", desc: "Access to our client database" },
        { title: "Fast Closings", desc: "Close on time, every time" },
        { title: "Premium Placement", desc: "Priority in referral systems" },
        { title: "Training & Support", desc: "Ongoing partner education" }
      ],
      statsLabels: {
        primary: "Campaigns Successfully Funded",
        secondary: "On-Time Closing Rate", 
        rating: "Agent Rating",
        response: "Average Response Time"
      }
    },
    insurance: {
      teamTitle: "Our Insurance Specialists",
      partnerLabel: "Agent Partners", 
      processLabel: "policies",
      mainMetric: "Claims Processing Excellence",
      successLabel: "Agent Success Stories",
      reviewLabel: "Insurance Agent Reviews",
      teamMembers: [
        { title: "Senior Insurance Specialist", metric: "policies", description: "Years of insurance expertise" },
        { title: "Insurance Agent", metric: "policies", description: "Comprehensive coverage solutions" }
      ],
      benefits: [
        { title: "Shared Marketing Costs", desc: "Split advertising expenses 50/50" },
        { title: "Co-Branded Materials", desc: "Professional marketing assets" },
        { title: "Lead Generation", desc: "Access to our client database" },
        { title: "Fast Claims Processing", desc: "Quick and reliable service" },
        { title: "Premium Placement", desc: "Priority in referral systems" },
        { title: "Training & Support", desc: "Ongoing partner education" }
      ],
      statsLabels: {
        primary: "Campaigns Successfully Funded",
        secondary: "Claims Approval Rate",
        rating: "Agent Rating", 
        response: "Average Response Time"
      }
    },
    legal: {
      teamTitle: "Our Legal Team",
      partnerLabel: "Attorney Partners",
      processLabel: "cases",
      mainMetric: "Successful Case Resolution",
      successLabel: "Attorney Success Stories", 
      reviewLabel: "Attorney Reviews",
      teamMembers: [
        { title: "Senior Attorney", metric: "cases", description: "Years of legal experience" },
        { title: "Associate Attorney", metric: "cases", description: "Specialized legal expertise" }
      ],
      benefits: [
        { title: "Shared Marketing Costs", desc: "Split advertising expenses 50/50" },
        { title: "Co-Branded Materials", desc: "Professional marketing assets" },
        { title: "Lead Generation", desc: "Access to our client database" },
        { title: "Case Management", desc: "Efficient case processing" },
        { title: "Premium Placement", desc: "Priority in referral systems" },
        { title: "Training & Support", desc: "Ongoing partner education" }
      ],
      statsLabels: {
        primary: "Campaigns Successfully Funded",
        secondary: "Case Success Rate",
        rating: "Attorney Rating",
        response: "Average Response Time"
      }
    },
    accounting: {
      teamTitle: "Our Accounting Team",
      partnerLabel: "CPA Partners",
      processLabel: "returns",
      mainMetric: "Accurate Tax Processing",
      successLabel: "CPA Success Stories",
      reviewLabel: "CPA Reviews", 
      teamMembers: [
        { title: "Senior CPA", metric: "returns", description: "Years of accounting expertise" },
        { title: "Tax Specialist", metric: "returns", description: "Tax preparation excellence" }
      ],
      benefits: [
        { title: "Shared Marketing Costs", desc: "Split advertising expenses 50/50" },
        { title: "Co-Branded Materials", desc: "Professional marketing assets" },
        { title: "Lead Generation", desc: "Access to our client database" },
        { title: "Tax Preparation", desc: "Accurate and timely service" },
        { title: "Premium Placement", desc: "Priority in referral systems" },
        { title: "Training & Support", desc: "Ongoing partner education" }
      ],
      statsLabels: {
        primary: "Campaigns Successfully Funded",
        secondary: "Filing Accuracy Rate",
        rating: "CPA Rating",
        response: "Average Response Time"
      }
    },
    'real-estate': {
      teamTitle: "Our Real Estate Team",
      partnerLabel: "Agent Partners",
      processLabel: "transactions",
      mainMetric: "Successful Transactions",
      successLabel: "Agent Success Stories",
      reviewLabel: "Real Estate Agent Reviews",
      teamMembers: [
        { title: "Senior Real Estate Agent", metric: "transactions", description: "Years of real estate expertise" },
        { title: "Real Estate Agent", metric: "transactions", description: "Market knowledge and expertise" }
      ],
      benefits: [
        { title: "Shared Marketing Costs", desc: "Split advertising expenses 50/50" },
        { title: "Co-Branded Materials", desc: "Professional marketing assets" },
        { title: "Lead Generation", desc: "Access to our client database" },
        { title: "Transaction Support", desc: "End-to-end transaction management" },
        { title: "Premium Placement", desc: "Priority in referral systems" },
        { title: "Training & Support", desc: "Ongoing partner education" }
      ],
      statsLabels: {
        primary: "Campaigns Successfully Funded", 
        secondary: "Transaction Success Rate",
        rating: "Agent Rating",
        response: "Average Response Time"
      }
    },
    general: {
      teamTitle: "Our Team",
      partnerLabel: "Partners",
      processLabel: "projects",
      mainMetric: "Service Excellence",
      successLabel: "Partner Success Stories",
      reviewLabel: "Partner Reviews",
      teamMembers: [
        { title: "Senior Specialist", metric: "projects", description: "Years of industry expertise" },
        { title: "Specialist", metric: "projects", description: "Professional service delivery" }
      ],
      benefits: [
        { title: "Shared Marketing Costs", desc: "Split advertising expenses 50/50" },
        { title: "Co-Branded Materials", desc: "Professional marketing assets" },
        { title: "Lead Generation", desc: "Access to our client database" },
        { title: "Service Excellence", desc: "High-quality service delivery" },
        { title: "Premium Placement", desc: "Priority in referral systems" },
        { title: "Training & Support", desc: "Ongoing partner education" }
      ],
      statsLabels: {
        primary: "Campaigns Successfully Funded",
        secondary: "Service Success Rate",
        rating: "Partner Rating", 
        response: "Average Response Time"
      }
    }
  };

  const config = industryConfig[industry];
  
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

  const [vendorReviews, setVendorReviews] = useState<Array<{ id: string; author: string; title?: string; rating: number; date: string; verified: boolean; review: string }>>([]);
  const [vendorReviewsLoading, setVendorReviewsLoading] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      if (!vendor?.id) {
        setVendorReviews([]);
        return;
      }
      setVendorReviewsLoading(true);
      try {
        const { data, error } = await supabase
          .from('service_reviews')
          .select(`
            id,
            rating,
            review,
            created_at,
            verified,
            profiles:profiles!service_reviews_user_id_fkey (display_name, avatar_url),
            services:services!service_reviews_service_id_fkey (vendor_id, title)
          `)
          .eq('services.vendor_id', vendor.id)
          .order('created_at', { ascending: false })
          .limit(10);
        if (error) throw error;
        const mapped = (data || []).map((r: any) => ({
          id: r.id,
          author: r.profiles?.display_name || 'Anonymous',
          title: r.services?.title,
          rating: r.rating,
          date: new Date(r.created_at).toLocaleDateString(),
          verified: !!r.verified,
          review: r.review,
        }));
        setVendorReviews(mapped);
      } catch (e) {
        console.error('Failed to load vendor reviews', e);
        setVendorReviews([]);
      } finally {
        setVendorReviewsLoading(false);
      }
    };
    loadReviews();
  }, [vendor?.id]);

  const handleRequestCoMarketing = () => {
    onRequestCoMarketing(vendor.id, selectedPackage, quantity);
    onClose();
  };

  const handleSaveFunnel = (content: any) => {
    console.log('Saving funnel content for vendor:', vendor.id, content);
    // Here you would save the funnel content to your database
    setIsEditingFunnel(false);
  };

  const handleCancelFunnelEdit = () => {
    setIsEditingFunnel(false);
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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-0 z-[110]">
        <DialogHeader className="sr-only">
          <span>Vendor Partnership Details</span>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Column 1: Media & Videos */}
          <div className="lg:col-span-4">
            <div className="space-y-4">
              {/* Main Media */}
              <div className="relative h-48 rounded-lg overflow-hidden bg-gray-900 border border-gray-200">
                {/* This could be either video or image - using vendor logo by default */}
                <img 
                  src={vendor.logo_url || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=400&fit=crop"}
                  alt={vendor.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2">
                  <Badge className="bg-black/70 text-white text-xs">
                    {vendor.name}
                  </Badge>
                </div>
                {/* Play button overlay for videos - only show if vendor has uploaded a video */}
                {vendor.logo_url && vendor.logo_url.includes('video') && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[16px] border-l-blue-600 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 4 smaller media items below */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    src: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=300&h=200&fit=crop", 
                    alt: "Agent Success Story", 
                    type: "video",
                    title: "Agent Success Stories"
                  },
                  { 
                    src: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=300&h=200&fit=crop", 
                    alt: "Closing Process", 
                    type: "video",
                    title: "Our Closing Process"
                  },
                  { 
                    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=200&fit=crop", 
                    alt: "Communication Process", 
                    type: "image",
                    title: "Communication Tools"
                  },
                  { 
                    src: vendor.logo_url || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&h=200&fit=crop", 
                    alt: vendor.name, 
                    type: "image",
                    title: "Company Overview"
                  }
                ].map((media, index) => (
                  <div key={index} className="relative h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity">
                    <img
                      src={media.src}
                      alt={media.alt}
                      className="w-full h-full object-cover"
                    />
                    {media.type === 'video' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[6px] border-l-blue-600 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-1"></div>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="bg-black/70 text-white text-[10px] px-1 py-0.5 rounded truncate">
                        {media.title}
                      </div>
                    </div>
                    {index === 3 && vendor.is_verified && (
                      <div className="absolute top-1 right-1">
                        <Badge className="bg-green-600 text-white text-xs">
                          <Shield className="w-2 h-2 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Representatives Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-blue-600" />
                  {config.teamTitle}
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
                  {[
                    { name: "Sarah Johnson", experience: "8 years", metric: "200+" },
                    { name: "Mike Rodriguez", experience: "5 years", metric: "150+" },
                    { name: "Jennifer Chen", experience: "10 years", metric: "300+" },
                    { name: "David Smith", experience: "6 years", metric: "180+" },
                    { name: "Lisa Martinez", experience: "12 years", metric: "400+" },
                    { name: "Tom Wilson", experience: "4 years", metric: "120+" },
                    { name: "Amanda Brown", experience: "9 years", metric: "250+" },
                    { name: "Kevin Lee", experience: "7 years", metric: "190+" }
                  ].map((rep, index) => {
                    const memberType = config.teamMembers[index % 2]; // Alternate between the two team member types
                    const emailDomain = vendor.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '.com';
                    const email = `${rep.name.toLowerCase().replace(/\s+/g, '.')}@${emailDomain}`;
                    const phone = `(555) ${(123 + index * 111).toString().slice(0,3)}-${(4567 + index * 11).toString().slice(0,4)}`;
                    
                    return (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {rep.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 text-sm">{rep.name}</p>
                              <p className="text-xs text-gray-600">{memberType.title}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-green-600 font-medium">{rep.metric} {config.processLabel}</p>
                              <p className="text-xs text-gray-500">{rep.experience} exp</p>
                            </div>
                          </div>
                          <div className="flex gap-4 mt-1">
                            <a href={`tel:${phone}`} className="text-xs text-blue-600 hover:underline">{phone}</a>
                            <a href={`mailto:${email}`} className="text-xs text-blue-600 hover:underline truncate">{email}</a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              

            </div>
          </div>

          {/* Column 2: Partnership Details */}
          <div className="lg:col-span-5">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{vendor.name}</h2>
                <p className="text-xl text-blue-600 font-medium mt-1">Strategic Partnership Opportunity</p>
                <div className="flex items-center gap-2 mt-3">
                  {getRiskBadge(riskLevel)}
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {vendor.nmls_id ? `NMLS #${vendor.nmls_id}` : 'NMLS Licensed'}
                  </Badge>
                </div>
              </div>

              <div className="prose prose-sm">
                <p className="text-gray-700 leading-relaxed">
                  {vendor?.description || "A trusted partner in the real estate industry, committed to providing exceptional service and building lasting relationships with our clients and partners."}
                </p>
              </div>

              {/* Service Coverage */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  Service Coverage
                </h3>
                <div className="space-y-2">
                  {vendor.location && (
                    <div>
                      <span className="text-sm font-medium text-gray-900">Location:</span>
                      <span className="text-sm text-gray-600 ml-2">{vendor.location}</span>
                    </div>
                  )}
                  
                  {vendor.service_states && vendor.service_states.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-900">States:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vendor.service_states.map((state, index) => (
                          <Badge key={index} variant="outline" className="text-xs text-blue-600 border-blue-200">
                            {state}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {vendor.mls_areas && vendor.mls_areas.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-900">MLS Areas:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {vendor.mls_areas.slice(0, 4).map((area, index) => (
                          <Badge key={index} variant="outline" className="text-xs text-green-600 border-green-200">
                            {area}
                          </Badge>
                        ))}
                        {vendor.mls_areas.length > 4 && (
                          <Badge variant="outline" className="text-xs text-gray-600 border-gray-200">
                            +{vendor.mls_areas.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {vendor.service_radius_miles && (
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">Radius:</span>
                      <span className="text-sm text-gray-600 ml-2">{vendor.service_radius_miles} miles</span>
                    </div>
                  )}
                  
                  {(!vendor.location) && 
                   (!vendor.service_states || vendor.service_states.length === 0) && 
                   (!vendor.mls_areas || vendor.mls_areas.length === 0) && 
                   !vendor.service_radius_miles && (
                    <div className="text-center py-2">
                      <p className="text-sm text-gray-500">Coverage details available upon contact</p>
                    </div>
                  )}
                </div>
              </div>

               {/* Partnership Benefits */}
               <div className="bg-white border border-gray-200 rounded-lg p-5">
                 <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                   <Handshake className="w-5 h-5 mr-2 text-blue-600" />
                   Partnership Benefits
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {config.benefits.map((benefit, index) => (
                     <div key={index} className="flex items-start space-x-3">
                       <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                       <div>
                         <p className="font-medium text-gray-900">{benefit.title}</p>
                         <p className="text-sm text-gray-600">{benefit.desc}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

            </div>
          </div>

          {/* Column 3: Performance Stats & Contact */}
          <div className="lg:col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-6 shadow-lg">
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">Partnership Performance</h3>
                  <p className="text-sm text-gray-600 mt-1">Why agents choose us</p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleRequestCoMarketing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Handshake className="w-4 h-4 mr-2" />
                    Request Partnership
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                    size="lg"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Consultation
                  </Button>
                  
                  {vendor.website_url && (
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                      size="lg"
                      onClick={() => window.open(vendor.website_url, '_blank')}
                    >
                      <Building className="w-4 h-4 mr-2" />
                      Visit Website
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    className="w-full text-gray-600 hover:text-gray-800"
                    size="sm"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View Agent Testimonials
                  </Button>
                </div>

                 {/* Key Stats - Only show if vendor has meaningful numbers */}
                 {(vendor.co_marketing_agents >= 10 && vendor.campaigns_funded >= 20) && (
                   <div className="space-y-4">
                     <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                       <div className="text-2xl font-bold text-green-700">{vendor.campaigns_funded}</div>
                       <div className="text-sm text-green-600">{config.statsLabels.primary}</div>
                     </div>
                     
                     <div className="grid grid-cols-2 gap-3">
                       <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                         <div className="text-xl font-bold text-blue-700">98%</div>
                         <div className="text-xs text-blue-600">{config.statsLabels.secondary}</div>
                       </div>
                       <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                         <div className="text-xl font-bold text-purple-700">4.9★</div>
                         <div className="text-xs text-purple-600">{config.statsLabels.rating}</div>
                       </div>
                     </div>
                     
                     <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                       <div className="text-xl font-bold text-orange-700">24hr</div>
                       <div className="text-xs text-orange-600">{config.statsLabels.response}</div>
                     </div>
                   </div>
                 )}


              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Tabs */}
        <div className="border-t bg-muted/20">
          <div className="p-6">
            <Tabs defaultValue={vendorReviews.length > 0 ? 'reviews' : 'details'} className="w-full">
              <TabsList className={`grid w-full ${isVendorOwner ? (vendorReviews.length > 0 ? 'grid-cols-5' : 'grid-cols-4') : (vendorReviews.length > 0 ? 'grid-cols-4' : 'grid-cols-3')}`}>
                {vendorReviews.length > 0 && (
                  <TabsTrigger value="reviews">Agent Reviews</TabsTrigger>
                )}
                <TabsTrigger value="details">Company Details</TabsTrigger>
                <TabsTrigger value="qa">Q&A</TabsTrigger>
                <TabsTrigger value="related">Related Services</TabsTrigger>
                {isVendorOwner && (
                  <TabsTrigger value="edit-funnel">Edit Funnel</TabsTrigger>
                )}
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
              
              {vendorReviews.length > 0 && (
                <TabsContent value="reviews" className="mt-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold">{vendor.rating}</div>
                        {renderStarRating(vendor.rating, "lg")}
                        <p className="text-sm text-muted-foreground">{vendorReviews.length} verified reviews</p>
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
                      {vendorReviewsLoading && (
                        <div className="text-sm text-muted-foreground">Loading reviews...</div>
                      )}
                      {!vendorReviewsLoading && vendorReviews.length === 0 && (
                        <div className="text-sm text-muted-foreground">No reviews available.</div>
                      )}
                      {vendorReviews.map((review) => (
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
                              <p className="text-sm mb-1">{review.review}</p>
                              {review.title && (
                                <p className="text-xs text-muted-foreground">Service: {review.title}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              )}
              
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

              {/* Edit Funnel Tab - Only visible to vendor owners */}
              {isVendorOwner && (
                <TabsContent value="edit-funnel" className="mt-6">
                  {isEditingFunnel ? (
                    <VendorFunnelEditor
                      vendorId={vendor.id}
                      onSave={handleSaveFunnel}
                      onCancel={handleCancelFunnelEdit}
                    />
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <div className="space-y-4">
                          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              Customize Your Funnel Page
                            </h3>
                            <p className="text-gray-600 mb-4 max-w-md mx-auto">
                              Create a compelling funnel page that showcases your services, builds trust, and converts visitors into partners.
                            </p>
                          </div>
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Hero Section
                              </div>
                              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Benefits & Features
                              </div>
                              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Media Gallery
                              </div>
                              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Pricing Packages
                              </div>
                              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Social Proof
                              </div>
                              <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Call to Action
                              </div>
                            </div>
                            <Button 
                              onClick={() => setIsEditingFunnel(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2"
                            >
                              Start Editing Funnel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};