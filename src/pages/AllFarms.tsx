import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { SkeletonLoaders } from '@/components/SkeletonLoaders';
import { MapPin, Star, ArrowRight } from 'lucide-react';

interface Farm {
  id: string;
  name: string;
  image_url?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  review_count?: number | null;
  farm_size?: string | null;
}

const AllFarms: React.FC = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFarms = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        console.error('Error fetching farms:', error);
        setFarms([]);
      } else {
        // Fix null type issues for optional fields
        setFarms((data || []).map(farm => ({
          ...farm,
          image_url: farm.image_url ?? null,
          location: farm.location ?? null,
          latitude: farm.latitude ?? null,
          longitude: farm.longitude ?? null,
          rating: 'rating' in farm ? (farm as any).rating ?? null : null,
          review_count: 'review_count' in farm ? (farm as any).review_count ?? null : null,
          farm_size: farm.farm_size ?? null,
        })));
      }
      setLoading(false);
    };
    fetchFarms();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Browse All Farms</h1>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {farms.map(farm => (
              <Card key={farm.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {farm.image_url ? (
                      <img src={farm.image_url} alt={farm.name} className="w-12 h-12 rounded-full object-cover mr-2" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mr-2">
                        <MapPin className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <span>{farm.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {farm.location || `${farm.latitude?.toFixed(3)}, ${farm.longitude?.toFixed(3)}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">{farm.rating ?? 0}</span>
                    <span className="text-xs text-muted-foreground">({farm.review_count ?? 0} reviews)</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">{farm.farm_size}</div>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-between"
                    onClick={() => navigate(`/farms/${farm.id}`)}
                  >
                    View Farm
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import ErrorBoundary from "../components/ErrorBoundary";

const WrappedAllFarms = () => (
  <ErrorBoundary>
    <AllFarms />
  </ErrorBoundary>
);

export default WrappedAllFarms;
