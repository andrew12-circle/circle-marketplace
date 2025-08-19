import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Heart, DollarSign, Users, Globe, BookOpen, Home, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const CircleMinistry = () => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const presetAmounts = [25, 50, 100, 250, 500, 1000];

  const ministries = [
    {
      id: 1,
      name: "Global Missions",
      description: "Supporting missionaries and evangelism around the world",
      icon: Globe,
      image: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Local Church Support",
      description: "Strengthening local churches and pastoral ministries",
      icon: Home,
      image: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Educational Ministry",
      description: "Christian education and seminary scholarships",
      icon: BookOpen,
      image: "/placeholder.svg"
    },
    {
      id: 4,
      name: "Community Outreach",
      description: "Feeding programs and community development",
      icon: Users,
      image: "/placeholder.svg"
    }
  ];

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleDonate = async () => {
    const amount = selectedAmount || parseFloat(customAmount);
    
    if (!amount || amount < 1) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid donation amount",
        variant: "destructive"
      });
      return;
    }

    if (!donorEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-donation', {
        body: {
          amount: Math.round(amount * 100), // Convert to cents
          donorName: donorName || 'Anonymous',
          donorEmail,
          userId: user?.id || null
        }
      });

      if (error) throw error;

      // Redirect to Stripe Checkout
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Donation error:', error);
      toast({
        title: "Donation Error",
        description: error.message || "Unable to process donation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="relative bg-primary text-primary-foreground py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary-foreground/10 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Circle Ministry</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            The faith-driven heart of Circle, advancing God's Kingdom through business and generosity
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            501(c)(3) Tax-Deductible Ministry
          </Badge>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-16">
        {/* Our Mission */}
        <section className="text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Our Mission</h2>
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto leading-relaxed">
            Circle is a Kingdom-focused company that believes business can be a powerful force for advancing God's work. 
            We're committed to using our resources, relationships, and influence to support ministries that are 
            transforming lives and communities around the world.
          </p>
        </section>

        {/* How We Give */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">How We Give</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our commitment goes beyond profit margins—it's foundational to who we are.
            </p>
          </div>
          
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-center mb-4">10% of Gross Profits</h3>
              <p className="text-muted-foreground text-center leading-relaxed">
                We tithe 10% of our <strong>gross profits</strong>—not net—to ensure that giving remains a 
                foundational practice. This means that before any other business expenses or distributions, 
                we set aside this portion to support Kingdom work. It's our way of honoring God with the 
                firstfruits of our success.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Who We Support */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Who We Support</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              These are the ministries and causes making a real impact in advancing God's Kingdom.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {ministries.map((ministry) => {
              const Icon = ministry.icon;
              return (
                <Card key={ministry.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">{ministry.name}</h3>
                        <p className="text-muted-foreground leading-relaxed">{ministry.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Join Us in Giving */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Join Us in Giving</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Partner with us in supporting these life-changing ministries. Every contribution makes a difference.
            </p>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Preset Amounts */}
                <div>
                  <label className="block text-sm font-medium mb-3">Choose an amount:</label>
                  <div className="grid grid-cols-3 gap-3">
                    {presetAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? "default" : "outline"}
                        onClick={() => handleAmountSelect(amount)}
                        className="h-12"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">Or enter a custom amount:</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      className="pl-10"
                      min="1"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Donor Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Name (optional):</label>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *:</label>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Donate Button */}
                <Button
                  onClick={handleDonate}
                  disabled={isProcessing || (!selectedAmount && !customAmount)}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-4 h-4 mr-2" />
                      Support These Ministries
                    </>
                  )}
                </Button>

                {/* Tax Deductible Note */}
                <p className="text-sm text-muted-foreground text-center">
                  Circle Ministry is a 501(c)(3) organization. Your donation is tax-deductible to the full extent allowed by law.
                  <br />
                  <strong>EIN:</strong> [Your EIN Number Here]
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default CircleMinistry;