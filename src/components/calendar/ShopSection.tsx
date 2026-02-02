import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  ShoppingCart, 
  ExternalLink, 
  Star,
  Leaf,
  Bug,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  category: 'fertilizer' | 'pesticide' | 'seed' | 'equipment';
  crops: string[];
  pests?: string[];
  description: string;
  buyUrl: string;
  recommended?: boolean;
}

const shopProducts: Product[] = [
  {
    id: '1',
    name: 'DAP (Di-Ammonium Phosphate)',
    brand: 'IFFCO',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300',
    price: 1350,
    originalPrice: 1500,
    rating: 4.5,
    category: 'fertilizer',
    crops: ['Wheat', 'Rice', 'Maize', 'Cotton'],
    description: 'High-quality phosphorus fertilizer for root development and flowering',
    buyUrl: 'https://www.amazon.in/s?k=DAP+fertilizer',
    recommended: true,
  },
  {
    id: '2',
    name: 'Urea (46% Nitrogen)',
    brand: 'NFL',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=300',
    price: 266,
    rating: 4.3,
    category: 'fertilizer',
    crops: ['Rice', 'Wheat', 'Sugarcane', 'Vegetables'],
    description: 'Essential nitrogen fertilizer for vegetative growth',
    buyUrl: 'https://www.amazon.in/s?k=Urea+fertilizer',
    recommended: true,
  },
  {
    id: '3',
    name: 'NPK 20-20-20',
    brand: 'Coromandel',
    image: 'https://images.unsplash.com/photo-1592722182674-0a7c5b5d8e38?w=300',
    price: 1800,
    rating: 4.7,
    category: 'fertilizer',
    crops: ['Tomato', 'Potato', 'Onion', 'Fruits'],
    description: 'Balanced nutrition for all growth stages',
    buyUrl: 'https://www.amazon.in/s?k=NPK+fertilizer',
    recommended: true,
  },
  {
    id: '4',
    name: 'Potash (MOP)',
    brand: 'KRIBHCO',
    image: 'https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=300',
    price: 1700,
    rating: 4.4,
    category: 'fertilizer',
    crops: ['Cotton', 'Sugarcane', 'Banana', 'Grapes'],
    description: 'Potassium fertilizer for fruit quality and disease resistance',
    buyUrl: 'https://www.amazon.in/s?k=MOP+fertilizer',
  },
  {
    id: '5',
    name: 'Imidacloprid 17.8% SL',
    brand: 'Bayer',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300',
    price: 450,
    rating: 4.6,
    category: 'pesticide',
    crops: ['Cotton', 'Rice', 'Vegetables'],
    pests: ['Aphids', 'Jassids', 'Whitefly', 'Thrips'],
    description: 'Systemic insecticide for sucking pests',
    buyUrl: 'https://www.amazon.in/s?k=Imidacloprid+insecticide',
    recommended: true,
  },
  {
    id: '6',
    name: 'Chlorpyrifos 20% EC',
    brand: 'UPL',
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=300',
    price: 380,
    rating: 4.2,
    category: 'pesticide',
    crops: ['Rice', 'Wheat', 'Cotton', 'Vegetables'],
    pests: ['Stem Borer', 'Termites', 'Cutworms'],
    description: 'Broad-spectrum insecticide for soil and foliar pests',
    buyUrl: 'https://www.amazon.in/s?k=Chlorpyrifos+pesticide',
  },
  {
    id: '7',
    name: 'Mancozeb 75% WP',
    brand: 'Indofil',
    image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=300',
    price: 320,
    rating: 4.4,
    category: 'pesticide',
    crops: ['Potato', 'Tomato', 'Grapes', 'Mango'],
    pests: ['Late Blight', 'Downy Mildew', 'Anthracnose'],
    description: 'Protective fungicide for leaf diseases',
    buyUrl: 'https://www.amazon.in/s?k=Mancozeb+fungicide',
    recommended: true,
  },
  {
    id: '8',
    name: 'Neem Oil (Organic)',
    brand: 'Organic India',
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=300',
    price: 250,
    rating: 4.5,
    category: 'pesticide',
    crops: ['All Crops'],
    pests: ['Aphids', 'Mites', 'Whitefly', 'Caterpillars'],
    description: 'Natural organic pesticide safe for beneficial insects',
    buyUrl: 'https://www.amazon.in/s?k=Neem+oil+organic',
  },
  {
    id: '9',
    name: 'Vermicompost (Organic)',
    brand: 'Nature Bio',
    image: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=300',
    price: 500,
    rating: 4.8,
    category: 'fertilizer',
    crops: ['All Crops'],
    description: 'Premium organic compost for soil health and microbial activity',
    buyUrl: 'https://www.amazon.in/s?k=Vermicompost+organic',
    recommended: true,
  },
  {
    id: '10',
    name: 'Humic Acid',
    brand: 'Humigreen',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=300',
    price: 650,
    rating: 4.3,
    category: 'fertilizer',
    crops: ['Rice', 'Wheat', 'Vegetables', 'Fruits'],
    description: 'Soil conditioner for improved nutrient uptake',
    buyUrl: 'https://www.amazon.in/s?k=Humic+acid+fertilizer',
  },
];

interface ShopSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShopSection({ isOpen, onClose }: ShopSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'fertilizer' | 'pesticide'>('all');

  const filteredProducts = useMemo(() => {
    let products = shopProducts;

    // Filter by category
    if (activeFilter !== 'all') {
      products = products.filter(p => p.category === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.crops.some(c => c.toLowerCase().includes(query)) ||
        p.pests?.some(pest => pest.toLowerCase().includes(query))
      );
    }

    // Sort: recommended first, then by rating
    return products.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return b.rating - a.rating;
    });
  }, [searchQuery, activeFilter]);

  const handleBuy = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Farm Shop
            </DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Quality fertilizers and pesticides for your crops
          </p>
        </DialogHeader>

        <div className="px-6 py-4 border-b bg-muted/30">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by product, brand, crop, or pest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('all')}
            >
              All Products
            </Button>
            <Button
              variant={activeFilter === 'fertilizer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('fertilizer')}
              className="gap-1"
            >
              <Leaf className="h-3 w-3" />
              Fertilizers
            </Button>
            <Button
              variant={activeFilter === 'pesticide' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter('pesticide')}
              className="gap-1"
            >
              <Bug className="h-3 w-3" />
              Pesticides
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[55vh] px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex gap-3">
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.recommended && (
                        <Badge className="absolute -top-1 -left-1 text-xs bg-amber-500">
                          ⭐ Top Pick
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 p-3 pr-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
                          <p className="text-xs text-muted-foreground">{product.brand}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{product.rating}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {product.crops.slice(0, 3).map((crop) => (
                          <Badge key={crop} variant="secondary" className="text-xs py-0">
                            {crop}
                          </Badge>
                        ))}
                        {product.crops.length > 3 && (
                          <Badge variant="secondary" className="text-xs py-0">
                            +{product.crops.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-primary">₹{product.price}</span>
                          {product.originalPrice && (
                            <span className="text-xs text-muted-foreground line-through">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleBuy(product.buyUrl)}
                        >
                          Buy Now
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-2 text-center py-12">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No products found matching your search</p>
                <Button variant="link" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>
                  Clear filters
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
