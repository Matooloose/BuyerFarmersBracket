import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAppState } from "@/contexts/AppStateContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasCompletedWelcome } = useAppState();

  useEffect(() => {
    if (user) {
      if (hasCompletedWelcome) {
        navigate('/dashboard');
      } else {
        navigate('/welcome');
      }
    }
  }, [user, hasCompletedWelcome, navigate]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">FarmersBracket</h1>
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
