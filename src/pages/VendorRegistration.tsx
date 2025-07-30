import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const VendorRegistration = () => {
  console.log('VendorRegistration component is rendering');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Vendor Registration</CardTitle>
          <CardDescription>This is a test version</CardDescription>
        </CardHeader>
        <CardContent>
          <p>If you can see this, the route is working!</p>
          <Button asChild className="w-full mt-4">
            <Link to="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorRegistration;