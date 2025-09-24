import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  MapPin,
  Navigation,
  Search,
  Filter,
  Locate,
  Map,
  Compass,
  Route,
  Clock,
  Phone,
  Globe,
  Star,
  Heart,
  Share2,
  Navigation2,
  Car,
  Truck,
  Bike,
  MapPinIcon,
  Settings,
  Eye,
  EyeOff,
  Layers,
  Satellite,
  Mountain,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Upload,
  List,
  Grid,
  Crosshair,
  AlertCircle,
  CheckCircle,
  Info,
  Calendar,
  Users,
  Package,
  Leaf
} from 'lucide-react';

interface Farm {
  id: string;
  name: string;
  owner: {
    id: string;
    name: string;
    image_url?: string;
  };
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  categories: string[];
  rating: number;
  reviews_count: number;
  distance?: number;
  is_open: boolean;
  opening_hours: {
    [key: string]: string;
  };
  delivery_zones: {
    name: string;
    radius_km: number;
    fee: number;
  }[];
  featured_products: string[];
  certifications: string[];
  created_at: string;
  updated_at: string;
}

interface DeliveryZone {
  id: string;
  farm_id: string;
  name: string;
  coordinates: [number, number][];
  delivery_fee: number;
  min_order_amount: number;
  delivery_time: string;
  is_active: boolean;
}

interface MapSettings {
  show_farms: boolean;
  show_delivery_zones: boolean;
  show_user_location: boolean;
  map_style: 'street' | 'satellite' | 'terrain';
  auto_locate: boolean;
  distance_unit: 'km' | 'miles';
  default_radius: number;
}

