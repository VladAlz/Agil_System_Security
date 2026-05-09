import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
      // La navegación se maneja dentro del AuthContext
    } catch (error) {
      // El error ya se maneja con un toast en el AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-destructive/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      
      <Card className="w-full max-w-md bg-[#1e293b]/80 border-[#334155] backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in duration-500">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-destructive rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-destructive/20">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-white">S.S.I.U.</CardTitle>
          <CardDescription className="text-slate-400 text-base">
            Dashboard de Seguridad Integral Universitaria
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@uta.edu.ec"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-[#0f172a]/50 border-[#334155] text-white focus:border-destructive/50 transition-all"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">Contraseña</Label>
                <a href="#" className="text-xs text-destructive hover:underline">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-[#0f172a]/50 border-[#334155] text-white focus:border-destructive/50 transition-all"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-destructive hover:bg-destructive/90 text-white font-bold h-11 shadow-lg shadow-destructive/20 transition-all active:scale-[0.98]" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : "Ingresar al Panel"}
            </Button>
            <p className="text-center text-xs text-slate-500">
              Uso exclusivo para personal de seguridad FISEI - UTA
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
