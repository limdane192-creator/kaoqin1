/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  Copy,
  Check,
  ChevronRight,
  Filter,
  FileText,
  Paperclip,
  Eye,
  Download,
  X,
  Trash2,
  MessageCircle,
  Bell,
  Sparkles,
  Send
} from 'lucide-react';
import { CuteHomeworkBunny, CuteSunBadge, CuteReminderKitten, CutePawIcon } from './CuteIllustrations';
import { ClassRoom, Student, Assignment, SubmissionStatus, StudentSubmission } from '../types';
import { calculateStudentHomework } from '../utils/calculations';

interface HomeworkViewProps {
  currentClass: ClassRoom;
  students: Student[];
  assignments: Assignment[];
  onOpenNewAssignment: () => void;
  onUpdateSubmission: (
    assignmentId: string,
    studentId: string,
    updates: Partial<StudentSubmission>
  ) => void;
  onBatchSubmitToday: (assignmentId: string) => void;
  onSelectStudentModal: (student: Student) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
}

/**
 * 判断指定截止日期是否已过，并计算超期天数
 */
export const checkIsOverdue = (dueDateStr?: string): { isOverdue: boolean; daysLate: number } => {
  if (!dueDateStr) return { isOverdue: false, daysLate: 0 };
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 支持 YYYY-MM-DD 或 YYYY/MM/DD
    const parts = dueDateStr.split(/[-/]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const due = new Date(year, month, day, 23, 59, 59, 999);

      const diffTime = today.getTime() - due.getTime();
      if (diffTime > 0) {
        const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { isOverdue: true, daysLate };
      }
    }
    return { isOverdue: false, daysLate: 0 };
  } catch {
    return { isOverdue: false, daysLate: 0 };
  }
};

/**
 * 生成单人可爱温馨催交文案
 */
export const buildSingleStudentReminderText = (
  student: Student,
  assignment: Assignment,
  className: string,
  daysLate: number
): string => {
  const lateHint = daysLate > 0 ? `（⏰ 已逾期 ${daysLate} 天）` : '（⏰ 截止期已过）';
  return `亲爱的【${student.name}】同学你好呀～🌸🐾\n\n林老师温馨提醒：我们【${className}】的作业《${assignment.title}》已于 ${assignment.dueDate} 截止${lateHint}，目前系统里还没收到你的作业哦～\n\n📝 作业要求：${assignment.content || '按课堂规定完成并提交'}\n\n💡 每天坚持完成作业能帮大家巩固中文生词和语法，平时分也会更高哦！记得抽空尽快写好发给老师批改，老师期待看到你工整的作业，一起加油呀～💪✨`;
};

/**
 * 生成全班逾期未交群发催交通知文案
 */
export const buildBatchOverdueReminderText = (
  overdueStudents: Student[],
  assignment: Assignment,
  className: string,
  daysLate: number
): string => {
  const lateHint = daysLate > 0 ? `⏰ 已超截止期 ${daysLate} 天` : '⏰ 截止时间已过';
  const namesList = overdueStudents
    .map((s, idx) => `  ${idx + 1}. 🐾 ${s.name}（学号 No.${s.no}）`)
    .join('\n');

  return `🔔【${className} · 作业逾期催交温馨提醒】🌸🐾\n\n📚 作业题目：《${assignment.title}》\n📅 布置日期：${assignment.assignedDate}\n⏳ 截止时间：${assignment.dueDate}（${lateHint}）\n📝 作业要求：${assignment.content || '按课堂要求完成'}\n\n目前尚未提交作业的同学（共 ${overdueStudents.length} 人）：\n${namesList}\n\n💡 老师寄语：学中文重在日常积累，按时完成作业是平时考查分（满分10分）的重要依据。请上述同学今天尽快补交作业给林老师哦！如有不会的题目随时来问老师，大家一起加油！💪✨`;
};

