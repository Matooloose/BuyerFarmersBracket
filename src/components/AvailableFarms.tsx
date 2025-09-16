import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Leaf } from "lucide-react";

interface Farm {
  id: string;
  name: string;
  description: string;
  location: string;
  image_url: string;
  farmer_id: string;
}

const AvailableFarms = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const { data, error } = await supabase
          .from('farms')
          .select('*');
        console.log('Farms data:', data, 'Error:', error);
        if (error) {
          console.error('Error fetching farms:', error);
        } else {
          setFarms(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFarms();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Farms</CardTitle>
          <CardDescription>Loading farms...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (farms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Available Farms</CardTitle>
          <CardDescription>No farms available at the moment</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Farms</CardTitle>
        <CardDescription>Fresh produce from local farms</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {farms.map((farm) => (
            <div key={farm.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                {farm.image_url ? (
                  <img 
                    src={farm.image_url} 
                    alt={farm.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Leaf className="h-8 w-8 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-foreground truncate">{farm.name}</h4>
                  <Badge variant="secondary" className="ml-2">
                    <Star className="h-3 w-3 mr-1" />
                    4.8
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {farm.description || "Fresh organic produce available"}
                </p>
                {farm.location && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" />
                    {farm.location}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailableFarms;