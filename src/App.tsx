
import '@/styles/design-system.css';
import '@/styles/animations.css';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GameProvider } from "@/contexts/GameContext";
import { performanceMonitor } from "@/services/PerformanceMonitor";
import { memoryCleanup } from "@/services/MemoryCleanup";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitor.onPerformanceWarning((metric, value) => {
      console.warn(`⚠️ Performance warning: ${metric} = ${value}`);
    });

    // Start memory cleanup monitoring
    memoryCleanup.startMonitoring();

    return () => {
      memoryCleanup.stopMonitoring();
    };
  }, []);

  return (
    <GameProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
      <Sonner />
    </GameProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
