import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Bienvenido</h1>
        <p className="text-xl text-muted-foreground">Inicia sesión para acceder al sistema</p>
        <Button asChild size="lg">
          <Link to="/login">
            <LogIn className="mr-2 h-5 w-5" />
            Iniciar Sesión
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default Index;
