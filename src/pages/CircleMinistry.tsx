// @ts-nocheck
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, Users, Globe, ArrowRight, Play, DollarSign, BookOpen, Home } from 'lucide-react';

export default function CircleMinistry() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('');
  const [donorEmail, setDonorEmail] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const presetAmounts = [25, 50, 100, 250, 500, 1000];

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
    
    if (!amount || amount <= 0) {
      toast.error('Please select or enter a valid donation amount');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-donation', {
        body: {
          amount: Math.round(amount * 100),
          donorName: donorName || 'Anonymous',
          donorEmail: donorEmail || null,
          metadata: {
            source: 'circle-ministry',
            type: 'ministry-donation'
          }
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast.error('Failed to process donation. Please try again.');
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Donation error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Outline Text */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="relative mb-16">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-8 relative">
              <span 
                className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
                style={{
                  WebkitTextStroke: '2px transparent',
                  WebkitTextFillColor: 'transparent',
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary))/0.6)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text'
                }}
              >
                CIRCLE
              </span>
              <br />
              <span 
                className="text-transparent"
                style={{
                  WebkitTextStroke: '2px hsl(var(--foreground))',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                MINISTRY
              </span>
            </h1>
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-3xl -z-10" />
          </div>
          
          {/* Video Section */}
          <div className="relative max-w-4xl mx-auto mb-12">
            <div className="relative bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm border border-primary/20">
              <div className="aspect-video bg-muted/50 rounded-2xl flex items-center justify-center relative overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary))/0.3,transparent_70%)]" />
                <Button 
                  size="lg" 
                  className="relative z-10 h-20 w-20 rounded-full bg-primary hover:bg-primary/90 shadow-2xl hover:scale-110 transition-all duration-300"
                >
                  <Play className="h-10 w-10 ml-1" />
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground font-medium">Click for sound • 2:30</p>
            </div>
          </div>
        </div>
      </section>

      {/* What is Circle Ministry Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tight">
              WHAT IS CIRCLE MINISTRY?
            </h2>
            <div className="max-w-4xl mx-auto space-y-8 text-lg text-muted-foreground leading-relaxed">
              <p className="text-xl">
                Any organization that commits at least 10% of its profits to supporting 
                ministries and communities is a <strong className="text-foreground">Circle Partner</strong>. 
                By giving supporters the choice to direct profits toward meaningful causes, 
                we create deeper, more valuable connections.
              </p>
              <p className="text-xl">
                At Circle Ministry, we are Circle Partners. We give <strong className="text-4xl text-primary font-bold block my-4">40%-50% of our profits</strong> to 
                making an impact in communities worldwide. For us, purpose and people have always 
                come before profit. While we're pioneering this approach, we hope we're not the only ones. 
                We invite all organizations to become Circle Partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Circle Ministry vs Traditional Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold text-center text-foreground mb-20 tracking-tight">
            CIRCLE MINISTRY VS. TRADITIONAL GIVING
          </h2>
          <div className="max-w-4xl mx-auto text-lg text-muted-foreground leading-relaxed space-y-8">
            <p className="text-xl">
              Put simply, Circle Partners do all the same things traditional organizations do 
              <strong className="text-foreground text-2xl"> PLUS</strong> they give a significant amount of their profits 
              back into their local and global communities.
            </p>
            <p className="text-xl">
              For example, Circle Ministry has supported over <strong className="text-foreground text-2xl">15 ministries</strong> with 
              sustainable funding while maintaining exceptional service and community engagement.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Numbers with Modern Design */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-8 tracking-tight">
              MINISTRIES THAT MEAN MORE
            </h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-2xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500">
                  <Heart className="h-12 w-12 text-primary-foreground" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Ministries that mean more impact:</h3>
              <p className="text-lg text-muted-foreground mb-6">
                We've given our vessel to fund much-needed infrastructure, 
                education and support to underserved areas globally.
              </p>
              <div className="text-5xl font-black text-primary mb-2">$377K</div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Given</p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-2xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500">
                  <Users className="h-12 w-12 text-primary-foreground" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Ministries that mean more schools:</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Circle Schools network committed to teaching world-class academics 
                and values where families need education options most.
              </p>
              <div className="text-5xl font-black text-primary mb-2">4</div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Schools Supported</p>
            </div>
            
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-2xl mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500">
                  <Globe className="h-12 w-12 text-primary-foreground" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Ministries that mean more giving:</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Circle's match giving program amplifies generosity. When supporters give 
                to causes important to them, we match it dollar for dollar.
              </p>
              <div className="text-5xl font-black text-primary mb-2">$150K</div>
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Matched Giving</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Ministries Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-8">
              WHO WE SUPPORT
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              These are the ministries and causes making a real impact in advancing God's Kingdom.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Globe,
                name: "Global Missions",
                description: "Supporting missionaries and evangelism around the world, bringing hope to unreached communities."
              },
              {
                icon: Home,
                name: "Local Church Support",
                description: "Strengthening local churches and pastoral ministries in underserved communities."
              },
              {
                icon: BookOpen,
                name: "Educational Ministry",
                description: "Christian education and seminary scholarships for future ministry leaders."
              },
              {
                icon: Users,
                name: "Community Outreach",
                description: "Feeding programs and community development initiatives that transform neighborhoods."
              }
            ].map((ministry, index) => {
              const Icon = ministry.icon;
              return (
                <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-background/80 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                        <Icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
                          {ministry.name}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed text-lg">
                          {ministry.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,hsl(var(--primary))/0.1,transparent_70%)]" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="relative mb-16">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-3xl transform rotate-1 blur-sm" />
            <div className="relative bg-background/90 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-primary/20">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-8">
                Together we've done this much <span className="text-primary">GOOD</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                If you're a supporter, partner, or community member who's engaged with Circle Ministry, 
                you are the reason we're able to give so sustainably and make a positive, 
                generational difference in our communities. Whether or not you realize it, 
                you've played a significant role in helping us create a brighter future for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Donation Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-2xl border-0 bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary))/0.1,transparent_70%)]" />
            <CardHeader className="text-center pb-12 relative z-10">
              <CardTitle className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Make Your Impact
              </CardTitle>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join us in creating meaningful change. Your donation directly supports 
                ministries transforming lives worldwide.
              </p>
            </CardHeader>
            <CardContent className="space-y-10 relative z-10">
              {/* Preset amounts */}
              <div>
                <label className="text-sm font-bold text-foreground mb-6 block uppercase tracking-widest">
                  Choose Amount
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {presetAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedAmount === amount ? "default" : "outline"}
                      onClick={() => handleAmountSelect(amount)}
                      className="h-16 text-xl font-bold hover:scale-105 transition-all duration-300"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <label className="text-sm font-bold text-foreground mb-4 block uppercase tracking-widest">
                  Or Enter Custom Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-6 w-6" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-6 py-6 border-2 border-border rounded-xl bg-background/80 backdrop-blur-sm text-foreground text-xl font-bold focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder-muted-foreground"
                  />
                </div>
              </div>

              {/* Donor information */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-foreground mb-4 block uppercase tracking-widest">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-6 py-5 border-2 border-border rounded-xl bg-background/80 backdrop-blur-sm text-foreground text-lg focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder-muted-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground mb-4 block uppercase tracking-widest">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="w-full px-6 py-5 border-2 border-border rounded-xl bg-background/80 backdrop-blur-sm text-foreground text-lg focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all duration-300 placeholder-muted-foreground"
                  />
                </div>
              </div>

              {/* Donate button */}
              <Button
                onClick={handleDonate}
                disabled={isProcessing || (!selectedAmount && !customAmount)}
                className="w-full h-20 text-2xl font-bold group relative overflow-hidden"
                size="lg"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-300 group-hover:from-primary/90 group-hover:to-primary" />
                <span className="relative z-10 flex items-center justify-center">
                  {isProcessing ? 'Processing...' : (
                    <>
                      Donate Now 
                      <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                    </>
                  )}
                </span>
              </Button>

              {/* Tax deductibility note */}
              <div className="text-center pt-8 border-t border-border/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Circle Ministry is a 501(c)(3) nonprofit organization. 
                  Your donation may be tax-deductible to the full extent allowed by law.
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  EIN: [To be provided]
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}