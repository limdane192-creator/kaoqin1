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
  Send,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Award,
  Heart,
  TrendingUp,
  Star
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { CuteHomeworkBunny, CuteSunBadge, CuteReminderKitten, CutePawIcon } from './CuteIllustrations';
import { ClassRoom, Student, Assignment, SubmissionStatus, StudentSubmission } from '../types';
import { calculateStudentHomework } from '../utils/calculations';

interface HomeworkViewProps {
  currentClass: ClassRoom;
  students: Student[];
  assignments: Assignment[];
  allClasses?: ClassRoom[];
  allStudents?: Student[];
  onOpenNewAssignment: () => void;
  onUpdateSubmission: (
    assignmentId: string,
    studentId: string,
    updates: Partial<StudentSubmission>
  ) => void;
  onBatchSubmitToday: (assignmentId: string) => void;
  onSelectStudentModal: (student: Student) => void;
  onDeleteAssignment?: (assignmentId: string) => void;
  onSelectClass?: (classId: string) => void;
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
 * 判断作业是否距离截止小于 48 小时
 */
export const checkIsWithin48Hours = (
  dueDateStr?: string
): { isWithin48h: boolean; hoursRemaining: number; countdownStr: string } => {
  if (!dueDateStr) return { isWithin48h: false, hoursRemaining: 999, countdownStr: '' };
  try {
    const now = Date.now();
    const parts = dueDateStr.split(/[-/]/);
    let dueTime = 0;
    if (parts.length >= 3) {
      dueTime = new Date(
        parseInt(parts[0], 10),
        parseInt(parts[1], 10) - 1,
        parseInt(parts[2], 10),
        23,
        59,
        59
      ).getTime();
    } else {
      dueTime = new Date(dueDateStr).getTime();
    }
    const diffMs = dueTime - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const isWithin48h = hours >= 0 && hours <= 48;
    const countdownStr =
      hours < 1 ? '仅剩不到1小时' : hours < 24 ? `仅剩 ${hours} 小时` : `剩 1天 ${hours % 24} 小时`;
    return { isWithin48h, hoursRemaining: hours, countdownStr };
  } catch {
    return { isWithin48h: false, hoursRemaining: 999, countdownStr: '' };
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

/**
 * 生成已交学生表扬喜报文案
 */
export const buildPraiseMessageText = (
  studentName: string,
  assignmentTitle: string,
  className: string
): string => {
  return `🌟【${className} · 作业之星表扬喜报】🎉🐾\n\n恭喜【${studentName}】同学顺利按时完成作业《${assignmentTitle}》！✨\n\n书写工整认真，学习态度非常棒！特此表扬鼓励，继续保持良好的中文学习习惯，林老师为你加油点赞！🌸🏆`;
};

export const HomeworkView: React.FC<HomeworkViewProps> = ({
  currentClass,
  students,
  assignments,
  allClasses,
  allStudents,
  onOpenNewAssignment,
  onUpdateSubmission,
  onBatchSubmitToday,
  onSelectStudentModal,
  onDeleteAssignment,
  onSelectClass
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

  // 折叠图表状态 (可完全缩到看不见，不遮挡右侧内容)
  const [isChartCollapsed, setIsChartCollapsed] = useState<boolean>(false);

  // 照片缩放比例状态 { [attachmentId]: scaleValue }
  const [photoZoomMap, setPhotoZoomMap] = useState<Record<string, number>>({});

  // 表扬激励弹窗
  const [celebratingStudent, setCelebratingStudent] = useState<{
    student: Student;
    assignment: Assignment;
    submission?: StudentSubmission;
  } | null>(null);
  const [celebrateCopyToast, setCelebrateCopyToast] = useState(false);

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

  // 当前激活作业的48小时临期判定
  const activeWithin48Info = activeAssignment
    ? checkIsWithin48Hours(activeAssignment.dueDate)
    : { isWithin48h: false, hoursRemaining: 999, countdownStr: '' };
  const isCurrentWithin48h = activeWithin48Info.isWithin48h;

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

  // 4. 复制48小时临期紧急催交通知文案
  const handleCopyUrgent48hReminder = () => {
    if (!activeAssignment) return;
    const missingStudents = students.filter(s => {
      const sub = activeAssignment.submissions[s.id];
      return !sub || sub.status === 'missing';
    });
    const info = checkIsWithin48Hours(activeAssignment.dueDate);
    const namesList = missingStudents
      .map((s, i) => `  ${i + 1}. 🐾 ${s.name}（学号 No.${s.no}）`)
      .join('\n');
    const text = `🔥【${currentClass.name} · 作业截止紧急提醒（48小时内）】⏰🐾\n\n📚 作业题目：《${activeAssignment.title}》\n⏳ 距离截止还剩：${info.countdownStr}（截止时间：${activeAssignment.dueDate}）\n📝 作业要求：${activeAssignment.content || '按课堂要求完成'}\n\n目前尚未提交作业的同学（共 ${missingStudents.length} 人）：\n${namesList}\n\n💡 老师温馨叮嘱：作业已进入截止倒计时！请同学们安排好时间尽快完成并提交，避免临近截止匆忙哦～加油！💪✨`;

    navigator.clipboard.writeText(text);
    setCopySuccess('urgent48');
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

  // 缩放照片工具函数
  const getScale = (id: string) => photoZoomMap[id] || 1;
  const zoomIn = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPhotoZoomMap(prev => ({
      ...prev,
      [id]: Math.min(2.5, Number(((prev[id] || 1) + 0.25).toFixed(2)))
    }));
  };
  const zoomOut = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPhotoZoomMap(prev => ({
      ...prev,
      [id]: Math.max(0.5, Number(((prev[id] || 1) - 0.25).toFixed(2)))
    }));
  };
  const resetZoom = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPhotoZoomMap(prev => ({ ...prev, [id]: 1 }));
  };

  // Recharts 各班级作业未交率折线图数据统计
  const classList = allClasses && allClasses.length > 0 ? allClasses : [currentClass];
  const chartData = classList.map(c => {
    const cAssignments = assignments.filter(a => a.classId === c.id);
    const cStudents = allStudents
      ? allStudents.filter(s => s.classId === c.id)
      : c.id === currentClass.id
      ? students
      : [];

    let totalExpected = cAssignments.length * (cStudents.length || 1);
    let totalMissing = 0;
    let totalSubmitted = 0;

    cAssignments.forEach(a => {
      cStudents.forEach(s => {
        const sub = a.submissions?.[s.id];
        if (!sub || sub.status === 'missing') {
          totalMissing++;
        } else {
          totalSubmitted++;
        }
      });
    });

    const missingRate = totalExpected > 0 ? Math.round((totalMissing / totalExpected) * 100) : 0;
    const completionRate = 100 - missingRate;

    return {
      name: c.name,
      classId: c.id,
      未交率: missingRate,
      提交率: completionRate,
      missingCount: totalMissing,
      submittedCount: totalSubmitted,
      assignmentsCount: cAssignments.length,
      studentCount: cStudents.length,
      isCurrent: c.id === currentClass.id
    };
  });

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Recharts 折线图：各班级作业未交率横向对比看板 (支持一键收起到看不见) */}
      <div className="bg-white/95 rounded-2xl border border-amber-200/80 shadow-xs overflow-hidden transition-all">
        <div className="px-4 py-3 bg-gradient-to-r from-amber-50/90 via-rose-50/40 to-amber-50/90 border-b border-amber-200/60 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <span>各班级作业未交率折线分析</span>
                  <span className="text-[11px] bg-rose-100 text-rose-800 font-bold px-2 py-0.2 rounded-full border border-rose-200">
                    Recharts 教学进度定位
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                折线越高代表未交率越高、需老师重点催查；可折叠收起，绝不遮挡下方作业明细
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Class Selector Pills */}
            <div className="hidden sm:flex items-center gap-1 text-xs">
              {chartData.map(d => (
                <button
                  key={d.classId}
                  type="button"
                  onClick={() => onSelectClass && onSelectClass(d.classId)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                    d.isCurrent
                      ? 'bg-rose-500 text-white border-rose-500 shadow-2xs'
                      : 'bg-white hover:bg-amber-100 text-slate-700 border-slate-200'
                  }`}
                  title={`点击切换到 ${d.name}`}
                >
                  {d.name}: <span className="font-mono">{d.未交率}%</span>未交
                </button>
              ))}
            </div>

            {/* Toggle Collapse/Expand Button */}
            <button
              type="button"
              onClick={() => setIsChartCollapsed(!isChartCollapsed)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-amber-950 bg-white hover:bg-amber-100 rounded-xl border border-amber-300 transition-colors cursor-pointer shadow-2xs"
              title={isChartCollapsed ? '展开折线图' : '收起折线图到看不见，节省屏幕空间'}
            >
              {isChartCollapsed ? (
                <>
                  <BarChart2 className="w-3.5 h-3.5 text-amber-700" />
                  <span>展开图表 📈</span>
                  <ChevronDown className="w-3.5 h-3.5 text-amber-700" />
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-amber-700" />
                  <span>收起图表（不挡内容）</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chart Content Area */}
        {!isChartCollapsed && (
          <div className="p-4 sm:p-5">
            <div className="h-56 sm:h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 25, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={val => `${val}%`}
                    axisLine={{ stroke: '#cbd5e1' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isHigh = data.未交率 > 25;
                        return (
                          <div className="bg-white/95 backdrop-blur-xs p-3 rounded-xl shadow-xl border border-rose-200 text-xs">
                            <div className="font-bold text-slate-900 flex items-center justify-between gap-3 mb-1.5 border-b border-slate-100 pb-1">
                              <span>🏫 {data.name}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  isHigh ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isHigh ? '⚠️ 缺交偏高·需催查' : '🌸 教学进度优良'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="text-rose-600 font-bold flex items-center justify-between gap-4">
                                <span>作业未交率：</span>
                                <span className="font-mono text-sm">{data.未交率}%</span>
                              </div>
                              <div className="text-emerald-700 font-medium flex items-center justify-between gap-4">
                                <span>按时提交率：</span>
                                <span className="font-mono">{data.提交率}%</span>
                              </div>
                              <div className="text-slate-500 text-[11px] pt-1 border-t border-slate-100 flex items-center justify-between gap-4">
                                <span>在册人数 / 作业项数：</span>
                                <span className="font-mono">{data.studentCount}人 · {data.assignmentsCount}项</span>
                              </div>
                              <div className="text-slate-500 text-[11px] flex items-center justify-between gap-4">
                                <span>缺交人次：</span>
                                <span className="font-mono text-rose-600 font-bold">{data.missingCount} 次</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="未交率"
                    name="各班作业未交率 (%)"
                    stroke="#f43f5e"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#e11d48' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="提交率"
                    name="作业提交率 (%)"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

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
              <span>未交卡片放大核对</span>
              <span>·</span>
              <span>作业照片放大缩小</span>
              <span>·</span>
              <span>一键催交与完成激励动画</span>
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
              <span>🐾 缺交总清单 (按人看板)</span>
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
                const aWithin48 = checkIsWithin48Hours(a.dueDate);

                // 计算已交/缺交
                let missing = 0;
                let done = 0;
                students.forEach(s => {
                  const sub = a.submissions[s.id];
                  if (!sub || sub.status === 'missing') missing++;
                  else done++;
                });

                const isOverdueAndMissing = aOverdue.isOverdue && missing > 0;
                const isWithin48AndMissing = aWithin48.isWithin48h && missing > 0;

                return (
                  <div
                    key={a.id}
                    onClick={() => {
                      setSelectedAssignmentId(a.id);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? isWithin48AndMissing
                          ? 'bg-orange-50/90 border-orange-400 shadow-xs ring-2 ring-orange-400/50'
                          : 'bg-amber-50/90 border-amber-400 shadow-xs ring-2 ring-amber-300/40'
                        : isOverdueAndMissing
                        ? 'bg-rose-50/50 border-rose-300 hover:bg-rose-50'
                        : isWithin48AndMissing
                        ? 'bg-orange-50/50 border-orange-300 hover:bg-orange-50 ring-1 ring-orange-300/50 shadow-2xs'
                        : 'bg-white hover:bg-amber-50/40 border-amber-200/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 mb-1.5">
                      <span className="text-[10px] font-mono text-slate-400">
                        布置于 {a.assignedDate}
                      </span>
                      <div className="flex items-center gap-1">
                        {isOverdueAndMissing ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-1.5 py-0.2 rounded-md animate-pulse">
                            逾期 {missing}人
                          </span>
                        ) : isWithin48AndMissing ? (
                          <span className="text-[10px] font-bold text-orange-900 bg-orange-100 border border-orange-300 px-1.5 py-0.2 rounded-md animate-pulse flex items-center gap-0.5 shadow-2xs">
                            <span>🔥 48h截止</span>
                            <span className="font-mono text-[9px]">({aWithin48.countdownStr})</span>
                          </span>
                        ) : missing === 0 ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                            全齐 ✨
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded-md">
                            缺 {missing}人
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
                      <span className={`font-mono ${aOverdue.isOverdue && missing > 0 ? 'text-rose-600 font-bold' : isWithin48AndMissing ? 'text-orange-700 font-bold' : ''}`}>
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
              <div className={`bg-white/95 p-4 sm:p-5 rounded-2xl border shadow-xs transition-all ${
                isCurrentWithin48h && currentMissingCount > 0
                  ? 'border-orange-300 ring-2 ring-orange-200/60 shadow-orange-100/40'
                  : 'border-amber-200/70'
              }`}>
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
                            : isCurrentWithin48h && currentMissingCount > 0
                            ? 'bg-orange-50 text-orange-900 border-orange-300 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        ⏳ 截止时间：{activeAssignment.dueDate}
                        {isCurrentOverdue ? (
                          <span className="ml-1 text-rose-600 font-bold">
                            （已逾期 {currentDaysLate} 天）
                          </span>
                        ) : isCurrentWithin48h && currentMissingCount > 0 ? (
                          <span className="ml-1 text-orange-700 font-bold">
                            （🔥 距截止仅 {activeWithin48Info.countdownStr}）
                          </span>
                        ) : null}
                      </span>
                      {isCurrentWithin48h && currentMissingCount > 0 && (
                        <span className="text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 px-2.5 py-0.5 rounded-lg shadow-2xs flex items-center gap-1 animate-pulse">
                          <span>🔥 48小时截止提醒</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-2 flex items-center gap-2">
                      <span>{activeAssignment.title}</span>
                    </h3>

                    <p className="text-xs text-slate-600 mt-1.5 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100 leading-relaxed">
                      <span className="font-bold text-amber-900">📝 作业要求：</span>
                      {activeAssignment.content}
                    </p>

                    {/* 48小时截止预警横幅 */}
                    {isCurrentWithin48h && currentMissingCount > 0 && (
                      <div className="mt-2.5 p-3 bg-gradient-to-r from-orange-500/10 via-amber-500/15 to-orange-500/10 border-2 border-orange-400 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center text-sm shadow-2xs shrink-0 animate-bounce">
                            🔥
                          </span>
                          <div>
                            <div className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
                              <span>作业截止紧急预警（距离截止 &lt; 48小时）</span>
                              <span className="text-[10px] bg-orange-200 text-orange-900 px-1.5 py-0.2 rounded-full font-mono font-bold">
                                {activeWithin48Info.countdownStr}
                              </span>
                            </div>
                            <p className="text-[11px] text-orange-800 mt-0.5">
                              此作业已进入最后倒计时！尚有 <strong className="text-orange-950 font-black">{currentMissingCount}</strong> 名学生未交，请抓紧督促提交。
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleCopyUrgent48hReminder}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-lg shadow-2xs transition-all cursor-pointer shrink-0 flex items-center gap-1 active:scale-98"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>一键催交</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {isCurrentWithin48h && currentMissingCount > 0 && (
                      <button
                        onClick={handleCopyUrgent48hReminder}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
                        title="一键复制48小时紧急催交通知"
                      >
                        {copySuccess === 'urgent48' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>已复制48h催交！</span>
                          </>
                        ) : (
                          <>
                            <Bell className="w-3.5 h-3.5" />
                            <span>🔥 复制48h催交</span>
                          </>
                        )}
                      </button>
                    )}
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
                    <span className={`${currentMissingCount > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                      未交:
                    </span>
                    <span className={`font-bold tabular-nums ${currentMissingCount > 0 ? 'text-rose-700 text-sm' : 'text-slate-800'}`}>
                      {currentMissingCount}人
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 【核心升级】：未交框放大一点！上面的内容出现布置日期、作业内容、上传的大照片，支持放大缩小 */}
              {currentMissingCount > 0 && (
                <div className="bg-gradient-to-br from-rose-50/90 via-amber-50/50 to-rose-50/70 border-2 border-rose-300 rounded-3xl p-5 shadow-sm space-y-4">
                  {/* Big Missing Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-200/80 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 animate-bounce">
                        ⚠️
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-black text-rose-950 flex items-center gap-2">
                            <span>【缺交作业核查大看板】</span>
                            <span className="text-xs bg-rose-200/90 text-rose-900 px-2 py-0.5 rounded-full font-bold">
                              当前缺交 {currentMissingCount} 人
                            </span>
                          </h4>
                          {isCurrentOverdue && (
                            <span className="text-xs font-bold text-white bg-rose-600 px-2.5 py-0.5 rounded-full shadow-2xs">
                              ⏰ 截止已逾期 {currentDaysLate} 天
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-rose-800/80 mt-0.5">
                          大框核对作业内容与课后原图，支持放大缩小，方便一眼定位学生缺哪项作业
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleCopyBatchOverdueReminder}
                        className="px-3.5 py-1.5 text-xs font-black text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-rose-500/25 active:scale-98"
                        title="一键复制全班逾期催交文案"
                      >
                        {copySuccess === 'overdueBatch' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>已复制催交通知！</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>一键复制催交文案 📢</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Enlarged Details: Assigned Date & Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div className="bg-white/90 p-3.5 rounded-2xl border border-rose-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span className="flex items-center gap-1.5 text-rose-900">
                          <Calendar className="w-4 h-4 text-rose-600" />
                          <span>作业排期与要求：</span>
                        </span>
                        <span className="font-mono text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          满分 {activeAssignment.maxScore || 100} 分
                        </span>
                      </div>
                      <div className="text-xs text-slate-700 space-y-1">
                        <div>
                          <strong className="text-slate-900">📅 布置日期：</strong>
                          <span className="font-mono text-slate-800 font-bold">{activeAssignment.assignedDate}</span>
                        </div>
                        <div>
                          <strong className="text-slate-900">⏳ 截止时间：</strong>
                          <span className="font-mono text-rose-700 font-bold">{activeAssignment.dueDate}</span>
                          {isCurrentOverdue && (
                            <span className="ml-1 text-[11px] text-rose-600 font-bold">
                              （已超期 {currentDaysLate} 天）
                            </span>
                          )}
                        </div>
                        <div className="pt-1 border-t border-slate-100">
                          <strong className="text-slate-900">📝 作业内容详情：</strong>
                          <p className="mt-1 p-2 bg-amber-50/60 rounded-xl border border-amber-200/60 text-slate-800 text-xs leading-relaxed font-medium">
                            {activeAssignment.content}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Missing Student Quick Actions */}
                    <div className="bg-white/90 p-3.5 rounded-2xl border border-rose-200 shadow-2xs space-y-2">
                      <div className="text-xs font-bold text-rose-900 flex items-center justify-between">
                        <span>未交学生列表（{currentMissingCount}人）：</span>
                        <span className="text-[11px] text-slate-400 font-normal">点击可快速催交或补录</span>
                      </div>

                      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {students
                          .filter(s => {
                            const sub = activeAssignment.submissions[s.id];
                            return !sub || sub.status === 'missing';
                          })
                          .map(stu => (
                            <div
                              key={stu.id}
                              className="flex items-center justify-between p-2 bg-rose-50/60 hover:bg-rose-100/60 rounded-xl border border-rose-200/80 text-xs transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-slate-400 text-[11px]">#{stu.no}</span>
                                <span className="font-bold text-slate-900">{stu.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopySingleStudentReminder(stu, currentDaysLate)}
                                  className={`px-2 py-0.8 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                                    copiedStudentId === stu.id
                                      ? 'bg-rose-600 text-white border-rose-600'
                                      : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                                  }`}
                                  title="一键复制为TA定制的可爱催交提醒"
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
                                  className="px-2 py-0.8 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors cursor-pointer"
                                >
                                  补交
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>

                  {/* Photos Section: 大照片展示与放大缩小控制 */}
                  <div className="bg-white/95 p-4 rounded-2xl border border-rose-200 shadow-2xs space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span className="font-bold text-xs text-slate-900">
                          老师上传的作业原图与课辅照片
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({activeAssignment.attachments?.filter(a => a.type === 'image').length || 0} 张照片)
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-800 font-medium">
                        💡 放大照片可看清题号与生词，缩小可看全页排版
                      </span>
                    </div>

                    {activeAssignment.attachments &&
                    activeAssignment.attachments.filter(a => a.type === 'image').length > 0 ? (
                      <div className="space-y-4">
                        {activeAssignment.attachments
                          .filter(a => a.type === 'image')
                          .map(att => {
                            const scale = getScale(att.id);
                            return (
                              <div
                                key={att.id}
                                className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 space-y-2.5"
                              >
                                {/* Photo Toolbar */}
                                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-bold text-slate-800 truncate text-xs">
                                      📷 {att.name}
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                      缩放: {Math.round(scale * 100)}%
                                    </span>
                                  </div>

                                  {/* Zoom Controls */}
                                  <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                                    <button
                                      type="button"
                                      onClick={e => zoomOut(att.id, e)}
                                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors cursor-pointer"
                                      title="缩小照片 (-25%)"
                                    >
                                      <ZoomOut className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={e => resetZoom(att.id, e)}
                                      className="px-2 py-0.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                      title="恢复100%原始大小"
                                    >
                                      100%
                                    </button>

                                    <button
                                      type="button"
                                      onClick={e => zoomIn(att.id, e)}
                                      className="p-1 hover:bg-slate-100 rounded-lg text-slate-700 transition-colors cursor-pointer"
                                      title="放大照片 (+25%)"
                                    >
                                      <ZoomIn className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setLightboxImage({ url: att.dataUrl, name: att.name })}
                                      className="p-1 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer ml-1"
                                      title="全屏高清大图查看"
                                    >
                                      <Maximize2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Large Image Box with Zoom */}
                                <div className="w-full overflow-auto max-h-[460px] bg-slate-900/5 rounded-xl border border-slate-200/80 p-2 flex items-center justify-center">
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    style={{
                                      transform: `scale(${scale})`,
                                      transformOrigin: 'top center',
                                      transition: 'transform 0.15s ease-out'
                                    }}
                                    onClick={() => setLightboxImage({ url: att.dataUrl, name: att.name })}
                                    className="max-h-[380px] w-auto object-contain rounded-lg cursor-zoom-in shadow-xs"
                                    title="点击全屏高清查看"
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="bg-amber-50/50 border border-dashed border-amber-200 rounded-xl p-4 text-center text-xs text-amber-800">
                        <span>📷 此作业布置时暂未上传课本/练习册照片。下次点击上方“布置新作业”时可直接上传照片，系统将自动大图呈现并支持自由缩放！</span>
                      </div>
                    )}
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
                        <th className="py-2.5 px-3 min-w-[150px]">提交状态 / 激励</th>
                        <th className="py-2.5 px-3 min-w-[130px]">
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
                          const isSubmitted = sub.status === 'submitted' || sub.status === 'late';

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

                              {/* 提交状态与可爱完成激励动画 */}
                              <td className="py-2.5 px-3">
                                {isSubmitted ? (
                                  <div className="flex items-center gap-2">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 text-emerald-800 shadow-2xs animate-in zoom-in-95 duration-150">
                                      <span className="text-xs animate-bounce">🎉</span>
                                      <span className="font-bold text-[11px]">恭喜完成任务！</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCelebratingStudent({
                                          student: stu,
                                          assignment: activeAssignment,
                                          submission: sub
                                        })
                                      }
                                      className="p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                                      title="点击为TA展示可爱庆祝动画与表扬喜报"
                                    >
                                      <Award className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <select
                                    value={sub.status}
                                    onChange={e => {
                                      const newStatus = e.target.value as SubmissionStatus;
                                      const updates: Partial<StudentSubmission> = { status: newStatus };
                                      if (newStatus === 'submitted' && !sub.submittedDate) {
                                        updates.submittedDate = new Date().toISOString().slice(0, 10);
                                      }
                                      onUpdateSubmission(activeAssignment.id, stu.id, updates);
                                    }}
                                    className="text-xs font-semibold rounded-lg px-2 py-1 cursor-pointer bg-rose-50 text-rose-800 border border-rose-200"
                                  >
                                    <option value="missing">❌ 未交</option>
                                    <option value="submitted">✅ 已交 (按时)</option>
                                    <option value="late">⏰ 补交/迟交</option>
                                    <option value="excused">⚪ 免交/请假</option>
                                  </select>
                                )}
                              </td>

                              {/* 提交日期 */}
                              <td className="py-2.5 px-3">
                                {isMissing ? (
                                  <span className="text-[11px] text-rose-400 italic">尚未提交</span>
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
        /* MODE 2: 按学生归纳缺交作业看板 (每人缺交框放大呈现：布置日期+内容+大照片缩放) */
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
                    大框呈现 · 原图支持放大缩小
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  智能标记每项作业是否已过截止期，未交框大字高亮显示布置日期、内容及照片原图
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
                  <span>生成全班缺交总通知 📋</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.map(stu => {
              const hwStats = calculateStudentHomework(stu.id, classAssignments);
              const hasMissing = hwStats.missingCount > 0;

              // 检查该学生缺交的作业中有多少项已逾期
              const overdueItems = hwStats.missingAssignments.filter(ma => checkIsOverdue(ma.dueDate).isOverdue);
              const hasOverdue = overdueItems.length > 0;

              return (
                <div
                  key={stu.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    hasOverdue
                      ? 'bg-rose-50/50 border-rose-300 shadow-xs'
                      : hasMissing
                      ? 'bg-white border-amber-200 shadow-2xs'
                      : 'bg-emerald-50/30 border-emerald-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-slate-900">{stu.name}</span>
                        <span className="text-xs text-slate-400 font-mono">No.{stu.no}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        完成率: <span className="font-semibold tabular-nums text-slate-800">{hwStats.completionRate}%</span>
                        {' · '}
                        已交: <span className="tabular-nums font-mono">{hwStats.submittedCount + hwStats.lateCount}</span>/{hwStats.totalAssigned}
                        {' · '}
                        得分: <span className="font-bold text-amber-900 tabular-nums">{hwStats.homeworkScore10}分</span>
                      </div>
                    </div>

                    {hasOverdue ? (
                      <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full shrink-0 border border-rose-200 shadow-2xs animate-pulse">
                        ⏰ 逾期未交 {overdueItems.length} 项
                      </span>
                    ) : hasMissing ? (
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full shrink-0">
                        缺交 {hwStats.missingCount} 项
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full shrink-0 flex items-center gap-1 border border-emerald-200">
                        <span>🎉 全员完成！</span>
                      </span>
                    )}
                  </div>

                  {/* 【放大框呈现】：Missing items breakdown with big box, assigned date, content & zoomable photos */}
                  {hasMissing ? (
                    <div className="space-y-3 mt-3 pt-3 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>缺交项目详细卡片（放大核对）：</span>
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
                          className="text-xs text-rose-700 hover:text-rose-900 font-bold underline cursor-pointer"
                        >
                          {copiedStudentId === stu.id ? '✅ 已复制催TA文案！' : '💬 一键催TA'}
                        </button>
                      </div>

                      {hwStats.missingAssignments.map(ma => {
                        const od = checkIsOverdue(ma.dueDate);
                        const targetAssignment = classAssignments.find(a => a.id === ma.assignmentId);
                        const imageAttachments = targetAssignment?.attachments?.filter(att => att.type === 'image') || [];

                        return (
                          <div
                            key={ma.assignmentId}
                            className={`p-3.5 rounded-2xl border-2 space-y-2.5 ${
                              od.isOverdue
                                ? 'bg-white/95 border-rose-300 shadow-xs'
                                : 'bg-white/95 border-amber-200 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                                  <span>《{ma.title}》</span>
                                  {od.isOverdue && (
                                    <span className="text-[10px] text-rose-700 font-bold bg-rose-100 border border-rose-200 px-1.5 py-0.2 rounded-md">
                                      超期 {od.daysLate} 天
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5 space-x-2">
                                  <span>📅 布置日期: <strong className="text-slate-800">{targetAssignment?.assignedDate || '近期'}</strong></span>
                                  <span>⏳ 截止时间: <strong className={od.isOverdue ? 'text-rose-600' : 'text-slate-800'}>{ma.dueDate}</strong></span>
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
                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shrink-0 cursor-pointer shadow-2xs"
                                title="标记该同学今天补交了此项作业"
                              >
                                今日补交 ✅
                              </button>
                            </div>

                            {/* 作业内容与要求 */}
                            {targetAssignment?.content && (
                              <div className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/50 text-xs text-slate-700 leading-relaxed">
                                <span className="font-bold text-amber-950">📝 作业内容：</span>
                                {targetAssignment.content}
                              </div>
                            )}

                            {/* 上传的照片与放大缩小工具 */}
                            {imageAttachments.length > 0 && (
                              <div className="space-y-2 pt-1 border-t border-slate-100">
                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                  <span className="flex items-center gap-1 text-blue-700">
                                    <Paperclip className="w-3 h-3" />
                                    <span>作业课件照片 ({imageAttachments.length})：</span>
                                  </span>
                                  <span className="text-[10px] text-slate-400">点击支持缩放</span>
                                </div>

                                <div className="space-y-2">
                                  {imageAttachments.map(att => {
                                    const scale = getScale(att.id);
                                    return (
                                      <div
                                        key={att.id}
                                        className="bg-slate-50 rounded-xl border border-slate-200 p-2 space-y-1.5"
                                      >
                                        <div className="flex items-center justify-between text-[11px]">
                                          <span className="font-medium text-slate-800 truncate max-w-[150px]">
                                            {att.name}
                                          </span>
                                          <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-lg border border-slate-200">
                                            <button
                                              type="button"
                                              onClick={e => zoomOut(att.id, e)}
                                              className="p-0.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                                              title="缩小"
                                            >
                                              <ZoomOut className="w-3 h-3" />
                                            </button>
                                            <span className="font-mono text-[9px] text-slate-500">
                                              {Math.round(scale * 100)}%
                                            </span>
                                            <button
                                              type="button"
                                              onClick={e => zoomIn(att.id, e)}
                                              className="p-0.5 text-slate-600 hover:text-slate-900 cursor-pointer"
                                              title="放大"
                                            >
                                              <ZoomIn className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setLightboxImage({ url: att.dataUrl, name: att.name })}
                                              className="p-0.5 text-blue-600 hover:text-blue-800 cursor-pointer ml-0.5"
                                              title="全屏大图"
                                            >
                                              <Maximize2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>

                                        <div className="w-full overflow-auto max-h-56 bg-slate-900/5 rounded-lg p-1 flex items-center justify-center">
                                          <img
                                            src={att.dataUrl}
                                            alt={att.name}
                                            style={{
                                              transform: `scale(${scale})`,
                                              transformOrigin: 'top center',
                                              transition: 'transform 0.15s ease-out'
                                            }}
                                            onClick={() => setLightboxImage({ url: att.dataUrl, name: att.name })}
                                            className="max-h-48 w-auto object-contain rounded cursor-zoom-in"
                                            title="点击放大全屏查看"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* 已全部交齐的可爱动画卡片展示 */
                    <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 via-amber-50/50 to-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
                      <div className="text-2xl animate-bounce">🎉 🌸 🐾</div>
                      <div className="font-black text-xs text-emerald-900">
                        太棒啦！恭喜你已完成全部作业任务！
                      </div>
                      <p className="text-[11px] text-emerald-800/80">
                        中文生词与课后练习均按时提交，学习积极性极高，林老师为你点赞！
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setCelebratingStudent({
                            student: stu,
                            assignment: activeAssignment || classAssignments[0]
                          })
                        }
                        className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-xl border border-emerald-300 transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>查看庆祝喜报 🏆</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 可爱完成激励弹窗：恭喜你已完成任务！ */}
      {celebratingStudent && (
        <div
          onClick={() => setCelebratingStudent(null)}
          className="fixed inset-0 bg-slate-900/70 z-[80] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150 font-sans"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-2 border-amber-300 relative overflow-hidden animate-in zoom-in-95 duration-200"
          >
            {/* Background confetti effect */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-rose-200/50 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={() => setCelebratingStudent(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Mascot & Balloons */}
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 p-1 mx-auto shadow-lg animate-bounce">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-3xl">
                  🎉
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 text-xl animate-pulse">⭐</span>
              <span className="absolute -top-1 -left-1 text-xl animate-pulse">🌸</span>
            </div>

            <h3 className="text-lg font-black text-slate-900">
              恭喜你已完成任务！太棒啦！
            </h3>
            <p className="text-xs text-amber-900 font-bold mt-1">
              🌟【{celebratingStudent.student.name}】同学 · 作业之星
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-slate-700 text-left space-y-1.5">
              <div>
                <strong className="text-slate-900">📚 对应作业：</strong>
                <span>《{celebratingStudent.assignment?.title || '日常中文作业'}》</span>
              </div>
              <div>
                <strong className="text-slate-900">📅 提交时间：</strong>
                <span className="font-mono text-emerald-700 font-bold">
                  {celebratingStudent.submission?.submittedDate || '已准时完成'}
                </span>
              </div>
              {celebratingStudent.submission?.score !== undefined && (
                <div>
                  <strong className="text-slate-900">💯 作业得分：</strong>
                  <span className="font-mono text-rose-600 font-bold">
                    {celebratingStudent.submission.score} 分
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-amber-200/60 text-slate-600 leading-relaxed">
                <strong className="text-amber-900">🌸 老师寄语：</strong>
                学习中文最宝贵的就是坚持！你今天按时完成了作业，书写工整、态度积极，林老师为你感到十分自豪！继续保持，冲刺期末优秀等第！💪🐾
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const text = buildPraiseMessageText(
                    celebratingStudent.student.name,
                    celebratingStudent.assignment?.title || '课堂作业',
                    currentClass.name
                  );
                  navigator.clipboard.writeText(text);
                  setCelebrateCopyToast(true);
                  setTimeout(() => setCelebrateCopyToast(false), 2000);
                }}
                className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 rounded-2xl shadow-sm shadow-amber-500/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
              >
                {celebrateCopyToast ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>已复制表扬喜报！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>一键复制表扬喜报发微信 📋</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 bg-black/85 z-[90] flex items-center justify-center p-4 cursor-pointer backdrop-blur-xs"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-4xl max-h-[92vh] bg-white rounded-3xl overflow-hidden p-3 shadow-2xl"
          >
            <div className="flex items-center justify-between p-2 border-b border-slate-100 mb-2">
              <span className="text-xs font-bold text-slate-800 truncate">
                📷 作业附件照片高清原图: {lightboxImage.name}
              </span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[80vh] flex items-center justify-center p-2 bg-slate-900/5 rounded-2xl">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-h-[75vh] w-auto object-contain mx-auto rounded-xl"
              />
            </div>
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
