import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Users, 
  Trash2, 
  Plus, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { Student } from '../types';
import { parseStudentsFromText, SAMPLE_STUDENTS } from '../utils/csvParser';

interface StudentManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onNavigateToDraw: () => void;
  onNavigateToGroups: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  onUpdateStudents,
  onNavigateToDraw,
  onNavigateToGroups,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newName, setNewName] = useState('');
  const [newSeat, setNewSeat] = useState('');
  const [filterText, setFilterText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      showNotification('請先輸入或貼上學生名單', 'error');
      return;
    }
    const { students: parsed } = parseStudentsFromText(pasteText);
    if (parsed.length === 0) {
      showNotification('未能識別有效的學生姓名，請檢查格式', 'error');
      return;
    }

    // Merge or replace based on confirmation
    onUpdateStudents(parsed);
    setPasteText('');
    showNotification(`成功匯入 ${parsed.length} 位學生名單！`);
  };

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      showNotification('請上傳 .csv 或 .txt 格式的文字檔案', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        const { students: parsed } = parseStudentsFromText(content);
        if (parsed.length > 0) {
          onUpdateStudents(parsed);
          showNotification(`成功從「${file.name}」匯入 ${parsed.length} 位學生！`);
        } else {
          showNotification('檔案內無有效的學生資料', 'error');
        }
      }
    };
    reader.onerror = () => {
      showNotification('讀取檔案失敗，請重試', 'error');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newStudent: Student = {
      id: `stu_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newName.trim(),
      seatNumber: newSeat.trim() || undefined,
    };

    onUpdateStudents([...students, newStudent]);
    setNewName('');
    setNewSeat('');
    showNotification(`已新增學生：${newStudent.name}`);
  };

  const handleRemoveStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    onUpdateStudents(students.filter(s => s.id !== id));
    if (student) {
      showNotification(`已移除 ${student.name}`);
    }
  };

  const handleLoadSample = () => {
    onUpdateStudents(SAMPLE_STUDENTS);
    showNotification(`已載入範例班級名單（共 ${SAMPLE_STUDENTS.length} 人）！`);
  };

  const handleClearAll = () => {
    if (window.confirm('確定要清空所有學生名單嗎？')) {
      onUpdateStudents([]);
      showNotification('名單已全部清空');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(filterText.toLowerCase()) || 
    (s.seatNumber && s.seatNumber.includes(filterText))
  );

  return (
    <div id="student-manager-container" className="space-y-6">
      {/* Top Banner & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              名單管理
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                目前 {students.length} 位學生
              </span>
            </h2>
            <p className="text-sm text-slate-500">
              上傳 CSV、TXT 檔案或直接貼上學生姓名，系統將自動整理名冊。
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-load-sample-roster"
            type="button"
            onClick={handleLoadSample}
            className="px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            載入範例班級 (24人)
          </button>

          {students.length > 0 && (
            <button
              id="btn-clear-all-students"
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              清空名單
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div 
          className={`p-4 rounded-xl text-sm font-medium flex items-center gap-2 transition ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Input Methods: Left side Upload/Paste, Right side Active Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Import Box */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* CSV File Upload Drag & Drop */}
          <div 
            id="csv-drop-zone"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition bg-white ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
                : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 mx-auto flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">上傳 CSV / TXT 檔案</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              支援座號、姓名欄位的 Excel 匯出檔，或純文字清單。系統支援 UTF-8 自動判別。
            </p>

            <button
              id="btn-trigger-file-select"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              選擇電腦中的檔案
            </button>
          </div>

          {/* Paste Names Textarea */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="paste-names-input" className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                直接貼上學生姓名
              </label>
              <span className="text-xs text-slate-400">支援換行、逗號或座號</span>
            </div>

            <textarea
              id="paste-names-input"
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="可直接貼上，例如：&#10;01 陳子安&#10;02 林冠宇&#10;03 黃品妍&#10;或是逗號隔開：王小明, 李小華, 謝大同"
              rows={5}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none text-slate-800 font-sans leading-relaxed placeholder:text-slate-400"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                {pasteText.trim() ? `預計識別約 ${pasteText.split(/[\n,、]/).filter(t => t.trim()).length} 筆資料` : '每行一位或逗號分隔'}
              </span>
              <button
                id="btn-import-pasted-text"
                type="button"
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                匯入名單
              </button>
            </div>
          </div>

          {/* Manual Add Single Student */}
          <form onSubmit={handleAddSingleStudent} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2">
            <div className="w-20">
              <input
                type="text"
                placeholder="座號(選)"
                value={newSeat}
                onChange={(e) => setNewSeat(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="輸入單一學生姓名..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              id="btn-add-single-student"
              type="submit"
              disabled={!newName.trim()}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white rounded-xl text-sm font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              新增
            </button>
          </form>

        </div>

        {/* Right Column: Roster Display */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <h3 className="font-bold text-slate-800">現有名冊預覽</h3>
                <p className="text-xs text-slate-500">點選右側垃圾桶可快速刪除個別學生</p>
              </div>

              {students.length > 5 && (
                <input
                  type="text"
                  placeholder="搜尋姓名或座號..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-36 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            {students.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
                  <Users className="w-8 h-8" />
                </div>
                <p className="font-semibold text-slate-600 mb-1">目前還沒有任何學生名單</p>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  請由左側上傳 CSV 檔案、貼上名冊，或是點擊上方「載入範例班級」快速體驗。
                </p>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  載入範例名單 (24人)
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                  {filteredStudents.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl text-sm transition group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-mono font-bold flex items-center justify-center shadow-2xs">
                          {student.seatNumber || (index + 1)}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {student.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(student.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="移除學生"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {filteredStudents.length === 0 && (
                    <div className="text-center py-10 text-xs text-slate-400">
                      查無符合「{filterText}」的學生
                    </div>
                  )}
                </div>

                {/* Bottom Quick Launch Actions */}
                <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500 font-medium">
                    共 {students.length} 位學生已準備就緒
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-goto-draw"
                      type="button"
                      onClick={onNavigateToDraw}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs cursor-pointer"
                    >
                      前往隨機抽籤 →
                    </button>
                    <button
                      id="btn-goto-groups"
                      type="button"
                      onClick={onNavigateToGroups}
                      className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition cursor-pointer"
                    >
                      前往自動分組 →
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
