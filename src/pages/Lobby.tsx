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

      {/* Advice Engine Section - Main Content */}
      <section className="flex-1 py-12 md:py-16 px-4">
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

      {/* Footer */}
      <LegalFooter />
    </div>
  );
};

export default Lobby;
