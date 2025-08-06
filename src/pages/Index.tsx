
import { Game } from "@/components/Game";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GameErrorBoundary } from "@/components/GameErrorBoundary";

const queryClient = new QueryClient();

const Index = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GameErrorBoundary>
        <Game />
        <Toaster />
      </GameErrorBoundary>
    </QueryClientProvider>
  );
};

export default Index;
