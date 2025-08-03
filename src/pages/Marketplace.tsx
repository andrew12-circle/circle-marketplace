import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export const Marketplace = () => {
  return (
    <ErrorBoundary section="Marketplace">
      <MarketplaceGrid />
    </ErrorBoundary>
  );
};