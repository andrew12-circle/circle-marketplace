import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

export function ServiceImportPanel() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [showVendors, setShowVendors] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const { data, error } = await supabase
      .from('vendors')
      .select('id, name, vendor_type, location')
      .order('name');
    
    if (!error && data) {
      setVendors(data);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `title,description,category,retail_price,pro_price,co_pay_price,price_duration,discount_percentage,duration,estimated_roi,vendor_id,tags,is_featured,is_top_pick,requires_quote,image_url,service_provider_id
"CRM Software","Complete customer relationship management solution","Software",99,79,59,"mo",20,12,200,"","crm,software,leads",true,false,false,"https://example.com/crm.jpg",""
"Lead Generation Service","Professional lead generation for real estate","Marketing",299,249,199,"mo",15,3,500,"","leads,marketing,real estate",false,true,false,"","provider-uuid-here"`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Template Downloaded',
      description: 'CSV template has been downloaded to your device',
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
      const { data, error } = await supabase.functions.invoke('import-services', {
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
          description: `Successfully imported ${data.successCount} services`,
        });
      } else {
        toast({
          title: 'Import Completed with Errors',
          description: `${data.successCount} services imported, ${data.errorCount} failed`,
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Error importing services:', error);
      toast({
        title: 'Import Failed',
        description: 'Failed to import services. Please try again.',
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
    a.download = 'import_errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Service Import
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Upload a CSV file to bulk import services. Download the template first to see the required format.
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

            <Dialog open={showVendors} onOpenChange={setShowVendors}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Vendor IDs
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Available Vendor IDs</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Copy the vendor ID for the vendor you want to associate with your services:
                  </p>
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {vendors.map((vendor) => (
                      <div key={vendor.id} className="p-3 border rounded-lg">
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {vendor.vendor_type} • {vendor.location}
                        </div>
                        <div className="text-xs font-mono bg-muted p-1 rounded mt-2 select-all">
                          {vendor.id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
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
              <span>Importing services...</span>
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
          <p><strong>Required fields:</strong> title</p>
          <p><strong>Optional fields:</strong> vendor_id (leave empty for independent services)</p>
          <p><strong>Tags format:</strong> Comma-separated values (e.g., "crm,software,leads")</p>
          <p><strong>Boolean fields:</strong> Use "true" or "false" for is_featured, is_top_pick, requires_quote</p>
        </div>
      </CardContent>
    </Card>
  );
}