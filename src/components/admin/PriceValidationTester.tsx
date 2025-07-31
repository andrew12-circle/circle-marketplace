import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { 
  validatePrice, 
  extractAndValidatePrice, 
  validatePriceHierarchy,
  safeFormatPrice,
  PriceValidationResult 
} from '@/utils/priceValidation';

export const PriceValidationTester = () => {
  const [testPrice, setTestPrice] = useState('');
  const [retailPrice, setRetailPrice] = useState('');
  const [proPrice, setProPrice] = useState('');
  const [coPayPrice, setCoPayPrice] = useState('');
  const [validationResult, setValidationResult] = useState<PriceValidationResult | null>(null);
  const [hierarchyResult, setHierarchyResult] = useState<{ isValid: boolean; errors: string[] } | null>(null);

  const testSinglePrice = () => {
    const result = extractAndValidatePrice(testPrice, 'retail');
    setValidationResult(result);
  };

  const testPriceHierarchy = () => {
    const result = validatePriceHierarchy(retailPrice, proPrice, coPayPrice);
    setHierarchyResult(result);
  };

  const testCases = [
    { input: '$1,299.99', expected: 'Valid' },
    { input: '1400', expected: 'Valid' },
    { input: '$50,000', expected: 'Warning: High price' },
    { input: 'abc', expected: 'Invalid' },
    { input: '$0.00', expected: 'Invalid: Below minimum' },
    { input: '$150,000', expected: 'Invalid: Above maximum' },
  ];

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Price Validation Testing Dashboard
          </CardTitle>
          <CardDescription>
            Test price validation safeguards to ensure ecommerce pricing accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Single Price Test */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Single Price Validation</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter price to test (e.g., $1,299.99)"
                value={testPrice}
                onChange={(e) => setTestPrice(e.target.value)}
                className="flex-1"
              />
              <Button onClick={testSinglePrice}>Validate Price</Button>
            </div>
            
            {validationResult && (
              <Alert className={validationResult.isValid ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-center gap-2">
                  {validationResult.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    {validationResult.isValid ? 'Valid Price' : 'Invalid Price'}
                  </span>
                  {validationResult.sanitizedPrice && (
                    <Badge variant="outline">
                      Parsed: {safeFormatPrice(validationResult.sanitizedPrice)}
                    </Badge>
                  )}
                </div>
                <AlertDescription className="mt-2">
                  {validationResult.errors.length > 0 && (
                    <div className="space-y-1">
                      <strong>Errors:</strong>
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="text-red-600">• {error}</div>
                      ))}
                    </div>
                  )}
                  {validationResult.warnings.length > 0 && (
                    <div className="space-y-1 mt-2">
                      <strong>Warnings:</strong>
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="text-orange-600">• {warning}</div>
                      ))}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Price Hierarchy Test */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Price Hierarchy Validation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Retail Price"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
              />
              <Input
                placeholder="Pro Price"
                value={proPrice}
                onChange={(e) => setProPrice(e.target.value)}
              />
              <Input
                placeholder="Co-pay Price"
                value={coPayPrice}
                onChange={(e) => setCoPayPrice(e.target.value)}
              />
            </div>
            <Button onClick={testPriceHierarchy}>Validate Hierarchy</Button>
            
            {hierarchyResult && (
              <Alert className={hierarchyResult.isValid ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-center gap-2">
                  {hierarchyResult.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">
                    {hierarchyResult.isValid ? 'Valid Hierarchy' : 'Invalid Hierarchy'}
                  </span>
                </div>
                {hierarchyResult.errors.length > 0 && (
                  <AlertDescription className="mt-2">
                    <strong>Errors:</strong>
                    {hierarchyResult.errors.map((error, index) => (
                      <div key={index} className="text-red-600">• {error}</div>
                    ))}
                  </AlertDescription>
                )}
              </Alert>
            )}
          </div>

          {/* Test Cases */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Predefined Test Cases</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testCases.map((testCase, index) => {
                const result = extractAndValidatePrice(testCase.input, 'retail');
                return (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {testCase.input}
                      </code>
                      <Badge 
                        variant={result.isValid ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {result.isValid ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Expected: {testCase.expected}
                    </div>
                    {result.sanitizedPrice && (
                      <div className="text-xs font-medium">
                        Parsed: {safeFormatPrice(result.sanitizedPrice)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Safeguards Active:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Price extraction with validation</li>
                <li>• Server-side price verification before cart operations</li>
                <li>• Range validation ($0.01 - $100,000)</li>
                <li>• Price hierarchy enforcement</li>
                <li>• Format validation and sanitization</li>
                <li>• Error handling with user feedback</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};