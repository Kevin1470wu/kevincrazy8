import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardData, Suit, Rank, GameStatus, GameState } from './types';
import { createDeck, shuffle, isPlayable } from './utils';
import { 
  Heart, 
  Diamond, 
  Club, 
  Spade, 
  RotateCcw, 
  Trophy, 
  User, 
  Cpu,
  ChevronRight,
  Info
} from 'lucide-react';

const SUIT_COLORS = {
  [Suit.HEARTS]: 'text-red-500',
  [Suit.DIAMONDS]: 'text-red-500',
  [Suit.CLUBS]: 'text-slate-800',
  [Suit.SPADES]: 'text-slate-800',
};

const SUIT_ICONS = {
  [Suit.HEARTS]: Heart,
  [Suit.DIAMONDS]: Diamond,
  [Suit.CLUBS]: Club,
  [Suit.SPADES]: Spade,
};

const Card = ({ card, onClick, isHidden = false, isPlayable = false, className = "" }: { 
  card: CardData; 
  onClick?: () => void; 
  isHidden?: boolean;
  isPlayable?: boolean;
  className?: string;
  key?: React.Key;
}) => {
  const Icon = SUIT_ICONS[card.suit];
  
  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      whileHover={isPlayable ? { y: -10, scale: 1.05 } : {}}
      onClick={isPlayable ? onClick : undefined}
      className={`relative w-16 h-24 sm:w-24 sm:h-36 rounded-xl border-2 shadow-md flex flex-col items-center justify-center cursor-pointer transition-colors ${
        isHidden 
          ? 'bg-indigo-600 border-indigo-400' 
          : 'bg-white border-slate-200'
      } ${isPlayable ? 'ring-4 ring-emerald-400 border-emerald-500' : ''} ${className}`}
    >
      {isHidden ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-white/20 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white/10 rounded-full" />
          </div>
        </div>
      ) : (
        <>
          <div className={`absolute top-1 left-1 sm:top-2 sm:left-2 flex flex-col items-center ${SUIT_COLORS[card.suit]}`}>
            <span className="text-xs sm:text-lg font-bold leading-none">{card.rank}</span>
            <Icon size={12} className="sm:w-4 sm:h-4" fill="currentColor" />
          </div>
          <Icon size={24} className={`sm:w-12 sm:h-12 ${SUIT_COLORS[card.suit]}`} fill="currentColor" />
          <div className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 flex flex-col items-center rotate-180 ${SUIT_COLORS[card.suit]}`}>
            <span className="text-xs sm:text-lg font-bold leading-none">{card.rank}</span>
            <Icon size={12} className="sm:w-4 sm:h-4" fill="currentColor" />
          </div>
        </>
      )}
    </motion.div>
  );
};

const SUIT_NAMES_ZH = {
  [Suit.HEARTS]: '红心',
  [Suit.DIAMONDS]: '方块',
  [Suit.CLUBS]: '梅花',
  [Suit.SPADES]: '黑桃',
};

export default function App() {
  const [game, setGame] = useState<GameState | null>(null);
  const [message, setMessage] = useState<string>("欢迎来到 Tina 的疯狂 8 点！");
  const [isAiThinking, setIsAiThinking] = useState(false);
  const gameRef = React.useRef<GameState | null>(null);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  const initGame = useCallback(() => {
    const fullDeck = shuffle(createDeck());
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    
    // Find a starting card that isn't an 8
    let firstCardIndex = 0;
    while (fullDeck[firstCardIndex].rank === Rank.EIGHT) {
      firstCardIndex++;
    }
    const discardPile = [fullDeck.splice(firstCardIndex, 1)[0]];
    const deck = fullDeck;

    setGame({
      deck,
      discardPile,
      playerHand,
      aiHand,
      currentTurn: 'player',
      status: 'playing',
      activeSuit: null,
      winner: null,
    });
    setMessage("轮到你了！匹配花色或点数。");
  }, []);

  // Removed auto-init useEffect to show cover first

  const checkWin = (hand: CardData[], turn: 'player' | 'ai') => {
    if (hand.length === 0) {
      setGame(prev => prev ? {
        ...prev,
        status: turn === 'player' ? 'won' : 'lost',
        winner: turn,
      } : null);
      setMessage(turn === 'player' ? "恭喜！你赢了！" : "AI 赢了。再试一次吧！");
      return true;
    }
    return false;
  };

  const handlePlayCard = (card: CardData) => {
    if (!game || game.currentTurn !== 'player' || game.status !== 'playing') return;

    const topCard = game.discardPile[game.discardPile.length - 1];
    if (!isPlayable(card, topCard, game.activeSuit)) return;

    const newPlayerHand = game.playerHand.filter(c => c.id !== card.id);
    const newDiscardPile = [...game.discardPile, card];

    if (card.rank === Rank.EIGHT) {
      setGame(prev => prev ? {
        ...prev,
        playerHand: newPlayerHand,
        discardPile: newDiscardPile,
        status: 'choosing_suit',
      } : null);
      setMessage("请选择一个新的花色！");
    } else {
      if (checkWin(newPlayerHand, 'player')) return;

      setGame(prev => prev ? {
        ...prev,
        playerHand: newPlayerHand,
        discardPile: newDiscardPile,
        currentTurn: 'ai',
        activeSuit: null,
      } : null);
      setMessage("AI 正在思考...");
    }
  };

  const handleChooseSuit = (suit: Suit) => {
    if (!game || game.status !== 'choosing_suit') return;

    const nextTurn = game.currentTurn === 'player' ? 'ai' : 'player';
    
    // If it was AI's turn choosing suit, we already checked win before this
    // If it was player's turn, we check win before entering choosing_suit
    
    setGame(prev => prev ? {
      ...prev,
      status: 'playing',
      activeSuit: suit,
      currentTurn: nextTurn,
    } : null);
    
    if (nextTurn === 'ai') {
      setMessage(`花色已更改为 ${SUIT_NAMES_ZH[suit]}。轮到 AI 了。`);
    } else {
      setMessage(`花色已更改为 ${SUIT_NAMES_ZH[suit]}。轮到你了。`);
    }
  };

  const handleDrawCard = () => {
    if (!game || game.currentTurn !== 'player' || game.status !== 'playing') return;

    if (game.deck.length === 0) {
      setMessage("摸牌堆已空！跳过回合。");
      setGame(prev => prev ? { ...prev, currentTurn: 'ai' } : null);
      return;
    }

    const newDeck = [...game.deck];
    const drawnCard = newDeck.pop()!;
    const newPlayerHand = [...game.playerHand, drawnCard];

    setGame(prev => prev ? {
      ...prev,
      deck: newDeck,
      playerHand: newPlayerHand,
    } : null);

    setMessage(`你摸到了一张 ${SUIT_NAMES_ZH[drawnCard.suit]} ${drawnCard.rank}。`);
  };

  // AI Turn Trigger
  useEffect(() => {
    if (game?.currentTurn === 'ai' && game.status === 'playing' && !isAiThinking) {
      setIsAiThinking(true);
    }
  }, [game?.currentTurn, game?.status, isAiThinking]);

  // AI Turn Execution
  useEffect(() => {
    if (isAiThinking && gameRef.current) {
      const currentGame = gameRef.current;
      const timer = setTimeout(() => {
        const topCard = currentGame.discardPile[currentGame.discardPile.length - 1];
        const playableCards = currentGame.aiHand.filter(c => isPlayable(c, topCard, currentGame.activeSuit));

        if (playableCards.length > 0) {
          // AI strategy: play non-8 if possible, otherwise play 8
          const nonEight = playableCards.find(c => c.rank !== Rank.EIGHT);
          const cardToPlay = nonEight || playableCards[0];

          const newAiHand = currentGame.aiHand.filter(c => c.id !== cardToPlay.id);
          const newDiscardPile = [...currentGame.discardPile, cardToPlay];

          if (cardToPlay.rank === Rank.EIGHT) {
            // AI chooses most frequent suit in its hand
            const suitCounts = newAiHand.reduce((acc, c) => {
              acc[c.suit] = (acc[c.suit] || 0) + 1;
              return acc;
            }, {} as Record<Suit, number>);
            
            const bestSuit = (Object.keys(suitCounts) as Suit[]).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || Suit.HEARTS;

            if (newAiHand.length === 0) {
              setGame(prev => prev ? {
                ...prev,
                aiHand: newAiHand,
                discardPile: newDiscardPile,
                status: 'lost',
                winner: 'ai',
              } : null);
              setMessage("AI 赢了。再试一次吧！");
              setIsAiThinking(false);
              return;
            }

            setGame(prev => prev ? {
              ...prev,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              activeSuit: bestSuit,
              currentTurn: 'player',
            } : null);
            setMessage(`AI 打出了 8 并选择了 ${SUIT_NAMES_ZH[bestSuit]}。轮到你了！`);
          } else {
            if (newAiHand.length === 0) {
              setGame(prev => prev ? {
                ...prev,
                aiHand: newAiHand,
                discardPile: newDiscardPile,
                status: 'lost',
                winner: 'ai',
              } : null);
              setMessage("AI 赢了。再试一次吧！");
              setIsAiThinking(false);
              return;
            }

            setGame(prev => prev ? {
              ...prev,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              currentTurn: 'player',
              activeSuit: null,
            } : null);
            setMessage(`AI 打出了 ${SUIT_NAMES_ZH[cardToPlay.suit]} ${cardToPlay.rank}。轮到你了！`);
          }
        } else {
          // Draw
          if (currentGame.deck.length > 0) {
            const newDeck = [...currentGame.deck];
            const drawnCard = newDeck.pop()!;
            const newAiHand = [...currentGame.aiHand, drawnCard];
            
            // Check if drawn card is playable
            if (isPlayable(drawnCard, topCard, currentGame.activeSuit)) {
              // AI plays it immediately for simplicity
              const finalHand = newAiHand.filter(c => c.id !== drawnCard.id);
              const finalDiscard = [...currentGame.discardPile, drawnCard];
              
              if (drawnCard.rank === Rank.EIGHT) {
                const suitCounts = finalHand.reduce((acc, c) => {
                  acc[c.suit] = (acc[c.suit] || 0) + 1;
                  return acc;
                }, {} as Record<Suit, number>);
                const bestSuit = (Object.keys(suitCounts) as Suit[]).sort((a, b) => suitCounts[b] - suitCounts[a])[0] || Suit.HEARTS;

                setGame(prev => prev ? {
                  ...prev,
                  deck: newDeck,
                  aiHand: finalHand,
                  discardPile: finalDiscard,
                  activeSuit: bestSuit,
                  currentTurn: 'player',
                } : null);
                setMessage(`AI 摸牌并打出了 8，选择了 ${SUIT_NAMES_ZH[bestSuit]}。轮到你了！`);
              } else {
                setGame(prev => prev ? {
                  ...prev,
                  deck: newDeck,
                  aiHand: finalHand,
                  discardPile: finalDiscard,
                  currentTurn: 'player',
                  activeSuit: null,
                } : null);
                setMessage(`AI 摸牌并打出了 ${SUIT_NAMES_ZH[drawnCard.suit]} ${drawnCard.rank}。轮到你了！`);
              }
            } else {
              setGame(prev => prev ? {
                ...prev,
                deck: newDeck,
                aiHand: newAiHand,
                currentTurn: 'player',
              } : null);
              setMessage("AI 摸了一张牌但无法出牌。轮到你了！");
            }
          } else {
            setGame(prev => prev ? { ...prev, currentTurn: 'player' } : null);
            setMessage("AI 跳过了回合（摸牌堆已空）。轮到你了！");
          }
        }
        setIsAiThinking(false);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isAiThinking]);

  if (!game || game.status === 'menu') {
    return (
      <div className="min-h-screen bg-emerald-900 text-white font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col items-center justify-center p-6 relative">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-400/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 flex flex-col items-center text-center max-w-2xl"
        >
          {/* Decorative Hand of 8 Cards */}
          <div className="flex justify-center -space-x-8 sm:-space-x-12 mb-12">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50, rotate: -20 + i * 5 }}
                animate={{ opacity: 1, y: 0, rotate: -20 + i * 5 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative"
                style={{ zIndex: i }}
              >
                <Card 
                  card={{ id: `cover-${i}`, suit: [Suit.HEARTS, Suit.SPADES, Suit.DIAMONDS, Suit.CLUBS][i % 4], rank: Rank.EIGHT }} 
                  className="shadow-2xl"
                />
              </motion.div>
            ))}
          </div>

          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-8"
          >
            <span className="text-6xl font-black text-emerald-950">8</span>
          </motion.div>

          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-4 bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent">
            疯狂 8 点
          </h1>
          
          <p className="text-emerald-100/60 text-lg sm:text-xl font-medium mb-12 max-w-md leading-relaxed">
            一款经典的策略与运气并存的纸牌游戏。匹配花色或点数，记住：<span className="text-emerald-400 font-bold">8 是万能牌！</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={initGame}
              className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-2xl font-black text-xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 group"
            >
              开始游戏
              <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              className="px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold text-xl transition-all active:scale-95"
              onClick={() => alert("规则：匹配弃牌堆顶牌的花色或点数。8 是万能牌，可以随时打出并更改花色。最先清空手牌的一方获胜！")}
            >
              玩法说明
            </button>
          </div>

          <div className="mt-16 flex items-center gap-8 opacity-40">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">52</span>
              <span className="text-[10px] uppercase tracking-widest font-black">张牌</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">1v1</span>
              <span className="text-[10px] uppercase tracking-widest font-black">AI 模式</span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold">8</span>
              <span className="text-[10px] uppercase tracking-widest font-black">张万能牌</span>
            </div>
          </div>
        </motion.div>

        <footer className="absolute bottom-8 text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-300/20">
          Tina 出品 // v1.0.4
        </footer>
      </div>
    );
  }

  const topCard = game.discardPile[game.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-emerald-900 text-white font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-white/10 bg-black/20 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-2xl font-black text-emerald-950">8</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Tina 的疯狂 8 点</h1>
            <p className="text-xs text-emerald-300/70 font-medium uppercase tracking-widest">标准版</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">实时对战</span>
          </div>
          <button 
            onClick={initGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="重启游戏"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="flex-1 relative flex flex-col p-4 sm:p-8 gap-8 overflow-y-auto">
        
        {/* AI Hand */}
        <section className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-300/60 uppercase text-[10px] font-bold tracking-[0.2em]">
            <Cpu size={14} />
            <span>对手手牌 ({game.aiHand.length})</span>
          </div>
          <div className="flex flex-wrap justify-center gap-[-1.5rem] sm:gap-[-2.5rem]">
            {game.aiHand.map((card, idx) => (
              <div key={card.id} style={{ marginLeft: idx === 0 ? 0 : '-2rem' }} className="sm:ml-[-3rem]">
                <Card card={card} isHidden />
              </div>
            ))}
          </div>
        </section>

        {/* Center Table */}
        <section className="flex-1 flex flex-col items-center justify-center gap-8 py-4">
          <div className="flex items-center gap-12 sm:gap-24 relative">
            {/* Draw Pile */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                {game.deck.length > 0 ? (
                  <div 
                    onClick={handleDrawCard}
                    className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  >
                    {/* Stack effect */}
                    <div className="absolute top-1 left-1 w-16 h-24 sm:w-24 sm:h-36 bg-indigo-800 rounded-xl border-2 border-indigo-500 translate-x-1 translate-y-1" />
                    <div className="absolute top-2 left-2 w-16 h-24 sm:w-24 sm:h-36 bg-indigo-700 rounded-xl border-2 border-indigo-400 translate-x-2 translate-y-2" />
                    <Card card={game.deck[0]} isHidden className="relative z-10" />
                  </div>
                ) : (
                  <div className="w-16 h-24 sm:w-24 sm:h-36 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white/20 uppercase">Empty</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-emerald-300/50 uppercase tracking-widest">摸牌堆 ({game.deck.length})</span>
            </div>

            {/* Discard Pile */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  <Card 
                    key={topCard.id}
                    card={topCard} 
                    className="relative z-10 shadow-2xl shadow-black/40"
                  />
                </AnimatePresence>
                {game.activeSuit && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-4 -right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-20 border-2 border-emerald-500"
                  >
                    {React.createElement(SUIT_ICONS[game.activeSuit], { 
                      size: 20, 
                      className: SUIT_COLORS[game.activeSuit],
                      fill: 'currentColor'
                    })}
                  </motion.div>
                )}
              </div>
              <span className="text-[10px] font-bold text-emerald-300/50 uppercase tracking-widest">弃牌堆</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="max-w-md w-full px-6 py-3 bg-black/30 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full ${game.currentTurn === 'player' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'}`} />
            <p className="text-sm font-medium text-emerald-50 text-center flex-1">{message}</p>
          </div>
        </section>

        {/* Player Hand */}
        <section className="flex flex-col items-center gap-6 mt-auto pb-8">
          <div className="flex items-center gap-2 text-emerald-300/60 uppercase text-[10px] font-bold tracking-[0.2em]">
            <User size={14} />
            <span>你的手牌 ({game.playerHand.length})</span>
          </div>
          <div className="flex justify-center -space-x-6 sm:-space-x-10 px-4 max-w-full overflow-x-auto py-4">
            {game.playerHand.map((card, idx) => (
              <div key={card.id} style={{ zIndex: idx }} className="transition-transform hover:z-50">
                <Card 
                  card={card} 
                  isPlayable={game.currentTurn === 'player' && game.status === 'playing' && isPlayable(card, topCard, game.activeSuit)}
                  onClick={() => handlePlayCard(card)}
                  className="shadow-xl"
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Overlays */}
      <AnimatePresence>
        {game.status === 'choosing_suit' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-2 text-center">万能牌！</h2>
              <p className="text-slate-400 text-sm mb-8 text-center">你打出了 8。请选择一个新的花色以继续游戏。</p>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.values(Suit).map((suit) => {
                  const Icon = SUIT_ICONS[suit];
                  return (
                    <button
                      key={suit}
                      onClick={() => handleChooseSuit(suit)}
                      className="flex flex-col items-center gap-3 p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group active:scale-95"
                    >
                      <Icon size={32} className={`${SUIT_COLORS[suit]} group-hover:scale-110 transition-transform`} fill="currentColor" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-60">{SUIT_NAMES_ZH[suit]}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {(game.status === 'won' || game.status === 'lost') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-white/20 p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl text-center relative overflow-hidden"
            >
              {/* Background Glow */}
              <div className={`absolute -top-24 -left-24 w-48 h-48 blur-[100px] rounded-full ${game.status === 'won' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`} />
              
              <div className={`w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center ${game.status === 'won' ? 'bg-emerald-500 text-emerald-950' : 'bg-red-500 text-red-950'}`}>
                {game.status === 'won' ? <Trophy size={40} /> : <RotateCcw size={40} />}
              </div>
              
              <h2 className="text-4xl font-black mb-2 tracking-tight">
                {game.status === 'won' ? '胜利！' : '游戏结束'}
              </h2>
              <p className="text-slate-400 mb-10 font-medium">
                {game.status === 'won' 
                  ? "技术精湛！你清空了手牌并赢得了比赛。" 
                  : "这次 AI 技高一筹。不要放弃！"}
              </p>
              
              <button
                onClick={initGame}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${
                  game.status === 'won' 
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-500/20' 
                    : 'bg-white hover:bg-slate-200 text-slate-950 shadow-lg shadow-white/10'
                }`}
              >
                再玩一次
                <ChevronRight size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="p-4 bg-black/30 border-t border-white/5 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Info size={12} />
            <span>规则：匹配花色或点数。8 是万能牌。</span>
          </div>
        </div>
        <span>v1.0.4 // Tina 疯狂 8 点</span>
      </footer>
    </div>
  );
}
