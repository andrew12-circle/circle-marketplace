import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export const ProhibitedItems = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Prohibited Items Policy</h1>
          <p className="text-muted-foreground mt-2">Items not allowed on CircleMarketplace.io</p>
        </div>

        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Listing prohibited items may result in immediate listing removal and account suspension.
            When in doubt, contact our support team before listing.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Prohibited Items and Services</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <h2>Illegal Items</h2>
            <ul>
              <li>Stolen goods or items of questionable ownership</li>
              <li>Counterfeit, replica, or unauthorized copies</li>
              <li>Items that violate intellectual property rights</li>
              <li>Illegal drugs, drug paraphernalia, or controlled substances</li>
              <li>Weapons, ammunition, or explosive materials</li>
              <li>Items that violate export/import laws</li>
            </ul>

            <h2>Restricted Items</h2>
            <ul>
              <li><strong>Electronics:</strong> Items without proper certifications</li>
              <li><strong>Medical Devices:</strong> Prescription medical equipment</li>
              <li><strong>Automotive:</strong> Recalled auto parts or safety equipment</li>
              <li><strong>Food & Beverages:</strong> Perishable items, alcohol, supplements</li>
              <li><strong>Cosmetics:</strong> Expired or unlabeled beauty products</li>
            </ul>

            <h2>Adult Content</h2>
            <ul>
              <li>Adult or sexual content of any kind</li>
              <li>Adult services or escort services</li>
              <li>Items primarily intended for sexual purposes</li>
              <li>Pornographic materials</li>
            </ul>

            <h2>Animals and Wildlife</h2>
            <ul>
              <li>Live animals of any kind</li>
              <li>Animal parts from endangered species</li>
              <li>Ivory, coral, or other protected materials</li>
              <li>Pet breeding services</li>
            </ul>

            <h2>Financial and Legal Services</h2>
            <ul>
              <li>Financial advice or investment services</li>
              <li>Legal advice or representation</li>
              <li>Tax preparation services</li>
              <li>Credit repair or debt relief services</li>
              <li>Get-rich-quick schemes or pyramid schemes</li>
            </ul>

            <h2>Digital and Virtual Items</h2>
            <ul>
              <li>Digital currency or cryptocurrency</li>
              <li>Virtual game currency or items</li>
              <li>Digital products without proper licensing</li>
              <li>Accounts for online services or platforms</li>
            </ul>

            <h2>Hazardous Materials</h2>
            <ul>
              <li>Chemicals, pesticides, or toxic substances</li>
              <li>Flammable or explosive materials</li>
              <li>Radioactive materials</li>
              <li>Asbestos-containing materials</li>
            </ul>

            <h2>Offensive and Inappropriate Content</h2>
            <ul>
              <li>Items promoting hate speech or discrimination</li>
              <li>Nazi or hate group memorabilia</li>
              <li>Items glorifying violence</li>
              <li>Offensive or inappropriate imagery</li>
            </ul>

            <h2>Services Restrictions</h2>
            <ul>
              <li>Multi-level marketing (MLM) opportunities</li>
              <li>Work-from-home schemes</li>
              <li>Ticket resale above face value</li>
              <li>Academic dishonesty services (paper writing, etc.)</li>
              <li>Identity verification bypass services</li>
            </ul>

            <h2>Age-Restricted Items</h2>
            <ul>
              <li>Tobacco products and e-cigarettes</li>
              <li>Alcoholic beverages</li>
              <li>Adult-oriented items</li>
              <li>Items requiring age verification</li>
            </ul>

            <h2>Brand and Copyright Violations</h2>
            <ul>
              <li>Unauthorized use of brand names or logos</li>
              <li>Bootleg or unauthorized merchandise</li>
              <li>Items infringing on copyrighted material</li>
              <li>Trademark violations</li>
            </ul>

            <h2>Reporting Prohibited Items</h2>
            <p>
              If you encounter prohibited items on our platform, please report them immediately:
            </p>
            <ul>
              <li>Click the "Report this listing" button on the item page</li>
              <li>Select the appropriate violation category</li>
              <li>Provide additional details if necessary</li>
              <li>Our team will review and take action within 24 hours</li>
            </ul>

            <h2>Consequences</h2>
            <p>Violations may result in:</p>
            <ul>
              <li><strong>First Offense:</strong> Warning and listing removal</li>
              <li><strong>Second Offense:</strong> 7-day account suspension</li>
              <li><strong>Third Offense:</strong> 30-day account suspension</li>
              <li><strong>Severe Violations:</strong> Permanent account termination</li>
            </ul>

            <h2>Appeal Process</h2>
            <p>
              If you believe your item was incorrectly flagged as prohibited, you may appeal
              the decision by contacting policy-appeals@circlemarketplace.io within 10 days
              of the action.
            </p>

            <h2>Questions?</h2>
            <p>
              For questions about what items are allowed, contact us at
              policy-questions@circlemarketplace.io before listing.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};