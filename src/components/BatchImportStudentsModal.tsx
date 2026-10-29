/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus, ArrowDownAZ, Check } from 'lucide-react';
import { ClassRoom, Student } from '../types';
import { compareStudentNamesAZ } from '../utils/calculations';

interface BatchImportStudentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  existingCount: number;
  onAddStudents: (newStudents: Student[]) => void;
}

export const BatchImportStudentsModal: React.FC<BatchImportStudentsModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  existingCount,
  onAddStudents
}) => {
  const [namesText, setNamesText] = useState('');
  const [autoSortAZ, setAutoSortAZ] = useState(true);
  const [isSortedPrompt, setIsSortedPrompt] = useState(false);

  if (!isOpen) return null;

  // 手动整理输入框文本中的名字按 A-Z 升序排列
  const handleSortNamesInInput = () => {
    const lines = namesText
      .split(/[\n,，]+/)
      .map(n => n.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    const sorted = [...lines].sort(compareStudentNamesAZ);
    setNamesText(sorted.join('\n'));
    setIsSortedPrompt(true);
    setTimeout(() => setIsSortedPrompt(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawNames = namesText
      .split(/[\n,，]+/)
      .map(n => n.trim())
      .filter(Boolean);

    if (rawNames.length === 0) return;

    // 根据用户要求，输入学生名字按 A-Z 升序排序
    const finalNames = autoSortAZ ? [...rawNames].sort(compareStudentNamesAZ) : rawNames;

    let startNo = existingCount + 1;
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

    onAddStudents(newStudents);
    onClose();
    setNamesText('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>添加学生名单 · {currentClass.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              当前班级已有 {existingCount} 名学生，新增名单将顺延学号
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-semibold text-slate-700">
                输入或粘贴学生姓名列表 *
              </label>
              <button
                type="button"
                onClick={handleSortNamesInInput}
                disabled={!namesText.trim()}
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
              rows={6}
              required
              value={namesText}
              onChange={e => setNamesText(e.target.value)}
              placeholder="直接粘贴名单（支持中英文双语姓名），每行一个学生：&#10;Sok Niza 苏妮莎&#10;张伟&#10;王小丽&#10;陈凯"
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
                输入学生名字按 A-Z 字母/拼音升序排序并编排学号
              </span>
            </label>
            <p className="text-[10px] text-slate-400 mt-1 pl-6">
              勾选后，系统将按 A-Z 顺序分配 No.{existingCount + 1} 起的学号，便于点名时按字母快速查找。
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
              <span>按 A-Z 确认导入名单</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
