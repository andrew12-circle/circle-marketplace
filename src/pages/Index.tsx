import { useTranslation } from "react-i18next";
import { Marketplace } from "./Marketplace";
import { CartProvider } from "@/contexts/CartContext";
import { LegalFooter } from "@/components/LegalFooter";
import { Header } from "@/components/header";

const Index = () => {
  const { t } = useTranslation();

  return (
    <CartProvider>
      <div className="min-h-screen bg-background safe-area-inset">
        {/* Mobile-Optimized Header */}
        <Header />

        {/* Main Content */}
        <main>
          <Marketplace />
        </main>

        {/* Legal Footer */}
        <div className="safe-area-inset">
          <LegalFooter />
        </div>
      </div>
    </CartProvider>
  );
};

export default Index;
