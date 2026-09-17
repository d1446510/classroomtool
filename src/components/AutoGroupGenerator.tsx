import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Shuffle, 
  Copy, 
  Download, 
  Check, 
  ArrowRightLeft, 
  Edit2, 
  Settings2, 
  Layers,
  Sparkles,
  Printer
} from 'lucide-react';
import { Student, StudentGroup } from '../types';
import { exportGroupsToCsv } from '../utils/csvParser';
import { soundManager } from '../utils/sound';

interface AutoGroupGeneratorProps {
  students: Student[];
  onNavigateToRoster: () => void;
}

const COLOR_PALETTES = [
  { bg: 'bg-indigo-50/70', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800', header: 'text-indigo-900', text: 'text-slate-800' },
  { bg: 'bg-emerald-50/70', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800', header: 'text-emerald-900', text: 'text-slate-800' },
  { bg: 'bg-amber-50/70', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', header: 'text-amber-900', text: 'text-slate-800' },
  { bg: 'bg-rose-50/70', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-800', header: 'text-rose-900', text: 'text-slate-800' },
  { bg: 'bg-cyan-50/70', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-800', header: 'text-cyan-900', text: 'text-slate-800' },
  { bg: 'bg-purple-50/70', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800', header: 'text-purple-900', text: 'text-slate-800' },
  { bg: 'bg-teal-50/70', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-800', header: 'text-teal-900', text: 'text-slate-800' },
  { bg: 'bg-sky-50/70', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-800', header: 'text-sky-900', text: 'text-slate-800' },
  { bg: 'bg-orange-50/70', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800', header: 'text-orange-900', text: 'text-slate-800' },
  { bg: 'bg-pink-50/70', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-800', header: 'text-pink-900', text: 'text-slate-800' },
];

export const AutoGroupGenerator: React.FC<AutoGroupGeneratorProps> = ({
  students,
  onNavigateToRoster,
}) => {
  // Settings
  const [groupSizeMode, setGroupSizeMode] = useState<'bySize' | 'byCount'>('bySize');
  const [targetSize, setTargetSize] = useState<number>(4); // 每組幾人
  const [targetGroupCount, setTargetGroupCount] = useState<number>(4); // 分成幾組
  const [distributeRemainder, setDistributeRemainder] = useState<boolean>(true); // 平分餘數 vs 獨立一組

  // Generated groups
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);

  // Student transfer modal / popover state
  const [movingStudent, setMovingStudent] = useState<{ student: Student; fromGroupId: string } | null>(null);

  // Perform auto-grouping algorithm
  const generateGroups = () => {
    if (students.length === 0) return;

    setIsShuffling(true);
    soundManager.playShuffle();

    // Fisher-Yates shuffle array
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    let calculatedGroups: Student[][] = [];

    if (groupSizeMode === 'bySize') {
      const size = Math.max(1, targetSize);
      if (distributeRemainder) {
        // Distribute remainder evenly across groups
        const numGroups = Math.max(1, Math.round(shuffled.length / size));
        calculatedGroups = Array.from({ length: numGroups }, () => []);
        shuffled.forEach((student, index) => {
          calculatedGroups[index % numGroups].push(student);
        });
      } else {
        // Chunk into exact sizes, remainder is its own group
        for (let i = 0; i < shuffled.length; i += size) {
          calculatedGroups.push(shuffled.slice(i, i + size));
        }
      }
    } else {
      // By group count
      const count = Math.max(1, Math.min(targetGroupCount, shuffled.length));
      calculatedGroups = Array.from({ length: count }, () => []);
      shuffled.forEach((student, index) => {
        calculatedGroups[index % count].push(student);
      });
    }

    // Build StudentGroup structures
    const newGroups: StudentGroup[] = calculatedGroups
      .filter(g => g.length > 0)
      .map((members, index) => {
        const palette = COLOR_PALETTES[index % COLOR_PALETTES.length];
        return {
          id: `group_${Date.now()}_${index}`,
          name: `第 ${index + 1} 組`,
          colorTheme: palette,
          members,
        };
      });

    setTimeout(() => {
      setGroups(newGroups);
      setIsShuffling(false);
      soundManager.playTick(700, 0.05);
    }, 250);
  };

  // Initial group generation when component loads or student count changes significantly
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      generateGroups();
    }
  }, [students.length]);

  // Copy formatted text
  const handleCopyText = () => {
    if (groups.length === 0) return;

    let text = `【課堂小組分組名單】(全班共 ${students.length} 人，分成 ${groups.length} 組)\n\n`;
    groups.forEach((g) => {
      const memberNames = g.members
        .map(m => (m.seatNumber ? `${m.seatNumber}.${m.name}` : m.name))
        .join('、');
      text += `■ ${g.name} (${g.members.length}人)：${memberNames}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Download CSV
  const handleDownloadCsv = () => {
    if (groups.length === 0) return;
    const csvData = exportGroupsToCsv(groups);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `課堂分組名冊_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Rename group
  const handleStartRename = (group: StudentGroup) => {
    setEditingGroupId(group.id);
    setEditGroupName(group.name);
  };

  const handleSaveRename = (groupId: string) => {
    if (editGroupName.trim()) {
      setGroups(groups.map(g => g.id === groupId ? { ...g, name: editGroupName.trim() } : g));
    }
    setEditingGroupId(null);
  };

  // Move a student to another group
  const handleMoveStudent = (targetGroupId: string) => {
    if (!movingStudent) return;
    const { student, fromGroupId } = movingStudent;
    if (fromGroupId === targetGroupId) {
      setMovingStudent(null);
      return;
    }

    setGroups(prevGroups => {
      return prevGroups.map(g => {
        if (g.id === fromGroupId) {
          return { ...g, members: g.members.filter(m => m.id !== student.id) };
        }
        if (g.id === targetGroupId) {
          return { ...g, members: [...g.members, student] };
        }
        return g;
      });
    });

    setMovingStudent(null);
    soundManager.playTick(500, 0.04);
  };

  return (
    <div id="auto-group-generator-section" className="space-y-6">
      
      {/* Settings Control Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">自動分組設定</h3>
              <p className="text-xs text-slate-500">
                可自由設定每組人數，系統將隨機產生公平小組名單。
              </p>
            </div>
          </div>

          {/* Group size presets & mode */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setGroupSizeMode('bySize')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  groupSizeMode === 'bySize' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                每組人數
              </button>
              <button
                type="button"
                onClick={() => setGroupSizeMode('byCount')}
                className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  groupSizeMode === 'byCount' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                固定組數
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Detailed configuration */}
          <div className="flex items-center gap-4 flex-wrap">
            {groupSizeMode === 'bySize' ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">每組：</span>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5, 6].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTargetSize(num)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        targetSize === num
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {num}人
                    </button>
                  ))}
                  
                  {/* Custom Number Input */}
                  <div className="flex items-center gap-1 ml-1 text-xs text-slate-500">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, students.length)}
                      value={targetSize}
                      onChange={(e) => setTargetSize(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-2 py-1.5 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span>人</span>
                  </div>
                </div>

                {/* Remainder option */}
                <label className="flex items-center gap-1.5 text-xs text-slate-600 ml-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={distributeRemainder}
                    onChange={(e) => setDistributeRemainder(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>餘數平均分散到各組</span>
                </label>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">總共分成：</span>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5, 6, 8].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setTargetGroupCount(num)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition border cursor-pointer ${
                        targetGroupCount === num
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {num}組
                    </button>
                  ))}
                  
                  <div className="flex items-center gap-1 ml-1 text-xs text-slate-500">
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, students.length)}
                      value={targetGroupCount}
                      onChange={(e) => setTargetGroupCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-14 px-2 py-1.5 text-center text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span>組</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action: Trigger Shuffle */}
          <button
            id="btn-trigger-group-shuffle"
            type="button"
            onClick={generateGroups}
            disabled={students.length === 0 || isShuffling}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Shuffle className={`w-4 h-4 ${isShuffling ? 'animate-spin' : ''}`} />
            {isShuffling ? '分組中...' : '隨機重新分組 🎲'}
          </button>
        </div>
      </div>

      {/* Grouping Results Toolbar */}
      {students.length > 0 && groups.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-700">
              分組結果（共 {groups.length} 組，{students.length} 位學生）
            </span>
            <span className="text-xs text-slate-400 hidden md:inline">
              · 點擊組名筆圖示可自訂組名，點擊學生箭頭可手動調組
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-copy-groups-text"
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? '已複製名單！' : '複製名單文字'}</span>
            </button>

            <button
              id="btn-download-groups-csv"
              type="button"
              onClick={handleDownloadCsv}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              title="匯出為 Excel CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>匯出 CSV</span>
            </button>

            <button
              id="btn-print-groups"
              type="button"
              onClick={() => window.print()}
              className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs rounded-xl shadow-2xs transition cursor-pointer"
              title="列印分組結果"
            >
              <Printer className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      )}

      {/* Main Visual Groups Bento Grid */}
      {students.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">名冊目前是空的</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-5">
            請先前往名單管理匯入學生資料，再使用自動分組功能。
          </p>
          <button
            type="button"
            onClick={onNavigateToRoster}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            前往匯入名冊
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
          {groups.map((group, groupIdx) => (
            <div
              key={group.id}
              className={`rounded-2xl border ${group.colorTheme.border} ${group.colorTheme.bg} p-4.5 shadow-2xs flex flex-col justify-between transition hover:shadow-xs`}
            >
              {/* Group Header */}
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/5 mb-3">
                {editingGroupId === group.id ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(e) => setEditGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRename(group.id);
                        if (e.key === 'Escape') setEditingGroupId(null);
                      }}
                      autoFocus
                      className="w-full px-2 py-1 text-sm font-bold bg-white border border-indigo-300 rounded-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(group.id)}
                      className="px-2 py-1 text-xs font-bold text-white bg-indigo-600 rounded-lg cursor-pointer"
                    >
                      儲存
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className={`font-black text-base truncate ${group.colorTheme.header}`}>
                      {group.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartRename(group)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded transition cursor-pointer shrink-0"
                      title="自訂組名"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${group.colorTheme.badge} shrink-0`}>
                  {group.members.length} 人
                </span>
              </div>

              {/* Members List */}
              <div className="space-y-2 flex-1 min-h-[140px]">
                {group.members.map((member, mIdx) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between px-3 py-2 bg-white/90 rounded-xl border border-black/5 text-sm shadow-2xs group hover:bg-white transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 text-2xs font-mono font-bold flex items-center justify-center shrink-0">
                        {member.seatNumber || (mIdx + 1)}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {member.name}
                      </span>
                    </div>

                    {/* Move student to another group */}
                    <button
                      type="button"
                      onClick={() => setMovingStudent({ student: member, fromGroupId: group.id })}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition cursor-pointer"
                      title="調整至其他組別"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {group.members.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 italic py-6">
                    此組暫無成員
                  </div>
                )}
              </div>

              {/* Footer Indicator */}
              <div className="mt-3 pt-2 text-2xs text-slate-400 text-right">
                第 {groupIdx + 1} 小組
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Student Reassignment Modal */}
      {movingStudent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                將學生「{movingStudent.student.name}」移至：
              </h4>
              <button
                type="button"
                onClick={() => setMovingStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {groups.map(g => (
                <button
                  key={g.id}
                  type="button"
                  disabled={g.id === movingStudent.fromGroupId}
                  onClick={() => handleMoveStudent(g.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold text-left border transition cursor-pointer flex items-center justify-between ${
                    g.id === movingStudent.fromGroupId
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white hover:bg-indigo-50 border-slate-200 hover:border-indigo-300 text-slate-700'
                  }`}
                >
                  <span className="truncate">{g.name}</span>
                  <span className="text-2xs font-normal text-slate-400">
                    ({g.members.length}人)
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setMovingStudent(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