const LocationServices: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(25);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [activeTab, setActiveTab] = useState<'farms' | 'delivery' | 'settings'>('farms');
  const [mapSettings, setMapSettings] = useState<MapSettings>({
    show_farms: true,
    show_delivery_zones: true,
    show_user_location: true,
    map_style: 'street',
    auto_locate: true,
    distance_unit: 'km',
    default_radius: 25
  });
  const [isLocating, setIsLocating] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const categories = [
    'Vegetables',
    'Fruits',
    'Dairy',
    'Meat & Poultry',
    'Grains & Cereals',
    'Herbs & Spices',
    'Organic',
    'Free Range',
    'Hydroponic',
    'Greenhouse'
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadFarms();
    loadDeliveryZones();
    
    if (mapSettings.auto_locate) {
      getCurrentLocation();
    }
  }, [user, searchRadius, filterCategory]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      return;
    }

    setIsLocating(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });
      setLocationPermission('granted');

      toast({
        title: "Location Found",
        description: `Your location has been updated.`,
      });
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationPermission('denied');
      
      toast({
        title: "Location Access Denied",
        description: "Please enable location access to find nearby farms.",
        variant: "destructive",
      });
    } finally {
      setIsLocating(false);
    }
  };

  const loadFarms = async () => {
    setIsLoading(true);
    try {
      // Fetch farms from database
      const { data: farmsData, error } = await supabase
        .from('farms')
        .select(`
          *,
          profiles!farms_farmer_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading farms:', error);
        setFarms([]);
        return;
      }

      // Transform database data to match interface
      const transformedFarms: Farm[] = (farmsData || []).map(farm => ({
        id: farm.id,
        name: farm.name,
        owner: {
          id: farm.farmer_id,
          name: farm.profiles?.name || 'Farm Owner',
          image_url: farm.profiles?.image_url || '/placeholder.svg'
        },
        description: farm.description || 'No description available',
        location: {
          latitude: farm.latitude || 0,
          longitude: farm.longitude || 0,
          address: farm.location || 'Location not specified',
          city: 'City',
          province: 'Province',
          postal_code: '0000',
          country: 'South Africa'
        },
        contact: {
          phone: farm.profiles?.phone || '',
          email: farm.profiles?.email || ''
        },
        categories: ['General'],
        rating: 4.5,
        reviews_count: 0,
        distance: userLocation ? calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          farm.latitude || 0, 
          farm.longitude || 0
        ) : 0,
        is_open: true,
        opening_hours: {},
        delivery_zones: [],
        featured_products: [],
        certifications: [],
        created_at: farm.created_at,
        updated_at: farm.updated_at
      }));

      let filteredFarms = transformedFarms;

      if (filterCategory !== 'all') {
        filteredFarms = filteredFarms.filter(farm => 
          farm.categories.includes(filterCategory)
        );
      }

      if (searchQuery) {
        filteredFarms = filteredFarms.filter(farm => 
          farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          farm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          farm.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }

      if (userLocation) {
        filteredFarms = filteredFarms.filter(farm => 
          farm.distance && farm.distance <= searchRadius
        );
      }

      setFarms(filteredFarms);
    } catch (error) {
      console.error('Error loading farms:', error);
      toast({
        title: "Error Loading Farms",
        description: "Failed to load farm locations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeliveryZones = async () => {
    try {
      // No delivery zones tables exist - show empty state
      setDeliveryZones([]);
    } catch (error) {
      console.error('Error loading delivery zones:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getDirections = (farm: Farm) => {
    const { latitude, longitude } = farm.location;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  const shareFarm = (farm: Farm) => {
    if (navigator.share) {
      navigator.share({
        title: farm.name,
        text: farm.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Farm location link copied to clipboard.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <MapPin className="h-8 w-8 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <h1 className="text-lg font-semibold">Farm Locations</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <Map className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={getCurrentLocation}
              disabled={isLocating}
            >
              <Locate className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="farms" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Farms ({farms.length})
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Delivery
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Farms Tab */}
          <TabsContent value="farms" className="space-y-6">
            {/* Search and Filters */}
            <div className="grid gap-4 md:grid-cols-12 items-end">
              <div className="md:col-span-5">
                <Label htmlFor="search">Search Farms</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, location, or products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="category">Category</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-3">
                <Label htmlFor="radius">
                  Search Radius: {searchRadius} {mapSettings.distance_unit}
                </Label>
                <Slider
                  id="radius"
                  min={1}
                  max={100}
                  step={1}
                  value={[searchRadius]}
                  onValueChange={([value]) => setSearchRadius(value)}
                  className="mt-2"
                />
              </div>

              <div className="md:col-span-2">
                <Button 
                  variant="outline" 
                  onClick={loadFarms} 
                  className="w-full"
                  disabled={isLoading}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Location Status */}
            {locationPermission === 'denied' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Location Access Required</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Enable location access to find nearby farms and get accurate distances.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={getCurrentLocation}
                      className="mt-2"
                    >
                      Enable Location
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {userLocation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                  </span>
                </div>
              </div>
            )}

            {viewMode === 'map' ? (
              /* Map View */
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg h-96 relative overflow-hidden">
                  {/* Placeholder for map - replace with actual mapping library */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
                    <div className="text-center space-y-4">
                      <Map className="h-16 w-16 mx-auto text-gray-400" />
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-600">Interactive Map</h3>
                        <p className="text-sm text-gray-500 max-w-md">
                          This area will display an interactive map showing farm locations, 
                          delivery zones, and your current position.
                        </p>
                        <div className="flex justify-center gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            <ZoomIn className="h-3 w-3 mr-1" />
                            Zoom In
                          </Button>
                          <Button variant="outline" size="sm">
                            <ZoomOut className="h-3 w-3 mr-1" />
                            Zoom Out
                          </Button>
                          <Button variant="outline" size="sm">
                            <Layers className="h-3 w-3 mr-1" />
                            Layers
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Map Controls */}
                  <div className="absolute top-4 right-4 space-y-2">
                    <div className="bg-white rounded-lg shadow-sm border p-2 space-y-2">
                      <Button variant="ghost" size="sm" className="w-full">
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full">
                        <ZoomOut className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full">
                        <Crosshair className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full">
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-sm border p-3">
                    <h4 className="text-sm font-medium mb-2">Legend</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Farm Locations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>Your Location</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <span>Delivery Zones</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Farm Cards Below Map */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {farms.map((farm) => (
                    <Card 
                      key={farm.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedFarm(farm)}
                    >
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-semibold">{farm.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{farm.location.city}, {farm.location.province}</span>
                              </div>
                              {farm.distance && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Navigation className="h-3 w-3" />
                                  <span>{farm.distance.toFixed(1)} km away</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{farm.rating}</span>
                              <span className="text-xs text-muted-foreground">
                                ({farm.reviews_count})
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {farm.description}
                          </p>

                          <div className="flex flex-wrap gap-1">
                            {farm.categories.slice(0, 3).map((category) => (
                              <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {farm.categories.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{farm.categories.length - 3} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <div className={`h-2 w-2 rounded-full ${farm.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-xs text-muted-foreground">
                                {farm.is_open ? 'Open' : 'Closed'}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Heart className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  getDirections(farm);
                                }}
                              >
                                <Navigation2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  shareFarm(farm);
                                }}
                              >
                                <Share2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              /* List View */
              <div className="space-y-4">
                {farms.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No farms found</h3>
                    <p className="text-muted-foreground mb-4">
                      Try adjusting your search criteria or increasing the search radius.
                    </p>
                    <Button onClick={loadFarms}>
                      <Search className="h-4 w-4 mr-2" />
                      Search Again
                    </Button>
                  </div>
                ) : (
                  farms.map((farm) => (
                    <Card key={farm.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <div className="flex-shrink-0">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={farm.owner.image_url} />
                              <AvatarFallback>
                                <Leaf className="h-8 w-8" />
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold">{farm.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  by {farm.owner.name}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{farm.location.address}, {farm.location.city}</span>
                                  </div>
                                  {farm.distance && (
                                    <div className="flex items-center gap-1">
                                      <Navigation className="h-3 w-3" />
                                      <span>{farm.distance.toFixed(1)} km away</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span>{farm.rating} ({farm.reviews_count} reviews)</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${farm.is_open ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-xs text-muted-foreground">
                                  {farm.is_open ? 'Open' : 'Closed'}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                              {farm.description}
                            </p>

                            <div className="flex flex-wrap gap-2">
                              {farm.categories.map((category) => (
                                <Badge key={category} variant="secondary" className="text-xs">
                                  {category}
                                </Badge>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {farm.contact.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{farm.contact.phone}</span>
                                  </div>
                                )}
                                {farm.contact.website && (
                                  <div className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    <span>Website</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Heart className="h-4 w-4 mr-2" />
                                  Save
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => getDirections(farm)}
                                >
                                  <Navigation2 className="h-4 w-4 mr-2" />
                                  Directions
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => navigate(`/farmer-profile/${farm.id}`)}
                                >
                                  Visit Farm
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          {/* Delivery Tab */}
          <TabsContent value="delivery">
            <div className="text-center py-12">
              <Truck className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Delivery Zones</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                View delivery coverage areas and fees for each farm in your region.
              </p>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Map Settings</CardTitle>
                <CardDescription>
                  Customize your map view and location preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-farms">Show Farm Locations</Label>
                    <p className="text-sm text-muted-foreground">Display farm markers on the map</p>
                  </div>
                  <Switch
                    id="show-farms"
                    checked={mapSettings.show_farms}
                    onCheckedChange={(checked) => 
                      setMapSettings(prev => ({ ...prev, show_farms: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-delivery">Show Delivery Zones</Label>
                    <p className="text-sm text-muted-foreground">Display delivery coverage areas</p>
                  </div>
                  <Switch
                    id="show-delivery"
                    checked={mapSettings.show_delivery_zones}
                    onCheckedChange={(checked) => 
                      setMapSettings(prev => ({ ...prev, show_delivery_zones: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-location">Show My Location</Label>
                    <p className="text-sm text-muted-foreground">Display your current position</p>
                  </div>
                  <Switch
                    id="show-location"
                    checked={mapSettings.show_user_location}
                    onCheckedChange={(checked) => 
                      setMapSettings(prev => ({ ...prev, show_user_location: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-locate">Auto-locate on Load</Label>
                    <p className="text-sm text-muted-foreground">Automatically find your location when opening the map</p>
                  </div>
                  <Switch
                    id="auto-locate"
                    checked={mapSettings.auto_locate}
                    onCheckedChange={(checked) => 
                      setMapSettings(prev => ({ ...prev, auto_locate: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="map-style">Map Style</Label>
                  <Select 
                    value={mapSettings.map_style} 
                    onValueChange={(value: any) => 
                      setMapSettings(prev => ({ ...prev, map_style: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="street">Street View</SelectItem>
                      <SelectItem value="satellite">Satellite</SelectItem>
                      <SelectItem value="terrain">Terrain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distance-unit">Distance Unit</Label>
                  <Select 
                    value={mapSettings.distance_unit} 
                    onValueChange={(value: any) => 
                      setMapSettings(prev => ({ ...prev, distance_unit: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="km">Kilometers</SelectItem>
                      <SelectItem value="miles">Miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default-radius">
                    Default Search Radius: {mapSettings.default_radius} {mapSettings.distance_unit}
                  </Label>
                  <Slider
                    id="default-radius"
                    min={1}
                    max={100}
                    step={1}
                    value={[mapSettings.default_radius]}
                    onValueChange={([value]) => 
                      setMapSettings(prev => ({ ...prev, default_radius: value }))
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default LocationServices;