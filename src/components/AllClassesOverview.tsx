/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Download,
  ArrowRight,
  BookOpen,
  Clock,
  Flame,
  Check,
  Copy,
  Send,
  Sparkles,
  Filter,
  Plus,
  BellRing,
  ChevronRight
} from 'lucide-react';
import { ClassRoom, Student, Assignment } from '../types';
import { calculateStudentAttendance, calculateStudentHomework } from '../utils/calculations';
import { exportSingleClassToExcel } from '../utils/excelExport';

interface AllClassesOverviewProps {
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  onSelectClass: (id: string) => void;
  onOpenNewClass: () => void;
  onNavigateToHomework?: (classId: string, assignmentId?: string) => void;
  onOpenNewAssignment?: () => void;
}

export interface DeadlineAssignmentInfo {
  assignment: Assignment;
  classRoom: ClassRoom;
  hoursRemaining: number;
  daysRemaining: number;
  isOverdue: boolean;
  isWithin48h: boolean;
  formattedCountdown: string;
  missingCount: number;
  submittedCount: number;
  totalStudents: number;
  missingStudents: Student[];
}

/**
 * 计算作业距离截止日期的精确倒计时与状态（支持智能判断 < 48小时）
 */
export const calculateDeadlineInfo = (
  assignment: Assignment,
  classRoom: ClassRoom,
  allStudents: Student[]
): DeadlineAssignmentInfo => {
  const now = new Date();
  const dueDateStr = assignment.dueDate || '';
  let dueTimestamp = 0;

  if (dueDateStr) {
    const parts = dueDateStr.split(/[-/]/);
    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      // 默认截止到当天 23:59:59
      dueTimestamp = new Date(year, month, day, 23, 59, 59, 999).getTime();
    } else {
      dueTimestamp = new Date(dueDateStr).getTime();
    }
  }

  const diffMs = dueTimestamp > 0 ? dueTimestamp - now.getTime() : 999999999;
  const hoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
  const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isOverdue = diffMs < 0;

  // 严格判断距离截止小于 48 小时（0 到 48 小时以内）
  const isWithin48h = hoursRemaining >= 0 && hoursRemaining <= 48;

  let formattedCountdown = '';
  if (isOverdue) {
    const lateDays = Math.max(1, Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24)));
    formattedCountdown = `已超期 ${lateDays} 天`;
  } else if (hoursRemaining < 1) {
    const mins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    formattedCountdown = `仅剩 ${mins} 分钟截止！🔥`;
  } else if (hoursRemaining < 24) {
    formattedCountdown = `仅剩 ${hoursRemaining} 小时截止 🔥`;
  } else {
    const remainHours = hoursRemaining % 24;
    formattedCountdown = `仅剩 1天 ${remainHours} 小时截止 ⏳`;
  }

  const classStudents = allStudents.filter(s => s.classId === classRoom.id);
  const missingStudents: Student[] = [];
  let submittedCount = 0;

  classStudents.forEach(stu => {
    const sub = assignment.submissions?.[stu.id];
    if (!sub || sub.status === 'missing') {
      missingStudents.push(stu);
    } else {
      submittedCount++;
    }
  });

  return {
    assignment,
    classRoom,
    hoursRemaining,
    daysRemaining,
    isOverdue,
    isWithin48h,
    formattedCountdown,
    missingCount: missingStudents.length,
    submittedCount,
    totalStudents: classStudents.length,
    missingStudents
  };
};

/**
 * 48小时紧急催交通知文案
 */
export const buildUrgent48hReminderText = (info: DeadlineAssignmentInfo): string => {
  const { assignment, classRoom, formattedCountdown, missingStudents } = info;
  const names = missingStudents
    .map((s, idx) => `  ${idx + 1}. 🐾 ${s.name}（No.${s.no}）`)
    .join('\n');

  return `🔔【${classRoom.name} · 作业截止紧急提醒 (48小时倒计时)】🔥\n\n📚 作业名称：《${assignment.title}》\n⏳ 截止时间：${assignment.dueDate}（${formattedCountdown}）\n📝 作业要求：${assignment.content || '按课堂规定完成'}\n\n尚未交作业的同学（共 ${missingStudents.length} 人）：\n${names}\n\n💡 老师温馨提示：距离系统作业收缴截止已不足 48 小时，按时提交平时作业是平时成绩（10分）的重要核算依据。请同学们抓紧时间完成并交予林老师，大家一起加油冲刺！💪✨`;
};

