import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { sanitizeInput } from "@/lib/sanitize";

interface Lead {
  id: string;
  nombre: string;
  telefono: string;
  vehiculo_interes: string;
  comentario: string;
  estado: string;
  clasificacion: string | null;
  created_at: string;
}

interface Vehicle {
  id: string;
  name: string;
}

interface LeadEditDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated: () => void;
}

const LeadEditDialog = ({ lead, open, onOpenChange, onLeadUpdated }: LeadEditDialogProps) => {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [vehiculoInteres, setVehiculoInteres] = useState("");
  const [comentario, setComentario] = useState("");
  const [estado, setEstado] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Cargar vehículos desde Supabase
  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, name")
        .order("name");

      if (error) {
        console.error("Error cargando vehículos:", error);
      } else {
        setVehicles(data || []);
      }
      setLoadingVehicles(false);
    };

    if (open) {
      fetchVehicles();
    }
  }, [open]);

  // Pre-llenar el formulario cuando se abre con un lead
  useEffect(() => {
    if (lead && open) {
      setNombre(lead.nombre);
      setTelefono(lead.telefono);
      setVehiculoInteres(lead.vehiculo_interes);
      setComentario(lead.comentario || "");
      setEstado(lead.estado);
    }
  }, [lead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    setLoading(true);

    const { error } = await supabase
      .from("leads")
      .update({
        nombre: sanitizeInput(nombre),
        telefono: telefono.trim(),
        vehiculo_interes: sanitizeInput(vehiculoInteres),
        comentario: sanitizeInput(comentario),
        estado,
      })
      .eq("id", lead.id);

    setLoading(false);

    if (error) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Lead actualizado",
      description: `Los datos de "${nombre}" se han guardado correctamente.`,
    });

    onOpenChange(false);
    onLeadUpdated();
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-nombre">Nombre</Label>
            <Input
              id="edit-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-telefono">Teléfono</Label>
            <Input
              id="edit-telefono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+52 55 1234 5678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-vehiculo">Vehículo de Interés</Label>
            <Select value={vehiculoInteres} onValueChange={setVehiculoInteres} required>
              <SelectTrigger id="edit-vehiculo">
                <SelectValue placeholder={loadingVehicles ? "Cargando..." : "Selecciona un vehículo"} />
              </SelectTrigger>
              <SelectContent className="bg-popover">
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
            <Label htmlFor="edit-comentario">Comentario</Label>
            <Textarea
              id="edit-comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Notas adicionales sobre el cliente..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-estado">Estado</Label>
            <Select value={estado} onValueChange={setEstado} required>
              <SelectTrigger id="edit-estado">
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="Nuevo">Nuevo</SelectItem>
                <SelectItem value="Contactado">Contactado</SelectItem>
                <SelectItem value="Cerrado">Cerrado</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !nombre || !telefono || !vehiculoInteres || !estado}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadEditDialog;
