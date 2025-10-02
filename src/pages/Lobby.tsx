import { Link } from "react-router-dom";
import { Home, Briefcase, Heart, Users, Zap } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LegalFooter } from "@/components/LegalFooter";
import NeedAdviceHome from "@/components/concierge/NeedAdviceHome";
import { motion } from "framer-motion";

const categories = [
  {
    id: "home-property",
    icon: Home,
    title: "Home & Property",
    description: "Realtors, Loan Officers, Insurance, Contractors (HVAC, Plumbing, Roofing, etc.), Moving, Staging, Pest Control, Security",
    route: "/marketplace?category=home-property",
  },
  {
    id: "business-professional",
    icon: Briefcase,
    title: "Business & Professional Services",
    description: "B2B Insurance, Financial Advisors, Accounting, LegalTech, Marketing, IT, HR, Corporate Training",
    route: "/marketplace?category=business-professional",
  },
  {
    id: "healthcare-wellness",
    icon: Heart,
    title: "Healthcare & Wellness",
    description: "Healthcare Staffing, Dental & Outpatient, Senior Care, Behavioral Health, Alternative Medicine, Medical Devices, Fitness",
    route: "/marketplace?category=healthcare-wellness",
  },
  {
    id: "community-lifestyle",
    icon: Users,
    title: "Community & Lifestyle",
    description: "Nonprofit/Faith-Based, Education/Tutoring, Childcare, Event Services",
    route: "/marketplace?category=community-lifestyle",
  },
  {
    id: "growth-emerging",
    icon: Zap,
    title: "Growth & Emerging Sectors",
    description: "Green Energy (solar, EV, retrofits), Commercial Construction Subs, Logistics & Fleet, Specialty Vehicle Upfits",
    route: "/marketplace?category=growth-emerging",
  },
];

const Lobby = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <Header showCart={false} showTourButton={false} />
      </div>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
          >
            Choose Your Marketplace
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Explore wholesale pricing, verified ROI, and real reviews across industries.
          </motion.p>
        </div>
      </section>

      {/* Category Grid */}
      <section className="py-8 px-4 pb-24">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <Link to={category.route}>
                  <div className="group relative bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 hover:border-primary/50 h-full flex flex-col">
                    {/* Icon */}
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                      <category.icon className="w-8 h-8 text-primary" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                      {category.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow">
                      {category.description}
                    </p>

                    {/* Hover Arrow */}
                    <div className="mt-6 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-medium">Explore</span>
                      <svg
                        className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advice Engine Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <NeedAdviceHome />
        </div>
      </section>

      {/* Footer */}
      <LegalFooter />
    </div>
  );
};

export default Lobby;
