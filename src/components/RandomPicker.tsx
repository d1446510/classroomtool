import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Dices, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  CheckCircle, 
  UserCheck, 
  History, 
  Sparkles, 
  Undo2,
  Users
} from 'lucide-react';
import { Student, DrawHistoryItem } from '../types';
import { soundManager } from '../utils/sound';

interface RandomPickerProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onNavigateToRoster,
}) => {
  // Config state
  const [allowRepeat, setAllowRepeat] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Pool & Drawing state
  const [remainingIds, setRemainingIds] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentWinner, setCurrentWinner] = useState<Student | null>(null);
  const [displayCandidate, setDisplayCandidate] = useState<Student | null>(null);
  const [drawHistory, setDrawHistory] = useState<DrawHistoryItem[]>([]);
  const [drawCount, setDrawCount] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<number | null>(null);

  // Initialize or synchronize remaining student pool
  useEffect(() => {
    // When students change or allowRepeat changes
    setRemainingIds(prev => {
      // Keep only remaining IDs that still exist in current students
      const validExisting = prev.filter(id => students.some(s => s.id === id));
      if (validExisting.length === 0 && students.length > 0) {
        return students.map(s => s.id);
      }
      return validExisting;
    });
  }, [students]);

  // Sync sound manager settings
  useEffect(() => {
    soundManager.enabled = soundEnabled;
  }, [soundEnabled]);

  // Reset the pool
  const handleResetPool = () => {
    setRemainingIds(students.map(s => s.id));
    setCurrentWinner(null);
    setDisplayCandidate(null);
    soundManager.playTick(500, 0.05);
  };

  // Clear draw history
  const handleClearHistory = () => {
    if (window.confirm('確定要清空抽取歷史紀錄嗎？')) {
      setDrawHistory([]);
    }
  };

  // Return a drawn student back into the remaining pool (if student was absent or drawn by mistake)
  const handleReturnToPool = (studentId: string) => {
    if (!remainingIds.includes(studentId)) {
      setRemainingIds(prev => [...prev, studentId]);
    }
    setDrawHistory(prev => prev.filter(item => item.student.id !== studentId));
    if (currentWinner?.id === studentId) {
      setCurrentWinner(null);
    }
    soundManager.playTick(400, 0.05);
  };

  // Launch the lottery roll
  const startDraw = () => {
    if (isDrawing || students.length === 0) return;

    // Determine available pool
    const pool = allowRepeat
      ? students
      : students.filter(s => remainingIds.includes(s.id));

    if (pool.length === 0) {
      alert('所有學生都已經抽過囉！請點擊「重置抽籤池」重新開始。');
      return;
    }

    setIsDrawing(true);
    setCurrentWinner(null);

    // Pick final winner in advance
    const winnerIndex = Math.floor(Math.random() * pool.length);
    const chosenWinner = pool[winnerIndex];

    // Animation physics parameters:
    // Starts fast (interval ~40ms), slowly decelerates to ~320ms over ~3 seconds
    let currentInterval = 45;
    const maxInterval = 320;
    const totalDuration = 2800; // ms
    const startTime = Date.now();

    let rollCount = 0;

    const runStep = () => {
      const elapsed = Date.now() - startTime;
      rollCount++;

      // Pick a random student for the slot flick
      const randomIndex = Math.floor(Math.random() * students.length);
      setDisplayCandidate(students[randomIndex]);

      // Sound tick: pitch increases slightly as it slows down for suspense
      const pitch = 400 + Math.min(600, (elapsed / totalDuration) * 500);
      soundManager.playTick(pitch, 0.035);

      if (elapsed < totalDuration) {
        // Deceleration curve (ease-out cubic progression)
        const progress = elapsed / totalDuration;
        currentInterval = 45 + Math.pow(progress, 2.5) * (maxInterval - 45);
        animationTimerRef.current = window.setTimeout(runStep, currentInterval);
      } else {
        // Finish rolling, land on final chosen winner
        setDisplayCandidate(chosenWinner);
        setCurrentWinner(chosenWinner);
        setIsDrawing(false);
        setDrawCount(c => c + 1);

        // Update remaining pool if no-repeat mode
        if (!allowRepeat) {
          setRemainingIds(prev => prev.filter(id => id !== chosenWinner.id));
        }

        // Record history
        setDrawHistory(prev => [
          {
            id: `draw_${Date.now()}`,
            student: chosenWinner,
            timestamp: Date.now(),
          },
          ...prev,
        ]);

        // Celebration sound & confetti
        soundManager.playFanfare();
        fireConfetti();
      }
    };

    runStep();
  };

  const fireConfetti = () => {
    try {
      // Confetti burst from both sides
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6, x: 0.3 },
      });
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6, x: 0.7 },
      });
    } catch {
      // ignore
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, []);

  const activePoolCount = allowRepeat
    ? students.length
    : students.filter(s => remainingIds.includes(s.id)).length;

  return (
    <div 
      ref={containerRef}
      id="random-picker-section" 
      className={`space-y-6 ${isFullscreen ? 'bg-slate-900 text-white p-8 min-h-screen flex flex-col justify-center' : ''}`}
    >
      {/* Top Controls & Mode Switcher */}
      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl border transition ${
        isFullscreen ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80 shadow-xs'
      }`}>
        {/* Mode Toggle: Allow Repeat vs Non-repeat */}
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            抽籤規則：
          </div>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              id="mode-no-repeat"
              type="button"
              onClick={() => {
                if (isDrawing) return;
                setAllowRepeat(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                !allowRepeat 
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
              不重複抽取 (抽完為止)
            </button>
            <button
              id="mode-allow-repeat"
              type="button"
              onClick={() => {
                if (isDrawing) return;
                setAllowRepeat(true);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                allowRepeat 
                  ? 'bg-white text-indigo-700 shadow-xs font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              可重複抽取
            </button>
          </div>
        </div>

        {/* Right side controls: Sound toggle, Fullscreen, Reset */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            id="btn-toggle-sound"
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? '音效已開啟' : '音效已靜音'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? '音效開' : '靜音'}</span>
          </button>

          {!allowRepeat && students.length > 0 && (
            <button
              id="btn-reset-pool"
              type="button"
              onClick={handleResetPool}
              disabled={isDrawing}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="將所有學生放回抽籤名冊"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              重置抽籤池
            </button>
          )}

          <button
            id="btn-toggle-fullscreen"
            type="button"
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              isFullscreen 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={isFullscreen ? '離開全螢幕' : '投影全螢幕模式'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? '縮小' : '全螢幕投影'}</span>
          </button>
        </div>
      </div>

      {/* Main Visual Arena */}
      {students.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">尚未匯入學生名冊</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
            請先在名單管理頁面上傳名冊或貼上學生姓名，即可開始進行抽籤！
          </p>
          <button
            id="btn-empty-goto-roster"
            type="button"
            onClick={onNavigateToRoster}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            前往設定名冊
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Slot Stage */}
          <div className={`${drawHistory.length > 0 && !isFullscreen ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-4`}>
            <div className={`relative overflow-hidden rounded-3xl border text-center transition-all ${
              isFullscreen 
                ? 'bg-slate-800 border-slate-700 p-10 min-h-[460px] flex flex-col justify-center' 
                : 'bg-white border-slate-200/90 shadow-sm p-8 sm:p-12 min-h-[380px] flex flex-col justify-center'
            }`}>
              
              {/* Subtle background decoration */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              {/* Status Header Badge */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {!allowRepeat ? (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    activePoolCount === 0 
                      ? 'bg-rose-100 text-rose-700' 
                      : isFullscreen ? 'bg-slate-700 text-indigo-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}>
                    <UserCheck className="w-3.5 h-3.5" />
                    抽籤池剩餘：{activePoolCount} / {students.length} 人
                  </span>
                ) : (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    isFullscreen ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}>
                    可重複模式（全班 {students.length} 人隨時入選）
                  </span>
                )}
              </div>

              {/* Central Name Stage */}
              <div className="py-4 my-auto">
                {isDrawing ? (
                  <div className="animate-pulse">
                    <div className="inline-block px-4 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mb-3">
                      ⚡ 正在隨機抽取中...
                    </div>
                    <div className={`font-black tracking-wider transition-all duration-75 select-none ${
                      isFullscreen ? 'text-6xl sm:text-8xl text-indigo-400' : 'text-5xl sm:text-7xl text-indigo-600'
                    }`}>
                      {displayCandidate ? (
                        <span>
                          {displayCandidate.seatNumber && (
                            <span className="text-3xl sm:text-4xl text-slate-400 mr-3 font-mono font-normal">
                              {displayCandidate.seatNumber}.
                            </span>
                          )}
                          {displayCandidate.name}
                        </span>
                      ) : '準備抽取...'}
                    </div>
                  </div>
                ) : currentWinner ? (
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      🎉 幸運中籤同學！
                    </div>

                    <div className="space-y-2">
                      {currentWinner.seatNumber && (
                        <div className="text-xl sm:text-2xl font-bold font-mono text-slate-400">
                          座號 {currentWinner.seatNumber}
                        </div>
                      )}
                      <div className={`font-black tracking-wider ${
                        isFullscreen ? 'text-6xl sm:text-9xl text-white' : 'text-5xl sm:text-8xl text-slate-900'
                      }`}>
                        {currentWinner.name}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
                      <Dices className="w-8 h-8" />
                    </div>
                    <h2 className={`font-bold ${isFullscreen ? 'text-3xl text-slate-200' : 'text-2xl text-slate-800'}`}>
                      隨機抽出一位學生
                    </h2>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      點擊下方按鈕，系統將隨機滾動名單並伴隨動畫音效抽出幸運學生！
                    </p>
                  </div>
                )}
              </div>

              {/* Action Big Button */}
              <div className="pt-6">
                {activePoolCount === 0 && !allowRepeat ? (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-rose-500">
                      班上所有同學都已經抽過一輪囉！
                    </p>
                    <button
                      id="btn-restart-pool-empty"
                      type="button"
                      onClick={handleResetPool}
                      className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition cursor-pointer text-base"
                    >
                      重新重置抽籤池
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      id="btn-trigger-draw"
                      type="button"
                      onClick={startDraw}
                      disabled={isDrawing}
                      className={`px-8 py-4 text-lg font-bold rounded-2xl shadow-md transition-all flex items-center gap-3 cursor-pointer ${
                        isDrawing 
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 active:scale-95 shadow-indigo-200'
                      }`}
                    >
                      <Dices className={`w-6 h-6 ${isDrawing ? 'animate-spin' : ''}`} />
                      <span>{isDrawing ? '抽籤中...' : currentWinner ? '再抽一位 🎲' : '開始抽籤 🎲'}</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Draw History Sidebar */}
          {drawHistory.length > 0 && !isFullscreen && (
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-[460px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <h3 className="font-bold text-slate-800 text-sm">本次抽取紀錄</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {drawHistory.length}
                    </span>
                  </div>
                  <button
                    id="btn-clear-draw-history"
                    type="button"
                    onClick={handleClearHistory}
                    className="text-xs text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    清除紀錄
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {drawHistory.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs transition group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-2xs flex items-center justify-center shrink-0">
                          {drawHistory.length - idx}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 text-sm">
                            {item.student.name}
                          </span>
                          {item.student.seatNumber && (
                            <span className="text-slate-400 ml-1.5 font-mono">
                              ({item.student.seatNumber}號)
                            </span>
                          )}
                        </div>
                      </div>

                      {!allowRepeat && (
                        <button
                          type="button"
                          onClick={() => handleReturnToPool(item.student.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 text-2xs"
                          title="若缺席可放回抽籤池"
                        >
                          <Undo2 className="w-3 h-3" />
                          放回
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100 text-2xs text-slate-400 text-center">
                  若有學生缺席或點錯，可將滑鼠移至名單點選「放回」
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
