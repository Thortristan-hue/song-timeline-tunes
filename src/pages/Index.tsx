
import { Game } from "@/components/Game";

export default function Index() {
  // Get initial room and player IDs from URL params if available
  const urlParams = new URLSearchParams(window.location.search);
  const initialRoomId = urlParams.get('roomId') || undefined;
  const initialPlayerId = urlParams.get('playerId') || undefined;

  return (
    <Game 
      initialRoomId={initialRoomId}
      initialPlayerId={initialPlayerId}
    />
  );
}
