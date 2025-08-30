// @ts-nocheck
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const MinistrySuccess = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">Thank You for Your Generosity!</h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            Your donation to Circle Ministry has been successfully processed. 
            Your generosity helps us support Kingdom-focused ministries around the world.
          </p>
          
          <div className="bg-muted p-6 rounded-lg mb-8">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-red-500 mr-2" />
              <span className="font-semibold">Your Impact</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your donation will directly support global missions, local church support, 
              educational ministry, and community outreach programs that are making a 
              real difference in advancing God's Kingdom.
            </p>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A tax-deductible receipt has been sent to your email address.
              <br />
              Circle Ministry is a 501(c)(3) organization.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link to="/ministry">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Ministry
                </Link>
              </Button>
              <Button asChild>
                <Link to="/">
                  Return Home
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinistrySuccess;