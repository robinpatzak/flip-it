import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import socket from "@/services/socket";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const JoinRoom = () => {
  const [playerName, setPlayerName] = useState("");
  const { roomId } = useParams();
  const navigate = useNavigate();

  const handleJoin = () => {
    socket.emit("joinRoom", { roomId, playerName });
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Join Game</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name</label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          <Button
            onClick={handleJoin}
            disabled={!playerName}
            className="w-full"
          >
            Join Room
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinRoom;
