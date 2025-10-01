import { useState } from "react";
import { Upload, FileText, Database, Activity, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatsOverview from "@/components/dashboard/StatsOverview";
import RecentExtractions from "@/components/dashboard/RecentExtractions";
import UploadSection from "@/components/upload/UploadSection";
import ExtractedDataView from "@/components/data/ExtractedDataView";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="dashboard">
              <Activity className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="data">
              <Database className="w-4 h-4 mr-2" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <StatsOverview />
            <RecentExtractions />
          </TabsContent>

          <TabsContent value="upload">
            <UploadSection />
          </TabsContent>

          <TabsContent value="data">
            <ExtractedDataView />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
