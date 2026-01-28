import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import LeadFormDialog from "@/components/LeadFormDialog";
import LeadsTable, { type Lead } from "@/components/LeadsTable";
import DashboardStats from "@/components/DashboardStats";
import { Toaster } from "@/components/ui/toaster";

const Dashboard = () => {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleLeadCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
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

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Gestión de Leads</h2>
          <LeadFormDialog onLeadCreated={handleLeadCreated} />
        </div>

        <LeadsTable 
          refreshTrigger={refreshTrigger} 
          onLeadsChange={setLeads}
        />
      </main>

      <Toaster />
    </div>
  );
};

export default Dashboard;
