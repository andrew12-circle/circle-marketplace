import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle,
  Clock,
  DollarSign,
  HelpCircle,
  TrendingUp,
  User,
  Users,
  Verified,
  Video,
  Globe2,
  LayoutDashboard,
  Star,
  CalendarCheck,
  LucideIcon,
  Mail,
  Phone,
  Link,
  Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Circle } from "lucide-react";

interface ServiceFunnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
}

export const ServiceFunnelModal = ({ isOpen, onClose, service }: ServiceFunnelModalProps) => {
  const [showSupportStats, setShowSupportStats] = useState(false);
  const isVerified = service?.vendor?.is_verified;

  useEffect(() => {
    setShowSupportStats(!!service?.funnel_content?.showSupportStats);
  }, [service?.funnel_content?.showSupportStats]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="pt-6 pb-2 px-6 border-b">
            <DialogTitle className="text-lg font-semibold">
              {service.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="relative">
              {/* Hero Section */}
              <div 
                className="relative h-96 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white overflow-hidden"
                style={{
                  backgroundImage: service.image_url ? `linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(147, 51, 234, 0.9)), url(${service.image_url})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="container relative z-10 p-8">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <h1 className="text-4xl font-extrabold tracking-tight">
                        {service.funnel_content?.headline || service.title}
                      </h1>
                      <p className="text-lg text-blue-100">
                        {service.funnel_content?.subheadline || service.description}
                      </p>
                      <div className="flex items-center gap-4">
                        {service.vendor?.logo_url && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={service.vendor.logo_url} alt={service.vendor.name} />
                            <AvatarFallback>{service.vendor.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <div className="text-sm font-medium">{service.vendor?.name}</div>
                          <div className="flex items-center gap-1 text-xs text-blue-200">
                            {Array(5)
                              .fill(null)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < service.vendor?.rating ? 'text-yellow-400' : 'text-gray-400'
                                    }`}
                                />
                              ))}
                            ({service.vendor?.review_count || 0} reviews)
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {isVerified && (
                        <Badge variant="outline">
                          <Verified className="w-4 h-4 mr-2" />
                          Verified Vendor
                        </Badge>
                      )}
                      <Button asChild>
                        <a href={service.vendor?.website_url} target="_blank" rel="noopener noreferrer">
                          <Globe2 className="w-4 h-4 mr-2" />
                          Visit Website
                        </a>
                      </Button>
                    </div>
                  </div>

                    {/* Quick Stats */}
                    <div className={`grid ${showSupportStats ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
                       <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                         <div className="text-2xl font-bold">{isVerified && service.estimated_roi ? `${service.estimated_roi}%` : 'TBD'}</div>
                         <div className="text-xs text-blue-200">Avg ROI</div>
                       </div>
                       <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                         <div className="text-2xl font-bold">{isVerified && service.duration ? service.duration : 'TBD'}</div>
                         <div className="text-xs text-blue-200">Time to Results</div>
                       </div>
                       <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                         <div className="text-2xl font-bold">{isVerified && service.setup_time ? service.setup_time : 'TBD'}</div>
                         <div className="text-xs text-blue-200">Time to Setup</div>
                       </div>
                       {showSupportStats && <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                           <div className="text-2xl font-bold">{service.vendor?.support_hours || 'Business Hours'}</div>
                           <div className="text-xs text-blue-200">Support Hours</div>
                         </div>}
                     </div>
                </div>
              </div>

              {/* Media Gallery */}
              {service.funnel_content?.media && service.funnel_content.media.length > 0 && (
                <section className="container py-8">
                  <h2 className="text-2xl font-semibold mb-4">Media Gallery</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {service.funnel_content.media.map((item: any) => (
                      <Card key={item.url}>
                        <CardHeader>
                          <CardTitle className="text-sm">{item.title}</CardTitle>
                          <CardDescription className="text-xs">{item.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          {item.type === 'image' ? (
                            <img src={item.url} alt={item.title} className="w-full h-48 object-cover rounded-md" />
                          ) : (
                            <video src={item.url} controls className="w-full h-48 object-cover rounded-md" />
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Benefits Section */}
              {service.funnel_content?.benefits && service.funnel_content.benefits.length > 0 && (
                <section className="container py-8">
                  <h2 className="text-2xl font-semibold mb-4">Key Benefits</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {service.funnel_content.benefits.map((benefit: any) => (
                      <Card key={benefit.title}>
                        <CardContent className="space-y-2">
                          <div className="text-3xl">
                            {benefit.icon === 'TrendingUp' && <TrendingUp />}
                            {benefit.icon === 'Clock' && <Clock />}
                            {benefit.icon === 'DollarSign' && <DollarSign />}
                          </div>
                          <h3 className="text-lg font-semibold">{benefit.title}</h3>
                          <p className="text-sm text-muted-foreground">{benefit.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Pricing Tiers */}
              {service.pricing_tiers && service.pricing_tiers.length > 0 && (
                <section className="container py-8">
                  <h2 className="text-2xl font-semibold mb-4">Pricing Options</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {service.pricing_tiers.map((tier: any) => (
                      <Card key={tier.id} className={tier.isPopular ? 'border-2 border-primary' : ''}>
                        <CardHeader className="space-y-1">
                          <CardTitle className="text-xl font-semibold">{tier.name}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">{tier.description}</CardDescription>
                          {tier.badge && <Badge className="absolute top-2 right-2">{tier.badge}</Badge>}
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="text-3xl font-bold">
                            ${tier.price}
                            <span className="text-sm text-muted-foreground">/{tier.duration}</span>
                          </div>
                          <ul className="list-disc pl-4 space-y-1">
                            {tier.features.map((feature: any) => (
                              <li key={feature.id} className="text-sm">
                                {feature.included ? (
                                  <CheckCircle className="inline-block w-4 h-4 mr-1 text-green-500" />
                                ) : (
                                  <Circle className="inline-block w-4 h-4 mr-1 text-gray-400" />
                                )}
                                {feature.text}
                              </li>
                            ))}
                          </ul>
                          <Button>{tier.buttonText}</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Testimonials Section */}
              {service.funnel_content?.testimonials && service.funnel_content.testimonials.length > 0 && (
                <section className="container py-8">
                  <h2 className="text-2xl font-semibold mb-4">What Our Clients Say</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {service.funnel_content.testimonials.map((testimonial: any) => (
                      <Card key={testimonial.name}>
                        <CardHeader>
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage alt={testimonial.name} />
                              <AvatarFallback>{testimonial.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg font-semibold">{testimonial.name}</CardTitle>
                              <CardDescription className="text-sm text-muted-foreground">{testimonial.title}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{testimonial.content}</p>
                          <div className="flex items-center mt-2">
                            {Array(5)
                              .fill(null)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-400'
                                    }`}
                                />
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* FAQ Section */}
              {service.funnel_content?.faqSections && service.funnel_content.faqSections.length > 0 && (
                <section className="container py-8">
                  <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
                  <Accordion type="single" collapsible>
                    {service.funnel_content.faqSections.map((faq: any) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger>{faq.title}</AccordionTrigger>
                        <AccordionContent>{faq.content}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              )}

              {/* Call to Action Section */}
              {service.funnel_content?.callToAction && (
                <section className="container py-8 text-center">
                  <h2 className="text-3xl font-bold mb-4">{service.funnel_content.callToAction.title}</h2>
                  <p className="text-lg text-muted-foreground mb-6">{service.funnel_content.callToAction.description}</p>
                  <Button size="lg">{service.funnel_content.callToAction.buttonText}</Button>
                </section>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
