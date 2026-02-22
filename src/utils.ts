import { CardData, Rank, Suit } from './types';

export const createDeck = (): CardData[] => {
  const deck: CardData[] = [];
  const suits = Object.values(Suit);
  const ranks = Object.values(Rank);

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
      });
    }
  }
  return deck;
};

export const shuffle = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const isPlayable = (card: CardData, topCard: CardData, activeSuit: Suit | null): boolean => {
  // If an 8 was played, the activeSuit is what matters
  if (activeSuit) {
    return card.rank === Rank.EIGHT || card.suit === activeSuit;
  }
  
  // Normal matching logic
  return (
    card.rank === Rank.EIGHT ||
    card.rank === topCard.rank ||
    card.suit === topCard.suit
  );
};
