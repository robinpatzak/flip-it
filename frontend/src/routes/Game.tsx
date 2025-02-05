import PlayerList from "@/components/PlayerList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import socket from "@/services/socket";
import { GameState, MemoryCard, Player } from "@/types/room";
import { SetStateAction, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface GameProps {
  isHost: boolean;
  players: Player[];
  playerName: string;
  setGameState: React.Dispatch<SetStateAction<GameState>>;
}

const Game: React.FC<GameProps> = ({
  isHost,
  players,
  playerName,
  setGameState,
}) => {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [currentTurn, setCurrentTurn] = useState("");
  const [canFlip, setCanFlip] = useState(true);

  useEffect(() => {
    if (roomId) {
      socket.emit("requestGame", { roomId });
    }

    socket.on(
      "updateGame",
      ({ gameState, cards, currentTurn, flippedCards }) => {
        if (!cards || !currentTurn || !flippedCards) return;
        setCards(cards);
        setCurrentTurn(currentTurn);
        setCanFlip(flippedCards.length < 2);
        setGameState(gameState);
      }
    );

    socket.on("turnUpdate", (playerName) => {
      setCurrentTurn(playerName);
      setCanFlip(true);
    });

    return () => {
      socket.off("updateGame");
      socket.off("turnUpdate");
    };
  }, [playerName, isHost, navigate, roomId, setGameState]);

  const handleCardClick = (clickedCard: MemoryCard) => {
    if (
      currentTurn !== playerName ||
      !canFlip ||
      clickedCard.isFlipped ||
      clickedCard.isMatched ||
      !roomId
    )
      return;

    socket.emit("flipCard", {
      roomId,
      cardId: clickedCard.id,
      playerName,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Memory Game</span>
            <span className="text-sm">
              Current Turn: {currentTurn}
              {currentTurn === playerName && " (Your Turn)"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {cards.map((card) => (
              <Button
                key={card.id}
                onClick={() => handleCardClick(card)}
                className={`h-24 text-3xl ${
                  currentTurn === playerName
                    ? "cursor-pointer"
                    : "cursor-not-allowed"
                }`}
                variant={card.isMatched ? "ghost" : "outline"}
                disabled={currentTurn !== playerName}
              >
                {card.isFlipped || card.isMatched ? card.face : "?"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      {roomId && (
        <PlayerList isHost={isHost} players={players} roomId={roomId} />
      )}
    </div>
  );
};

export default Game;
