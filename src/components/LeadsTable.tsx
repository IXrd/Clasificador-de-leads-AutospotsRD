import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

interface LeadsTableProps {
  refreshTrigger?: number;
}

const LeadsTable = ({ refreshTrigger }: LeadsTableProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error al cargar leads",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();

    // Suscripción en tiempo real para INSERT y UPDATE
    const channel = supabase
      .channel("leads-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          console.log("Nuevo lead insertado:", payload.new);
          setLeads((prev) => [payload.new as Lead, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          console.log("Lead actualizado:", payload.new);
          setLeads((prev) =>
            prev.map((lead) =>
              lead.id === (payload.new as Lead).id ? (payload.new as Lead) : lead
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const handleEstadoChange = async (leadId: string, nuevoEstado: string) => {
    const { error } = await supabase
      .from("leads")
      .update({ estado: nuevoEstado })
      .eq("id", leadId);

    if (error) {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Estado actualizado",
      description: `Lead marcado como "${nuevoEstado}"`,
    });

    // Refetch para mantener sincronizado
    fetchLeads();
  };

  const getClasificacionBadge = (clasificacion: string | null) => {
    if (!clasificacion) {
      return <Badge variant="outline" className="text-muted-foreground">Pendiente...</Badge>;
    }

    const colorMap: Record<string, string> = {
      alto: "bg-green-500 hover:bg-green-600",
      medio: "bg-yellow-500 hover:bg-yellow-600",
      bajo: "bg-red-500 hover:bg-red-600",
    };

    const colorClass = colorMap[clasificacion.toLowerCase()] || "bg-primary";

    return <Badge className={colorClass}>{clasificacion}</Badge>;
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "Nuevo":
        return "default";
      case "Contactado":
        return "secondary";
      case "Cerrado":
        return "outline";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cargando leads...
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay leads registrados. ¡Crea el primero!
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Vehículo</TableHead>
            <TableHead>Comentario</TableHead>
            <TableHead>Clasificación</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="whitespace-nowrap">
                {format(new Date(lead.created_at), "dd MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell className="font-medium">{lead.nombre}</TableCell>
              <TableCell>{lead.vehiculo_interes}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {lead.comentario || "-"}
              </TableCell>
              <TableCell>{getClasificacionBadge(lead.clasificacion)}</TableCell>
              <TableCell>
                <Select
                  value={lead.estado}
                  onValueChange={(value) => handleEstadoChange(lead.id, value)}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="Nuevo">Nuevo</SelectItem>
                    <SelectItem value="Contactado">Contactado</SelectItem>
                    <SelectItem value="Cerrado">Cerrado</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LeadsTable;
