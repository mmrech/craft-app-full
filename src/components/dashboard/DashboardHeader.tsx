import { Activity } from "lucide-react";

const DashboardHeader = () => {
  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg cursor-pointer" onClick={() => window.location.href = '/'}>
              <Activity className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground cursor-pointer" onClick={() => window.location.href = '/'}>MedExtract</h1>
              <p className="text-sm text-muted-foreground">Clinical Data Extraction System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">Dr. Sarah Chen</p>
              <p className="text-xs text-muted-foreground">Healthcare Professional</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">SC</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
