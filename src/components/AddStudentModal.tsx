/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus, Users, UserCheck, ArrowDownAZ, Check } from 'lucide-react';
import { ClassRoom, Student } from '../types';
import { compareStudentNamesAZ } from '../utils/calculations';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  existingCount: number;
  onAddStudent: (newStudent: Student) => void;
  onBatchAddStudents: (newStudents: Student[]) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  existingCount,
  onAddStudent,
  onBatchAddStudents
}) => {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  // Single mode state
  const [singleName, setSingleName] = useState('');
  const [singleNo, setSingleNo] = useState(existingCount + 1);
  const [gender, setGender] = useState<'男' | '女' | undefined>(undefined);
  const [note, setNote] = useState('插班入读，前期考勤不扣分');

  // Batch mode state
  const [batchNames, setBatchNames] = useState('');
  const [autoSortAZ, setAutoSortAZ] = useState(true);
  const [isSortedPrompt, setIsSortedPrompt] = useState(false);

  if (!isOpen) return null;

  // 手动整理输入框文本中的名字按 A-Z 升序排列
  const handleSortNamesInInput = () => {
    const lines = batchNames
      .split(/[\n,，]+/)
      .map(n => n.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const sorted = [...lines].sort(compareStudentNamesAZ);
    setBatchNames(sorted.join('\n'));
    setIsSortedPrompt(true);
    setTimeout(() => setIsSortedPrompt(false), 2500);
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;

    const newStu: Student = {
      id: `s_${currentClass.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      classId: currentClass.id,
      no: Number(singleNo) || existingCount + 1,
      name: singleName.trim(),
      gender,
      attendance: {},
      attendanceNotes: note.trim() ? { 1: note.trim() } : {},
      scores: {},
      evaluation: {
        grade: '',
        remarks: '',
        tags: ['插班生'],
        behaviorNotes: note.trim()
          ? [
              {
                id: `b_${Date.now()}`,
                date: new Date().toISOString().slice(0, 10),
                content: `报名入读: ${note.trim()}`,
                type: 'neutral'
              }
            ]
          : []
      }
    };

    onAddStudent(newStu);
    onClose();
    setSingleName('');
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawNames = batchNames
      .split(/[\n,，]+/)
      .map(n => n.trim())
      .filter(Boolean);

    if (rawNames.length === 0) return;

    // 输入学生名字按 A-Z 升序排序
    const finalNames = autoSortAZ ? [...rawNames].sort(compareStudentNamesAZ) : rawNames;

    const startNo = existingCount + 1;
    const newStudents: Student[] = finalNames.map((name, index) => ({
      id: `s_${currentClass.id}_${Date.now()}_${index}`,
      classId: currentClass.id,
      no: startNo + index,
      name,
      attendance: {},
      attendanceNotes: {},
      scores: {},
      evaluation: {
        grade: '',
        remarks: '',
        tags: [],
        behaviorNotes: []
      }
    }));

    onBatchAddStudents(newStudents);
    onClose();
    setBatchNames('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>录入新学生 / 插班生</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              班级: {currentClass.name} · 当前已有 {existingCount} 名学生
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode switcher tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg mt-3 text-xs">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`py-1.5 font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'single'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>单人快速录入 (插班)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('batch')}
            className={`py-1.5 font-medium rounded-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'batch'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>批量粘贴名单</span>
          </button>
        </div>

        {mode === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="mt-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  学生姓名 *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={singleName}
                  onChange={e => setSingleName(e.target.value)}
                  placeholder="例如: Sok Niza 或 张伟"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  学号 No.
                </label>
                <input
                  type="number"
                  value={singleNo}
                  onChange={e => setSingleNo(Number(e.target.value))}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                性别 (可选)
              </label>
              <div className="flex gap-2">
                {(['男', '女'] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(gender === g ? undefined : g)}
                    className={`flex-1 py-1.5 border rounded-lg text-xs cursor-pointer ${
                      gender === g
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                插班/报名备注说明 (可选)
              </label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="例如: 第3周插班入读，前期考勤不扣分"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                插班生未填课时与空白课时默认不计入扣分，出勤率按实际到课计算。
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
              >
                录入花名册
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBatchSubmit} className="mt-4 space-y-3.5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-slate-700">
                  输入或粘贴学生姓名列表 *
                </label>
                <button
                  type="button"
                  onClick={handleSortNamesInInput}
                  disabled={!batchNames.trim()}
                  className="text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-100 disabled:text-slate-400 px-2 py-0.5 rounded border border-blue-200/80 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                  title="将文本框内的学生姓名一键按 A-Z 拼音/字母升序重新排版"
                >
                  {isSortedPrompt ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">已整理为 A-Z 排序</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownAZ className="w-3.5 h-3.5 text-blue-600" />
                      <span>按 A-Z 整理姓名</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                rows={5}
                required
                value={batchNames}
                onChange={e => setBatchNames(e.target.value)}
                placeholder="直接粘贴名单，每行一个姓名：&#10;Sok Niza 苏妮莎&#10;张伟&#10;王小丽"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-sans"
              />
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSortAZ}
                  onChange={e => setAutoSortAZ(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className="text-slate-700 font-medium">
                  输入学生名字按 A-Z 字母/拼音升序排序并顺延学号
                </span>
              </label>
              <p className="text-[10px] text-slate-400 mt-1 pl-6">
                将从 No.{existingCount + 1} 开始顺延分配学号。
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowDownAZ className="w-4 h-4" />
                <span>按 A-Z 确认批量导入</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
