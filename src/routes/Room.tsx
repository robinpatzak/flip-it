import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import socket from "@/services/socket";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Game from "./Game";
import PlayerList from "@/components/PlayerList";
import { GameState, Player } from "@/types/room";

const Room = () => {
  const navigate = useNavigate();

  const { roomId } = useParams();

  const [inviteLink, setInviteLink] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>("waiting");
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState("");

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const startGame = () => {
    if (isHost && roomId) {
      socket.emit("startGame", { roomId });
    }
  };

  useEffect(() => {
    setInviteLink(`${window.location.origin}/${roomId}`);

    if (roomId) {
      socket.emit("requestRoom", { roomId });
    }

    socket.on("updatePlayers", (updatedPlayers) => {
      setPlayers(updatedPlayers);

      const currentPlayer = updatedPlayers.find(
        (player) => player.socketId === socket.id
      );
      if (currentPlayer) {
        setIsHost(currentPlayer.isHost);
        setPlayerName(currentPlayer.playerName);
      }
    });

    socket.on("kicked", () => {
      navigate("/");
    });

    socket.on("gameStarted", () => {
      setGameState("playing");
    });

    return () => {
      socket.off("updatePlayers");
      socket.off("kicked");
      socket.off("gameStarted");
    };
  }, [roomId, navigate]);

  if (gameState === "playing" || gameState === "ending") {
    return (
      <Game
        isHost={isHost}
        players={players}
        playerName={playerName}
        setGameState={setGameState}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Room</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Invite Link</label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={inviteLink}
                readOnly
                className="w-full"
              />
              <Button onClick={copyToClipboard}>
                {copySuccess ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {isHost ? (
              <Button
                onClick={startGame}
                disabled={!players.length}
                className="w-full"
              >
                Start Game
              </Button>
            ) : (
              <Button disabled className="w-full">
                Waiting for host...
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      {roomId && (
        <PlayerList isHost={isHost} players={players} roomId={roomId} />
      )}
    </div>
  );
};

export default Room;
