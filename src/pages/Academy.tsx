import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Star } from "lucide-react";

// Mock data for books
const topPaidBooks = [
  {
    id: 1,
    title: "The Ultimate Real Estate Guide",
    author: "John Smith",
    cover: "https://images.unsplash.com/photo-1499956638868-115b9621171f?w=300&h=400&fit=crop",
    rank: 1
  },
  {
    id: 2,
    title: "Property Investment Secrets",
    author: "Sarah Johnson",
    cover: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=300&h=400&fit=crop",
    rank: 2
  },
  {
    id: 3,
    title: "Home Staging Mastery",
    author: "Mike Davis",
    cover: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&h=400&fit=crop",
    rank: 3
  },
  {
    id: 4,
    title: "Commercial Real Estate",
    author: "Lisa Anderson",
    cover: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=300&h=400&fit=crop",
    rank: 4
  },
  {
    id: 5,
    title: "Negotiation Tactics",
    author: "Robert Wilson",
    cover: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=300&h=400&fit=crop",
    rank: 5
  },
  {
    id: 6,
    title: "Digital Marketing for Agents",
    author: "Emma Brown",
    cover: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=300&h=400&fit=crop",
    rank: 6
  }
];

const topFreeBooks = [
  {
    id: 7,
    title: "Getting Started in Real Estate",
    author: "Tom Miller",
    cover: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=400&fit=crop"
  },
  {
    id: 8,
    title: "First-Time Buyer's Guide",
    author: "Jennifer Lee",
    cover: "https://images.unsplash.com/photo-1517022812141-23620dba5c23?w=300&h=400&fit=crop"
  },
  {
    id: 9,
    title: "Market Analysis Basics",
    author: "David Clark",
    cover: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=300&h=400&fit=crop"
  },
  {
    id: 10,
    title: "Legal Essentials",
    author: "Maria Garcia",
    cover: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&h=400&fit=crop"
  },
  {
    id: 11,
    title: "Financing Options",
    author: "James Taylor",
    cover: "https://images.unsplash.com/photo-1470813740244-df37b8c1edcb?w=300&h=400&fit=crop"
  },
  {
    id: 12,
    title: "Property Management 101",
    author: "Amanda White",
    cover: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=300&h=400&fit=crop"
  }
];

const categories = [
  "Investment & Finance",
  "Marketing & Sales", 
  "Legal & Contracts",
  "Property Management",
  "Market Analysis"
];

export default function Academy() {
  const [selectedCategory, setSelectedCategory] = useState("Investment & Finance");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Top Books</h1>
          <p className="text-muted-foreground">Discover the best real estate books to advance your career</p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
            <Button variant="outline" className="rounded-full">
              Genre Charts
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Top Paid Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Top Paid</h2>
            <Button variant="ghost" size="sm">
              See All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topPaidBooks.map((book) => (
              <Card key={book.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full aspect-[3/4] object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 left-2 bg-background/90 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      {book.rank}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{book.title}</h3>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <div className="flex items-center mt-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">(4.8)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Top Free Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Top Free</h2>
            <Button variant="ghost" size="sm">
              See All
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topFreeBooks.map((book, index) => (
              <Card key={book.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  <div className="relative">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="w-full aspect-[3/4] object-cover rounded-t-lg"
                    />
                    <div className="absolute top-2 left-2 bg-background/90 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <Badge className="absolute top-2 right-2 bg-green-500 hover:bg-green-600">
                      FREE
                    </Badge>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">{book.title}</h3>
                    <p className="text-xs text-muted-foreground">{book.author}</p>
                    <div className="flex items-center mt-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">(4.6)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Collections */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Featured Collections</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Bestsellers</h3>
                    <p className="text-sm text-muted-foreground">Most popular books</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Discover the most loved books by real estate professionals</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">New Releases</h3>
                    <p className="text-sm text-muted-foreground">Latest publications</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Stay current with the newest real estate insights and strategies</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Editor's Choice</h3>
                    <p className="text-sm text-muted-foreground">Curated selection</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">Hand-picked books recommended by industry experts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}