export const AllClassesOverview: React.FC<AllClassesOverviewProps> = ({
  classes,
  students,
  assignments,
  onSelectClass,
  onOpenNewClass,
  onNavigateToHomework,
  onOpenNewAssignment
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deadlineFilter, setDeadlineFilter] = useState<'within48h' | 'all' | 'overdue'>('within48h');

  const totalClassesCount = classes.length;
  const totalStudentsCount = students.length;

  let totalAttendanceSum = 0;
  let totalMissingHomeworkCount = 0;

  students.forEach(s => {
    const classInfo = classes.find(c => c.id === s.classId);
    const classAssignments = assignments.filter(a => a.classId === s.classId);
    const att = calculateStudentAttendance(s, classInfo?.totalSessions || 30);
    const hw = calculateStudentHomework(s.id, classAssignments);

    totalAttendanceSum += att.attendanceRate;
    totalMissingHomeworkCount += hw.missingCount;
  });

  const overallAvgAttendance =
    totalStudentsCount > 0 ? (totalAttendanceSum / totalStudentsCount).toFixed(1) : '0';

  // 计算所有作业的截止状态
  const allDeadlines: DeadlineAssignmentInfo[] = useMemo(() => {
    const list: DeadlineAssignmentInfo[] = [];
    assignments.forEach(a => {
      const cls = classes.find(c => c.id === a.classId);
      if (cls) {
        list.push(calculateDeadlineInfo(a, cls, students));
      }
    });

    // 优先按截止时间紧迫程度升序排列
    return list.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
  }, [assignments, classes, students]);

  // 严格过滤出 < 48 小时截止的作业列表
  const within48hDeadlines = useMemo(() => {
    return allDeadlines.filter(item => item.isWithin48h && item.missingCount > 0);
  }, [allDeadlines]);

  const overdueDeadlines = useMemo(() => {
    return allDeadlines.filter(item => item.isOverdue && item.missingCount > 0);
  }, [allDeadlines]);

  // 根据当前所选 tab 过滤展示清单
  const displayedDeadlines = useMemo(() => {
    if (deadlineFilter === 'within48h') return within48hDeadlines;
    if (deadlineFilter === 'overdue') return overdueDeadlines;
    return allDeadlines.filter(item => item.missingCount > 0);
  }, [deadlineFilter, within48hDeadlines, overdueDeadlines, allDeadlines]);

  const handleCopyReminder = (item: DeadlineAssignmentInfo) => {
    const text = buildUrgent48hReminderText(item);
    navigator.clipboard.writeText(text);
    setCopiedId(item.assignment.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleGoToHomework = (classId: string, assignmentId: string) => {
    if (onNavigateToHomework) {
      onNavigateToHomework(classId, assignmentId);
    } else {
      onSelectClass(classId);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner & KPI Stat Strip */}
      <div className="bg-white/95 p-5 sm:p-6 rounded-3xl border border-amber-200/80 shadow-xs backdrop-blur-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>全学期教学管理全景看板</span>
                <span className="text-xs bg-amber-100 text-amber-900 font-bold px-2.5 py-0.5 rounded-full border border-amber-300">
                  首页仪表盘 🏫
                </span>
              </h2>
            </div>
            <p className="text-xs text-amber-900/80 mt-1">
              当前负责带教 <span className="font-bold text-slate-900">{totalClassesCount} 个班级</span>，覆盖{' '}
              <span className="font-bold text-slate-900">{totalStudentsCount} 名学生</span>，集成作业 48 小时截止高亮预警
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenNewAssignment && (
              <button
                type="button"
                onClick={onOpenNewAssignment}
                className="px-3.5 py-2 text-xs font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-amber-700" />
                <span>布置新作业 ✏️</span>
              </button>
            )}

            <button
              onClick={onOpenNewClass}
              className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl transition-all shadow-sm shadow-amber-500/25 cursor-pointer shrink-0 active:scale-98"
            >
              ＋ 新建教学班级
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
            <div className="flex items-center justify-between text-amber-800 text-xs mb-1 font-medium">
              <span>带教班级数</span>
              <BookOpen className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {totalClassesCount}
              <span className="text-xs font-normal text-slate-500 ml-1">个班</span>
            </div>
            <div className="text-[11px] text-amber-800/70 mt-1">全校多班级横向对比</div>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
            <div className="flex items-center justify-between text-amber-800 text-xs mb-1 font-medium">
              <span>在籍总学生</span>
              <Users className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-slate-900">
              {totalStudentsCount}
              <span className="text-xs font-normal text-slate-500 ml-1">人</span>
            </div>
            <div className="text-[11px] text-amber-800/70 mt-1">支持跨班花名册联动</div>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between text-emerald-800 text-xs mb-1 font-medium">
              <span>全校平均出勤率</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-emerald-700">
              {overallAvgAttendance}%
            </div>
            <div className="text-[11px] text-emerald-700/70 mt-1">智能扣分与迟到折算</div>
          </div>

          {/* 重点预警卡片：48小时截止紧急作业 */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              within48hDeadlines.length > 0
                ? 'bg-gradient-to-br from-orange-500/10 via-amber-500/15 to-orange-500/10 border-orange-400 shadow-sm shadow-orange-500/20 ring-2 ring-orange-300/40'
                : 'bg-amber-50/50 border-amber-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1 font-bold">
              <span className={within48hDeadlines.length > 0 ? 'text-orange-950 flex items-center gap-1' : 'text-amber-800'}>
                {within48hDeadlines.length > 0 && <span className="animate-bounce">🔥</span>}
                <span>48h内截止作业</span>
              </span>
              <Clock className={`w-4 h-4 ${within48hDeadlines.length > 0 ? 'text-orange-600 animate-pulse' : 'text-amber-600'}`} />
            </div>
            <div className="text-2xl font-black font-mono tabular-nums text-orange-600 flex items-baseline gap-1.5">
              <span>{within48hDeadlines.length}</span>
              <span className="text-xs font-bold text-orange-900">项需催收</span>
            </div>
            <div className="text-[11px] text-orange-800/80 mt-1 font-medium">
              {within48hDeadlines.length > 0 ? '橙色高亮标记已启动 🚨' : '近期无即将逾期任务 ✨'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. 【核心功能】：首页仪表盘“作业截止提醒”模块（<48小时高亮橙色展示） */}
      <div className="bg-gradient-to-br from-orange-50/90 via-amber-50/60 to-orange-50/80 rounded-3xl border-2 border-orange-400 p-5 sm:p-6 shadow-sm shadow-orange-500/10 space-y-4">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-orange-200/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-md ring-4 ring-orange-300/40 shrink-0 animate-pulse">
              🔥
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-orange-950 flex items-center gap-1.5">
                  <span>作业截止提醒中心</span>
                  <span className="text-xs bg-orange-500 text-white font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    48小时倒计时预警 ⏳
                  </span>
                </h3>
              </div>
              <p className="text-xs text-orange-900/80 mt-0.5">
                自动过滤距离截止日期小于 48 小时的作业清单，添加醒目橙色高亮标记与快捷催交
              </p>
            </div>
          </div>

          {/* Filter segment tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white/80 rounded-2xl border border-orange-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setDeadlineFilter('within48h')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                deadlineFilter === 'within48h'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-orange-950'
              }`}
            >
              <span>🔥 48h内截止</span>
              <span className="font-mono text-[11px] bg-white/20 px-1.5 py-0.2 rounded-full">
                {within48hDeadlines.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeadlineFilter('overdue')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                deadlineFilter === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-rose-900'
              }`}
            >
              <span>⏰ 已逾期未交</span>
              <span className="font-mono text-[11px] bg-white/20 px-1.5 py-0.2 rounded-full">
                {overdueDeadlines.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDeadlineFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                deadlineFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>全部监控</span>
            </button>
          </div>
        </div>

        {/* Urgent Assignments Grid */}
        {displayedDeadlines.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayedDeadlines.map(item => {
              const isUrgent = item.isWithin48h;
              const isExpired = item.isOverdue;
              const progressRate =
                item.totalStudents > 0
                  ? Math.round((item.submittedCount / item.totalStudents) * 100)
                  : 0;

              return (
                <div
                  key={item.assignment.id}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition-all relative overflow-hidden bg-white/95 shadow-sm ${
                    isUrgent
                      ? 'border-orange-400 ring-2 ring-orange-300/40 shadow-orange-500/10'
                      : isExpired
                      ? 'border-rose-300 bg-rose-50/30'
                      : 'border-amber-200'
                  }`}
                >
                  {/* Glowing orange corner banner for < 48 hours */}
                  {isUrgent && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                      <Flame className="w-3 h-3 fill-white" />
                      <span>48小时高亮预警</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                          🏫 {item.classRoom.name}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.classRoom.code}
                        </span>
                      </div>
                      <h4 className="font-black text-sm sm:text-base text-slate-900 mt-1.5 flex items-center gap-1.5">
                        <span>《{item.assignment.title}》</span>
                      </h4>
                    </div>
                  </div>

                  {/* 【醒目橙色高亮标记】Badge Strip */}
                  <div className="my-2.5 flex items-center gap-2 flex-wrap">
                    {isUrgent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black shadow-sm shadow-orange-500/30 ring-2 ring-orange-300/50 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        <span>距离截止小于 48 小时（{item.formattedCountdown}）</span>
                      </span>
                    ) : isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-xl bg-rose-600 text-white text-xs font-black shadow-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>截止时间已过（{item.formattedCountdown}）</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.8 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                        <span>截止日期：{item.assignment.dueDate}</span>
                      </span>
                    )}

                    <span className="text-[11px] text-slate-500 font-mono bg-slate-50 px-2 py-0.8 rounded-lg border border-slate-200">
                      📅 布置于: {item.assignment.assignedDate}
                    </span>
                  </div>

                  {/* Assignment Content Summary */}
                  {item.assignment.content && (
                    <p className="text-xs text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100 line-clamp-2 leading-relaxed">
                      <span className="font-bold text-amber-900">📝 作业要求：</span>
                      {item.assignment.content}
                    </p>
                  )}

                  {/* Progress & Missing Stats */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">已交进度:</span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-emerald-700 font-bold">
                          {item.submittedCount}/{item.totalStudents} 已交 ({progressRate}%)
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="text-orange-600 font-black">
                          {item.missingCount} 人未交
                        </span>
                      </div>
                    </div>

                    {/* Visual Progress Bar in Orange/Emerald */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isUrgent
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progressRate}%` }}
                      />
                    </div>

                    {/* Missing Students Names preview */}
                    {item.missingStudents.length > 0 && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="font-bold text-orange-950 shrink-0">缺交名单：</span>
                        <span className="text-slate-700 font-medium truncate max-w-[320px]">
                          {item.missingStudents.map(s => s.name).join('、')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleCopyReminder(item)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                        copiedId === item.assignment.id
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-300'
                      }`}
                      title="一键复制专为 48 小时截止定制的催交通知"
                    >
                      {copiedId === item.assignment.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>已复制催交通知！</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-amber-800" />
                          <span>复制48h催交通知 📢</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleGoToHomework(item.classRoom.id, item.assignment.id)}
                      className="px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-sm shadow-orange-500/25 active:scale-98"
                      title="直接跳转至该班级的作业收缴中心"
                    >
                      <span>进入收缴</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/80 rounded-2xl border border-dashed border-orange-200 p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto text-xl">
              🎉
            </div>
            <h4 className="text-sm font-bold text-slate-900">
              {deadlineFilter === 'within48h'
                ? '当前暂无 48 小时内即将截止的紧急作业 🌸'
                : '当前无符合筛选条件的作业'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              所有作业截止状态良好。若新布置作业且截止时间进入 48 小时倒计时，系统将在此处自动高亮呈现！
            </p>
            {onOpenNewAssignment && (
              <button
                type="button"
                onClick={onOpenNewAssignment}
                className="mt-2 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>立即布置带截止期的新作业</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. Grid of Class Cards (班级横向全景对比) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">带教班级横向状态一览</span>
            <span className="text-xs text-amber-800 bg-amber-100 font-mono px-2 py-0.2 rounded-full font-bold">
              {classes.length} 个教学班
            </span>
          </div>
          <span className="text-xs text-slate-400">点击进入班级管理与点名台账</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map(c => {
            const classStudents = students.filter(s => s.classId === c.id);
            const classAssignments = assignments.filter(a => a.classId === c.id);

            let classAttSum = 0;
            let classMissingSum = 0;
            let warningStudentCount = 0;

            classStudents.forEach(stu => {
              const att = calculateStudentAttendance(stu, c.totalSessions);
              const hw = calculateStudentHomework(stu.id, classAssignments);
              classAttSum += att.attendanceRate;
              classMissingSum += hw.missingCount;
              if (att.attendanceRate < 80 || att.absentCount >= 2) {
                warningStudentCount++;
              }
            });

            const classAvgAtt =
              classStudents.length > 0 ? Math.round(classAttSum / classStudents.length) : 0;

            // 检查该班是否有即将 48 小时截止的作业
            const classUrgentHwCount = classAssignments.filter(a => {
              const dl = calculateDeadlineInfo(a, c, students);
              return dl.isWithin48h && dl.missingCount > 0;
            }).length;

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-amber-200/80 p-5 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                      <p className="text-[11px] font-mono text-slate-400">{c.code}</p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200">
                      🎒 {classStudents.length}人
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{c.schedule}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      教室: {c.room} · 共 {c.totalSessions} 课时
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-500">平均出勤率</span>
                        <span className="font-bold font-mono tabular-nums text-slate-800">
                          {classAvgAtt}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            classAvgAtt >= 90
                              ? 'bg-emerald-500'
                              : classAvgAtt >= 80
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${classAvgAtt}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">已布置作业</span>
                      <span className="font-semibold text-slate-800">{classAssignments.length} 项</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">缺交待补交</span>
                      {classMissingSum > 0 ? (
                        <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                          {classMissingSum} 人次
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">全齐 ✨</span>
                      )}
                    </div>

                    {/* 上课进度指标 */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>上课进度:</span>
                      </span>
                      <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        教到第 {c.currentTeachingDay || 1} 课 {c.sessionDates?.[c.currentTeachingDay || 1] ? `(${c.sessionDates[c.currentTeachingDay || 1]})` : ''}
                      </span>
                    </div>
                    {c.currentTeachingTopic && (
                      <div className="text-[10px] text-slate-600 truncate bg-slate-50 px-2 py-1 rounded" title={c.currentTeachingTopic}>
                        📖 {c.currentTeachingTopic}
                      </div>
                    )}

                    {/* 48小时预警标识 */}
                    {classUrgentHwCount > 0 && (
                      <div className="text-[11px] font-bold text-orange-950 bg-orange-100/90 border border-orange-300 p-1.5 rounded-xl flex items-center gap-1 animate-pulse">
                        <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span>含 {classUrgentHwCount} 项作业 48h 内截止！</span>
                      </div>
                    )}

                    {warningStudentCount > 0 && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-xl border border-amber-200/60 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{warningStudentCount} 位学生考勤需关注</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-2">
                  <button
                    onClick={() => onSelectClass(c.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 px-3 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>进入班级</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => exportSingleClassToExcel(c, students, assignments)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                    title="导出该班 Excel 表格"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
