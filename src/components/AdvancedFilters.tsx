import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";

export interface FilterOptions {
  categories: string[];
  isOrganic: boolean | null;
  isFeatured: boolean | null;
  priceRange: [number, number];
  availability: 'all' | 'inStock' | 'lowStock';
}

interface AdvancedFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  categories: string[];
  priceRange: [number, number];
  activeFiltersCount: number;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
  priceRange,
  activeFiltersCount
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({ ...filters, categories: newCategories });
  };

  const handlePriceRangeChange = (value: number[]) => {
    if (value && value.length === 2) {
      onFiltersChange({ ...filters, priceRange: [value[0], value[1]] });
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      categories: [],
      isOrganic: null,
      isFeatured: null,
      priceRange: priceRange,
      availability: 'all'
    });
  };

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {hasActiveFilters && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs rounded-full"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Categories */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Categories</Label>
            <div className="space-y-2">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={filters.categories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <Label 
                    htmlFor={`category-${category}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {category}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Organic Filter */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Product Type</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="organic"
                  checked={filters.isOrganic === true}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ 
                      ...filters, 
                      isOrganic: checked ? true : null 
                    })
                  }
                />
                <Label htmlFor="organic" className="text-sm font-normal cursor-pointer">
                  🌱 Organic Only
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={filters.isFeatured === true}
                  onCheckedChange={(checked) => 
                    onFiltersChange({ 
                      ...filters, 
                      isFeatured: checked ? true : null 
                    })
                  }
                />
                <Label htmlFor="featured" className="text-sm font-normal cursor-pointer">
                  ⭐ Featured Only
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Price Range</Label>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceRangeChange}
                max={priceRange[1]}
                min={priceRange[0]}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-2">
                <span>R{filters.priceRange[0]}</span>
                <span>R{filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Availability */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Availability</Label>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'All Products' },
                { value: 'inStock', label: 'In Stock (>10 units)' },
                { value: 'lowStock', label: 'Low Stock (1-10 units)' }
              ].map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`availability-${option.value}`}
                    checked={filters.availability === option.value}
                    onCheckedChange={() => 
                      onFiltersChange({ 
                        ...filters, 
                        availability: option.value as FilterOptions['availability']
                      })
                    }
                  />
                  <Label 
                    htmlFor={`availability-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4">
            <Button onClick={() => setIsOpen(false)} className="w-full">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFilters;