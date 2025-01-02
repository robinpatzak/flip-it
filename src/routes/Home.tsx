import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const Home = () => {
  const [playerName, setPlayerName] = useState("");

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
              onClick={() => console.log("Create room")}
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
