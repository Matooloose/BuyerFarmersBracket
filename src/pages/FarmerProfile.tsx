import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Leaf } from "lucide-react";

const FarmerProfile = () => {
  const { id } = useParams();
  interface Profile {
    id: string;
    full_name: string;
    bio: string;
    avatar_url: string;
    address: string;
    email: string;
  }

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      setProfile(data ? {
        id: data.id,
        full_name: data.name,
        bio: data.bio,
        avatar_url: data.image_url,
        address: data.address,
        email: data.email,
      } : null);
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return <Card><CardHeader><CardTitle>Loading...</CardTitle></CardHeader></Card>;
  }
  if (!profile) {
    return <Card><CardHeader><CardTitle>Farmer not found</CardTitle></CardHeader></Card>;
  }

  return (
    <Card className="max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>{profile.full_name || "Farmer Profile"}</CardTitle>
        <CardDescription>{profile.bio || "No bio available."}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-32 h-32 object-cover rounded-full" />
            ) : (
              <Leaf className="h-16 w-16 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">{profile.full_name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{profile.address}</p>
            <p className="text-sm mb-2">{profile.email}</p>
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
              src={`https://www.google.com/maps?q=${encodeURIComponent(profile.address)}&output=embed`}
              title={profile.full_name}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FarmerProfile;
