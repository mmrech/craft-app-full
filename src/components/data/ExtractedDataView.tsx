import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Filter } from "lucide-react";

const ExtractedDataView = () => {
  const extractedData = [
    {
      id: "EXT-001",
      patientName: "John Anderson",
      patientId: "P-10234",
      documentType: "Lab Results",
      dateExtracted: "2025-01-15",
      fieldsCount: 24,
      status: "verified"
    },
    {
      id: "EXT-002",
      patientName: "Maria Garcia",
      patientId: "P-10567",
      documentType: "Medical History",
      dateExtracted: "2025-01-15",
      fieldsCount: 18,
      status: "verified"
    },
    {
      id: "EXT-003",
      patientName: "Robert Chen",
      patientId: "P-10892",
      documentType: "Prescription",
      dateExtracted: "2025-01-14",
      fieldsCount: 12,
      status: "review"
    },
    {
      id: "EXT-004",
      patientName: "Emily Johnson",
      patientId: "P-11023",
      documentType: "Diagnostic Report",
      dateExtracted: "2025-01-14",
      fieldsCount: 31,
      status: "verified"
    },
    {
      id: "EXT-005",
      patientName: "David Martinez",
      patientId: "P-11156",
      documentType: "Lab Results",
      dateExtracted: "2025-01-13",
      fieldsCount: 22,
      status: "verified"
    }
  ];

  const getStatusBadge = (status: string) => {
    if (status === "verified") {
      return <Badge className="bg-accent/10 text-accent hover:bg-accent/20">Verified</Badge>;
    }
    return <Badge className="bg-primary/10 text-primary hover:bg-primary/20">Review</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Extracted Data Records</h2>
            <p className="text-sm text-muted-foreground mt-1">
              View and manage all extracted clinical data
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by patient name, ID, or document type..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Extraction ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Patient ID</TableHead>
                <TableHead>Document Type</TableHead>
                <TableHead>Date Extracted</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {extractedData.map((record) => (
                <TableRow key={record.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>{record.patientName}</TableCell>
                  <TableCell>{record.patientId}</TableCell>
                  <TableCell>{record.documentType}</TableCell>
                  <TableCell>{record.dateExtracted}</TableCell>
                  <TableCell>
                    <span className="font-medium">{record.fieldsCount}</span> fields
                  </TableCell>
                  <TableCell>{getStatusBadge(record.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Total Records</h3>
          <p className="text-3xl font-bold text-primary">3,842</p>
          <p className="text-sm text-muted-foreground mt-1">Across all document types</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Average Fields</h3>
          <p className="text-3xl font-bold text-primary">21.4</p>
          <p className="text-sm text-muted-foreground mt-1">Per document extracted</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-2">Verification Rate</h3>
          <p className="text-3xl font-bold text-accent">94.2%</p>
          <p className="text-sm text-muted-foreground mt-1">Auto-verified records</p>
        </Card>
      </div>
    </div>
  );
};

export default ExtractedDataView;
