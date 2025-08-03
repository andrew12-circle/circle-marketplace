import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const SignatureWorkflowDebug: React.FC<{ coPayRequestId: string }> = ({ coPayRequestId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testQuery = async () => {
    setLoading(true);
    try {
      console.log('Testing co-pay request query with ID:', coPayRequestId);
      
      // Test basic co-pay request
      const { data: basicData, error: basicError } = await supabase
        .from('co_pay_requests')
        .select('*')
        .eq('id', coPayRequestId)
        .single();
      
      console.log('Basic co-pay request data:', basicData);
      console.log('Basic co-pay request error:', basicError);
      
      // Test with relationships
      const { data: relationData, error: relationError } = await supabase
        .from('co_pay_requests')
        .select(`
          *,
          agent:profiles!agent_id(display_name, email),
          vendor:profiles!vendor_id(display_name, email, business_name),
          service:services(title)
        `)
        .eq('id', coPayRequestId)
        .single();
      
      console.log('Relation query data:', relationData);
      console.log('Relation query error:', relationError);
      
      // Test profiles table access
      if (basicData) {
        const { data: agentProfile, error: agentError } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', basicData.agent_id)
          .single();
        
        console.log('Agent profile:', agentProfile);
        console.log('Agent profile error:', agentError);
        
        const { data: vendorProfile, error: vendorError } = await supabase
          .from('profiles')
          .select('display_name, email, business_name')
          .eq('user_id', basicData.vendor_id)
          .single();
        
        console.log('Vendor profile:', vendorProfile);
        console.log('Vendor profile error:', vendorError);
      }
      
      setData({
        basic: basicData,
        basicError,
        relation: relationData,
        relationError
      });
      
    } catch (error) {
      console.error('Debug query error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (coPayRequestId) {
      testQuery();
    }
  }, [coPayRequestId]);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug: Signature Workflow Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={testQuery} disabled={loading}>
          {loading ? 'Testing...' : 'Test Query'}
        </Button>
        
        {data && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-medium">Basic Data:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(data.basic, null, 2)}
              </pre>
              {data.basicError && (
                <p className="text-red-600 text-sm">Error: {JSON.stringify(data.basicError)}</p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium">Relation Data:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                {JSON.stringify(data.relation, null, 2)}
              </pre>
              {data.relationError && (
                <p className="text-red-600 text-sm">Error: {JSON.stringify(data.relationError)}</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};