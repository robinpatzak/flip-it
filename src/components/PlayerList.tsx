import React from "react";
import { Button } from "./ui/button";
import { Player } from "@/routes/Room";
import socket from "@/services/socket";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface PlayerListProps {
  isHost: boolean;
  players: Player[];
  roomId: string;
}

const PlayerList: React.FC<PlayerListProps> = ({ isHost, players, roomId }) => {
  const kickPlayer = (playerName: string) => {
    if (isHost) {
      socket.emit("kickPlayer", { roomId, playerName });
    }
  };

  return (
    <Card className="space-y-2">
      <CardHeader>
        <CardTitle>Players in Room</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
};

export default PlayerList;
