import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import socket from "@/services/socket";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState("");

  const createRoom = () => {
    socket.emit("createRoom", { playerName });
    socket.on("roomCreated", ({ roomId }) => {
      navigate(`/room/${roomId}`);
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Memory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Name</label>
            <Input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-4">
            <Button
              onClick={createRoom}
              className="w-full"
              disabled={!playerName}
            >
              Create New Room
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
