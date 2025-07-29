import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-circle-primary to-circle-primary-light rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Circle</h1>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                Login
              </Link>
              <Button asChild className="bg-gradient-to-r from-circle-primary to-circle-primary-light text-white">
                <Link to="/">Join Free & Explore</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            Marketing for Real Estate, Mastered.
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            Find vetted creative partners and manage your marketing with powerful tools designed to help you grow.
          </p>
          
          <div className="inline-block">
            <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 px-4 py-2">
              For Real Estate Agents
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Find the Plan That's Right for You</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're just getting started or scaling a top-producing team, Circle has a plan to help you grow.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Pricing Table Header */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="p-6"></div>
              
              {/* Circle Starter */}
              <div className="bg-white rounded-lg border p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Circle Starter</h3>
                <div className="text-3xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-sm text-muted-foreground mb-6">Agents exploring the marketplace</p>
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                  Create Free Account
                </Button>
              </div>

              {/* Circle Pro (Solo) - Most Popular */}
              <div className="bg-gradient-to-b from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6 text-center relative">
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white">
                  Most Popular
                </Badge>
                <h3 className="text-xl font-semibold mb-2">Circle Pro (Solo)</h3>
                <div className="text-3xl font-bold mb-4">$47<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-sm text-muted-foreground mb-6">Solo agents automating their marketing</p>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Start Your Free Trial
                </Button>
              </div>

              {/* Circle Pro (Team) */}
              <div className="bg-white rounded-lg border p-6 text-center">
                <h3 className="text-xl font-semibold mb-2">Circle Pro (Team)</h3>
                <div className="text-3xl font-bold mb-4">$97<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                <p className="text-sm text-muted-foreground mb-6">Teams building a growth system</p>
                <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                  Start Your Free Trial
                </Button>
              </div>
            </div>

            {/* Features Table */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="grid grid-cols-4 gap-0">
                {/* Row Headers */}
                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-muted-foreground">Price</span>
                </div>
                <div className="p-4 border-r border-b text-center font-bold">$0/month</div>
                <div className="p-4 border-r border-b text-center font-bold bg-blue-50">$47/month</div>
                <div className="p-4 border-b text-center font-bold">$97/month</div>

                <div className="bg-gray-50 p-4 border-r border-b">
                  <span className="font-medium text-muted-foreground">Best For</span>
                </div>
                <div className="p-4 border-r border-b text-center text-sm">Agents exploring the marketplace</div>
                <div className="p-4 border-r border-b text-center text-sm bg-blue-50">Solo agents automating their marketing</div>
                <div className="p-4 border-b text-center text-sm">Teams building a growth system</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};