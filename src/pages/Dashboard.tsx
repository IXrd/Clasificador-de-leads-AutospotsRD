import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Download, Table2, LayoutGrid } from "lucide-react";
import LeadFormDialog from "@/components/LeadFormDialog";
import LeadsTable, { type Lead } from "@/components/LeadsTable";
import LeadsKanban from "@/components/LeadsKanban";
import DashboardStats from "@/components/DashboardStats";
import { Toaster } from "@/components/ui/toaster";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleLeadCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = ["Fecha", "Nombre", "Teléfono", "Vehículo", "Clasificación", "Estado"];
    const rows = leads.map((lead) => [
      format(new Date(lead.created_at), "dd/MM/yyyy", { locale: es }),
      lead.nombre,
      lead.telefono,
      lead.vehiculo_interes,
      lead.clasificacion || "Pendiente",
      lead.estado,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `leads_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Resumen de Negocio */}
        <DashboardStats leads={leads} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">Gestión de Leads</h2>
          <div className="flex flex-wrap items-center gap-2">
            {/* Toggle de Vista */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "table" | "kanban")}>
              <TabsList className="h-9">
                <TabsTrigger value="table" className="gap-1.5 px-3">
                  <Table2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Tabla</span>
                </TabsTrigger>
                <TabsTrigger value="kanban" className="gap-1.5 px-3">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Tablero</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button 
              onClick={handleExportCSV} 
              variant="outline" 
              size="sm"
              disabled={leads.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <LeadFormDialog onLeadCreated={handleLeadCreated} />
          </div>
        </div>

        {/* Vista condicional */}
        <div className={viewMode === "table" ? "block" : "hidden"}>
          <LeadsTable 
            refreshTrigger={refreshTrigger} 
            onLeadsChange={setLeads}
          />
        </div>
        {viewMode === "kanban" && <LeadsKanban leads={leads} />}
      </main>

      <Toaster />
    </div>
  );
};

export default Dashboard;
