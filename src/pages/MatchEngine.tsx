import React from 'react';
import { MatchEngineControl } from '@/components/match-engine/MatchEngineControl';
import { VendorMatchDashboard } from '@/components/match-engine/VendorMatchDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Target, Users } from 'lucide-react';

export const MatchEngine = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          Match Engine
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Intelligent vendor matching system that connects agents with the right service providers 
          based on requirements, budget, location, and performance metrics.
        </p>
      </div>

      <Tabs defaultValue="agent" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="agent" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Agent Requests
          </TabsTrigger>
          <TabsTrigger value="vendor" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendor Dashboard
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            System Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-6">
          <MatchEngineControl />
        </TabsContent>

        <TabsContent value="vendor" className="space-y-6">
          <VendorMatchDashboard />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                    <div>
                      <div className="font-medium">Agent Requests</div>
                      <div className="text-muted-foreground">Agents submit service requests with requirements</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                    <div>
                      <div className="font-medium">Smart Matching</div>
                      <div className="text-muted-foreground">AI evaluates vendor rules and compatibility</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                    <div>
                      <div className="font-medium">Auto Routing</div>
                      <div className="text-muted-foreground">Best matches are routed to qualified vendors</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-1.5"></div>
                    <div>
                      <div className="font-medium">Decision Handling</div>
                      <div className="text-muted-foreground">Vendors accept/decline with automatic fallbacks</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Matching Criteria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Service Category</span>
                    <span className="text-muted-foreground">Required</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget Range</span>
                    <span className="text-muted-foreground">±20 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Location Match</span>
                    <span className="text-muted-foreground">±15 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vendor Rating</span>
                    <span className="text-muted-foreground">+5 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Urgency Boost</span>
                    <span className="text-muted-foreground">+5 points</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity Check</span>
                    <span className="text-muted-foreground">Required</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Performance Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Match Accuracy</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Response Rate</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span>Avg Response Time</span>
                      <span className="font-medium">4.2h</span>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};