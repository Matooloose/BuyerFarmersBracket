import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Users,
  Calendar,
  Leaf
} from 'lucide-react';

interface FarmerProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image_url: string | null;
  role: string | null;
  created_at: string;
}

interface Farm {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  farmer_id: string;
  created_at: string;
  rating?: number;
  reviews_count?: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  images: string[];
  is_organic: boolean;
  is_featured: boolean;
  quantity: number;
}

function FarmerProfile() {
  const { farmerId } = useParams<{ farmerId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (farmerId) {
      fetchFarmerProfile();
    }
  }, [farmerId]);

  const fetchFarmerProfile = async () => {
    if (!farmerId) return;

    try {
      setLoading(true);

      // Fetch farmer profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', farmerId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      setProfile(profileData);

      // Fetch farm data
      const { data: farmData, error: farmError } = await supabase
        .from('farms')
        .select('*')
        .eq('farmer_id', farmerId)
        .single();

      if (farmError) {
        console.error('Error fetching farm:', farmError);
      } else {
        setFarm(farmData);
      }

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
      } else {
        setProducts(productsData || []);
      }

    } catch (error) {
      console.error('Error loading farmer profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading farmer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Farmer Not Found</h2>
              <p className="text-gray-600 mb-4">The farmer profile you're looking for doesn't exist.</p>
              <Button onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Farmer Profile</h1>
        </div>

        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 mx-auto md:mx-0">
                <AvatarImage src={profile.image_url || undefined} />
                <AvatarFallback className="text-xl">
                  {profile.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'F'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold">{profile.name || 'Unknown Farmer'}</h2>
                  <Badge variant="secondary" className="mt-2">
                    <Users className="h-3 w-3 mr-1" />
                    Farmer
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Farm Information */}
        {farm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-600" />
                Farm Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{farm.name}</h3>
                  {farm.description && (
                    <p className="text-gray-600 mt-1">{farm.description}</p>
                  )}
                </div>
                
                {farm.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{farm.location}</span>
                  </div>
                )}

                {(farm.rating || farm.reviews_count) && (
                  <div className="flex items-center gap-4">
                    {farm.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{farm.rating}</span>
                      </div>
                    )}
                    {farm.reviews_count && (
                      <span className="text-gray-600">
                        {farm.reviews_count} reviews
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({products.length})</CardTitle>
            <CardDescription>
              Fresh produce available from this farm
            </CardDescription>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No products available at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => navigate(`/product/${product.id}`)}>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          {product.images[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Leaf className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-green-600 font-bold">R{product.price.toFixed(2)}</p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {product.category}
                            </Badge>
                            {product.is_organic && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                Organic
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FarmerProfile;