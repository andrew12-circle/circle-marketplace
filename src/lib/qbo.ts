import { supabase } from '@/integrations/supabase/client';
import { ensureFreshToken, getConnectionForOrg } from './qbo-auth';

export interface CompanyInfo {
  QueryResponse: {
    CompanyInfo: Array<{
      Id: string;
      CompanyName: string;
      LegalName: string;
      Address: any;
      Phone: any;
      Email: any;
      WebAddr: any;
      FiscalYearStartMonth: string;
      TaxForm: string;
    }>;
  };
}

export interface QBOInvoice {
  Line: Array<{
    Amount: number;
    DetailType: string;
    SalesItemLineDetail: {
      ItemRef: {
        value: string;
        name: string;
      };
    };
  }>;
  CustomerRef: {
    value: string;
  };
}

export async function getCompanyInfo(orgId: string): Promise<CompanyInfo> {
  const connection = await getConnectionForOrg(orgId);
  if (!connection) {
    throw new Error('No QuickBooks connection found');
  }

  const accessToken = await ensureFreshToken(connection);
  const apiBase = 'https://sandbox-quickbooks.api.intuit.com'; // Use environment in production
  
  const response = await fetch(
    `${apiBase}/v3/company/${connection.realm_id}/companyinfo/${connection.realm_id}?minorversion=70`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('QBO API error:', errorText);
    throw new Error(`QuickBooks API error: ${response.status}`);
  }

  return response.json();
}

export async function createInvoice(
  orgId: string, 
  customerRefValue: string, 
  amount: number, 
  description: string
): Promise<any> {
  const connection = await getConnectionForOrg(orgId);
  if (!connection) {
    throw new Error('No QuickBooks connection found');
  }

  const accessToken = await ensureFreshToken(connection);
  const apiBase = 'https://sandbox-quickbooks.api.intuit.com'; // Use environment in production

  const invoice: QBOInvoice = {
    Line: [
      {
        Amount: amount,
        DetailType: 'SalesItemLineDetail',
        SalesItemLineDetail: {
          ItemRef: {
            value: '1', // Default service item - should be configurable
            name: 'Services'
          }
        }
      }
    ],
    CustomerRef: {
      value: customerRefValue
    }
  };

  const response = await fetch(
    `${apiBase}/v3/company/${connection.realm_id}/invoice?minorversion=70`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(invoice),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('QBO invoice creation error:', errorText);
    throw new Error(`Failed to create invoice: ${response.status}`);
  }

  return response.json();
}

// Placeholder functions for future implementation
export async function createBill(orgId: string, vendorRefValue: string, amount: number, description: string): Promise<any> {
  throw new Error('createBill not implemented yet');
}

export async function recordPayment(orgId: string, invoiceId: string, amount: number): Promise<any> {
  throw new Error('recordPayment not implemented yet');
}

export async function listCustomers(orgId: string): Promise<any> {
  throw new Error('listCustomers not implemented yet');
}