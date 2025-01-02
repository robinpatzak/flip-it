import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface Card {
  id: number;
  face: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const DUMMY_CARDS: Card[] = [
  { id: 1, face: "🐶", isFlipped: false, isMatched: false },
  { id: 2, face: "🐱", isFlipped: false, isMatched: false },
  { id: 3, face: "🐰", isFlipped: false, isMatched: false },
  { id: 4, face: "🦊", isFlipped: false, isMatched: false },
  { id: 5, face: "🐶", isFlipped: false, isMatched: false },
  { id: 6, face: "🐱", isFlipped: false, isMatched: false },
  { id: 7, face: "🐰", isFlipped: false, isMatched: false },
  { id: 8, face: "🦊", isFlipped: false, isMatched: false },
];

const flipTimeoutLength = 1000;

const Game = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<Card[]>([]);
  const [canFlip, setCanFlip] = useState(true);

  useEffect(() => {
    const shuffledCards = [...DUMMY_CARDS].sort(() => Math.random() - 0.5);
    setCards(shuffledCards);
  }, []);

  useEffect(() => {
    if (flippedCards.length === 2) {
      setCanFlip(false);

      if (flippedCards[0].face === flippedCards[1].face) {
        setCards(
          cards.map((card) =>
            flippedCards.some((flippedCard) => flippedCard.id === card.id)
              ? { ...card, isMatched: true }
              : card
          )
        );
        setFlippedCards([]);
        setCanFlip(true);
      } else {
        setTimeout(() => {
          setCards(
            cards.map((card) =>
              flippedCards.some((flippedCard) => flippedCard.id === card.id)
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setCanFlip(true);
        }, flipTimeoutLength);
      }
    }
  }, [flippedCards, cards]);

  const handleCardClick = (clickedCard: Card) => {
    if (!canFlip || clickedCard.isFlipped || clickedCard.isMatched) return;

    const updatedCards = cards.map((card) =>
      card.id === clickedCard.id ? { ...card, isFlipped: true } : card
    );
    setCards(updatedCards);
    setFlippedCards([...flippedCards, clickedCard]);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Memory Game</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {cards.map((card) => (
              <Button
                key={card.id}
                onClick={() => handleCardClick(card)}
                className="h-24 text-3xl"
                variant={card.isMatched ? "ghost" : "outline"}
              >
                {card.isFlipped || card.isMatched ? card.face : "?"}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Game;
