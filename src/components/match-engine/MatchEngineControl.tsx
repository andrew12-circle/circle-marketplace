import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, Zap } from 'lucide-react';

interface MatchRequest {
  service_category: string;
  budget?: number;
  urgency: 'low' | 'medium' | 'high';
  location?: string;
  specific_requirements?: Record<string, any>;
}

export const MatchEngineControl = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [request, setRequest] = useState<MatchRequest>({
    service_category: '',
    urgency: 'medium'
  });
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const handleCreateRequest = async () => {
    if (!request.service_category) {
      toast({
        title: "Missing Information",
        description: "Please select a service category",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('match-engine', {
        body: {
          action: 'create_request',
          data: {
            ...request,
            agent_id: user.id
          }
        }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Request Created! ⚡",
        description: `Found ${data.matches} potential matches for your request`,
      });

      // Get detailed results
      if (data.request_id) {
        const statusResponse = await supabase.functions.invoke('match-engine', {
          body: {
            action: 'get_request_status',
            data: { request_id: data.request_id }
          }
        });

        if (!statusResponse.error) {
          setResults(statusResponse.data);
        }
      }

    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Request Failed",
        description: "Failed to create match request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindMatches = async (requestId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('match-engine', {
        body: {
          action: 'find_matches',
          data: { request_id: requestId }
        }
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Matches Found! 🎯",
        description: `Found ${data.matches.length} matching vendors`,
      });

    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: "Search Failed",
        description: "Failed to find matches. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Match Engine Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="service_category">Service Category</Label>
              <Select
                value={request.service_category}
                onValueChange={(value) => setRequest(prev => ({ ...prev, service_category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crm">CRM</SelectItem>
                  <SelectItem value="leads">Lead Generation</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="websites">Websites</SelectItem>
                  <SelectItem value="transaction_management">Transaction Management</SelectItem>
                  <SelectItem value="coaching">Coaching</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="virtual_assistant">Virtual Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select
                value={request.urgency}
                onValueChange={(value: 'low' | 'medium' | 'high') => setRequest(prev => ({ ...prev, urgency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Flexible timeline</SelectItem>
                  <SelectItem value="medium">Medium - Within 2 weeks</SelectItem>
                  <SelectItem value="high">High - ASAP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input
                id="budget"
                type="number"
                placeholder="Monthly budget in USD"
                value={request.budget || ''}
                onChange={(e) => setRequest(prev => ({ 
                  ...prev, 
                  budget: e.target.value ? Number(e.target.value) : undefined 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="City, State or ZIP"
                value={request.location || ''}
                onChange={(e) => setRequest(prev => ({ ...prev, location: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="requirements">Specific Requirements (Optional)</Label>
            <Textarea
              id="requirements"
              placeholder="Describe any specific needs or preferences..."
              className="min-h-[80px]"
              onChange={(e) => {
                try {
                  const requirements = e.target.value ? { description: e.target.value } : undefined;
                  setRequest(prev => ({ ...prev, specific_requirements: requirements }));
                } catch (error) {
                  // Invalid JSON, ignore
                }
              }}
            />
          </div>

          <Button 
            onClick={handleCreateRequest} 
            disabled={isLoading || !request.service_category}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Find Matching Vendors
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Match Results</CardTitle>
          </CardHeader>
          <CardContent>
            {results.matches && results.matches.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Found {results.matches.length} matching vendors
                </p>
                
                <div className="grid gap-4">
                  {results.matches.map((match: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{match.vendor_name}</h4>
                        <div className="text-right">
                          <div className="text-sm font-medium text-primary">
                            {match.match_score}% Match
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Est. Response: {match.estimated_response_time}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {match.match_reasons.map((reason: string, reasonIndex: number) => (
                          <div key={reasonIndex} className="text-sm text-muted-foreground flex items-center gap-1">
                            <div className="w-1 h-1 bg-primary rounded-full"></div>
                            {reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : results.request ? (
              <div className="space-y-2">
                <p className="text-sm">Request Status: <span className="capitalize font-medium">{results.status}</span></p>
                <p className="text-sm text-muted-foreground">Request ID: {results.request.id}</p>
                
                {results.request_id && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleFindMatches(results.request_id)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Refresh Matches
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {results.message || 'Request processed successfully'}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};