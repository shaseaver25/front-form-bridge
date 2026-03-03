import { Suspense } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { allRoutes } from "./routes";


const queryClient = new QueryClient();

function AppRoutes() {
  const element = useRoutes(allRoutes);
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen text-muted-foreground">
          Loading…
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
        
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
