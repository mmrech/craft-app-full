import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import Index from "./pages/Index";

const App = () => (
  <ErrorBoundary>
    <Toaster />
    <Sonner />
    <OfflineIndicator />
    <Index />
  </ErrorBoundary>
);

export default App;
