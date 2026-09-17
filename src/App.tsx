import React, { useState, useEffect } from 'react';
import { 
  Dices, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Student, ActiveTab } from './types';
import { SAMPLE_STUDENTS } from './utils/csvParser';
import { soundManager } from './utils/sound';
import { RandomPicker } from './components/RandomPicker';
import { AutoGroupGenerator } from './components/AutoGroupGenerator';
import { StudentManager } from './components/StudentManager';

const STORAGE_KEY = 'classroom_students_roster_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('lottery');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Initialize students from LocalStorage or default sample
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return SAMPLE_STUDENTS;
  });

  // Save students to LocalStorage
  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newStudents));
    } catch {
      // ignore
    }
  };

  // Sync sound setting
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
    if (next) {
      soundManager.playTick(600, 0.04);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Application Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                課堂抽籤與分組小幫手
                <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  教師專用版
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                名單支援 CSV 上傳 / 貼上 · 動畫音效抽籤 · 視覺化分組
              </p>
            </div>
          </div>

          {/* Top Actions: Sound toggle & Current Roster Pill */}
          <div className="flex items-center gap-2">
            <button
              id="btn-header-sound-toggle"
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                soundEnabled
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
              title={soundEnabled ? '點擊關閉音效' : '點擊開啟音效'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              id="btn-header-roster-badge"
              type="button"
              onClick={() => setActiveTab('roster')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="查看與管理學生名冊"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>全班 {students.length} 人</span>
            </button>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 border-t border-slate-100 -mb-px">
            <button
              id="tab-lottery"
              type="button"
              onClick={() => {
                setActiveTab('lottery');
                soundManager.playTick(550, 0.03);
              }}
              className={`py-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'lottery'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Dices className="w-4 h-4" />
              <span>隨機抽籤</span>
              <span className="text-2xs bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full">
                動畫音效
              </span>
            </button>

            <button
              id="tab-groups"
              type="button"
              onClick={() => {
                setActiveTab('groups');
                soundManager.playTick(550, 0.03);
              }}
              className={`py-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'groups'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>自動分組</span>
              <span className="text-2xs bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-full">
                視覺化卡片
              </span>
            </button>

            <button
              id="tab-roster"
              type="button"
              onClick={() => {
                setActiveTab('roster');
                soundManager.playTick(550, 0.03);
              }}
              className={`py-3 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'roster'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>名單管理</span>
              <span className="text-2xs bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
                CSV / 貼上
              </span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main App Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'lottery' && (
          <RandomPicker 
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'groups' && (
          <AutoGroupGenerator 
            students={students}
            onNavigateToRoster={() => setActiveTab('roster')}
          />
        )}

        {activeTab === 'roster' && (
          <StudentManager 
            students={students}
            onUpdateStudents={handleUpdateStudents}
            onNavigateToDraw={() => setActiveTab('lottery')}
            onNavigateToGroups={() => setActiveTab('groups')}
          />
        )}
      </main>

      {/* Teacher Assistance Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">課堂教學專用工具</span>
            <span>·</span>
            <span>支援全螢幕投影</span>
            <span>·</span>
            <span>可複製名單至 LINE 班群</span>
          </div>
          <div className="text-slate-400">
            名單自動保存於本機瀏覽器，重新整理不會遺失
          </div>
        </div>
      </footer>

    </div>
  );
}
