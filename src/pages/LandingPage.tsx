import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserRound, Stethoscope } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Aasha
          </h1>
          <p className="text-xl text-muted-foreground">
            Mental Health & Wellness Platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="group glass-card border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-glow cursor-pointer">
            <div 
              className="p-8 text-center space-y-6"
              onClick={() => navigate('/auth?role=psychologist')}
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Psychologist
                </h2>
                <p className="text-muted-foreground">
                  Access your professional dashboard to manage patients and sessions
                </p>
              </div>
              <Button 
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                size="lg"
              >
                Continue as Psychologist
              </Button>
            </div>
          </Card>

          <Card className="group glass-card border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-glow">
            <div 
              className="p-8 text-center space-y-6"
            >
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UserRound className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  Patient
                </h2>
                <p className="text-muted-foreground">
                  Access your personal wellness dashboard
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  size="lg"
                  onClick={() => navigate('/patient-login')}
                >
                  Log in
                </Button>
                <Button 
                  className="w-full"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/patient-login?mode=register')}
                >
                  Create password
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;