import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, CheckCircle, XCircle, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

interface ImportResult {
  success: boolean;
  message: string;
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export function VendorImportPanel() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const downloadTemplate = () => {
    const csvContent = `name,description,vendor_type,location,contact_email,phone,website_url,service_states,license_states,service_zip_codes,mls_areas,individual_name,individual_title,individual_phone,individual_email,individual_license_number,nmls_id,latitude,longitude,service_radius_miles
"ABC Real Estate Photography","Professional real estate photography services","company","Los Angeles, CA","contact@abcphoto.com","555-123-4567","https://abcphoto.com","CA,NV","CA","90210,90211,90212","CRMLS,CARETS","John Smith","Lead Photographer","555-123-4567","john@abcphoto.com","RE123456","1234567",34.0522,-118.2437,25
"Home Staging Solutions","Complete home staging and design services","individual","Miami, FL","sarah@homestaging.com","305-555-0123","https://homestaging.com","FL","FL","33101,33102,33103","","Sarah Johnson","Certified Home Stager","305-555-0123","sarah@homestaging.com","HS789012","",25.7617,-80.1918,30`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'Vendor CSV template has been downloaded to your device',
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      // Read file content
      const fileContent = await file.text();
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Call the import edge function
      const { data, error } = await supabase.functions.invoke('import-vendors', {
        body: {
          csvContent: fileContent,
          fileName: file.name
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      setImportResult(data);

      if (data.success) {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${data.successCount} vendors`,
        });
      } else {
        toast({
          title: 'Import Completed with Errors',
          description: `${data.successCount} vendors imported, ${data.errorCount} failed`,
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Error importing vendors:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import vendors. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadErrorReport = () => {
    if (!importResult?.errors?.length) return;

    const errorContent = `Row,Error\n${importResult.errors
      .map(err => `${err.row},"${err.error}"`)
      .join('\n')}`;

    const blob = new Blob([errorContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor_import_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Vendor Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file to bulk import vendors. Download the template first to see the required format.
          </p>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={downloadTemplate}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Template
            </Button>
            
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              {isUploading ? 'Importing...' : 'Upload CSV'}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Importing vendors...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {importResult && (
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <h4 className="font-semibold">
                {importResult.success ? 'Import Successful' : 'Import Completed with Errors'}
              </h4>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{importResult.totalRows}</div>
                <div className="text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-green-600">{importResult.successCount}</div>
                <div className="text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-red-600">{importResult.errorCount}</div>
                <div className="text-muted-foreground">Failed</div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Import Errors:</h5>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {importResult.errors.slice(0, 5).map((error, index) => (
                    <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                  {importResult.errors.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      ... and {importResult.errors.length - 5} more errors
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={downloadErrorReport}
                  className="flex items-center gap-2"
                >
                  <Download className="h-3 w-3" />
                  Download Error Report
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Required fields:</strong> name</p>
          <p><strong>Array fields:</strong> Use comma-separated values for service_states, license_states, service_zip_codes, mls_areas</p>
          <p><strong>Vendor types:</strong> "company" or "individual"</p>
          <p><strong>Coordinates:</strong> Use decimal format for latitude/longitude (e.g., 34.0522, -118.2437)</p>
        </div>
      </CardContent>
    </Card>
  );
}