import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
// Removed Card imports for full-page layout
import { Leaf } from "lucide-react";

const FarmerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <span className="text-xl font-semibold text-primary">Loading...</span>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <span className="text-xl font-semibold text-primary">Farmer not found</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background flex flex-col items-center px-0 py-0">
      <div className="w-full flex flex-row items-center px-6 pt-6 pb-2 gap-4">
        <button
          className="p-2 rounded-full hover:bg-primary/10 focus:outline-none"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left text-primary"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <h2 className="text-2xl font-bold text-primary truncate">{profile.full_name} Farm</h2>
      </div>
      <div className="w-full">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-64 object-cover rounded-none" />
        ) : (
          <div className="w-full h-64 bg-primary/10 flex items-center justify-center">
            <Leaf className="h-24 w-24 text-primary" />
          </div>
        )}
      </div>
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center mt-8 px-4">
        <div className="w-full">
          <h3 className="text-xl font-semibold text-primary mb-2 text-left">About {profile.full_name}</h3>
          <p className="text-lg text-muted-foreground mb-4 text-left">{profile.bio || "No bio available."}</p>
          <h3 className="text-xl font-semibold text-primary mb-2 text-left">Address</h3>
          <p className="text-base text-muted-foreground mb-3 text-left">{profile.address}</p>
          <button
            className="mt-2 px-6 py-2 bg-primary text-white rounded-lg shadow hover:bg-primary/80 transition"
            onClick={() => setShowMap(true)}
          >
            See on Map
          </button>
          {showMap && (
            <div className="farm-map-container mt-6 w-full">
              <iframe
                className="farm-map-iframe rounded-lg border w-full h-72"
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${encodeURIComponent(profile.address)}&key=${import.meta.env.REACT_APP_GOOGLE_PLACES_API_KEY}&output=embed`}
                title={profile.full_name}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerProfile;
