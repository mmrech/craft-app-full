import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye } from "lucide-react";

const RecentExtractions = () => {
  const recentExtractions = [
    {
      id: 1,
      patientName: "John Anderson",
      documentType: "Lab Results",
      extractedDate: "2025-01-15",
      status: "completed",
      fieldsExtracted: 24
    },
    {
      id: 2,
      patientName: "Maria Garcia",
      documentType: "Medical History",
      extractedDate: "2025-01-15",
      status: "completed",
      fieldsExtracted: 18
    },
    {
      id: 3,
      patientName: "Robert Chen",
      documentType: "Prescription Form",
      extractedDate: "2025-01-14",
      status: "processing",
      fieldsExtracted: 12
    },
    {
      id: 4,
      patientName: "Emily Johnson",
      documentType: "Diagnostic Report",
      extractedDate: "2025-01-14",
      status: "completed",
      fieldsExtracted: 31
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-accent/10 text-accent hover:bg-accent/20";
      case "processing":
        return "bg-primary/10 text-primary hover:bg-primary/20";
      default:
        return "bg-muted text-muted-foreground hover:bg-muted";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Extractions</h2>
        <Button variant="outline" size="sm">View All</Button>
      </div>
      
      <div className="space-y-4">
        {recentExtractions.map((extraction) => (
          <div
            key={extraction.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{extraction.patientName}</p>
                <p className="text-sm text-muted-foreground">{extraction.documentType}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-foreground">{extraction.fieldsExtracted} fields</p>
                <p className="text-xs text-muted-foreground">{extraction.extractedDate}</p>
              </div>
              <Badge className={getStatusColor(extraction.status)}>
                {extraction.status}
              </Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
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
