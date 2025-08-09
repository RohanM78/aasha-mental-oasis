import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PatientLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistration, setIsRegistration] = useState(false);
  const [patientExists, setPatientExists] = useState(false);
  const [hasMarkedRegistration, setHasMarkedRegistration] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && isRegistration && !hasMarkedRegistration) {
        setTimeout(async () => {
          try {
            await (supabase.rpc as any)('mark_patient_registered');
            setHasMarkedRegistration(true);
          } catch (err) {
            console.error('Error marking patient registered via RPC:', err);
          }
        }, 0);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [isRegistration, hasMarkedRegistration]);

  const checkPatientStatus = async (emailToCheck: string) => {
    try {
      const { data, error } = await (supabase.rpc as any)('check_patient_email', { p_email: emailToCheck });
      if (error) throw error;

      const rows = (data ?? []) as any[];
      const result = Array.isArray(rows) ? rows[0] : (rows as any);
      const emailExists = !!result?.email_exists;
      const isRegistered = !!result?.is_registered;

      setPatientExists(emailExists);
      setIsRegistration(emailExists ? !isRegistered : false);

      return result;
    } catch (error) {
      console.error('Error checking patient status via RPC:', error);
      setPatientExists(false);
      setIsRegistration(false);
      return null;
    }
  };

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    if (newEmail.includes('@')) {
      await checkPatientStatus(newEmail);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/patient-login`
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Registration failed");
      }

      // Mark patient as registered via secure RPC if session exists
      if (authData.session) {
        try {
          await (supabase.rpc as any)('mark_patient_registered');
        } catch (err: any) {
          console.error('Error marking patient registered:', err);
        }
        toast({
          title: "Registration successful!",
          description: "You're all set. You can now sign in.",
        });
      } else {
        toast({
          title: "Confirm your email",
          description: "We sent a confirmation link. After confirming, return here to sign in.",
        });
      }

      // Switch to login mode
      setIsRegistration(false);
      setPassword("");
      setConfirmPassword("");
      
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Query the patients table to get patient data
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('email', authData.user.email)
        .maybeSingle();

      if (patientError || !patient) {
        toast({
          title: "Access denied",
          description: "You are not registered as a patient in this system.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        return;
      }

      // Store patient session data
      localStorage.setItem('patientSession', JSON.stringify({
        id: patient.id,
        name: patient.name,
        email: patient.email,
        psychologist_id: patient.psychologist_id
      }));
      
      toast({
        title: "Welcome back!",
        description: `Hello ${patient.name}, you're now logged in.`,
      });
      
      navigate('/patient-dashboard');
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/80 to-primary/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <Card className="glass-card border-primary/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
              {isRegistration ? 'Complete Registration' : 'Patient Login'}
            </h1>
            <p className="text-muted-foreground">
              {isRegistration 
                ? 'Create your password to complete registration' 
                : 'Sign in with your email and password'
              }
            </p>
            {!patientExists && email.includes('@') && (
              <p className="text-destructive text-sm mt-2">
                Email not found. Please contact your psychologist.
              </p>
            )}
          </div>

          <form onSubmit={isRegistration ? handleRegistration : handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="your@email.com"
                className="bg-background/50 border-primary/20"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">
                {isRegistration ? 'Create Password' : 'Password'}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegistration ? "Choose a secure password" : "Your password"}
                className="bg-background/50 border-primary/20"
                required
                minLength={6}
              />
              {isRegistration && (
                <p className="text-sm text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              )}
            </div>

            {isRegistration && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="bg-background/50 border-primary/20"
                  required
                />
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={loading || !email || !password || (isRegistration && (!confirmPassword || !patientExists))}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isRegistration ? 'Complete Registration' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PatientLoginPage;