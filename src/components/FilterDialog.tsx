import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Filter, X } from "lucide-react";

interface FilterDialogProps {
  onFiltersChange: (filters: { priceRange: [number, number]; organicOnly: boolean; featuredOnly: boolean; categories: string[] }) => void;
}

const FilterDialog = ({ onFiltersChange }: FilterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const categories = ["vegetables", "fruits", "grains", "herbs", "dairy", "meat"];

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const applyFilters = () => {
    onFiltersChange({
      priceRange,
      organicOnly,
      featuredOnly,
      categories: selectedCategories
    });
    setOpen(false);
  };

  const clearFilters = () => {
    setPriceRange([0, 100]);
    setOrganicOnly(false);
    setFeaturedOnly(false);
    setSelectedCategories([]);
    onFiltersChange({
      priceRange: [0, 100],
      organicOnly: false,
      featuredOnly: false,
      categories: []
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Filter className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Filter Products
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Price Range */}
          <div className="space-y-3">
            <Label>Price Range (R{priceRange[0]} - R{priceRange[1]})</Label>
            <Slider
              value={priceRange}
              onValueChange={(value) => setPriceRange([value[0], value[1]])}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategories.includes(category) ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => toggleCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Organic Only */}
          <div className="flex items-center justify-between">
            <Label>Organic Products Only</Label>
            <Switch checked={organicOnly} onCheckedChange={setOrganicOnly} />
          </div>

          {/* Featured Only */}
          <div className="flex items-center justify-between">
            <Label>Featured Products Only</Label>
            <Switch checked={featuredOnly} onCheckedChange={setFeaturedOnly} />
          </div>

          <Button onClick={applyFilters} className="w-full">
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;