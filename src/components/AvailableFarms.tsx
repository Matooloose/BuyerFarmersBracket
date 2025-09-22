import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Leaf } from "lucide-react";
import "../farm-map.css";

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
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [farmerAddress, setFarmerAddress] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollIdx, setScrollIdx] = useState(0);
  const [showMap, setShowMap] = useState(false);

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

  const handleFarmClick = async (farm: Farm) => {
    setSelectedFarm(farm);
    if (farm.farmer_id) {
      const { data, error } = await supabase
        .from('profiles')
        .select('address')
        .eq('id', farm.farmer_id)
        .single();
      if (data && data.address) {
        setFarmerAddress(data.address);
      } else {
        setFarmerAddress("");
      }
    } else {
      setFarmerAddress("");
    }
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
              className="inline-block min-w-[220px] max-w-xs bg-card border rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer align-top farm-scroll-card"
              onClick={() => handleFarmClick(farm)}
            >
              <div className="w-full h-24 bg-primary/10 rounded-t-lg flex items-center justify-center overflow-hidden">
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
              <div className="p-3">
                <h4 className="font-medium text-foreground truncate mb-1">{farm.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {farm.description || "Fresh organic produce available"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {/* Farmer Details Dialog */}
      {selectedFarm && (
        <Dialog open={!!selectedFarm} onOpenChange={() => {
          setSelectedFarm(null);
          setShowMap(false);
        }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedFarm.name} Details</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                {selectedFarm.image_url ? (
                  <img src={selectedFarm.image_url} alt={selectedFarm.name} className="w-32 h-32 object-cover rounded-lg" />
                ) : (
                  <Leaf className="h-16 w-16 text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedFarm.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{selectedFarm.description || "No description available."}</p>
                <p className="text-sm mb-2"><span className="font-medium">Address:</span> {farmerAddress || selectedFarm.location}</p>
                <button
                  className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
                  onClick={() => setShowMap(true)}
                >
                  See on Map
                </button>
              </div>
            </div>
            {showMap && (
              <div className="farm-map-container mt-6">
                <iframe
                  className="farm-map-iframe"
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps?q=${encodeURIComponent(farmerAddress || selectedFarm.location)}&output=embed`}
                  title={selectedFarm.name}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

    </Card>
  );
};

export default AvailableFarms;