import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Inbox, BarChart3, Send } from "lucide-react";
import { LenderRequestForm } from "@/components/lender/LenderRequestForm";
import { VendorInbox } from "@/components/lender/VendorInbox";

export default function LenderMarketplace() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Lender Marketplace</h1>
        <p className="text-muted-foreground">
          Connect agents with qualified lenders through our intelligent matching system
        </p>
      </div>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Agent Requests
          </TabsTrigger>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Vendor Inbox
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <LenderRequestForm />
        </TabsContent>

        <TabsContent value="inbox">
          <VendorInbox />
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center py-12 text-muted-foreground">
            Analytics dashboard coming soon...
          </div>
        </TabsContent>

        <TabsContent value="admin">
          <div className="text-center py-12 text-muted-foreground">
            Admin panel coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}