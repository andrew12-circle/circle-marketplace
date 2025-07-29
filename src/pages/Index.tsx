import { useState } from "react";
import { NavigationTabs } from "@/components/NavigationTabs";
import { Marketplace } from "./Marketplace";
import { Academy } from "./Academy";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Crown } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"marketplace" | "academy">("marketplace");
  
  // Mock user state - replace with actual auth
  const isProUser = false;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-circle-primary to-circle-primary-light rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Circle</h1>
                <p className="text-sm text-muted-foreground">Grow Smarter</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!isProUser && (
                <Button className="bg-circle-accent hover:bg-circle-accent/90 text-foreground">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro
                </Button>
              )}
              {isProUser && (
                <Badge variant="secondary" className="bg-circle-accent text-foreground">
                  <Crown className="w-4 h-4 mr-1" />
                  Circle Pro
                </Badge>
              )}
              <Button variant="outline">Sign In</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-circle-primary/10 via-background to-circle-accent/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-circle-primary to-circle-accent bg-clip-text text-transparent">
            Grow Smarter with Circle
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The ultimate platform combining real estate growth tools and on-demand education. 
            Get Circle Pro pricing and accelerate your success.
          </p>
          
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-circle-primary" />
              <span className="text-sm font-medium">10% Off All Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-circle-accent" />
              <span className="text-sm font-medium">Pro Content Access</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-circle-success" />
              <span className="text-sm font-medium">Co-Marketing Options</span>
            </div>
          </div>
          
          <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </section>

      {/* Main Content */}
      <main>
        {activeTab === "marketplace" ? <Marketplace /> : <Academy />}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 Circle. Empowering real estate professionals to grow smarter.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
