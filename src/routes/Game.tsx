import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Game = () => {
  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Memory Game</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-2xl">Game</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Game;