export const HomeworkView: React.FC<HomeworkViewProps> = ({
  currentClass,
  students,
  assignments,
  onOpenNewAssignment,
  onUpdateSubmission,
  onBatchSubmitToday,
  onSelectStudentModal,
  onDeleteAssignment
}) => {
  const classAssignments = assignments.filter(a => a.classId === currentClass.id);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    classAssignments[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'byAssignment' | 'byStudentMissing'>('byAssignment');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'missing' | 'submitted'>('all');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [copiedStudentId, setCopiedStudentId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);

  const activeAssignment = classAssignments.find(a => a.id === selectedAssignmentId) || classAssignments[0];

  const handleConfirmDeleteAssignment = () => {
    if (!assignmentToDelete || !onDeleteAssignment) return;
    const idToDelete = assignmentToDelete.id;
    onDeleteAssignment(idToDelete);
    setAssignmentToDelete(null);
    if (selectedAssignmentId === idToDelete) {
      const remaining = classAssignments.filter(a => a.id !== idToDelete);
      setSelectedAssignmentId(remaining[0]?.id || '');
    }
  };

  // 当前激活作业的逾期判定
  const overdueInfo = activeAssignment ? checkIsOverdue(activeAssignment.dueDate) : { isOverdue: false, daysLate: 0 };
  const isCurrentOverdue = overdueInfo.isOverdue;
  const currentDaysLate = overdueInfo.daysLate;

  // 计算当前作业各状态人数与逾期未交名单
  let currentSubmittedCount = 0;
  let currentMissingCount = 0;
  let currentLateCount = 0;
  const overdueStudents: Student[] = [];

  if (activeAssignment) {
    students.forEach(s => {
      const sub = activeAssignment.submissions[s.id];
      const isMissing = !sub || sub.status === 'missing';
      if (isMissing) {
        currentMissingCount++;
        if (isCurrentOverdue) {
          overdueStudents.push(s);
        }
      } else if (sub.status === 'submitted') {
        currentSubmittedCount++;
      } else if (sub.status === 'late') {
        currentLateCount++;
      }
    });
  }

  // 1. 复制单人专属可爱催交文案
  const handleCopySingleStudentReminder = (student: Student, daysLate: number) => {
    if (!activeAssignment) return;
    const text = buildSingleStudentReminderText(student, activeAssignment, currentClass.name, daysLate);
    navigator.clipboard.writeText(text);
    setCopiedStudentId(student.id);
    setCopySuccess(`single-${student.id}`);
    setTimeout(() => {
      setCopiedStudentId(null);
      setCopySuccess(null);
    }, 2500);
  };

  // 2. 复制当前作业全班逾期催交群发文案
  const handleCopyBatchOverdueReminder = () => {
    if (!activeAssignment || overdueStudents.length === 0) return;
    const text = buildBatchOverdueReminderText(
      overdueStudents,
      activeAssignment,
      currentClass.name,
      currentDaysLate
    );
    navigator.clipboard.writeText(text);
    setCopySuccess('overdueBatch');
    setTimeout(() => setCopySuccess(null), 2500);
  };

  // 3. 复制常规缺交提醒
  const handleCopyAssignmentReminder = () => {
    if (!activeAssignment) return;
    const missingStudents = students.filter(s => {
      const sub = activeAssignment.submissions[s.id];
      return !sub || sub.status === 'missing';
    });

    const text = `🌸【${currentClass.name} · 作业催交温馨提醒】🐾\n作业内容：《${activeAssignment.title}》\n布置日期：${activeAssignment.assignedDate}（截止时间：${activeAssignment.dueDate}）\n\n尚未提交作业的学生（共 ${missingStudents.length} 人）：\n${missingStudents.map((s, i) => `  ${i + 1}. 🐾 ${s.name}（No.${s.no}）`).join('\n')}\n\n请上述同学尽快补交作业给林老师哦，加油！✨`;

    navigator.clipboard.writeText(text);
    setCopySuccess('reminder');
    setTimeout(() => setCopySuccess(null), 2500);
  };

  // 4. 复制全学期全班缺交总清单
  const handleCopyAllMissingSummary = () => {
    const list: string[] = [];
    students.forEach(s => {
      const stats = calculateStudentHomework(s.id, classAssignments);
      if (stats.missingCount > 0) {
        const missingNames = stats.missingAssignments
          .map(ma => {
            const od = checkIsOverdue(ma.dueDate);
            return `《${ma.title}》(${ma.dueDate}${od.isOverdue ? `·超期${od.daysLate}天` : ''})`;
          })
          .join('、');
        list.push(`• 🐾 ${s.name}（缺交 ${stats.missingCount} 项）：${missingNames}`);
      }
    });

    const text = `🌸【${currentClass.name} · 全学期作业缺交汇总与督促】🐾\n截至今日，班级缺交作业学生明细如下：\n\n${list.length > 0 ? list.join('\n') : '🎉 全员作业已全部按时交齐，暂无缺交记录！'}\n\n期末综合评分在即，请同学们抓紧补齐平时作业哦！✨`;

    navigator.clipboard.writeText(text);
    setCopySuccess('allMissing');
    setTimeout(() => setCopySuccess(null), 2500);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Top Banner: Mode switcher & Actions */}
      <div className="bg-white/95 rounded-2xl p-4 sm:p-5 border border-amber-200/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-2xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <CuteHomeworkBunny size={50} className="p-1 bg-amber-50 rounded-2xl border border-amber-200 shadow-2xs" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-2xs">
              ✨
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>{currentClass.name} 作业收缴与催查中心</span>
                <span className="text-sm">📝</span>
              </h2>
            </div>
            <p className="text-xs text-amber-800/80 mt-0.5 flex items-center gap-1 flex-wrap">
              <span>智能识别逾期未交</span>
              <span>·</span>
              <span>一键复制催交提醒文案</span>
              <span>·</span>
              <span>按提交次数自动折算平时分（满分10分）</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Segmented Mode Control */}
          <div className="flex items-center p-1 bg-amber-50/80 rounded-xl border border-amber-200/60 text-xs font-semibold">
            <button
              onClick={() => setViewMode('byAssignment')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'byAssignment'
                  ? 'bg-white text-amber-950 shadow-xs font-bold border border-amber-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📋 按单次作业催缴</span>
            </button>
            <button
              onClick={() => setViewMode('byStudentMissing')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'byStudentMissing'
                  ? 'bg-white text-amber-950 shadow-xs font-bold border border-amber-200/50'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🐾 缺交总清单 (按人)</span>
            </button>
          </div>

          <button
            onClick={onOpenNewAssignment}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/25 active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>布置新作业 ✏️</span>
          </button>
        </div>
      </div>

      {classAssignments.length === 0 ? (
        <div className="bg-white/95 rounded-2xl border border-amber-200/70 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <BookOpen className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">当前班级暂无作业记录 🌸</h3>
          <p className="text-xs text-slate-500 mb-4">
            快点击上方“布置新作业”添加生词听写、练习册或作文吧！
          </p>
          <button
            onClick={onOpenNewAssignment}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>立即布置第一次作业</span>
          </button>
        </div>
      ) : viewMode === 'byAssignment' ? (
        /* MODE 1: 按作业查看收缴状态与逾期自动高亮 */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column: Assignment Selector Cards */}
          <div className="lg:col-span-1 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <span>已布置作业</span>
                <span className="text-[11px] bg-amber-100 text-amber-900 font-mono px-1.5 py-0.2 rounded-full">
                  {classAssignments.length}
                </span>
              </span>
              <span className="text-[10px] text-slate-400">点击切换查看</span>
            </div>

            <div className="space-y-2 max-h-[620px] overflow-y-auto custom-scrollbar pr-1">
              {classAssignments.map(a => {
                const isSelected = a.id === (activeAssignment?.id || selectedAssignmentId);
                const aOverdue = checkIsOverdue(a.dueDate);

                // 计算已交/缺交
                let missing = 0;
                let done = 0;
                students.forEach(s => {
                  const sub = a.submissions[s.id];
                  if (!sub || sub.status === 'missing') missing++;
                  else done++;
                });

                const isOverdueAndMissing = aOverdue.isOverdue && missing > 0;

                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedAssignmentId(a.id);
                      if (filterStatus === 'overdue' && !aOverdue.isOverdue) {
                        setFilterStatus('all');
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer group relative ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-400 shadow-xs ring-2 ring-amber-300/40'
                        : isOverdueAndMissing
                        ? 'bg-white border-rose-200/90 hover:border-rose-300'
                        : 'bg-white border-slate-200/80 hover:border-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-mono text-slate-400">
                        {a.assignedDate}
                      </span>
                      <div className="flex items-center gap-1">
                        {isOverdueAndMissing ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-1.5 py-0.2 rounded-md border border-rose-200 flex items-center gap-0.5 animate-pulse">
                            <span>⏰ 逾期未交</span>
                            <span className="tabular-nums">({missing}人)</span>
                          </span>
                        ) : missing > 0 ? (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded-md border border-amber-200">
                            未收齐 {missing}人
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                            已收齐 ✨
                          </span>
                        )}
                        {onDeleteAssignment && (
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setAssignmentToDelete(a);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="删除此项布置好的作业"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="font-bold text-xs text-slate-900 line-clamp-1 mb-1 group-hover:text-amber-900 transition-colors">
                      {a.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">
                      {a.content}
                    </div>

                    {a.attachments && a.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded-md border border-blue-200/60 mb-1.5 w-fit">
                        <Paperclip className="w-3 h-3 text-blue-600" />
                        <span>含 {a.attachments.length} 个附件/照片</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span>已交: <strong className="text-slate-800 font-mono">{done}/{students.length}</strong></span>
                      <span className={`font-mono ${aOverdue.isOverdue && missing > 0 ? 'text-rose-600 font-bold' : ''}`}>
                        截止: {a.dueDate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Assignment Detail & Student Submission Table */}
          {activeAssignment && (
            <div className="lg:col-span-3 space-y-4">
              {/* Assignment Header Card */}
              <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-amber-200/70 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                        📅 布置于 {activeAssignment.assignedDate}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-lg font-medium border ${
                          isCurrentOverdue
                            ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        ⏳ 截止时间：{activeAssignment.dueDate}
                        {isCurrentOverdue && (
                          <span className="ml-1 text-rose-600 font-bold">
                            （已逾期 {currentDaysLate} 天）
                          </span>
                        )}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
                      <span>{activeAssignment.title}</span>
                    </h3>

                    <p className="text-xs text-slate-600 mt-1.5 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100 leading-relaxed">
                      <span className="font-bold text-amber-900">📝 作业要求：</span>
                      {activeAssignment.content}
                    </p>

                    {/* Attached Photos and Files */}
                    {activeAssignment.attachments && activeAssignment.attachments.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                          <span>布置作业照片与附件 ({activeAssignment.attachments.length})：</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {activeAssignment.attachments.map(att => (
                            <div
                              key={att.id}
                              className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 flex items-center gap-2 hover:bg-slate-100 transition-colors shadow-2xs"
                            >
                              {att.type === 'image' ? (
                                <button
                                  type="button"
                                  onClick={() => setLightboxImage({ url: att.dataUrl, name: att.name })}
                                  className="flex items-center gap-1.5 cursor-pointer group text-left"
                                  title="点击放大查看作业照片"
                                >
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className="w-9 h-9 rounded-md object-cover border border-slate-200 shadow-2xs group-hover:opacity-90"
                                  />
                                  <div className="max-w-[130px]">
                                    <div className="text-[11px] font-medium text-blue-700 group-hover:underline truncate">
                                      {att.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                      <Eye className="w-2.5 h-2.5" />
                                      <span>点击放大照片</span>
                                    </div>
                                  </div>
                                </button>
                              ) : (
                                <a
                                  href={att.dataUrl}
                                  download={att.name}
                                  className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 hover:text-blue-600 cursor-pointer p-0.5"
                                  title="点击下载/打开附件文件"
                                >
                                  <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                    <FileText className="w-4 h-4" />
                                  </div>
                                  <div className="max-w-[130px]">
                                    <div className="truncate font-medium text-slate-800 hover:text-blue-600">
                                      {att.name}
                                    </div>
                                    {att.size && (
                                      <div className="text-[10px] text-slate-400 font-mono">
                                        {att.size}
                                      </div>
                                    )}
                                  </div>
                                  <Download className="w-3.5 h-3.5 text-slate-400 hover:text-blue-600 shrink-0 ml-1" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => onBatchSubmitToday(activeAssignment.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                      title="将所有未交的学生一键标记为今天已交"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>标记今天收齐</span>
                    </button>

                    <button
                      onClick={handleCopyAssignmentReminder}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="一键复制未交名单到剪贴板，方便发送常规催交通知"
                    >
                      {copySuccess === 'reminder' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">已复制催交通知！</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>复制催交名单</span>
                        </>
                      )}
                    </button>

                    {onDeleteAssignment && (
                      <button
                        type="button"
                        onClick={() => setAssignmentToDelete(activeAssignment)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="删除布置好的作业"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>删除作业</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-slate-500">班级人数:</span>
                    <span className="font-bold tabular-nums text-slate-800">{students.length}人</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-emerald-600 font-medium">已交:</span>
                    <span className="font-bold tabular-nums text-emerald-700">{currentSubmittedCount}人</span>
                  </div>
                  {currentLateCount > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-600 font-medium">迟交/补交:</span>
                      <span className="font-bold tabular-nums text-amber-700">{currentLateCount}人</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <span className="text-rose-600 font-medium">缺交未交:</span>
                    <span className="font-bold tabular-nums text-rose-700">{currentMissingCount}人</span>
                  </div>
                  {isCurrentOverdue && overdueStudents.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-rose-700 font-bold flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-rose-500 animate-spin" />
                        已逾期未交:
                      </span>
                      <span className="font-bold tabular-nums text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded-full">
                        {overdueStudents.length}人 (超期{currentDaysLate}天)
                      </span>
                    </div>
                  )}

                  {/* Cute Progress meter */}
                  <div className="flex-1 min-w-[120px] max-w-xs bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${students.length ? ((currentSubmittedCount + currentLateCount) / students.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* OVERDUE HIGHLIGHT ALERT BANNER: 截止日期已过且有未交学生时醒目高亮展示 */}
              {isCurrentOverdue && overdueStudents.length > 0 && (
                <div className="bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50/60 border-2 border-rose-200/90 rounded-2xl p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <CuteReminderKitten size={44} className="shadow-2xs rounded-full bg-white p-0.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-black text-rose-950 flex items-center gap-1">
                          <span>⏰ 截止日期已过！尚有 {overdueStudents.length} 位同学未提交</span>
                        </span>
                        <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full shadow-2xs">
                          已逾期 {currentDaysLate} 天
                        </span>
                      </div>
                      <p className="text-[11px] text-rose-800/90 mt-0.5 leading-normal">
                        截止日期为 <strong className="font-mono text-rose-950">{activeAssignment.dueDate}</strong>，点击右侧一键复制可爱催交通知，直接发送到微信/Telegram群督促学生！
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setFilterStatus(filterStatus === 'overdue' ? 'all' : 'overdue')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                        filterStatus === 'overdue'
                          ? 'bg-rose-600 text-white shadow-rose-500/20'
                          : 'bg-white hover:bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                      title="点击仅过滤出这几位逾期未交的学生"
                    >
                      <Filter className="w-3.5 h-3.5" />
                      <span>{filterStatus === 'overdue' ? '显示全班学生' : `仅看逾期未交 (${overdueStudents.length})`}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyBatchOverdueReminder}
                      className="px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-rose-500/25 active:scale-98"
                      title="一键复制全班逾期未交名单与温馨催交文案"
                    >
                      {copySuccess === 'overdueBatch' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>已复制催交通知！</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>一键复制逾期催交文案</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="text-slate-400 font-medium">筛选名单：</span>

                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-amber-500 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
                  }`}
                >
                  全部 ({students.length})
                </button>

                {isCurrentOverdue && overdueStudents.length > 0 && (
                  <button
                    onClick={() => setFilterStatus('overdue')}
                    className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      filterStatus === 'overdue'
                        ? 'bg-rose-600 text-white font-black shadow-xs ring-2 ring-rose-400/30'
                        : 'bg-rose-50 text-rose-700 font-bold border border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    <span>⏰ 逾期未交</span>
                    <span className="font-mono text-[11px] tabular-nums bg-rose-200/80 text-rose-900 px-1.5 py-0.2 rounded-full">
                      {overdueStudents.length}人
                    </span>
                  </button>
                )}

                <button
                  onClick={() => setFilterStatus('missing')}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                    filterStatus === 'missing'
                      ? 'bg-rose-500 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-rose-50 border border-slate-200'
                  }`}
                >
                  未交 ({currentMissingCount})
                </button>

                <button
                  onClick={() => setFilterStatus('submitted')}
                  className={`px-3 py-1 rounded-xl transition-all cursor-pointer ${
                    filterStatus === 'submitted'
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-emerald-50 border border-slate-200'
                  }`}
                >
                  已交 ({currentSubmittedCount + currentLateCount})
                </button>

                {filterStatus !== 'all' && (
                  <button
                    onClick={() => setFilterStatus('all')}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-1 cursor-pointer"
                  >
                    重置筛选
                  </button>
                )}
              </div>

              {/* Submissions Table */}
              <div className="bg-white/95 rounded-2xl border border-amber-200/70 shadow-xs overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-amber-50/60 text-amber-950 font-bold border-b border-amber-200/60">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">学号</th>
                        <th className="py-2.5 px-4 min-w-[150px]">学生姓名</th>
                        <th className="py-2.5 px-3 min-w-[140px]">提交状态</th>
                        <th className="py-2.5 px-3 min-w-[140px]">
                          交作业日期 <span className="text-[10px] text-slate-400 font-normal">(登记日期)</span>
                        </th>
                        <th className="py-2.5 px-3 w-24">作业得分</th>
                        <th className="py-2.5 px-4">教师批语 / 鼓励备注</th>
                        <th className="py-2.5 px-3 w-36 text-center">快捷操作 / 催交</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students
                        .filter(s => {
                          const sub = activeAssignment.submissions[s.id];
                          const isMiss = !sub || sub.status === 'missing';
                          if (filterStatus === 'overdue') return isMiss && isCurrentOverdue;
                          if (filterStatus === 'missing') return isMiss;
                          if (filterStatus === 'submitted') return !isMiss;
                          return true;
                        })
                        .map(stu => {
                          const sub: StudentSubmission = activeAssignment.submissions[stu.id] || {
                            status: 'missing'
                          };
                          const isMissing = sub.status === 'missing';
                          const isStudentOverdue = isMissing && isCurrentOverdue;

                          return (
                            <tr
                              key={stu.id}
                              className={`transition-colors ${
                                isStudentOverdue
                                  ? 'bg-rose-50/50 hover:bg-rose-100/40 border-l-4 border-l-rose-500'
                                  : isMissing
                                  ? 'bg-amber-50/20 hover:bg-amber-50/40'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              {/* 学号 */}
                              <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-500">
                                {stu.no}
                              </td>

                              {/* 学生姓名与逾期高亮标签 */}
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <button
                                    onClick={() => onSelectStudentModal(stu)}
                                    className="font-bold text-slate-900 hover:text-amber-800 transition-colors cursor-pointer text-left"
                                  >
                                    {stu.name}
                                  </button>

                                  {isStudentOverdue && (
                                    <span
                                      className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded-md border border-rose-200 shadow-2xs"
                                      title={`截止日期为 ${activeAssignment.dueDate}，已逾期 ${currentDaysLate} 天未提交`}
                                    >
                                      <span>⏰ 逾期未交</span>
                                      <span className="font-mono">({currentDaysLate}天)</span>
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 提交状态下拉选择 */}
                              <td className="py-2.5 px-3">
                                <select
                                  value={sub.status}
                                  onChange={e => {
                                    const nextStatus = e.target.value as SubmissionStatus;
                                    const todayStr = new Date().toISOString().slice(0, 10);
                                    onUpdateSubmission(activeAssignment.id, stu.id, {
                                      status: nextStatus,
                                      submittedDate:
                                        nextStatus === 'submitted' || nextStatus === 'late'
                                          ? sub.submittedDate || todayStr
                                          : undefined
                                    });
                                  }}
                                  className={`text-xs px-2 py-1 rounded-lg font-bold border cursor-pointer transition-colors ${
                                    sub.status === 'submitted'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : sub.status === 'late'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : sub.status === 'excused'
                                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                                      : isStudentOverdue
                                      ? 'bg-rose-100/90 text-rose-900 border-rose-300 font-black'
                                      : 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                                  }`}
                                >
                                  <option value="missing">
                                    {isStudentOverdue ? '🔴 缺交/逾期未交' : '🔴 缺交/未交'}
                                  </option>
                                  <option value="submitted">🟢 已交</option>
                                  <option value="late">⚠️ 补交/迟交</option>
                                  <option value="excused">⚪ 免交</option>
                                </select>
                              </td>

                              {/* 提交日期 */}
                              <td className="py-2.5 px-3">
                                {sub.status === 'missing' ? (
                                  <span className={`italic text-[11px] ${isStudentOverdue ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
                                    {isStudentOverdue ? `超期 ${currentDaysLate} 天未交` : '尚未提交'}
                                  </span>
                                ) : (
                                  <input
                                    type="text"
                                    value={sub.submittedDate || ''}
                                    placeholder="例如 08/28"
                                    onChange={e =>
                                      onUpdateSubmission(activeAssignment.id, stu.id, {
                                        submittedDate: e.target.value
                                      })
                                    }
                                    className="w-28 text-xs font-mono bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  />
                                )}
                              </td>

                              {/* 得分 */}
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={sub.score ?? ''}
                                  placeholder="分"
                                  onChange={e =>
                                    onUpdateSubmission(activeAssignment.id, stu.id, {
                                      score: e.target.value === '' ? undefined : Number(e.target.value)
                                    })
                                  }
                                  className="w-16 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </td>

                              {/* 批语 */}
                              <td className="py-2.5 px-4">
                                <input
                                  type="text"
                                  value={sub.feedback || ''}
                                  placeholder="批注鼓励（如书写规范、全对、有进步）"
                                  onChange={e =>
                                    onUpdateSubmission(activeAssignment.id, stu.id, {
                                      feedback: e.target.value
                                    })
                                  }
                                  className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                              </td>

                              {/* 快捷操作与一键催交 */}
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {isMissing ? (
                                    <>
                                      {/* 一键发送单人催交提醒文案 */}
                                      <button
                                        type="button"
                                        onClick={() => handleCopySingleStudentReminder(stu, currentDaysLate)}
                                        className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 shadow-2xs ${
                                          copiedStudentId === stu.id
                                            ? 'bg-rose-600 text-white border-rose-600'
                                            : isStudentOverdue
                                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                        }`}
                                        title={`一键复制为【${stu.name}】定制的可爱温馨催交文案（已包含作业名、截止期与要求）`}
                                      >
                                        <MessageCircle className="w-3 h-3" />
                                        <span>{copiedStudentId === stu.id ? '已复制！' : '催TA'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const todayStr = new Date().toISOString().slice(0, 10);
                                          onUpdateSubmission(activeAssignment.id, stu.id, {
                                            status: 'submitted',
                                            submittedDate: todayStr
                                          });
                                        }}
                                        className="px-2 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                                        title="标记该同学今天刚补交"
                                      >
                                        今天交
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onUpdateSubmission(activeAssignment.id, stu.id, {
                                          status: 'missing',
                                          submittedDate: undefined
                                        })
                                      }
                                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                      title="撤回为未交状态"
                                    >
                                      撤回已交
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MODE 2: 按学生归纳缺交作业 (回答：“没交的学生缺交哪些作业”) */
        <div className="space-y-4">
          <div className="bg-white/95 p-4 sm:p-5 rounded-2xl border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base shadow-2xs">
                🐾
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>全班缺交作业总清单看板</span>
                  <span className="text-xs font-normal text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    实时汇总每人缺交项目
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  智能标记每项作业是否已过截止期（超期天数），支持一键复制全班催交通知
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyAllMissingSummary}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all cursor-pointer shrink-0 shadow-2xs active:scale-98"
            >
              {copySuccess === 'allMissing' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">已复制全班缺交通知！</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-800" />
                  <span>生成全班缺交总通知</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map(stu => {
              const hwStats = calculateStudentHomework(stu.id, classAssignments);
              const hasMissing = hwStats.missingCount > 0;

              // 检查该学生缺交的作业中有多少项已逾期
              const overdueItems = hwStats.missingAssignments.filter(ma => checkIsOverdue(ma.dueDate).isOverdue);
              const hasOverdue = overdueItems.length > 0;

              return (
                <div
                  key={stu.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    hasOverdue
                      ? 'bg-rose-50/40 border-rose-200 shadow-xs'
                      : hasMissing
                      ? 'bg-white border-amber-200/90 shadow-2xs'
                      : 'bg-slate-50/50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{stu.name}</span>
                        <span className="text-xs text-slate-400 font-mono">No.{stu.no}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        完成率: <span className="font-semibold tabular-nums text-slate-800">{hwStats.completionRate}%</span>
                        {' · '}
                        已交: <span className="tabular-nums font-mono">{hwStats.submittedCount + hwStats.lateCount}</span>/{hwStats.totalAssigned}
                        {' · '}
                        得分: <span className="font-bold text-amber-900 tabular-nums">{hwStats.homeworkScore10}分</span>
                      </div>
                    </div>
                    {hasOverdue ? (
                      <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full shrink-0 border border-rose-200 shadow-2xs">
                        ⏰ 逾期未交 {overdueItems.length} 项
                      </span>
                    ) : hasMissing ? (
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                        缺交 {hwStats.missingCount} 项
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                        全部交齐 ✨
                      </span>
                    )}
                  </div>

                  {/* Missing items breakdown */}
                  {hasMissing ? (
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                        <span>缺交项目清单：</span>
                        {/* 针对该同学一键复制催交 */}
                        <button
                          type="button"
                          onClick={() => {
                            const firstMissing = hwStats.missingAssignments[0];
                            const targetAssignment = classAssignments.find(a => a.id === firstMissing.assignmentId);
                            if (targetAssignment) {
                              const od = checkIsOverdue(targetAssignment.dueDate);
                              handleCopySingleStudentReminder(stu, od.daysLate);
                            }
                          }}
                          className="text-[10px] text-amber-800 hover:text-amber-950 font-semibold underline cursor-pointer"
                        >
                          {copiedStudentId === stu.id ? '✅ 已复制催TA文案！' : '💬 一键催TA'}
                        </button>
                      </div>

                      {hwStats.missingAssignments.map(ma => {
                        const od = checkIsOverdue(ma.dueDate);
                        return (
                          <div
                            key={ma.assignmentId}
                            className={`flex items-center justify-between text-xs p-2 rounded-xl border ${
                              od.isOverdue
                                ? 'bg-rose-50/70 border-rose-200/80 text-rose-900'
                                : 'bg-amber-50/50 border-amber-100 text-slate-800'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-bold truncate" title={ma.title}>
                                {ma.title}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1.5 flex-wrap">
                                <span>截止: {ma.dueDate}</span>
                                {od.isOverdue && (
                                  <span className="text-rose-600 font-bold bg-rose-100 px-1 py-0.1 rounded text-[9px]">
                                    超期 {od.daysLate} 天
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                const todayStr = new Date().toISOString().slice(0, 10);
                                onUpdateSubmission(ma.assignmentId, stu.id, {
                                  status: 'submitted',
                                  submittedDate: todayStr
                                });
                              }}
                              className="px-2 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shrink-0 cursor-pointer shadow-2xs"
                              title="标记该同学今天补交了此项作业"
                            >
                              今日补交
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 italic py-2 flex items-center gap-1">
                      <span>🎉 表现极佳，所有布置作业均已按时按量提交！</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 cursor-pointer backdrop-blur-2xs"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl"
          >
            <div className="flex items-center justify-between p-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-800 truncate">
                作业附件照片: {lightboxImage.name}
              </span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="max-h-[75vh] w-auto object-contain mx-auto rounded-xl"
            />
          </div>
        </div>
      )}

      {/* 确认删除作业弹窗 */}
      {assignmentToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="p-5">
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 text-center mb-2">
                确定要删除布置好的作业吗？
              </h3>
              <p className="text-xs text-slate-600 text-center leading-relaxed mb-4">
                作业名称：<span className="font-semibold text-slate-900">【{assignmentToDelete.title}】</span>
                <br />
                <span className="text-[11px] text-slate-500">
                  布置时间：{assignmentToDelete.assignedDate}（截止：{assignmentToDelete.dueDate}）
                </span>
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 leading-normal flex items-start gap-2 mb-5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  删除后，该项作业以及所有学生的收缴状态、催交记录及上传的附件将一并删除，此操作不可撤销。
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignmentToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteAssignment}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>确定删除</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
