import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";
import "../farm-map.css";

interface Farm {
  id: string;
  name: string;
  description: string;
  location: string;
  address?: string;
  image_url: string;
  farmer_id: string;
}

interface FarmerProfile {
  id: string;
  image_url?: string;
}

const AvailableFarms = () => {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [farmerProfiles, setFarmerProfiles] = useState<Record<string, FarmerProfile>>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const { data, error } = await supabase
          .from('farms')
          .select('*');
        if (error) {
          console.error('Error fetching farms:', error);
        } else {
          setFarms(data || []);
          // Fetch farmer profiles for each farm
          const farmerIds = (data || []).map((farm: Farm) => farm.farmer_id).filter(Boolean);
          if (farmerIds.length > 0) {
            const { data: profiles, error: profileError } = await supabase
              .from('profiles')
              .select('id,image_url')
              .in('id', farmerIds);
            if (profiles) {
              const profileMap: Record<string, FarmerProfile> = {};
              profiles.forEach((profile) => {
                if (profile != null && typeof profile === 'object' && 'id' in profile) {
                  profileMap[(profile as FarmerProfile).id] = profile as FarmerProfile;
                }
              });
              setFarmerProfiles(profileMap);
            }
            if (profileError) {
              console.error('Error fetching farmer profiles:', profileError);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFarms();
  }, []);

  const handleFarmClick = (farm: Farm) => {
    navigate(`/farmer/${farm.farmer_id}`);
  };

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
      <CardContent className="w-full overflow-x-auto">
        <div className="whitespace-nowrap flex gap-6 pb-4 relative farm-scroll-container w-max px-2">
          {farms.map((farm, index) => (
            <div
              key={farm.id}
              className={`inline-block min-w-[280px] max-w-sm bg-card border rounded-xl shadow-lg hover:shadow-xl cursor-pointer align-top transition-all duration-300`}
              onClick={() => handleFarmClick(farm)}
            >
              <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-xl flex items-center justify-center overflow-hidden relative">
                {farmerProfiles[farm.farmer_id]?.image_url ? (
                  <img
                    src={farmerProfiles[farm.farmer_id].image_url}
                    alt={farm.name}
                    className="w-full h-full object-cover rounded-t-xl transition-transform duration-300 hover:scale-110"
                  />
                ) : (
                  <Leaf className="h-12 w-12 text-primary opacity-80" />
                )}
                <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  Farm #{index + 1}
                </div>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-xl text-foreground truncate mb-2">{farm.name}</h4>
                {farm.address && (
                  <p className="text-xs text-muted-foreground mb-1 flex items-center">
                    <span className="font-medium mr-1">📍</span> {farm.address}
                  </p>
                )}
                {farm.location && (
                  <p className="text-xs text-muted-foreground mb-2 flex items-center">
                    <span className="font-medium mr-1">🌍</span> {farm.location}
                  </p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                  {farm.description || "🌱 Discover fresh, local produce from this amazing farm!"}
                </p>
                {/* View All Farms Button for each card */}
                <div className="pt-2 border-t border-border">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/browse-products');
                    }}
                  >
                    View All Farms
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailableFarms;