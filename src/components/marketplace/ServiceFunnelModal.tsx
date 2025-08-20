import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Eye,
  Heart,
  Link,
  MessageSquare,
  Star,
  Trophy,
  TrendingUp,
  Clock,
  DollarSign,
  Shield
} from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  funnel_content?: any;
  pricing_tiers?: any[];
  category?: string;
  is_featured?: boolean;
  is_top_pick?: boolean;
  vendor?: {
    name: string;
    rating: number;
    review_count: number;
    is_verified: boolean;
    website_url?: string;
    logo_url?: string;
  };
}

interface ServiceFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

export const ServiceFunnelModal = ({ isOpen, onClose, service }: ServiceFunnelModalProps) => {
  const { funnel_content: fc, vendor } = service;

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      const formatted = (num / 1000).toFixed(1);
      return formatted.endsWith('.0') ? formatted.slice(0, -2) + 'k' : formatted + 'k';
    }
    return num.toString();
  };

  const renderHeroSection = () => {
    return (
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              {fc?.headline || service.title}
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              {fc?.subHeadline || service.description}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button size="lg">
                {fc?.callToAction?.buttonText || "Get Started"}
              </Button>
              {vendor?.website_url && (
                <Button variant="outline" size="lg" asChild>
                  <a href={vendor.website_url} target="_blank" rel="noopener noreferrer">
                    Visit Website
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderBenefitsSection = () => {
    return (
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-gray-900">Key Benefits</h2>
            <p className="text-gray-600">
              Transform your business and achieve your goals
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {(fc?.benefits || []).map((benefit: any, index: number) => (
              <div key={index} className="p-6 bg-gray-50 rounded-lg shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700 mb-4 mx-auto">
                  {benefit.icon === "TrendingUp" && <TrendingUp className="h-6 w-6" />}
                  {benefit.icon === "Clock" && <Clock className="h-6 w-6" />}
                  {benefit.icon === "DollarSign" && <DollarSign className="h-6 w-6" />}
                  {benefit.icon === "Trophy" && <Trophy className="h-6 w-6" />}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 text-center">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderMediaSection = () => {
    return (
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Explore More</h2>
            <p className="text-lg text-gray-600">
              See how our solution can revolutionize your approach
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {(fc?.media || []).map((media: any, index: number) => (
              <div key={index} className="shadow-lg rounded-xl overflow-hidden">
                {media.type === "image" ? (
                  <img src={media.url} alt={media.title} className="w-full h-64 object-cover" />
                ) : (
                  <video src={media.url} controls className="w-full h-64"></video>
                )}
                <div className="p-4 bg-white">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{media.title}</h3>
                  <p className="text-gray-600">{media.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderProofSection = () => {
    const proofData = fc?.proofItWorks;
    if (!proofData) return null;

    const hasEnabledProof = proofData.testimonials?.enabled || 
                           proofData.caseStudy?.enabled || 
                           proofData.vendorVerification?.enabled;

    if (!hasEnabledProof) return null;

    return (
      <section className="py-16 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Proof It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real results from real agents who transformed their business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Agent Reviews */}
            {proofData.testimonials?.enabled && proofData.testimonials.items?.length > 0 && (
              <div className="bg-white rounded-xl p-8 shadow-lg border border-emerald-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Agent Reviews</h3>
                    <p className="text-gray-600 text-sm">What agents are saying</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {proofData.testimonials.items.slice(0, 2).map((testimonial, index) => (
                    <div key={testimonial.id || index} className="border-l-4 border-yellow-400 pl-4">
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(testimonial.rating || 5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-gray-700 text-sm mb-2 italic">"{testimonial.content}"</p>
                      <p className="text-xs text-gray-500">
                        <strong>{testimonial.name}</strong>
                        {testimonial.company && `, ${testimonial.company}`}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Case Study Results */}
            {proofData.caseStudy?.enabled && proofData.caseStudy.data && (
              <div className="bg-white rounded-xl p-8 shadow-lg border border-emerald-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Case Study</h3>
                    <p className="text-gray-600 text-sm">Real results achieved</p>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {proofData.caseStudy.data.beforeValue}
                      </div>
                      <div className="text-xs text-gray-500">
                        {proofData.caseStudy.data.beforeLabel}
                      </div>
                    </div>
                    <div className="text-xl text-gray-400">→</div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {proofData.caseStudy.data.afterValue}
                      </div>
                      <div className="text-xs text-gray-500">
                        {proofData.caseStudy.data.afterLabel}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      +{proofData.caseStudy.data.percentageIncrease}%
                    </div>
                    <div className="text-sm text-gray-600">
                      in {proofData.caseStudy.data.timeframe}
                    </div>
                  </div>
                  
                  {proofData.caseStudy.data.description && (
                    <p className="text-xs text-gray-500 italic">
                      {proofData.caseStudy.data.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Vendor Verification */}
            {proofData.vendorVerification?.enabled && proofData.vendorVerification.data && (
              <div className="bg-white rounded-xl p-8 shadow-lg border border-emerald-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <Shield className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Verified Vendor</h3>
                    <p className="text-gray-600 text-sm">Quality guaranteed</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {proofData.vendorVerification.data.badges?.length > 0 && (
                    <div className="space-y-2">
                      {proofData.vendorVerification.data.badges.map((badge, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">{badge}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {proofData.vendorVerification.data.description && (
                    <p className="text-sm text-gray-600 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                      {proofData.vendorVerification.data.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  const renderTestimonialsAndStatsSection = () => {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              What Our Clients Say
            </h2>
            <p className="text-lg text-gray-600">
              See how we've helped businesses just like yours succeed
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Testimonials */}
            <div>
              {(fc?.testimonials || []).map((testimonial: any, index: number) => (
                <div
                  key={index}
                  className="bg-gray-50 p-6 rounded-lg shadow-md mb-6"
                >
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating || 5)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-4">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <Avatar className="mr-4">
                      <AvatarImage src="/placeholder-avatar.jpg" alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-gray-500">{testimonial.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              {(fc?.stats || []).map((stat: any, index: number) => (
                <div
                  key={index}
                  className="bg-blue-50 p-6 rounded-lg shadow-md flex flex-col items-center justify-center"
                >
                  <div className="text-4xl font-bold text-blue-700">{stat.value}</div>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              ))}
              {fc?.showSupportStats && (
                <div className="bg-blue-50 p-6 rounded-lg shadow-md flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold text-blue-700">24/7</div>
                  <p className="text-gray-600">Support</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderFAQSections = () => {
    return (
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">
              Everything you need to know about our solution
            </p>
          </div>
          <div className="space-y-6">
            {(fc?.faqSections || []).map((faq: any, index: number) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{faq.title}</h3>
                <p className="text-gray-700">{faq.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderCallToAction = () => {
    return (
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              {fc?.callToAction?.title || "Ready to Transform Your Business?"}
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              {fc?.callToAction?.description ||
                "Join thousands of agents who've already made the switch"}
            </p>
            <Button size="lg">
              {fc?.callToAction?.buttonText || "Book Your Free Demo"}
            </Button>
          </div>
        </div>
      </section>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] rounded-lg shadow-lg p-0 flex flex-col">
        
        <div className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          {renderHeroSection()}

          {/* Benefits Section */}
          {renderBenefitsSection()}

          {/* Media Section */}
          {renderMediaSection()}

          {/* Proof It Works Section - Now Connected */}
          {renderProofSection()}

          {/* Testimonials and Stats */}
          {renderTestimonialsAndStatsSection()}

          {/* FAQ Sections */}
          {renderFAQSections()}

          {/* Call to Action */}
          {renderCallToAction()}
        </div>

        {/* Fixed Bottom Navigation */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} All Rights Reserved
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
