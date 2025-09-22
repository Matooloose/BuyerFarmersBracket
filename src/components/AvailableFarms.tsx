import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);
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

  useEffect(() => {
    if (farms.length > 1) {
      const interval = setInterval(() => {
        setScrollIdx((prev) => (prev + 1) % farms.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [farms.length]);

  useEffect(() => {
    if (farms.length > 1 && scrollRef.current) {
      const cards = scrollRef.current.children;
      if (cards && cards[scrollIdx]) {
        (cards[scrollIdx] as HTMLElement).scrollIntoView({ behavior: 'smooth', inline: 'start' });
      }
    }
  }, [scrollIdx, farms.length]);

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
        <div ref={scrollRef} className="whitespace-nowrap flex gap-4 pb-2 relative farm-scroll-container w-max">
          {farms.map((farm) => (
            <div
              key={farm.id}
              className="inline-block min-w-[240px] max-w-xs bg-card border rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer align-top farm-scroll-card"
              onClick={() => handleFarmClick(farm)}
            >
              <div className="w-full h-28 bg-primary/10 rounded-t-lg flex items-center justify-center overflow-hidden">
                {farmerProfiles[farm.farmer_id]?.image_url ? (
                  <img
                    src={farmerProfiles[farm.farmer_id].image_url}
                    alt={farm.name}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                ) : (
                  <Leaf className="h-10 w-10 text-primary" />
                )}
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-lg text-foreground truncate mb-1">{farm.name}</h4>
                {farm.address && (
                  <p className="text-xs text-muted-foreground mb-1"><span className="font-medium">Address:</span> {farm.address}</p>
                )}
                {farm.location && (
                  <p className="text-xs text-muted-foreground mb-1"><span className="font-medium">Location:</span> {farm.location}</p>
                )}
                  <p className="text-sm text-muted-foreground line-clamp-2">{farm.description || "No bio available."}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AvailableFarms;