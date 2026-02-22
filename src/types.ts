export enum Suit {
  HEARTS = 'hearts',
  DIAMONDS = 'diamonds',
  CLUBS = 'clubs',
  SPADES = 'spades',
}

export enum Rank {
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
  ACE = 'A',
}

export interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
}

export type GameStatus = 'menu' | 'playing' | 'won' | 'lost' | 'choosing_suit';

export interface GameState {
  deck: CardData[];
  discardPile: CardData[];
  playerHand: CardData[];
  aiHand: CardData[];
  currentTurn: 'player' | 'ai';
  status: GameStatus;
  activeSuit: Suit | null; // For when an 8 is played
  winner: 'player' | 'ai' | null;
}
