import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";
import { useRecentDocuments } from "@/hooks/useDashboardData";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

const RecentExtractions = () => {
  const { user } = useAuth();
  const { data: recentDocuments, isLoading } = useRecentDocuments(user?.id, 5);

  const getStatusColor = (completionPercentage: number) => {
    if (completionPercentage === 100) {
      return "bg-accent/10 text-accent hover:bg-accent/20";
    } else if (completionPercentage > 0) {
      return "bg-primary/10 text-primary hover:bg-primary/20";
    }
    return "bg-muted text-muted-foreground hover:bg-muted";
  };

  const getStatusLabel = (completionPercentage: number) => {
    if (completionPercentage === 100) return "Completed";
    if (completionPercentage > 0) return "In Progress";
    return "Not Started";
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Recent Extractions</h2>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 border rounded-lg animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-1/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!recentDocuments || recentDocuments.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Recent Extractions</h2>
        </div>
        <p className="text-muted-foreground text-center py-8">No documents yet. Upload your first document to get started.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Extractions</h2>
        <Button variant="outline" size="sm">View All</Button>
      </div>
      
      <div className="space-y-4">
        {recentDocuments.map((doc) => (
          <div
            key={doc.document_id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{doc.document_name}</p>
                <p className="text-sm text-muted-foreground">
                  {doc.steps_completed} of 8 steps • {doc.total_pages} pages
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-foreground">{doc.total_extractions} extractions</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(doc.created_at), "MMM d, yyyy")}
                </p>
              </div>
              <Badge className={getStatusColor(doc.completion_percentage)}>
                {getStatusLabel(doc.completion_percentage)}
              </Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" title="View document">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Download data">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default RecentExtractions;
