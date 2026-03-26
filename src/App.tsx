import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCcw, Undo2, Trophy, Settings2, Pencil, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { GameState, Player, HistoryEntry } from './types';

const DEFAULT_POINTS_PER_SET = 11;
const DEFAULT_SETS_TO_WIN = 2; // Best of 3

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    player1: { name: 'Player 1', score: 0, setsWon: 0 },
    player2: { name: 'Player 2', score: 0, setsWon: 0 },
    currentServer: 1,
    history: [],
    isGameOver: false,
    winner: null,
    pointsPerSet: DEFAULT_POINTS_PER_SET,
    setsToWin: DEFAULT_SETS_TO_WIN,
    isSwapped: false,
  });

  const [showSettings, setShowSettings] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<1 | 2 | null>(null);
  const [tempName, setTempName] = useState('');

  // Calculate server
  const calculateServer = useCallback((p1Score: number, p2Score: number, pointsPerSet: number) => {
    const totalPoints = p1Score + p2Score;
    const isDeuce = p1Score >= pointsPerSet - 1 && p2Score >= pointsPerSet - 1;
    
    if (isDeuce) {
      // In deuce, service changes every point
      return (totalPoints % 2 === 0) ? 1 : 2;
    } else {
      // Normally service changes every 2 points
      const servesDone = Math.floor(totalPoints / 2);
      return (servesDone % 2 === 0) ? 1 : 2;
    }
  }, []);

  const addPoint = (playerNum: 1 | 2) => {
    if (gameState.isGameOver) return;

    setGameState(prev => {
      const newHistory: HistoryEntry = {
        player1Score: prev.player1.score,
        player2Score: prev.player2.score,
        currentServer: prev.currentServer,
      };

      // CRITICAL: Deep clone player objects to avoid mutation bugs
      const newState: GameState = { 
        ...prev, 
        player1: { ...prev.player1 },
        player2: { ...prev.player2 },
        history: [...prev.history, newHistory] 
      };
      
      if (playerNum === 1) {
        newState.player1.score += 1;
      } else {
        newState.player2.score += 1;
      }

      // Check for set win
      const p1 = newState.player1.score;
      const p2 = newState.player2.score;
      const limit = newState.pointsPerSet;

      if ((p1 >= limit || p2 >= limit) && Math.abs(p1 - p2) >= 2) {
        // Set finished
        if (p1 > p2) {
          newState.player1.setsWon += 1;
        } else {
          newState.player2.setsWon += 1;
        }

        // Check for match win
        if (newState.player1.setsWon >= newState.setsToWin) {
          newState.isGameOver = true;
          newState.winner = 1;
        } else if (newState.player2.setsWon >= newState.setsToWin) {
          newState.isGameOver = true;
          newState.winner = 2;
        } else {
          // Reset scores for next set
          newState.player1.score = 0;
          newState.player2.score = 0;
          // Swap sides every set
          newState.isSwapped = !prev.isSwapped;
          // In table tennis, the server for the next set is the one who didn't serve first in the previous set
          newState.currentServer = (newState.player1.setsWon + newState.player2.setsWon) % 2 === 0 ? 1 : 2;
        }
      } else {
        newState.currentServer = calculateServer(newState.player1.score, newState.player2.score, newState.pointsPerSet);
      }

      return newState;
    });
  };

  const subtractPoint = (playerNum: 1 | 2) => {
    if (gameState.isGameOver) return;

    setGameState(prev => {
      const player = playerNum === 1 ? prev.player1 : prev.player2;
      if (player.score === 0) return prev;

      const newHistory: HistoryEntry = {
        player1Score: prev.player1.score,
        player2Score: prev.player2.score,
        currentServer: prev.currentServer,
      };

      const newState: GameState = { 
        ...prev, 
        player1: { ...prev.player1 },
        player2: { ...prev.player2 },
        history: [...prev.history, newHistory] 
      };
      
      if (playerNum === 1) {
        newState.player1.score -= 1;
      } else {
        newState.player2.score -= 1;
      }

      newState.currentServer = calculateServer(newState.player1.score, newState.player2.score, newState.pointsPerSet);

      return newState;
    });
  };

  const undo = () => {
    setGameState(prev => {
      if (prev.history.length === 0 || prev.isGameOver) return prev;
      const lastEntry = prev.history[prev.history.length - 1];
      const newHistory = prev.history.slice(0, -1);
      
      return {
        ...prev,
        player1: { ...prev.player1, score: lastEntry.player1Score },
        player2: { ...prev.player2, score: lastEntry.player2Score },
        currentServer: lastEntry.currentServer,
        history: newHistory
      };
    });
  };

  const reset = () => {
    setGameState({
      player1: { name: gameState.player1.name, score: 0, setsWon: 0 },
      player2: { name: gameState.player2.name, score: 0, setsWon: 0 },
      currentServer: 1,
      history: [],
      isGameOver: false,
      winner: null,
      pointsPerSet: gameState.pointsPerSet,
      setsToWin: gameState.setsToWin,
      isSwapped: false,
    });
  };

  const saveName = () => {
    if (editingPlayer === 1) {
      setGameState(prev => ({ ...prev, player1: { ...prev.player1, name: tempName || 'Player 1' } }));
    } else if (editingPlayer === 2) {
      setGameState(prev => ({ ...prev, player2: { ...prev.player2, name: tempName || 'Player 2' } }));
    }
    setEditingPlayer(null);
  };

  return (
    <div className="min-h-screen bg-[#151619] text-white font-sans selection:bg-orange-500/30">
      {/* Header */}
      <header className="p-6 flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Trophy size={20} className="text-black" />
          </div>
          <h1 className="text-xl font-bold tracking-tight uppercase italic font-serif">Ping Pong Pro</h1>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={undo}
            disabled={gameState.history.length === 0 || gameState.isGameOver}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors disabled:opacity-30"
            title="Undo"
          >
            <Undo2 size={20} />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings2 size={20} />
          </button>
          <button 
            onClick={reset}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-red-400"
            title="Reset Match"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 relative">
        {/* Render ScoreCards based on isSwapped state */}
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={gameState.isSwapped ? 'p2-left' : 'p1-left'}
            layout
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            className="w-full"
          >
            {gameState.isSwapped ? (
              <ScoreCard 
                player={gameState.player2} 
                isServing={gameState.currentServer === 2}
                onAddPoint={() => addPoint(2)}
                onSubtractPoint={() => subtractPoint(2)}
                onEditName={() => { setEditingPlayer(2); setTempName(gameState.player2.name); }}
                isWinner={gameState.winner === 2}
                side="left"
                setsToWin={gameState.setsToWin}
              />
            ) : (
              <ScoreCard 
                player={gameState.player1} 
                isServing={gameState.currentServer === 1}
                onAddPoint={() => addPoint(1)}
                onSubtractPoint={() => subtractPoint(1)}
                onEditName={() => { setEditingPlayer(1); setTempName(gameState.player1.name); }}
                isWinner={gameState.winner === 1}
                side="left"
                setsToWin={gameState.setsToWin}
              />
            )}
          </motion.div>

          <motion.div 
            key={gameState.isSwapped ? 'p1-right' : 'p2-right'}
            layout
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="w-full"
          >
            {gameState.isSwapped ? (
              <ScoreCard 
                player={gameState.player1} 
                isServing={gameState.currentServer === 1}
                onAddPoint={() => addPoint(1)}
                onSubtractPoint={() => subtractPoint(1)}
                onEditName={() => { setEditingPlayer(1); setTempName(gameState.player1.name); }}
                isWinner={gameState.winner === 1}
                side="right"
                setsToWin={gameState.setsToWin}
              />
            ) : (
              <ScoreCard 
                player={gameState.player2} 
                isServing={gameState.currentServer === 2}
                onAddPoint={() => addPoint(2)}
                onSubtractPoint={() => subtractPoint(2)}
                onEditName={() => { setEditingPlayer(2); setTempName(gameState.player2.name); }}
                isWinner={gameState.winner === 2}
                side="right"
                setsToWin={gameState.setsToWin}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* VS Divider */}
        <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-64 bg-gradient-to-b from-transparent via-white/20 to-transparent items-center justify-center pointer-events-none">
          <div className="bg-[#151619] px-4 py-2 text-xs font-mono text-white/40 tracking-[0.3em] uppercase rotate-90">
            Versus
          </div>
        </div>
      </main>

      {/* Match Info Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-8 flex justify-center gap-12 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none">
        <div className="flex flex-col items-center pointer-events-auto">
          <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Format</span>
          <span className="text-sm font-medium">Best of {gameState.setsToWin * 2 - 1} ({gameState.pointsPerSet} pts)</span>
        </div>
        <div className="flex flex-col items-center pointer-events-auto">
          <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-mono">Current Set</span>
          <span className="text-sm font-medium">Set {gameState.player1.setsWon + gameState.player2.setsWon + 1}</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1c1d21] border border-white/10 p-8 rounded-2xl max-w-md w-full shadow-2xl"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Settings2 size={24} className="text-orange-500" />
                Match Settings
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-3 font-mono">Points per Set</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setGameState(prev => ({ ...prev, pointsPerSet: Math.max(5, prev.pointsPerSet - 1) }))}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronDown size={20} />
                    </button>
                    <span className="text-2xl font-mono w-12 text-center">{gameState.pointsPerSet}</span>
                    <button 
                      onClick={() => setGameState(prev => ({ ...prev, pointsPerSet: Math.min(21, prev.pointsPerSet + 1) }))}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronUp size={20} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/40 mb-3 font-mono">Sets to Win Match</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setGameState(prev => ({ ...prev, setsToWin: Math.max(1, prev.setsToWin - 1) }))}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronDown size={20} />
                    </button>
                    <span className="text-2xl font-mono w-12 text-center">{gameState.setsToWin}</span>
                    <button 
                      onClick={() => setGameState(prev => ({ ...prev, setsToWin: Math.min(5, prev.setsToWin + 1) }))}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <ChevronUp size={20} />
                    </button>
                  </div>
                  <p className="mt-2 text-[10px] text-white/30 italic">Best of {gameState.setsToWin * 2 - 1} sets</p>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full mt-8 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-xl transition-all active:scale-[0.98]"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Name Modal */}
      <AnimatePresence>
        {editingPlayer !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-[#1c1d21] border border-white/10 p-8 rounded-2xl max-w-sm w-full shadow-2xl"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Pencil size={20} className="text-orange-500" />
                Edit Player {editingPlayer} Name
              </h2>
              <input 
                autoFocus
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors mb-6"
                placeholder="Enter name..."
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => setEditingPlayer(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveName}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-xl transition-all active:scale-[0.98]"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winner Overlay */}
      <AnimatePresence>
        {gameState.isGameOver && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-6 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", damping: 12 }}
            >
              <div className="w-24 h-24 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(249,115,22,0.4)]">
                <Trophy size={48} className="text-black" />
              </div>
              <h2 className="text-5xl font-black uppercase italic tracking-tighter mb-2">Match Point!</h2>
              <p className="text-2xl text-white/60 mb-12">
                <span className="text-orange-500 font-bold">{gameState.winner === 1 ? gameState.player1.name : gameState.player2.name}</span> wins the match
              </p>
              
              <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                <button 
                  onClick={reset}
                  className="py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-orange-500 transition-colors active:scale-95"
                >
                  New Match
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScoreCard({ 
  player, 
  isServing, 
  onAddPoint, 
  onSubtractPoint,
  onEditName, 
  isWinner,
  side,
  setsToWin
}: { 
  player: Player; 
  isServing: boolean; 
  onAddPoint: () => void;
  onSubtractPoint: () => void;
  onEditName: () => void;
  isWinner: boolean;
  side: 'left' | 'right';
  setsToWin: number;
}) {
  return (
    <div className={`flex flex-col w-full ${side === 'right' ? 'md:items-end' : 'md:items-start'}`}>
      <div className={`flex items-center gap-3 mb-6 group w-full ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
        {side === 'right' && (
          <button 
            onClick={onEditName}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-md transition-all text-white/40 hover:text-white"
          >
            <Pencil size={14} />
          </button>
        )}
        <h2 className="text-3xl font-black tracking-tight uppercase italic">{player.name}</h2>
        {side === 'left' && (
          <button 
            onClick={onEditName}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-md transition-all text-white/40 hover:text-white"
          >
            <Pencil size={14} />
          </button>
        )}
      </div>

      <div className="relative w-full">
        {/* HUGE Serving Indicator Overlay */}
        <AnimatePresence>
          {isServing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute -inset-4 border-4 border-orange-500 rounded-[2.5rem] pointer-events-none z-20 shadow-[0_0_40px_rgba(249,115,22,0.3)]"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-black px-8 py-1.5 rounded-full font-black text-lg tracking-[0.3em] uppercase shadow-lg">
                Service
              </div>
              <motion.div 
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-orange-500/10 rounded-[2.3rem]"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Display */}
        <div className="relative group">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAddPoint}
            className={`w-full aspect-square md:aspect-[4/3] bg-[#1c1d21] border-2 ${isServing ? 'border-orange-500' : 'border-white/5'} rounded-3xl flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-2xl`}
          >
            {/* Background Glow for Server */}
            {isServing && (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-transparent" />
            )}
            
            <AnimatePresence mode="wait">
              <motion.span
                key={player.score}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -40, opacity: 0 }}
                className={`text-[15rem] md:text-[22rem] font-black leading-none font-mono tracking-tighter ${isServing ? 'text-orange-500' : 'text-white'}`}
              >
                {player.score}
              </motion.span>
            </AnimatePresence>

            {/* Large Tap Area Label */}
            <div className="absolute bottom-8 text-xs font-mono uppercase tracking-[0.5em] text-white/10 group-hover:text-white/30 transition-colors">
              +1 Point
            </div>
          </motion.button>

          {/* Minus Button Overlay */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSubtractPoint();
            }}
            disabled={player.score === 0}
            className={`absolute top-6 ${side === 'left' ? 'right-6' : 'left-6'} w-12 h-12 bg-white/5 hover:bg-red-500/20 border border-white/10 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 active:scale-90 z-30`}
            title="Subtract Point"
          >
            <Minus size={20} className="text-red-400" />
          </button>
        </div>

        {/* Sets Won Dots */}
        <div className={`mt-10 flex items-center gap-4 ${side === 'right' ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs font-mono uppercase tracking-widest text-white/40">Sets Won</span>
          <div className="flex gap-2">
            {[...Array(setsToWin)].map((_, i) => (
              <div 
                key={i}
                className={`w-16 h-3 rounded-full transition-all duration-500 ${
                  i < player.setsWon 
                    ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)]' 
                    : 'bg-white/5'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
