import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Target } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

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

interface DashboardStatsProps {
  leads: Lead[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const DashboardStats = ({ leads }: DashboardStatsProps) => {
  const stats = useMemo(() => {
    const total = leads.length;
    const altaPrioridad = leads.filter(
      (lead) => lead.clasificacion?.toLowerCase() === "alta" || lead.clasificacion?.toLowerCase() === "alto"
    ).length;
    const cerrados = leads.filter((lead) => lead.estado === "Cerrado").length;
    const tasaConversion = total > 0 ? ((cerrados / total) * 100).toFixed(1) : "0";

    // Distribución de vehículos
    const vehiculoCount: Record<string, number> = {};
    leads.forEach((lead) => {
      const vehiculo = lead.vehiculo_interes || "Otro";
      vehiculoCount[vehiculo] = (vehiculoCount[vehiculo] || 0) + 1;
    });

    const vehiculoData = Object.entries(vehiculoCount).map(([name, value]) => ({
      name,
      value,
    }));

    return { total, altaPrioridad, tasaConversion, vehiculoData };
  }, [leads]);

  return (
    <div className="space-y-6 mb-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registros en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alta Prioridad
            </CardTitle>
            <Target className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.altaPrioridad}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads clasificados como Alta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tasa de Conversión
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.tasaConversion}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads en estado Cerrado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      {stats.vehiculoData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribución por Vehículo de Interés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.vehiculoData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {stats.vehiculoData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} leads`, "Cantidad"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardStats;
