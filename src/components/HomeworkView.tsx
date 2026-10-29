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
  Trash2
} from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState<'all' | 'missing' | 'submitted'>('all');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
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

  // 计算当前作业各状态人数
  let currentSubmittedCount = 0;
  let currentMissingCount = 0;
  let currentLateCount = 0;

  if (activeAssignment) {
    students.forEach(s => {
      const sub = activeAssignment.submissions[s.id];
      if (!sub || sub.status === 'missing') currentMissingCount++;
      else if (sub.status === 'submitted') currentSubmittedCount++;
      else if (sub.status === 'late') currentLateCount++;
    });
  }

  // 复制当前作业催交文本
  const handleCopyAssignmentReminder = () => {
    if (!activeAssignment) return;
    const missingStudents = students.filter(s => {
      const sub = activeAssignment.submissions[s.id];
      return !sub || sub.status === 'missing';
    });

    const text = `【${currentClass.name} 作业催交通知】\n作业内容：${activeAssignment.title}\n布置日期：${activeAssignment.assignedDate}（截止：${activeAssignment.dueDate}）\n\n尚未交作业的学生（共 ${missingStudents.length} 人）：\n${missingStudents.map((s, i) => `${i + 1}. ${s.name}`).join('\n')}\n\n请上述同学尽快补交！`;

    navigator.clipboard.writeText(text);
    setCopySuccess('reminder');
    setTimeout(() => setCopySuccess(null), 2500);
  };

  // 复制全班缺交总清单
  const handleCopyAllMissingSummary = () => {
    const list: string[] = [];
    students.forEach(s => {
      const stats = calculateStudentHomework(s.id, classAssignments);
      if (stats.missingCount > 0) {
        const missingNames = stats.missingAssignments.map(ma => `《${ma.title}》(${ma.assignedDate})`).join('、');
        list.push(`• ${s.name}（缺交 ${stats.missingCount} 次）：${missingNames}`);
      }
    });

    const text = `【${currentClass.name} 全学期作业缺交汇总】\n截至今日，班级缺交作业学生统计如下：\n\n${list.length > 0 ? list.join('\n') : '全员作业已全部交齐，无缺交记录！'}\n\n期末综合评分在即，请抓紧补齐！`;

    navigator.clipboard.writeText(text);
    setCopySuccess('allMissing');
    setTimeout(() => setCopySuccess(null), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Mode switcher & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>{currentClass.name} 作业布置与收缴管理</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            记录布置内容、追踪交作业具体日期、清晰查看哪些学生未交及缺交哪些作业
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Segmented Mode Control */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('byAssignment')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'byAssignment'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              按作业收缴明细
            </button>
            <button
              onClick={() => setViewMode('byStudentMissing')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'byStudentMissing'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              缺交总清单 (按人归纳)
            </button>
          </div>

          <button
            onClick={onOpenNewAssignment}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>布置新作业</span>
          </button>
        </div>
      </div>

      {classAssignments.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700 mb-1">当前班级暂无作业记录</h3>
          <p className="text-xs text-slate-400 mb-4">
            点击“布置新作业”开始记录今天布置的生词、练习册或作文
          </p>
          <button
            onClick={onOpenNewAssignment}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
          >
            立即布置第一次作业
          </button>
        </div>
      ) : viewMode === 'byAssignment' ? (
        /* MODE 1: 按作业查看收缴状态 */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Left Column: Assignment Selector Cards */}
          <div className="lg:col-span-1 space-y-2.5">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              已布置作业 ({classAssignments.length})
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
              {classAssignments.map(a => {
                const isSelected = a.id === (activeAssignment?.id || selectedAssignmentId);

                // 计算已交/缺交
                let missing = 0;
                let done = 0;
                students.forEach(s => {
                  const sub = a.submissions[s.id];
                  if (!sub || sub.status === 'missing') missing++;
                  else done++;
                });

                return (
                  <div
                    key={a.id}
                    onClick={() => setSelectedAssignmentId(a.id)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all cursor-pointer group relative ${
                      isSelected
                        ? 'bg-slate-50 border-slate-900 shadow-2xs ring-1 ring-slate-900/10'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[11px] font-mono text-slate-400">
                        {a.assignedDate}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {missing > 0 ? (
                          <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                            缺交 {missing} 人
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                            已收齐
                          </span>
                        )}
                        {onDeleteAssignment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignmentToDelete(a);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="删除此项布置好的作业"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="font-semibold text-xs text-slate-900 line-clamp-1 mb-1">
                      {a.title}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">
                      {a.content}
                    </div>
                    {a.attachments && a.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50/80 px-1.5 py-0.5 rounded border border-blue-200/60 mb-1.5 w-fit">
                        <Paperclip className="w-3 h-3 text-blue-600" />
                        <span>含 {a.attachments.length} 个照片/附件</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>已交 {done}/{students.length}</span>
                      <span>截止: {a.dueDate}</span>
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
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                        布置于 {activeAssignment.assignedDate}
                      </span>
                      <span className="text-xs text-slate-500">
                        截止时间：{activeAssignment.dueDate}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {activeAssignment.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700">要求：</span>{activeAssignment.content}
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
                                    className="w-9 h-9 rounded object-cover border border-slate-200 shadow-2xs group-hover:opacity-90"
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
                                  <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
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

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => onBatchSubmitToday(activeAssignment.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                      title="将所有未交的学生一键标记为今天已交"
                    >
                      一键标记今天收齐
                    </button>
                    <button
                      onClick={handleCopyAssignmentReminder}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="一键复制未交名单到剪贴板，方便发送催交通知"
                    >
                      {copySuccess === 'reminder' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">已复制催交通知</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>复制催交名单</span>
                        </>
                      )}
                    </button>
                    {onDeleteAssignment && (
                      <button
                        type="button"
                        onClick={() => setAssignmentToDelete(activeAssignment)}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
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
                    <span className="text-slate-500">总人数:</span>
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
                    <span className="text-rose-600 font-medium">缺交/未交:</span>
                    <span className="font-bold tabular-nums text-rose-700">{currentMissingCount}人</span>
                  </div>
                  {/* Progress meter */}
                  <div className="flex-1 min-w-[120px] max-w-xs bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{
                        width: `${students.length ? ((currentSubmittedCount + currentLateCount) / students.length) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">筛选学生：</span>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    filterStatus === 'all'
                      ? 'bg-slate-900 text-white font-medium'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  全部 ({students.length})
                </button>
                <button
                  onClick={() => setFilterStatus('missing')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    filterStatus === 'missing'
                      ? 'bg-rose-50 text-rose-700 font-semibold border border-rose-200'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  未交 ({currentMissingCount})
                </button>
                <button
                  onClick={() => setFilterStatus('submitted')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    filterStatus === 'submitted'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  已交 ({currentSubmittedCount + currentLateCount})
                </button>
              </div>

              {/* Submissions Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-12 text-center">学号</th>
                        <th className="py-2.5 px-4 min-w-[130px]">学生姓名</th>
                        <th className="py-2.5 px-3 min-w-[130px]">提交状态</th>
                        <th className="py-2.5 px-3 min-w-[140px]">
                          交作业日期 <span className="text-[10px] text-slate-400 font-normal">(哪天交给你的)</span>
                        </th>
                        <th className="py-2.5 px-3 w-24">作业得分</th>
                        <th className="py-2.5 px-4">教师批语 / 备注</th>
                        <th className="py-2.5 px-3 w-28 text-center">快捷操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students
                        .filter(s => {
                          const sub = activeAssignment.submissions[s.id];
                          const isMiss = !sub || sub.status === 'missing';
                          if (filterStatus === 'missing') return isMiss;
                          if (filterStatus === 'submitted') return !isMiss;
                          return true;
                        })
                        .map(stu => {
                          const sub: StudentSubmission = activeAssignment.submissions[stu.id] || {
                            status: 'missing'
                          };
                          const isMissing = sub.status === 'missing';

                          return (
                            <tr
                              key={stu.id}
                              className={`hover:bg-slate-50 transition-colors ${
                                isMissing ? 'bg-rose-50/25' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-500">
                                {stu.no}
                              </td>
                              <td className="py-2.5 px-4">
                                <button
                                  onClick={() => onSelectStudentModal(stu)}
                                  className="font-medium text-slate-900 hover:text-blue-600 transition-colors cursor-pointer text-left"
                                >
                                  {stu.name}
                                </button>
                              </td>
                              {/* Status select */}
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
                                  className={`text-xs px-2 py-1 rounded font-medium border cursor-pointer ${
                                    sub.status === 'submitted'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : sub.status === 'late'
                                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                                      : sub.status === 'excused'
                                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                                      : 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                                  }`}
                                >
                                  <option value="missing">🔴 缺交/未交</option>
                                  <option value="submitted">🟢 已交</option>
                                  <option value="late">⚠️ 补交/迟交</option>
                                  <option value="excused">⚪ 免交</option>
                                </select>
                              </td>

                              {/* 提交日期 */}
                              <td className="py-2.5 px-3">
                                {sub.status === 'missing' ? (
                                  <span className="text-rose-500 italic text-[11px]">未提交</span>
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
                                    className="w-28 text-xs font-mono bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                                  className="w-16 text-xs font-mono tabular-nums bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>

                              {/* 批语 */}
                              <td className="py-2.5 px-4">
                                <input
                                  type="text"
                                  value={sub.feedback || ''}
                                  placeholder="简短批注（如书写规范、全对、有两处错误）"
                                  onChange={e =>
                                    onUpdateSubmission(activeAssignment.id, stu.id, {
                                      feedback: e.target.value
                                    })
                                  }
                                  className="w-full text-xs bg-white border border-slate-200 rounded px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </td>

                              {/* 快捷操作按钮 */}
                              <td className="py-2.5 px-3 text-center">
                                {isMissing ? (
                                  <button
                                    onClick={() => {
                                      const todayStr = new Date().toISOString().slice(0, 10);
                                      onUpdateSubmission(activeAssignment.id, stu.id, {
                                        status: 'submitted',
                                        submittedDate: todayStr
                                      });
                                    }}
                                    className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
                                  >
                                    今天刚交
                                  </button>
                                ) : (
                                  <button
                                    onClick={() =>
                                      onUpdateSubmission(activeAssignment.id, stu.id, {
                                        status: 'missing',
                                        submittedDate: undefined
                                      })
                                    }
                                    className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                  >
                                    撤回已交
                                  </button>
                                )}
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>全班缺交作业总清单看板</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                实时汇总每位学生当前尚未提交的所有具体作业项目，便于一对一督促与家校反馈
              </p>
            </div>
            <button
              onClick={handleCopyAllMissingSummary}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {copySuccess === 'allMissing' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">已复制全班缺交通知</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>生成催交总通知</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map(stu => {
              const hwStats = calculateStudentHomework(stu.id, classAssignments);
              const hasMissing = hwStats.missingCount > 0;

              return (
                <div
                  key={stu.id}
                  className={`p-4 rounded-xl border transition-all ${
                    hasMissing
                      ? 'bg-white border-rose-200 shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{stu.name}</span>
                        <span className="text-xs text-slate-400">No.{stu.no}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        完成率: <span className="font-semibold tabular-nums">{hwStats.completionRate}%</span>
                        {' · '}
                        已交: <span className="tabular-nums">{hwStats.submittedCount + hwStats.lateCount}</span> / {hwStats.totalAssigned}
                      </div>
                    </div>
                    {hasMissing ? (
                      <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full shrink-0">
                        缺交 {hwStats.missingCount} 项
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                        全部交齐
                      </span>
                    )}
                  </div>

                  {/* Missing items breakdown */}
                  {hasMissing ? (
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-rose-800">
                        具体缺交项目明细：
                      </div>
                      {hwStats.missingAssignments.map(ma => (
                        <div
                          key={ma.assignmentId}
                          className="flex items-center justify-between text-xs p-2 bg-rose-50/60 border border-rose-100 rounded-lg"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-medium text-slate-800 truncate" title={ma.title}>
                              {ma.title}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              布置: {ma.assignedDate} · 截止: {ma.dueDate}
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
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shrink-0 cursor-pointer"
                            title="标记该同学今天补交了此项作业"
                          >
                            今日补交
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 italic py-2">
                      🎉 表现良好，所有布置作业均已按时按量提交！
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
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 cursor-pointer"
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
              className="max-h-[75vh] w-auto object-contain mx-auto rounded-lg"
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
