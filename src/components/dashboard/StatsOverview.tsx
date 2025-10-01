import { Card } from "@/components/ui/card";
import { FileText, CheckCircle2, Clock, TrendingUp } from "lucide-react";

const StatsOverview = () => {
  const stats = [
    {
      title: "Total Documents",
      value: "1,247",
      change: "+12.5%",
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Extracted Records",
      value: "3,842",
      change: "+23.1%",
      icon: CheckCircle2,
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      title: "In Processing",
      value: "47",
      change: "+5.2%",
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted"
    },
    {
      title: "Accuracy Rate",
      value: "98.4%",
      change: "+2.1%",
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10"
    }
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6 transition-all hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-accent font-medium">{stat.change} from last month</p>
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
