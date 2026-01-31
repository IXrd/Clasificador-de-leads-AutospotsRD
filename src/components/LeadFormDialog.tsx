import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { sanitizeInput } from "@/lib/sanitize";

interface Vehicle {
  id: number;
  name: string;
}

interface LeadFormDialogProps {
  onLeadCreated?: () => void;
}

const LeadFormDialog = ({ onLeadCreated }: LeadFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    vehiculo_interes: "",
    comentario: "",
  });

  const fetchVehicles = async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, name")
      .order("name", { ascending: true });
    
    if (error) {
      console.error("Error cargando vehículos:", error);
    } else {
      console.log("Vehículos para select:", data);
    }
    
    setVehicles(data || []);
  };

  useEffect(() => {
    if (open) {
      fetchVehicles();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      nombre: "",
      telefono: "",
      vehiculo_interes: "",
      comentario: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.telefono || !formData.vehiculo_interes) {
      toast({
        title: "Error",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Obtener el email del usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log("Usuario autenticado:", user);
    console.log("Error de auth:", authError);
    
    const userEmail = user?.email || "anónimo";
    console.log("Email a guardar:", userEmail);

    const { error } = await supabase.from("leads").insert([
      {
        nombre: sanitizeInput(formData.nombre),
        telefono: formData.telefono,
        vehiculo_interes: sanitizeInput(formData.vehiculo_interes),
        comentario: sanitizeInput(formData.comentario),
        estado: "Nuevo",
        user_email: userEmail,
      },
    ]);

    setLoading(false);

    if (error) {
      toast({
        title: "Error al guardar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "¡Éxito!",
      description: "Lead creado correctamente",
    });

    resetForm();
    setOpen(false);
    onLeadCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nuevo Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Nombre del cliente"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono *</Label>
            <Input
              id="telefono"
              placeholder="Número de teléfono"
              value={formData.telefono}
              onChange={(e) =>
                setFormData({ ...formData, telefono: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehiculo">Vehículo de Interés *</Label>
            <Select
              value={formData.vehiculo_interes}
              onValueChange={(value) =>
                setFormData({ ...formData, vehiculo_interes: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un vehículo" />
              </SelectTrigger>
              <SelectContent>
                {vehicles.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No hay vehículos en el catálogo
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.name}>
                      {vehicle.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comentario">Comentario</Label>
            <Textarea
              id="comentario"
              placeholder="Notas adicionales..."
              value={formData.comentario}
              onChange={(e) =>
                setFormData({ ...formData, comentario: e.target.value })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormDialog;
