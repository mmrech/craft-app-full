import { Card } from "@/components/ui/card";
import { FileText, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { useDashboardStatistics } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";

const StatsOverview = () => {
  const { user } = useAuth();
  const { data: stats, isLoading } = useDashboardStatistics(user?.id);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/3"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statsDisplay = [
    {
      title: "Total Documents",
      value: stats.total_documents.toLocaleString(),
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Total Extractions",
      value: stats.total_extractions.toLocaleString(),
      icon: CheckCircle2,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "In Progress",
      value: stats.in_progress_documents.toLocaleString(),
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted"
    },
    {
      title: "Completed",
      value: stats.completed_documents.toLocaleString(),
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statsDisplay.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverview;
