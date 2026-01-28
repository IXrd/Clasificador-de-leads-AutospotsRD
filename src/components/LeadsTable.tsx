import { useEffect, useState, useMemo } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Trash2, MessageCircle } from "lucide-react";

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
  onLeadsChange?: (leads: Lead[]) => void;
}

export type { Lead };

const LeadsTable = ({ refreshTrigger, onLeadsChange }: LeadsTableProps) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [clasificacionFilter, setClasificacionFilter] = useState("todos");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

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
          setLeads((prev) => [payload.new as Lead, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((prev) =>
            prev.map((lead) =>
              lead.id === (payload.new as Lead).id ? (payload.new as Lead) : lead
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((prev) => prev.filter((lead) => lead.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  // Notificar cambios de leads al componente padre
  useEffect(() => {
    onLeadsChange?.(leads);
  }, [leads, onLeadsChange]);

  // Filtrado en tiempo real
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Filtro de búsqueda
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === "" ||
        lead.nombre.toLowerCase().includes(searchLower) ||
        lead.telefono.toLowerCase().includes(searchLower) ||
        lead.vehiculo_interes.toLowerCase().includes(searchLower);

      // Filtro de estado
      const matchesEstado =
        estadoFilter === "todos" || lead.estado === estadoFilter;

      // Filtro de clasificación
      const matchesClasificacion =
        clasificacionFilter === "todos" ||
        (clasificacionFilter === "pendiente" && !lead.clasificacion) ||
        lead.clasificacion?.toLowerCase() === clasificacionFilter.toLowerCase();

      return matchesSearch && matchesEstado && matchesClasificacion;
    });
  }, [leads, searchQuery, estadoFilter, clasificacionFilter]);

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
  };

  const handleDeleteClick = (lead: Lead) => {
    setLeadToDelete(lead);
    setDeleteDialogOpen(true);
  };

  const handleWhatsAppClick = (lead: Lead) => {
    // Limpiar número: solo dígitos
    const cleanPhone = lead.telefono.replace(/\D/g, "");
    // Generar mensaje codificado
    const message = `Hola ${lead.nombre}, vi tu interés en el ${lead.vehiculo_interes} en AutoSpot. ¿Sigues buscando?`;
    const encodedMessage = encodeURIComponent(message);
    // Abrir WhatsApp en nueva pestaña
    window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;

    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadToDelete.id);

    if (error) {
      toast({
        title: "Error al eliminar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Lead eliminado",
        description: `"${leadToDelete.nombre}" ha sido eliminado correctamente.`,
      });
    }

    setDeleteDialogOpen(false);
    setLeadToDelete(null);
  };

  const getClasificacionBadge = (clasificacion: string | null) => {
    if (!clasificacion) {
      return <Badge variant="outline" className="text-muted-foreground">Pendiente...</Badge>;
    }

    const colorMap: Record<string, string> = {
      alto: "bg-green-500 hover:bg-green-600",
      alta: "bg-green-500 hover:bg-green-600",
      medio: "bg-yellow-500 hover:bg-yellow-600",
      media: "bg-yellow-500 hover:bg-yellow-600",
      bajo: "bg-red-500 hover:bg-red-600",
      baja: "bg-red-500 hover:bg-red-600",
    };

    const colorClass = colorMap[clasificacion.toLowerCase()] || "bg-primary";

    return <Badge className={colorClass}>{clasificacion}</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Cargando leads...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/50 rounded-lg border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, teléfono o vehículo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={estadoFilter} onValueChange={setEstadoFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="Nuevo">Nuevo</SelectItem>
            <SelectItem value="Contactado">Contactado</SelectItem>
            <SelectItem value="Cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={clasificacionFilter} onValueChange={setClasificacionFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Clasificación" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Media</SelectItem>
            <SelectItem value="baja">Baja</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      {filteredLeads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border rounded-md">
          {leads.length === 0
            ? "No hay leads registrados. ¡Crea el primero!"
            : "No se encontraron leads con los filtros aplicados."}
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead className="hidden md:table-cell">Comentario</TableHead>
                <TableHead>Clasificación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[60px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(lead.created_at), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="font-medium">{lead.nombre}</TableCell>
                  <TableCell>{lead.telefono}</TableCell>
                  <TableCell>{lead.vehiculo_interes}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-[200px] truncate">
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
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                        onClick={() => handleWhatsAppClick(lead)}
                        title="Contactar por WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(lead)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Quieres eliminar el lead de <strong>{leadToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeadsTable;
