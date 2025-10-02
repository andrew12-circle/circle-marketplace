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

      {/* Advice Engine Section - Top */}
      <section className="py-12 md:py-16 px-4 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <NeedAdviceHome />
          </motion.div>
        </div>
      </section>

      {/* Category Selection Section */}
      <section className="py-12 md:py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Marketplace
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore wholesale pricing, verified ROI, and real reviews across industries.
            </p>
          </motion.div>

          {/* Category Icons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8 justify-items-center max-w-4xl mx-auto">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                className="w-full"
              >
                <Link to={category.route}>
                  <div className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-accent/50 transition-all duration-200 cursor-pointer">
                    {/* Icon Circle */}
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-200">
                      <category.icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                    </div>
                    
                    {/* Label */}
                    <span className="text-sm font-medium text-center leading-tight group-hover:text-primary transition-colors">
                      {category.title}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <LegalFooter />
    </div>
  );
};

export default Lobby;
