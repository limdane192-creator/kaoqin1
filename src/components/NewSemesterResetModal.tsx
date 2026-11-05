/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  Download,
  Calendar,
  Users,
  BookOpen,
  Trash2,
  FileCheck2
} from 'lucide-react';
import { Semester, ClassRoom, Student, Assignment } from '../types';

interface NewSemesterResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSemester?: Semester;
  currentClass?: ClassRoom;
  allSemesters: Semester[];
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  onClearAttendanceAndHomework: (scope: 'currentClass' | 'currentSemester' | 'all') => void;
  onClearStudentsInCurrentClass: () => void;
  onClearCurrentSemesterAllData: () => void;
  onFullResetToBlankSemester: () => void;
  onExportBackup: () => void;
}

export const NewSemesterResetModal: React.FC<NewSemesterResetModalProps> = ({
  isOpen,
  onClose,
  currentSemester,
  currentClass,
  classes,
  students,
  assignments,
  onClearAttendanceAndHomework,
  onClearStudentsInCurrentClass,
  onClearCurrentSemesterAllData,
  onFullResetToBlankSemester,
  onExportBackup
}) => {
  const [selectedAction, setSelectedAction] = useState<
    'clearRecordsOnly' | 'clearStudentsInClass' | 'clearSemesterClasses' | 'fullResetBlank'
  >('clearRecordsOnly');
  const [recordsScope, setRecordsScope] = useState<'currentClass' | 'currentSemester' | 'all'>('currentSemester');
  const [confirmText, setConfirmText] = useState('');
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const currentClassStudents = currentClass
    ? students.filter(s => s.classId === currentClass.id)
    : [];
  const currentSemesterStudents = currentSemester
    ? students.filter(s => classes.some(c => c.semesterId === currentSemester.id && c.id === s.classId))
    : [];
  const currentSemesterClasses = currentSemester
    ? classes.filter(c => c.semesterId === currentSemester.id)
    : [];

  const handleExecuteReset = () => {
    if (selectedAction === 'clearRecordsOnly') {
      onClearAttendanceAndHomework(recordsScope);
    } else if (selectedAction === 'clearStudentsInClass') {
      onClearStudentsInCurrentClass();
    } else if (selectedAction === 'clearSemesterClasses') {
      onClearCurrentSemesterAllData();
    } else if (selectedAction === 'fullResetBlank') {
      onFullResetToBlankSemester();
    }
    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[80] p-4 font-sans animate-in fade-in duration-150">
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-amber-200 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-5 text-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/90 shadow-sm flex items-center justify-center text-xl">
              🧹
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <span>新学期准备 · 数据清空与重置中心</span>
                <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full font-bold text-amber-900">
                  新学期整洁开局 ✨
                </span>
              </h3>
              <p className="text-xs text-amber-950/80 mt-0.5">
                还没开始上新学期？支持一键清空测试记录或考勤作业，干净利落迎开学
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/30 hover:bg-white/50 text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Safety Backup Tip */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Download className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-blue-900">安全防护小提示：</span>
                <span className="text-blue-800">
                  清空前可先下载当前教学台账备份文件（.json），随时可一键原样恢复。
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onExportBackup}
              className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-700 font-bold border border-blue-300 rounded-xl transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              先下载备份 📥
            </button>
          </div>

          {/* Action Choices */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 block">
              请选择您需要的清空重置模式：
            </label>

            {/* Option 1: 仅清空考勤打卡与作业记录，保留班级与学生花名册 (最常用) */}
            <div
              onClick={() => setSelectedAction('clearRecordsOnly')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedAction === 'clearRecordsOnly'
                  ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-amber-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <div className="font-bold text-xs text-slate-900">
                    清空考勤与作业记录（推荐：保留班级和学生花名册）
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  最常用 ✨
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed pl-7">
                保留班级名称、课时排期以及学生姓名、学号等基本信息。仅将
                <strong className="text-amber-900">
                  全周期30课时考勤打卡、作业收缴状态、平时成绩折算全部清空归零
                </strong>
                ，特别适合同一批在册学生升入新学期，整洁从第1课时开始记录！
              </p>

              {selectedAction === 'clearRecordsOnly' && (
                <div className="mt-3 pt-3 border-t border-amber-200/80 pl-7 flex items-center gap-3 text-xs flex-wrap">
                  <span className="text-slate-500 font-medium">清空生效范围：</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="recordsScope"
                      checked={recordsScope === 'currentSemester'}
                      onChange={() => setRecordsScope('currentSemester')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-semibold text-slate-800">
                      当前【{currentSemester?.name || '本学期'}】全部班级（{currentSemesterClasses.length}班 · {currentSemesterStudents.length}人）
                    </span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="recordsScope"
                      checked={recordsScope === 'currentClass'}
                      onChange={() => setRecordsScope('currentClass')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-slate-700">
                      仅当前班级【{currentClass?.name || '本班'}】（{currentClassStudents.length}人）
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Option 2: 清空当前班级全部学生 (保留班级排期，重新分班录入) */}
            <div
              onClick={() => setSelectedAction('clearStudentsInClass')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedAction === 'clearStudentsInClass'
                  ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-amber-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🎒</span>
                <div className="font-bold text-xs text-slate-900">
                  清空当前班级学生花名册（保留班级排期，重新录入新名单）
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed pl-7">
                保留【{currentClass?.name || '当前班级'}】的排课信息，将班内目前的
                {currentClassStudents.length} 名学生、考勤及作业全部移除，便于新学期重新录入或批量粘贴新名单。
              </p>
            </div>

            {/* Option 3: 清空当前学期所有班级与学生 (准备开学重新建班) */}
            <div
              onClick={() => setSelectedAction('clearSemesterClasses')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedAction === 'clearSemesterClasses'
                  ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                  : 'border-slate-200 hover:border-amber-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">🏫</span>
                <div className="font-bold text-xs text-slate-900">
                  清空当前【{currentSemester?.name || '学期'}】的所有班级与学生
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed pl-7">
                将当前学期下的 {currentSemesterClasses.length} 个旧班级与 {currentSemesterStudents.length} 名学生全部清空，并自动初始化一个干净的空白班级，完全准备开学！
              </p>
            </div>

            {/* Option 4: 彻底重置所有数据为初始干净空白学期 */}
            <div
              onClick={() => setSelectedAction('fullResetBlank')}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                selectedAction === 'fullResetBlank'
                  ? 'border-rose-400 bg-rose-50/50 shadow-xs'
                  : 'border-slate-200 hover:border-rose-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌱</span>
                  <div className="font-bold text-xs text-rose-950">
                    彻底清空历史旧数据，新建全新空白学期（从零开学）
                  </div>
                </div>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                  全新起点
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed pl-7">
                清空系统中所有旧测试班级与历史数据，仅保留一个名为“新学期”的干净空白台账，随时开始新的教学旅程。
              </p>
            </div>
          </div>

          {/* Safety Confirm Check */}
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span>此操作将重置相应数据。若您已提前下载备份或确定尚未正式开学，请点击下方确认按钮执行清空。</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            取消
          </button>

          <button
            type="button"
            onClick={handleExecuteReset}
            disabled={isDone}
            className={`px-5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-2 ${
              isDone
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-amber-500/25 active:scale-98'
            }`}
          >
            {isDone ? (
              <>
                <Check className="w-4 h-4" />
                <span>清空重置成功！✨</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>确认清空，准备新学期 🧹</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
