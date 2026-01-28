import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Car, User } from "lucide-react";

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

interface LeadsKanbanProps {
  leads: Lead[];
}

const COLUMNS = [
  { id: "Nuevo", title: "Nuevo", color: "bg-blue-500" },
  { id: "Contactado", title: "Contactado", color: "bg-yellow-500" },
  { id: "Cerrado", title: "Cerrado", color: "bg-emerald-500" },
];

const LeadsKanban = ({ leads }: LeadsKanbanProps) => {
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const getLeadsByStatus = (status: string) => {
    return leads.filter((lead) => lead.estado === status);
  };

  const getClasificacionBadge = (clasificacion: string | null) => {
    if (!clasificacion) {
      return <Badge variant="outline" className="text-xs">Pendiente</Badge>;
    }

    const colorMap: Record<string, string> = {
      alto: "bg-emerald-500 hover:bg-emerald-600",
      alta: "bg-emerald-500 hover:bg-emerald-600",
      medio: "bg-yellow-500 hover:bg-yellow-600",
      media: "bg-yellow-500 hover:bg-yellow-600",
      bajo: "bg-red-500 hover:bg-red-600",
      baja: "bg-red-500 hover:bg-red-600",
    };

    const colorClass = colorMap[clasificacion.toLowerCase()] || "bg-primary";
    return <Badge className={`text-xs ${colorClass}`}>{clasificacion}</Badge>;
  };

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedLead || draggedLead.estado === newStatus) {
      setDraggedLead(null);
      return;
    }

    const { error } = await supabase
      .from("leads")
      .update({ estado: newStatus })
      .eq("id", draggedLead.id);

    if (error) {
      toast({
        title: "Error al mover",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Lead actualizado",
        description: `"${draggedLead.nombre}" movido a "${newStatus}"`,
      });
    }

    setDraggedLead(null);
  };

  const handleDragEnd = () => {
    setDraggedLead(null);
    setDragOverColumn(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {COLUMNS.map((column) => (
        <div
          key={column.id}
          className={`rounded-lg border bg-muted/30 transition-colors ${
            dragOverColumn === column.id ? "ring-2 ring-primary bg-muted/50" : ""
          }`}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          {/* Column Header */}
          <div className="p-3 border-b flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`} />
            <h3 className="font-semibold">{column.title}</h3>
            <Badge variant="secondary" className="ml-auto">
              {getLeadsByStatus(column.id).length}
            </Badge>
          </div>

          {/* Cards */}
          <div className="p-2 space-y-2 min-h-[200px]">
            {getLeadsByStatus(column.id).map((lead) => (
              <Card
                key={lead.id}
                draggable
                onDragStart={(e) => handleDragStart(e, lead)}
                onDragEnd={handleDragEnd}
                className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                  draggedLead?.id === lead.id ? "opacity-50 scale-95" : ""
                }`}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {lead.nombre}
                    </div>
                    {getClasificacionBadge(lead.clasificacion)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Car className="h-3 w-3" />
                    {lead.vehiculo_interes}
                  </div>
                </CardContent>
              </Card>
            ))}

            {getLeadsByStatus(column.id).length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Sin leads
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeadsKanban;
