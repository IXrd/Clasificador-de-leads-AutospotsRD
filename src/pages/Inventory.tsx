import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { ArrowLeft, Plus, Trash2, Car } from "lucide-react";

interface Vehicle {
  id: number;
  name: string;
}

const Inventory = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newVehicle, setNewVehicle] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error carga:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los vehículos: " + error.message,
        variant: "destructive",
      });
      return;
    }

    console.log("Vehículos cargados:", data);
    setVehicles(data || []);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleAddVehicle = async () => {
    if (!newVehicle.trim()) {
      toast({
        title: "Error",
        description: "El nombre del vehículo no puede estar vacío",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("vehicles")
      .insert([{ name: newVehicle.trim() }]);

    setLoading(false);

    if (error) {
      console.error("Error al agregar:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "¡Éxito!",
      description: "Vehículo agregado correctamente",
    });

    setNewVehicle("");
    fetchVehicles();
  };

  const handleDeleteVehicle = async (id: number, name: string) => {
    const { error } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Eliminado",
      description: `${name} fue eliminado del catálogo`,
    });

    fetchVehicles();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Gestión de Vehículos</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Catálogo de Vehículos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Formulario para agregar */}
            <div className="flex gap-2">
              <Input
                placeholder="Nombre del vehículo (ej: Toyota Corolla)"
                value={newVehicle}
                onChange={(e) => setNewVehicle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddVehicle()}
              />
              <Button onClick={handleAddVehicle} disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>

            {/* Lista de vehículos */}
            <div className="space-y-2">
              {vehicles.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay vehículos en el catálogo. Agrega uno arriba.
                </p>
              ) : (
                vehicles.map((vehicle) => (
                  <div
                    key={vehicle.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <span className="font-medium">{vehicle.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteVehicle(vehicle.id, vehicle.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Total: {vehicles.length} vehículo{vehicles.length !== 1 ? "s" : ""} en catálogo
            </p>
          </CardContent>
        </Card>
      </main>

      <Toaster />
    </div>
  );
};

export default Inventory;
