import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import socket from "@/services/socket";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Game from "./Game";

interface Player {
  playerName: string;
  isHost: boolean;
}

const Room = () => {
  const navigate = useNavigate();
  const { isHost } = useLocation().state;

  const { roomId } = useParams();

  const [inviteLink, setInviteLink] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameStarted, setGameStarted] = useState(false);

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

  const kickPlayer = (playerName: string) => {
    if (isHost) {
      socket.emit("kickPlayer", { roomId, playerName });
    }
  };

  const startGame = () => {
    if (isHost) {
      socket.emit("startGame", { roomId });
    }
  };

  useEffect(() => {
    setInviteLink(`${window.location.origin}/${roomId}`);

    socket.on("updatePlayers", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("kicked", () => {
      navigate("/");
    });

    socket.on("gameStarted", () => {
      setGameStarted(true);
    });

    return () => {
      socket.off("updatedPlayers");
      socket.off("kicked");
      socket.off("gameStarted");
    };
  }, [roomId, navigate]);

  if (gameStarted) {
    return <Game />;
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
                disabled={players.length < 2}
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
          <div className="space-y-2">
            <label className="text-sm font-medium">Players in Room</label>
            <div className="space-y-1">
              {players.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-secondary rounded"
                >
                  <span>
                    {player.playerName} {player.isHost && "(Host)"}
                  </span>
                  {isHost && !player.isHost && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => kickPlayer(player.playerName)}
                    >
                      Kick
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Room;
