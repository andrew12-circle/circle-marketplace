import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationTabs } from "@/components/NavigationTabs";
import { UserMenu } from "@/components/UserMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocationSwitcher } from "@/components/LocationSwitcher";
import { LegalFooter } from "@/components/LegalFooter";
import { RealtorView } from "@/components/command-center/RealtorView";
import { SSPView } from "@/components/command-center/SSPView";
import { User, Search } from "lucide-react";

const CommandCenter = () => {
  const { user, profile } = useAuth();
  const [activeView, setActiveView] = useState<'realtor' | 'ssp'>('realtor');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">Circle</h1>
              <NavigationTabs />
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <LocationSwitcher />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Command Center</h1>
          <p className="text-muted-foreground">
            Deep performance analytics and agent tracking system
          </p>
        </div>

        {/* View Toggle */}
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'realtor' | 'ssp')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="realtor" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              🧑‍💼 Realtor View
            </TabsTrigger>
            <TabsTrigger value="ssp" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              🔎 SSP View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtor" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Self Performance Dashboard</h2>
              <p className="text-muted-foreground text-sm">
                Comprehensive view of your transaction history, performance metrics, and professional network
              </p>
            </div>
            <RealtorView />
          </TabsContent>

          <TabsContent value="ssp" className="space-y-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Search, Sort & Profile (SSP)</h2>
              <p className="text-muted-foreground text-sm">
                Advanced agent search and analysis tools for competitive intelligence and prospecting
              </p>
            </div>
            <SSPView />
          </TabsContent>
        </Tabs>
      </div>

      <LegalFooter />
    </div>
  );
};

export default CommandCenter;