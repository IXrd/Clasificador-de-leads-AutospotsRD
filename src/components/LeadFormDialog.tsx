import { useState } from "react";
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

interface LeadFormDialogProps {
  onLeadCreated?: () => void;
}

const LeadFormDialog = ({ onLeadCreated }: LeadFormDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    vehiculo_interes: "",
    comentario: "",
  });

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

    const { error } = await supabase.from("leads").insert([
      {
        nombre: formData.nombre,
        telefono: formData.telefono,
        vehiculo_interes: formData.vehiculo_interes,
        comentario: formData.comentario,
        estado: "Nuevo",
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
                <SelectItem value="Mustang">Mustang</SelectItem>
                <SelectItem value="Geely">Geely</SelectItem>
                <SelectItem value="Rav4">Rav4</SelectItem>
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
