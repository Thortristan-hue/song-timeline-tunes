
import { Game } from "@/components/Game";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GameErrorBoundary } from "@/components/GameErrorBoundary";
import { GameProvider } from "@/providers/GameProvider";

const queryClient = new QueryClient();

const Index = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <GameErrorBoundary>
          <Game />
          <Toaster />
        </GameErrorBoundary>
      </GameProvider>
    </QueryClientProvider>
  );
};

export default Index;
