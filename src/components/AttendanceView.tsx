/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  UserPlus,
  Calendar,
  Video,
  MapPin,
  Settings2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Save,
  ArrowRightLeft,
  Edit3,
  UserCheck,
  ArrowDownAZ,
  Plus,
  Minus,
  Trash2,
  Sparkles,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  Award,
  Layers,
  BookOpen,
  ClipboardPaste,
  Copy,
  ListOrdered,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { ClassRoom, Student, AttendanceStatus, SessionMode, SessionMilestone, SessionMilestoneType } from '../types';
import { calculateStudentAttendance } from '../utils/calculations';
import { CuteCalendarPicker, CuteDatePickerInput } from './CuteCalendarPicker';
import {
  parseWeekdaysFromSchedule,
  parseFlexibleDate,
  formatShortDate,
  getWeekdayName,
  autoGenerateSessionDates,
  WEEKDAY_NAMES_CN,
  getSessionMilestoneLabel,
  getScheduleCohort,
  getCohortDisplayName,
  getDefaultMilestonesForSessions,
  ScheduleCohortType
} from '../utils/scheduleHelper';
import { getSmartSessionsPerWeek, getWeekNumberForSession, buildWeekCycles, WeekCycle } from '../utils/cycleHelper';

interface AttendanceViewProps {
  currentClass: ClassRoom;
  students: Student[];
  onUpdateStudentAttendance: (studentId: string, day: number, status: AttendanceStatus, note?: string) => void;
  onBatchSetAttendance: (day: number, status: AttendanceStatus) => void;
  onSelectStudentModal: (student: Student) => void;
  onOpenBatchImport: () => void;
  onOpenAddStudent?: () => void;
  onOpenEditClass?: () => void;
  onOpenTransferStudent?: (student: Student) => void;
  onOpenEditStudent?: (student: Student) => void;
  onSwitchToRollCall?: () => void;
  onUpdateSessionConfig: (
    day: number,
    date: string,
    mode: SessionMode,
    milestone?: SessionMilestone | string,
    syncToCohort?: boolean
  ) => void;
  onBatchUpdateSessions?: (
    dates: Record<number, string>,
    modes: Record<number, SessionMode>,
    milestones?: Record<number, SessionMilestone | string>,
    syncToCohort?: boolean
  ) => void;
  onAddSession?: () => void;
  onDeleteSession?: () => void;
  onSaveData?: () => void;
  isJustSaved?: boolean;
  onSortClassStudentsAZ?: () => void;
  allClasses?: ClassRoom[];
  onSyncCohortSchedules?: (sourceClassId: string, cohort: ScheduleCohortType) => void;
  onUpdateTeachingProgress?: (
    classId: string,
    updates: {
      currentTeachingDay?: number;
      currentTeachingTopic?: string;
      sessionProgress?: Record<number, string>;
    }
  ) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  currentClass,
  students,
  onUpdateStudentAttendance,
  onBatchSetAttendance,
  onSelectStudentModal,
  onOpenBatchImport,
  onOpenAddStudent,
  onOpenEditClass,
  onOpenTransferStudent,
  onOpenEditStudent,
  onSwitchToRollCall,
  onUpdateSessionConfig,
  onBatchUpdateSessions,
  onAddSession,
  onDeleteSession,
  onSaveData,
  isJustSaved,
  onSortClassStudentsAZ,
  allClasses,
  onSyncCohortSchedules,
  onUpdateTeachingProgress
}) => {
  const [selectedDayForBatch, setSelectedDayForBatch] = useState<number>(1);
  const [filterWarningOnly, setFilterWarningOnly] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<{ studentId: string; day: number; note: string; studentName: string } | null>(null);

  // Cell Edit Confirmation State (浏览模式下防止误触，需明确选择状态并点击确定改动)
  const [confirmingCell, setConfirmingCell] = useState<{
    studentId: string;
    studentName: string;
    studentNo: number;
    day: number;
    dateStr: string;
    currentStatus: AttendanceStatus;
    selectedStatus: AttendanceStatus;
    note: string;
  } | null>(null);

  // Session date, modality & milestone editor state
  const [editingSession, setEditingSession] = useState<{
    day: number;
    date: string;
    mode: SessionMode;
    milestone: string;
    syncToCohort: boolean;
  } | null>(null);

  // Session deletion confirmation modal
  const [isConfirmDeleteSessionOpen, setIsConfirmDeleteSessionOpen] = useState(false);

  // Auto-schedule options inside editingSession modal
  const [selectedWeekdaysForEdit, setSelectedWeekdaysForEdit] = useState<number[]>([]);
  const [autoScheduleNotice, setAutoScheduleNotice] = useState<string | null>(null);

  // Cohort sync modal
  const [isCohortSyncModalOpen, setIsCohortSyncModalOpen] = useState(false);

  // Full schedule modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [tempDates, setTempDates] = useState<Record<number, string>>({});
  const [tempModes, setTempModes] = useState<Record<number, SessionMode>>({});
  const [tempMilestones, setTempMilestones] = useState<Record<number, string>>({});
  const [syncCohortInBatch, setSyncCohortInBatch] = useState<boolean>(true);
  const [batchStartDay, setBatchStartDay] = useState<number>(1);
  const [batchStartDate, setBatchStartDate] = useState<string>('');
  const [batchWeekdays, setBatchWeekdays] = useState<number[]>([]);
  const [batchScheduleNotice, setBatchScheduleNotice] = useState<string | null>(null);

  // 上课进度状态 (今天要教到哪一天 / 今日具体内容 / 复制粘贴弹窗 / 课时大纲弹窗)
  const currentTeachingDay = currentClass.currentTeachingDay || 1;
  const currentDayTopic = currentClass.currentTeachingTopic ?? (currentClass.sessionProgress?.[currentTeachingDay] || '');
  const [isProgressPasteModalOpen, setIsProgressPasteModalOpen] = useState(false);
  const [isSyllabusModalOpen, setIsSyllabusModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [selectedSourceClassId, setSelectedSourceClassId] = useState<string>('');
  const [manualPasteText, setManualPasteText] = useState<string>('');
  const [cachedCopiedProgress, setCachedCopiedProgress] = useState<{
    sourceClassName: string;
    currentTeachingDay: number;
    currentTeachingTopic: string;
    sessionProgress?: Record<number, string>;
  } | null>(null);

  // 检查缓存中是否有此前从其他班级复制的进度
  const handleOpenPasteModal = () => {
    try {
      const raw = localStorage.getItem('tea_clipboard_teaching_progress');
      if (raw) {
        setCachedCopiedProgress(JSON.parse(raw));
      }
    } catch (e) {
      setCachedCopiedProgress(null);
    }
    setPasteNotice(null);
    setManualPasteText('');
    setIsProgressPasteModalOpen(true);
  };

  // 1. 切换今天要教到哪一天
  const handleSelectTeachingDay = (day: number) => {
    const topic = currentClass.sessionProgress?.[day] || '';
    if (onUpdateTeachingProgress) {
      onUpdateTeachingProgress(currentClass.id, {
        currentTeachingDay: day,
        currentTeachingTopic: topic
      });
    }
  };

  const handleStepTeachingDay = (delta: number) => {
    const nextDay = Math.max(1, Math.min(totalSessions, currentTeachingDay + delta));
    handleSelectTeachingDay(nextDay);
  };

  // 2. 修改今天或某一课时的进度内容 (打字或修改即刻自动保存)
  const handleUpdateTopicText = (newTopic: string, day: number = currentTeachingDay) => {
    if (onUpdateTeachingProgress) {
      onUpdateTeachingProgress(currentClass.id, {
        currentTeachingDay: day === currentTeachingDay ? currentTeachingDay : undefined,
        currentTeachingTopic: day === currentTeachingDay ? newTopic : currentClass.currentTeachingTopic,
        sessionProgress: { [day]: newTopic }
      });
    }
  };

  // 3. 复制本班上课进度 (写入剪贴板与内部存储)
  const handleCopyTeachingProgress = async () => {
    const payload = {
      sourceClassName: currentClass.name,
      currentTeachingDay,
      currentTeachingTopic: currentDayTopic,
      sessionProgress: currentClass.sessionProgress || {}
    };
    try {
      localStorage.setItem('tea_clipboard_teaching_progress', JSON.stringify(payload));
      const clipboardText = `【${currentClass.name} 上课进度】\n今天要教到: 第 ${currentTeachingDay} 课 (${currentClass.sessionDates?.[currentTeachingDay] || ''})\n教学内容: ${currentDayTopic || '未填写'}`;
      await navigator.clipboard.writeText(clipboardText);
    } catch (err) {
      console.warn('Clipboard write fallback');
    }
    setCopyFeedback(`已复制【${currentClass.name}】上课进度（第 ${currentTeachingDay} 课）！可在任意班级点击“粘贴进本班”`);
    setTimeout(() => setCopyFeedback(null), 3500);
  };

  // 4. 应用已复制的进度或从其他班级复制进度
  const handleApplyProgressFromData = (data: {
    sourceClassName?: string;
    currentTeachingDay?: number;
    currentTeachingTopic?: string;
    sessionProgress?: Record<number, string>;
  }) => {
    if (onUpdateTeachingProgress) {
      onUpdateTeachingProgress(currentClass.id, {
        currentTeachingDay: data.currentTeachingDay,
        currentTeachingTopic: data.currentTeachingTopic,
        sessionProgress: data.sessionProgress
      });
    }
    setPasteNotice(`已成功将【${data.sourceClassName || '所选进度'}】粘贴进当前班级并自动保存！`);
    setTimeout(() => {
      setIsProgressPasteModalOpen(false);
      setPasteNotice(null);
    }, 1200);
  };

  // 5. 直接批量粘贴教学大纲文本 (如每行一课)
  const handleBatchParsePastedText = () => {
    if (!manualPasteText.trim()) return;
    const lines = manualPasteText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    if (lines.length === 1) {
      // 单行作为今日教学内容
      handleUpdateTopicText(lines[0], currentTeachingDay);
      setPasteNotice(`已将单行文字设置为第 ${currentTeachingDay} 课教学进度！`);
    } else {
      // 多行批量拆分到第 1 课至第 N 课
      const nextProgress: Record<number, string> = {};
      lines.slice(0, totalSessions).forEach((line, idx) => {
        // 清理类似 "第1课:" "1." 等前缀
        const cleaned = line.replace(/^(第\s*\d+\s*[课节天]|课时\s*\d+|\d+[\.、\s\-]+)/i, '').trim() || line;
        nextProgress[idx + 1] = cleaned;
      });
      if (onUpdateTeachingProgress) {
        onUpdateTeachingProgress(currentClass.id, {
          sessionProgress: nextProgress,
          currentTeachingTopic: nextProgress[currentTeachingDay] || currentDayTopic
        });
      }
      setPasteNotice(`已将 ${Object.keys(nextProgress).length} 节课时教学进度直接粘贴导入本班！`);
    }

    setTimeout(() => {
      setIsProgressPasteModalOpen(false);
      setPasteNotice(null);
    }, 1200);
  };

  const totalSessions = currentClass.totalSessions || 30;

  // Open single session modal with parsed weekdays & milestone
  const handleOpenEditSession = (day: number, dateStr: string, mode: SessionMode) => {
    const milestone = getSessionMilestoneLabel(currentClass.sessionMilestones?.[day]);
    setEditingSession({
      day,
      date: dateStr,
      mode,
      milestone,
      syncToCohort: true
    });
    setSelectedWeekdaysForEdit(parseWeekdaysFromSchedule(currentClass.schedule));
    setAutoScheduleNotice(null);
  };

  // Open batch schedule modal
  const handleOpenScheduleModal = () => {
    const existing = { ...(currentClass.sessionDates || {}) };
    setTempDates(existing);
    setTempModes({ ...(currentClass.sessionModes || {}) });

    const rawMilestones = currentClass.sessionMilestones || {};
    const flatMilestones: Record<number, string> = {};
    for (const [k, v] of Object.entries(rawMilestones)) {
      flatMilestones[Number(k)] = getSessionMilestoneLabel(v);
    }
    setTempMilestones(flatMilestones);
    setSyncCohortInBatch(true);
    setBatchStartDay(1);
    setBatchStartDate(existing[1] || formatShortDate(new Date()));
    setBatchWeekdays(parseWeekdaysFromSchedule(currentClass.schedule));
    setBatchScheduleNotice(null);
    setIsScheduleModalOpen(true);
  };

  // 从当前编辑的课时开始，按班级上课星期规律自动顺延推算后续真实日期
  const handleAutoCascadeFromCurrent = () => {
    if (!editingSession || !editingSession.date.trim()) return;

    const weekdays = selectedWeekdaysForEdit.length > 0
      ? selectedWeekdaysForEdit
      : parseWeekdaysFromSchedule(currentClass.schedule);

    const generated = autoGenerateSessionDates({
      fromDay: editingSession.day,
      startDateStr: editingSession.date.trim(),
      weekdays,
      totalSessions,
      existingDates: currentClass.sessionDates || {}
    });

    // 保存单课配置并顺延更新后续课时
    if (onBatchUpdateSessions) {
      onBatchUpdateSessions(
        generated,
        currentClass.sessionModes || {},
        currentClass.sessionMilestones || {},
        editingSession.syncToCohort
      );
    } else {
      for (let d = editingSession.day; d <= totalSessions; d++) {
        if (generated[d]) {
          onUpdateSessionConfig(
            d,
            generated[d],
            currentClass.sessionModes?.[d] || 'offline',
            d === editingSession.day ? editingSession.milestone : (currentClass.sessionMilestones?.[d] || ''),
            editingSession.syncToCohort
          );
        }
      }
    }

    const weekdayStr = weekdays.map(w => WEEKDAY_NAMES_CN[w]).join('/');
    const syncHint = editingSession.syncToCohort && siblingClasses.length > 0 ? `（已同步至${siblingClasses.length}个同周期班级）` : '';
    setAutoScheduleNotice(`已从第 ${editingSession.day} 课 (${editingSession.date}) 按【${weekdayStr}】自动顺延生成至第 ${totalSessions} 课真实日期！${syncHint}`);
    setTimeout(() => setAutoScheduleNotice(null), 4000);
  };

  // 在排期与形式弹窗中一键推算排期
  const handleAutoScheduleBatch = () => {
    if (!batchStartDate.trim()) return;
    const weekdays = batchWeekdays.length > 0 ? batchWeekdays : [1, 3];

    const generated = autoGenerateSessionDates({
      fromDay: batchStartDay,
      startDateStr: batchStartDate.trim(),
      weekdays,
      totalSessions,
      existingDates: tempDates
    });

    setTempDates(generated);
    const weekdayStr = weekdays.map(w => WEEKDAY_NAMES_CN[w]).join('/');
    setBatchScheduleNotice(`已从第 ${batchStartDay} 课 (${batchStartDate}) 按【${weekdayStr}】智能生成全周期排期！遇假期可直接在下方列表中单课修改。`);
    setTimeout(() => setBatchScheduleNotice(null), 4500);
  };

  const handleSaveBatchSchedule = () => {
    if (onBatchUpdateSessions) {
      onBatchUpdateSessions(tempDates, tempModes, tempMilestones, syncCohortInBatch);
    } else {
      // Fallback: update individually
      for (let day = 1; day <= totalSessions; day++) {
        const d = tempDates[day] ?? currentClass.sessionDates?.[day] ?? '';
        const m = tempModes[day] ?? currentClass.sessionModes?.[day] ?? 'offline';
        const ms = tempMilestones[day] ?? currentClass.sessionMilestones?.[day] ?? '';
        onUpdateSessionConfig(day, d, m, ms, syncCohortInBatch);
      }
    }
    setIsScheduleModalOpen(false);
  };

  // 状态循环逻辑: '' -> '1' -> 'L' -> 'P' -> 'A' -> '-' -> ''
  const handleCellClick = (studentId: string, day: number, currentVal: AttendanceStatus) => {
    let nextVal: AttendanceStatus = '1';
    if (currentVal === '1') nextVal = 'L';
    else if (currentVal === 'L') nextVal = 'P';
    else if (currentVal === 'P') nextVal = 'A';
    else if (currentVal === 'A') nextVal = '-';
    else if (currentVal === '-') nextVal = '';
    else nextVal = '1';

    onUpdateStudentAttendance(studentId, day, nextVal);
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case '1':
        return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-50 text-emerald-700 text-xs font-semibold font-mono">1</span>;
      case 'L':
        return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-sky-50 text-sky-700 text-xs font-semibold font-mono">L</span>;
      case 'P':
        return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-amber-50 text-amber-700 text-xs font-semibold font-mono">P</span>;
      case 'A':
        return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-rose-50 text-rose-700 text-xs font-semibold font-mono">A</span>;
      case '-':
        return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-100 text-slate-400 text-xs font-mono">-</span>;
      default:
        return <span className="inline-block w-5 h-5 text-slate-200">·</span>;
    }
  };

  // 过滤展示
  const displayStudents = filterWarningOnly
    ? students.filter(s => {
        const stats = calculateStudentAttendance(s, totalSessions);
        return stats.attendanceRate < 80 || stats.absentCount >= 2;
      })
    : students;

  // Count online vs offline
  let onlineCount = 0;
  for (let d = 1; d <= totalSessions; d++) {
    if (currentClass.sessionModes?.[d] === 'online') {
      onlineCount++;
    }
  }

  // 同周期排期与周次周期计算 (周一~周三班 / 周四~周五班 / 周末班)
  const currentCohort = getScheduleCohort(currentClass.schedule, currentClass.name);
  const cohortDisplayName = getCohortDisplayName(currentCohort);
  const siblingClasses = (allClasses || []).filter(
    c => c.id !== currentClass.id && getScheduleCohort(c.schedule, c.name) === currentCohort && currentCohort !== 'other'
  );
  const sessionsPerWeek = getSmartSessionsPerWeek(currentClass.schedule, totalSessions);
  const weekCycles = buildWeekCycles(totalSessions, sessionsPerWeek, currentClass.sessionDates);

  return (
    <div className="space-y-3">
      {/* Action / Helper Bar (完全横向排布，防止文字折行下掉) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        {/* Row 1: 标题、改班入口与右侧操作按钮区 */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left: Class Title & Modality Info */}
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-900 whitespace-nowrap">
              {currentClass.name} 全周期考勤浏览台账
            </h2>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-normal whitespace-nowrap">
              （浏览核对模式 · 单击格子确定改动）
            </span>
            {onOpenEditClass && (
              <button
                onClick={onOpenEditClass}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer transition-colors border border-blue-200 whitespace-nowrap"
                title="修改当前班级归属学期、班级名称、排期课时与追加学生"
              >
                <Settings2 className="w-3 h-3 text-blue-600" />
                <span>改班/修改归属学期</span>
              </button>
            )}
          </div>

          {/* Right: Operational Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {onSwitchToRollCall && (
              <button
                onClick={onSwitchToRollCall}
                className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                title="进入今日快速点名界面"
              >
                <UserCheck className="w-3.5 h-3.5 text-white" />
                <span>去今日课堂点名</span>
              </button>
            )}

            {/* Quick schedule manager button */}
            <button
              onClick={handleOpenScheduleModal}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="统一设定所有课时日期、线上线下形式与重要考试节点"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>排期与大考设置</span>
            </button>

            {/* 同周期排期与大考同步管理按钮 */}
            {allClasses && allClasses.length > 1 && (
              <button
                type="button"
                onClick={() => setIsCohortSyncModalOpen(true)}
                className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-md transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
                title="周一至周三课或周四至周五课日期同步管理"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                <span>同周期排期同步</span>
                {siblingClasses.length > 0 && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 rounded-full font-mono font-bold">
                    {siblingClasses.length}
                  </span>
                )}
              </button>
            )}

            {onSortClassStudentsAZ && (
              <button
                type="button"
                onClick={onSortClassStudentsAZ}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="按学生姓名 A-Z 拼音/字母升序重新排列全班学生并顺延重编学号"
              >
                <ArrowDownAZ className="w-3.5 h-3.5 text-blue-600" />
                <span>名册 A-Z 排序</span>
              </button>
            )}

            {/* 手动添加或删除课时按钮 */}
            {onAddSession && (
              <button
                type="button"
                onClick={onAddSession}
                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                title="多上了课时？点击增加 1 节课时，原有考勤与成绩规则不受影响"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ 加1课</span>
              </button>
            )}

            {onDeleteSession && totalSessions > 1 && (
              <button
                type="button"
                onClick={() => setIsConfirmDeleteSessionOpen(true)}
                className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title="少上了课时？点击删除末尾多余课时"
              >
                <Minus className="w-3.5 h-3.5 text-rose-600" />
                <span>- 减1课</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md p-0.5 text-xs whitespace-nowrap">
              <span className="text-slate-400 pl-1.5 pr-0.5">第</span>
              <select
                value={selectedDayForBatch}
                onChange={e => setSelectedDayForBatch(Number(e.target.value))}
                className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>
                    {day}课 ({currentClass.sessionDates?.[day] || '待定'} · {currentClass.sessionModes?.[day] === 'online' ? '线上' : '线下'})
                  </option>
                ))}
              </select>
              <button
                onClick={() => onBatchSetAttendance(selectedDayForBatch, '1')}
                className="px-2 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                title="将选定课时所有学生快速设为正常出勤"
              >
                全勤
              </button>
              <button
                onClick={() => onBatchSetAttendance(selectedDayForBatch, '-')}
                className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors cursor-pointer"
                title="将选定课时设为全班停课/免修"
              >
                停课
              </button>
            </div>

            <button
              onClick={() => setFilterWarningOnly(!filterWarningOnly)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                filterWarningOnly
                  ? 'bg-rose-50 text-rose-700 border-rose-200 font-semibold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {filterWarningOnly ? '显示全班' : '仅看预警'}
            </button>

            {onOpenAddStudent && (
              <button
                onClick={onOpenAddStudent}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                title="随时录入新学生或插班生（支持单人或批量）"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ 录入插班生</span>
              </button>
            )}

            <button
              onClick={onOpenBatchImport}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="批量粘贴姓名导入名单"
            >
              <span>批量导入</span>
            </button>

            {/* 自动实时保存指示 */}
            <span
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded font-medium"
              title="实时自动保存已启用，所有修改即时入库"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>自动保存中</span>
            </span>
          </div>
        </div>

        {/* 今日上课进度追踪看板 (满足：今天要教到哪一天，每班可同可异，支持复制粘贴) */}
        {(() => {
          const currentTeachingDate = currentClass.sessionDates?.[currentTeachingDay] || '';
          const currentTeachingWeekday = currentTeachingDate ? getWeekdayName(currentTeachingDate) : '';
          const currentTeachingMode = currentClass.sessionModes?.[currentTeachingDay] === 'online' ? '线上网课' : '线下实体';
          const currentTeachingMilestone = getSessionMilestoneLabel(currentClass.sessionMilestones?.[currentTeachingDay]);

          return (
            <div className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-amber-50/80 border border-blue-200/90 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                {/* Left: 今天教到哪一天 / 第几课 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/95 border border-blue-200 rounded-lg shadow-2xs">
                    <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900 text-xs whitespace-nowrap">上课进度:</span>
                    <span className="text-slate-600 text-xs whitespace-nowrap">今天要教到</span>
                  </div>

                  {/* 课时步进与下拉快速切换 */}
                  <div className="flex items-center gap-0.5 bg-white border border-blue-300 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      disabled={currentTeachingDay <= 1}
                      onClick={() => handleStepTeachingDay(-1)}
                      className="p-1 text-slate-500 hover:text-blue-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed rounded"
                      title="切换至前一课"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <select
                      value={currentTeachingDay}
                      onChange={e => handleSelectTeachingDay(Number(e.target.value))}
                      className="text-xs font-black font-mono text-blue-900 bg-transparent px-1.5 py-0.5 focus:outline-none cursor-pointer"
                    >
                      {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => {
                        const dateStr = currentClass.sessionDates?.[day] || '';
                        const weekday = dateStr ? getWeekdayName(dateStr) : '';
                        const mode = currentClass.sessionModes?.[day] === 'online' ? '线上' : '线下';
                        const milestone = getSessionMilestoneLabel(currentClass.sessionMilestones?.[day]);
                        return (
                          <option key={day} value={day}>
                            第 {day} 课 {dateStr ? `(${dateStr} ${weekday} · ${mode})` : ''} {milestone ? `🔴${milestone}` : ''}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      type="button"
                      disabled={currentTeachingDay >= totalSessions}
                      onClick={() => handleStepTeachingDay(1)}
                      className="p-1 text-slate-500 hover:text-blue-700 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed rounded"
                      title="切换至下一课"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 对应排期日期与形式胶囊 */}
                  {currentTeachingDate ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-slate-800 bg-white/90 border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs">
                      <span>📅 {currentTeachingDate}</span>
                      <span className="text-blue-600">{currentTeachingWeekday}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600 font-sans">{currentTeachingMode}</span>
                      {currentTeachingMilestone && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded bg-rose-600 text-white font-sans font-black shadow-2xs">
                          🔴 {currentTeachingMilestone}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 bg-white/60 px-2 py-0.5 rounded border border-slate-200">
                      待定公历日期
                    </span>
                  )}

                  {/* 复制成功浮动提示 */}
                  {copyFeedback && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{copyFeedback}</span>
                    </span>
                  )}
                </div>

                {/* Right: 复制与粘贴按钮 */}
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {/* 复制本班进度 */}
                  <button
                    type="button"
                    onClick={handleCopyTeachingProgress}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-98"
                    title="复制当前班级的上课进度与课时内容，可一键粘贴到其他班级"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-600" />
                    <span>复制进度</span>
                  </button>

                  {/* 粘贴进度进本班 */}
                  <button
                    type="button"
                    onClick={handleOpenPasteModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-900 bg-blue-100/90 hover:bg-blue-200 border border-blue-300 rounded-lg shadow-2xs transition-all cursor-pointer active:scale-98"
                    title="每班可能一样也可能不一样，点击可从其他班一键复制或直接粘贴进本班"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-blue-700" />
                    <span>粘贴进度进本班</span>
                  </button>

                  {/* 全周期课时大纲 */}
                  <button
                    type="button"
                    onClick={() => setIsSyllabusModalOpen(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    title="查看或批量编辑全学期 1~30 课的教学教案大纲"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
                    <span>课时总大纲</span>
                  </button>
                </div>
              </div>

              {/* Row 2: 今日具体授课内容内联编辑框 (打字即存，无需点击保存) */}
              <div className="flex items-center gap-2 pt-1 border-t border-blue-200/60">
                <span className="text-[11px] font-bold text-slate-700 shrink-0 flex items-center gap-1 whitespace-nowrap">
                  <span>📖 今日授课内容:</span>
                </span>
                <input
                  type="text"
                  value={currentDayTopic}
                  onChange={e => handleUpdateTopicText(e.target.value)}
                  placeholder={`输入第 ${currentTeachingDay} 课要教的课文、生词或作业讲评（打字自动实时保存）...`}
                  className="flex-1 text-xs py-1.5 px-2.5 bg-white border border-blue-300/80 rounded-lg text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-all"
                />
              </div>
            </div>
          );
        })()}

        {/* 同周期班级排期联动提醒条 */}
        {siblingClasses.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-950">
              <span className="font-bold flex items-center gap-1 text-amber-900 shrink-0">
                <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                <span>【{cohortDisplayName}】排期已联动：</span>
              </span>
              <span className="text-amber-800 text-[11px]">
                开课公历日期与大考节点完全同步（仅具体上课时间段不同）。联动同伴：{siblingClasses.map(c => `【${c.name}】(${c.schedule})`).join('、')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCohortSyncModalOpen(true)}
              className="text-[11px] font-bold text-amber-900 hover:text-amber-950 underline cursor-pointer shrink-0"
            >
              一键全量同步
            </button>
          </div>
        )}

        {/* Row 2: 纯横向排期详情与考勤图例条 (Horizontal Schedule & Legend Ribbon) */}
        <div className="bg-slate-50/90 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between gap-3 text-xs overflow-x-auto custom-scrollbar">
          {/* 左侧：横向排期与课时形式明细 */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0 text-slate-700">
            <span className="font-semibold text-slate-900">
              {currentClass.schedule}
            </span>
            <span className="text-slate-300">·</span>
            <span>教室: <strong className="text-slate-800">{currentClass.room || '待定'}</strong></span>
            <span className="text-slate-300">·</span>
            <span>共 <strong className="text-blue-700">{totalSessions}</strong> 课时</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
              <span>线下 <strong>{totalSessions - onlineCount}</strong> 节</span>
              <span className="text-slate-300">/</span>
              <span className="text-blue-600 font-semibold">线上网课 <strong>{onlineCount}</strong> 节</span>
            </span>
          </div>

          {/* 右侧：横向图例与操作提示 */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="inline-flex items-center gap-1 bg-white border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium text-emerald-800 shadow-2xs">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
              <span>出勤</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 bg-white border border-sky-200 px-2 py-0.5 rounded text-[11px] font-medium text-sky-800 shadow-2xs">
              <span className="w-3.5 h-3.5 rounded bg-sky-600 text-white font-bold text-[10px] flex items-center justify-center">L</span>
              <span>迟到(3次-0.5)</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 bg-white border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium text-amber-800 shadow-2xs">
              <span className="w-3.5 h-3.5 rounded bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">P</span>
              <span>请假(-0.25)</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 bg-white border border-rose-200 px-2 py-0.5 rounded text-[11px] font-medium text-rose-800 shadow-2xs">
              <span className="w-3.5 h-3.5 rounded bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center">A</span>
              <span>旷课(-0.5)</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700 shadow-2xs">
              <span className="w-3.5 h-3.5 rounded bg-slate-400 text-white font-bold text-[10px] flex items-center justify-center">-</span>
              <span>停课/换班(不扣)</span>
            </span>
            <span className="text-slate-400 text-[11px] pl-1 font-normal">
              （单击表格任意格子开启修改确认窗口，点表头编辑排期）
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar max-h-[640px]">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-20 border-b border-slate-200 shadow-2xs">
              {/* Row 1: 【上面分清楚周期】：周次周期分组栏 */}
              <tr className="bg-amber-50/70 border-b border-amber-200/80">
                <th
                  rowSpan={2}
                  className="py-2.5 px-3 border-r border-slate-200 w-12 text-center sticky left-0 bg-slate-50 z-30 text-slate-600 font-bold"
                >
                  学号
                </th>
                <th
                  rowSpan={2}
                  className="py-2.5 px-4 border-r border-slate-200 min-w-[130px] sticky left-12 bg-slate-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-slate-800 font-bold"
                >
                  学生姓名
                </th>

                {/* 教学周周期合并分组表头 */}
                {weekCycles.map((cycle) => {
                  const isEven = cycle.weekNumber % 2 === 0;
                  return (
                    <th
                      key={cycle.weekNumber}
                      colSpan={cycle.sessionDays.length}
                      className={`py-1.5 px-1 text-center border-r-2 border-slate-300 font-bold text-xs select-none ${
                        isEven
                          ? 'bg-amber-100/80 text-amber-950'
                          : 'bg-orange-100/80 text-orange-950'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5 py-0.5">
                        <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shadow-2xs ${
                          isEven ? 'bg-amber-400 text-amber-950' : 'bg-orange-400 text-orange-950'
                        }`}>
                          {cycle.weekNumber}
                        </span>
                        <span className="font-bold tracking-tight">第 {cycle.weekNumber} 周</span>
                        {cycle.dateRangeText && (
                          <span className="text-[10px] font-mono font-medium opacity-75">
                            ({cycle.dateRangeText})
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}

                {/* 加课表头快捷按钮 */}
                {onAddSession && (
                  <th
                    rowSpan={2}
                    onClick={onAddSession}
                    className="py-1 px-1.5 border-r border-slate-200 text-center min-w-[36px] bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer select-none group"
                    title="点击增加 1 节课时（多上课时可灵活追加）"
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-bold text-emerald-700">加课</span>
                    </div>
                  </th>
                )}

                {/* 统计指标列 (rowSpan=2) */}
                <th rowSpan={2} className="py-2 px-2.5 border-r border-slate-100 text-center text-slate-700 font-medium">出勤</th>
                <th rowSpan={2} className="py-2 px-2.5 border-r border-slate-100 text-center text-slate-700 font-medium">迟到</th>
                <th rowSpan={2} className="py-2 px-2.5 border-r border-slate-100 text-center text-slate-700 font-medium">请假</th>
                <th rowSpan={2} className="py-2 px-2.5 border-r border-slate-200 text-center text-slate-700 font-medium">旷课</th>
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-200 text-center font-bold bg-slate-100/80 text-slate-900">出勤率</th>
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-200 text-center text-slate-700 bg-slate-100/50">考勤分</th>
                <th rowSpan={2} className="py-2 px-3 text-center text-slate-500 font-normal">备注理由</th>
              </tr>

              {/* Row 2: 课时序号、放大日期、星期、形式及【红色重要日子标注在下面】 */}
              <tr className="bg-slate-50">
                {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => {
                  const dateStr = currentClass.sessionDates?.[day] || '';
                  const mode = currentClass.sessionModes?.[day] || 'offline';
                  const isOnline = mode === 'online';
                  const parsedDate = parseFlexibleDate(dateStr);
                  const weekdayLabel = parsedDate ? getWeekdayName(parsedDate) : '';
                  const weekNum = getWeekNumberForSession(day, sessionsPerWeek);
                  const isEndOfWeek = weekCycles.some(c => c.endDay === day);
                  const milestone = currentClass.sessionMilestones?.[day];
                  const milestoneLabel = getSessionMilestoneLabel(milestone);

                  return (
                    <th
                      key={day}
                      onClick={() => handleOpenEditSession(day, dateStr, mode)}
                      className={`py-1.5 px-1 text-center min-w-[62px] sm:min-w-[68px] transition-colors cursor-pointer select-none group relative ${
                        isEndOfWeek ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'
                      } ${
                        isOnline
                          ? 'bg-sky-50/70 hover:bg-sky-100/80'
                          : milestoneLabel
                          ? 'bg-rose-50/50 hover:bg-rose-50/90'
                          : 'hover:bg-slate-100/80'
                      }`}
                      title={`第${day}课 (第${weekNum}周) · ${dateStr ? `${dateStr} (${weekdayLabel || '点击编辑'})` : '点击输入日期'}${milestoneLabel ? ` · 重要节点: ${milestoneLabel}` : ''} · ${isOnline ? '线上上课' : '线下上课'} (点击可编辑日期、形式及大考节点)`}
                    >
                      {/* 课时序号 */}
                      <div className="text-[10px] font-bold text-slate-400 font-mono leading-none">
                        第{day}课
                      </div>

                      {/* 【表格日期放大一点】：明显加粗清晰展示 */}
                      <div className="text-xs sm:text-[13px] font-black font-mono text-slate-900 tracking-tight my-0.5 leading-tight">
                        {dateStr || '-'}
                      </div>

                      {/* 星期标签 */}
                      <div className="text-[10px] text-blue-600 font-bold leading-none">
                        {weekdayLabel || '待定'}
                      </div>

                      {/* 上课形式标签 */}
                      <div className="mt-0.5 flex justify-center">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded font-semibold bg-blue-100 text-blue-700 scale-90 origin-center">
                            线上
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded font-semibold bg-slate-100 text-slate-500 scale-90 origin-center">
                            线下
                          </span>
                        )}
                      </div>

                      {/* 【重要的日子表红色在下面】：醒目红色标记 */}
                      {milestoneLabel ? (
                        <div className="mt-1 flex justify-center">
                          <span
                            className="inline-flex items-center gap-0.5 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-black bg-rose-600 text-white shadow-2xs ring-1 ring-rose-400 animate-pulse whitespace-nowrap"
                            title={`重要教学节点：${milestoneLabel}`}
                          >
                            <span>🔴</span>
                            <span>{milestoneLabel}</span>
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] text-rose-500 bg-rose-50 border border-dashed border-rose-200 px-1 rounded hover:bg-rose-100">
                            +大考
                          </span>
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayStudents.length === 0 ? (
                <tr>
                  <td colSpan={totalSessions + (onAddSession ? 10 : 9)} className="py-12 text-center text-slate-400">
                    当前班级暂无学生或无符合预警条件的学生
                  </td>
                </tr>
              ) : (
                displayStudents.map((stu) => {
                  const stats = calculateStudentAttendance(stu, totalSessions);
                  const hasNotes = Object.keys(stu.attendanceNotes || {}).length > 0;
                  const isWarning = stats.attendanceRate < 80 || stats.absentCount >= 2;

                  return (
                    <tr
                      key={stu.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* 学号 */}
                      <td className="py-1.5 px-3 text-center font-mono tabular-nums text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                        {stu.no}
                      </td>

                      {/* 姓名 */}
                      <td className="py-1.5 px-3 sticky left-12 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100 min-w-[130px]">
                        <div className="flex items-center justify-between gap-1 group/stu">
                          <button
                            onClick={() => onSelectStudentModal(stu)}
                            className="font-medium text-slate-800 hover:text-blue-600 transition-colors text-left flex items-center gap-1.5 cursor-pointer truncate"
                            title="点击查看该学生详细档案"
                          >
                            <span className="truncate">{stu.name}</span>
                            {isWarning && (
                              <span className="text-[10px] text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-100 font-semibold shrink-0">
                                预警
                              </span>
                            )}
                          </button>
                          <div className="opacity-0 group-hover/stu:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                            {onOpenEditStudent && (
                              <button
                                onClick={(e) => {
                                   e.stopPropagation();
                                   onOpenEditStudent(stu);
                                }}
                                className="p-0.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                                title="修改学生姓名/学号"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                            {onOpenTransferStudent && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenTransferStudent(stu);
                                }}
                                className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                title="换班/转班 (早班改晚班，保留全部历史分数)"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 课时考勤格子 */}
                      {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => {
                        const val = stu.attendance[day] || '';
                        const note = stu.attendanceNotes?.[day];
                        const isEndOfWeek = weekCycles.some(c => c.endDay === day);
                        const milestone = currentClass.sessionMilestones?.[day];
                        const milestoneLabel = getSessionMilestoneLabel(milestone);

                        return (
                          <td
                            key={day}
                            onClick={() => {
                              setConfirmingCell({
                                studentId: stu.id,
                                studentName: stu.name,
                                studentNo: stu.no,
                                day,
                                dateStr: currentClass.sessionDates?.[day] || `第${day}课`,
                                currentStatus: val,
                                selectedStatus: val || '1',
                                note: note || ''
                              });
                            }}
                            className={`py-1 px-0.5 text-center cursor-pointer hover:bg-blue-50/70 transition-colors relative group select-none ${
                              isEndOfWeek ? 'border-r-2 border-slate-300' : 'border-r border-slate-100'
                            } ${milestoneLabel ? 'bg-rose-50/20' : ''}`}
                            title={`单击修改考勤：第${day}课 (${currentClass.sessionDates?.[day] || '待定'})${milestoneLabel ? ` [${milestoneLabel}]` : ''} · 当前: ${val || '未记录'}${note ? ` (${note})` : ''}`}
                          >
                            <div className="relative inline-flex items-center justify-center">
                              {getStatusBadge(val)}
                              {note && (
                                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* 加课列占位格 */}
                      {onAddSession && (
                        <td className="border-r border-slate-100 bg-slate-50/20 text-center text-slate-300 text-[10px] select-none">
                          -
                        </td>
                      )}

                      {/* 统计指标 */}
                      <td className="py-1.5 px-2.5 text-center font-mono tabular-nums text-slate-800 border-r border-slate-100">
                        {stats.presentCount}
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-mono tabular-nums text-slate-600 border-r border-slate-100">
                        {stats.lateCount}
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-mono tabular-nums text-slate-600 border-r border-slate-100">
                        {stats.leaveCount}
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-mono tabular-nums text-slate-700 font-medium border-r border-slate-200">
                        {stats.absentCount}
                      </td>

                      {/* 出勤率 */}
                      <td className="py-1.5 px-3 text-center font-mono tabular-nums font-semibold bg-slate-50 border-r border-slate-200">
                        <span
                          className={`${
                            stats.attendanceRate >= 90
                              ? 'text-slate-800'
                              : stats.attendanceRate >= 80
                              ? 'text-slate-700'
                              : 'text-rose-600 font-bold'
                          }`}
                        >
                          {stats.attendanceRate}%
                        </span>
                      </td>

                      {/* 考勤得分 */}
                      <td className="py-1.5 px-3 text-center font-mono tabular-nums text-slate-600 bg-slate-50/50 border-r border-slate-200">
                        {stats.attendanceScore}分
                      </td>

                      {/* 异常理由/备注快捷查看 */}
                      <td className="py-1.5 px-3 text-center">
                        {hasNotes ? (
                          <button
                            onClick={() => onSelectStudentModal(stu)}
                            className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            {Object.keys(stu.attendanceNotes).length}条理由
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Leave Note Editing Modal */}
      {editingNote && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              记录请假理由 / 考勤说明
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              学生：<span className="font-semibold text-slate-800">{editingNote.studentName}</span> · 第 {editingNote.day} 课 ({currentClass.sessionDates?.[editingNote.day] || '未知日期'})
            </p>
            <textarea
              rows={3}
              value={editingNote.note}
              onChange={e => setEditingNote({ ...editingNote, note: e.target.value })}
              placeholder="例如：事假（家中有事回乡探亲）、病假（感冒发烧就医）、迟到（交通拥堵）..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setEditingNote(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const currentStatus = students.find(s => s.id === editingNote.studentId)?.attendance[editingNote.day] || 'P';
                  onUpdateStudentAttendance(editingNote.studentId, editingNote.day, currentStatus, editingNote.note);
                  setEditingNote(null);
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
              >
                保存说明
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Session Date & Modality Edit Modal */}
      {editingSession && (() => {
        const parsedDate = parseFlexibleDate(editingSession.date);
        const weekdayName = parsedDate ? getWeekdayName(parsedDate) : '';

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    修改第 {editingSession.day} 课时排期
                  </h3>
                  <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">
                    总 {totalSessions} 课时
                  </span>
                </div>
                <button
                  onClick={() => setEditingSession(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-3 space-y-3 text-xs overflow-y-auto custom-scrollbar pr-1">
                {/* Date Input with Interactive Calendar Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-slate-800">
                      公历上课日期 (日历手动填表，点选不易出错)
                    </label>
                    {parsedDate && (
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {parsedDate.getFullYear()}年{parsedDate.getMonth() + 1}月{parsedDate.getDate()}日 ({weekdayName})
                      </span>
                    )}
                  </div>

                  {/* Interactive Calendar Card */}
                  <div className="flex justify-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <CuteCalendarPicker
                      value={editingSession.date}
                      onChange={(newDate) => {
                        setEditingSession({ ...editingSession, date: newDate });
                      }}
                      showFormatToggle
                      className="w-full shadow-none border-0 p-1 bg-transparent"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[11px] text-slate-500 shrink-0">已选排期:</span>
                    <input
                      type="text"
                      value={editingSession.date}
                      onChange={e => setEditingSession({ ...editingSession, date: e.target.value })}
                      placeholder="如: 11/04 或 2026-11-04"
                      className="w-full text-xs p-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold text-blue-900 bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    在上方日历中直接点击日期即可填表，支持跨月切换、快速“今天”与“清空”，彻底避免打字出错。
                  </p>
                </div>

                {/* 智能排期与后续自动顺延卡片 */}
                <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>根据班级时间自动排满真实日期</span>
                    </div>
                    <span className="text-[10px] text-blue-700 font-medium bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[170px]" title={currentClass.schedule}>
                      {currentClass.schedule || '未设时间'}
                    </span>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500 mb-1 flex items-center justify-between">
                      <span>排课星期规律：</span>
                      <span className="text-[10px] text-slate-400">已自动从班级识别</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {WEEKDAY_NAMES_CN.map((name, idx) => {
                        const isSelected = selectedWeekdaysForEdit.includes(idx);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedWeekdaysForEdit(prev =>
                                prev.includes(idx) ? prev.filter(w => w !== idx) : [...prev, idx].sort((a, b) => a - b)
                              );
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick presets */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-400">快捷切换:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedWeekdaysForEdit([1, 3])}
                        className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer ${
                          selectedWeekdaysForEdit.length === 2 && selectedWeekdaysForEdit.includes(1) && selectedWeekdaysForEdit.includes(3)
                            ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        周一/周三 (30课)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedWeekdaysForEdit([4, 5])}
                        className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer ${
                          selectedWeekdaysForEdit.length === 2 && selectedWeekdaysForEdit.includes(4) && selectedWeekdaysForEdit.includes(5)
                            ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        周四/周五 (20课)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedWeekdaysForEdit([2, 4])}
                        className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer ${
                          selectedWeekdaysForEdit.length === 2 && selectedWeekdaysForEdit.includes(2) && selectedWeekdaysForEdit.includes(4)
                            ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        周二/周四
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAutoCascadeFromCurrent}
                    disabled={!editingSession.date.trim()}
                    className="w-full mt-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    title="从当前课时输入的日期开始，按选定的上课星期规律自动顺延推算填充后续所有课时真实日期"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>从第 {editingSession.day} 课自动顺延生成至第 {totalSessions} 课</span>
                  </button>

                  <p className="text-[10px] text-slate-500 leading-tight">
                    例如第1课填写 11/7，系统将如实按周四/周五或周一/周三生成公历真实日期。若遇假期，后续可在表格中直接单课手动修改。
                  </p>

                  {autoScheduleNotice && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-1.5 flex items-center gap-1 font-medium animate-in fade-in">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{autoScheduleNotice}</span>
                    </div>
                  )}
                </div>

                {/* Modality Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    上课形式标记
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingSession({ ...editingSession, mode: 'offline' })}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        editingSession.mode === 'offline'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>线下实体课</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditingSession({ ...editingSession, mode: 'online' })}
                      className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        editingSession.mode === 'online'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>线上网课</span>
                    </button>
                  </div>
                </div>

                {/* 重要大考/重要节点标记 (表红色在下面) */}
                <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>重要大考/里程碑标记（考勤表日期下方红字显现）</span>
                    </label>
                    {editingSession.milestone && (
                      <button
                        type="button"
                        onClick={() => setEditingSession({ ...editingSession, milestone: '' })}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        清除标记
                      </button>
                    )}
                  </div>

                  {/* 快捷大考标签 */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '普通授课 (无考试)', val: '' },
                      { label: '🔴 小测', val: '小测' },
                      { label: '🔴 小测一', val: '小测一' },
                      { label: '🔴 小测二', val: '小测二' },
                      { label: '🔴 期中考试', val: '期中考试' },
                      { label: '🔴 口语考试', val: '口语考试' },
                      { label: '🔴 期末考试', val: '期末考试' }
                    ].map(item => {
                      const isSelected = (editingSession.milestone || '') === item.val;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setEditingSession({ ...editingSession, milestone: item.val })}
                          className={`px-2 py-1 rounded-md text-xs font-semibold border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs scale-102 ring-2 ring-rose-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* 自定义输入 */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500 shrink-0">自定义大考名:</span>
                    <input
                      type="text"
                      value={editingSession.milestone || ''}
                      onChange={e => setEditingSession({ ...editingSession, milestone: e.target.value })}
                      placeholder="如：阶段模考、听力测评等"
                      className="w-full text-xs p-1.5 bg-white border border-rose-200 rounded-lg text-rose-900 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>
                </div>

                {/* 同周期同步选项 */}
                {siblingClasses.length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingSession.syncToCohort}
                        onChange={e => setEditingSession({ ...editingSession, syncToCohort: e.target.checked })}
                        className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-amber-900">
                          同步给同【{cohortDisplayName}】的 {siblingClasses.length} 个班级
                        </span>
                        <p className="text-[10px] text-amber-700 mt-0.5">
                          周一至周三课（或周四至周五课）公历日期和大考完全同步，只是上课时段不同，勾选后无需重复录入。
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Step Previous / Next buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500">
                  <button
                    type="button"
                    disabled={editingSession.day <= 1}
                    onClick={() => {
                      const prevDay = editingSession.day - 1;
                      onUpdateSessionConfig(
                        editingSession.day,
                        editingSession.date,
                        editingSession.mode,
                        editingSession.milestone,
                        editingSession.syncToCohort
                      );
                      handleOpenEditSession(
                        prevDay,
                        currentClass.sessionDates?.[prevDay] || '',
                        currentClass.sessionModes?.[prevDay] || 'offline'
                      );
                    }}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>上一课</span>
                  </button>

                  <button
                    type="button"
                    disabled={editingSession.day >= totalSessions}
                    onClick={() => {
                      const nextDay = editingSession.day + 1;
                      onUpdateSessionConfig(
                        editingSession.day,
                        editingSession.date,
                        editingSession.mode,
                        editingSession.milestone,
                        editingSession.syncToCohort
                      );
                      handleOpenEditSession(
                        nextDay,
                        currentClass.sessionDates?.[nextDay] || '',
                        currentClass.sessionModes?.[nextDay] || 'offline'
                      );
                    }}
                    className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <span>下一课</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingSession(null)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-md cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateSessionConfig(
                        editingSession.day,
                        editingSession.date,
                        editingSession.mode,
                        editingSession.milestone,
                        editingSession.syncToCohort
                      );
                      setEditingSession(null);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer shadow-xs"
                  >
                    保存本课
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Full Schedule & Modality Batch Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{currentClass.name} 课时排期与形式统一设置</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  手动填写各课时公历日期，一键切换该课时为【线下上课】或【线上网课】
                </p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Auto-Schedule Bar */}
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 my-2 text-xs">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>智能排期与真历推算 (可指定起始课时与日期)</span>
                </span>
                <span className="text-[11px] text-blue-600">按真实公历星期自动顺延</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-3 flex items-center gap-1">
                  <span className="text-slate-600 shrink-0">从第:</span>
                  <select
                    value={batchStartDay}
                    onChange={e => setBatchStartDay(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-blue-900 focus:outline-none"
                  >
                    {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>第 {day} 课</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5 flex items-center gap-1.5">
                  <span className="text-slate-600 shrink-0 text-xs">起始日期:</span>
                  <CuteDatePickerInput
                    value={batchStartDate}
                    onChange={val => setBatchStartDate(val)}
                    placeholder="选起始日期"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setBatchStartDate(formatShortDate(new Date()))}
                    className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-[11px] text-slate-700 shrink-0 cursor-pointer"
                  >
                    今天
                  </button>
                </div>

                <div className="sm:col-span-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleAutoScheduleBatch}
                    className="w-full sm:w-auto px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>智能顺延全排期</span>
                  </button>
                </div>
              </div>

              {/* Weekday Selector & Presets */}
              <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-blue-200/60">
                <span className="text-[11px] text-slate-600 font-medium">每逢星期:</span>
                <div className="flex items-center gap-1">
                  {[
                    { day: 1, label: '一' },
                    { day: 2, label: '二' },
                    { day: 3, label: '三' },
                    { day: 4, label: '四' },
                    { day: 5, label: '五' },
                    { day: 6, label: '六' },
                    { day: 0, label: '日' }
                  ].map(w => {
                    const active = batchWeekdays.includes(w.day);
                    return (
                      <button
                        key={w.day}
                        type="button"
                        onClick={() => {
                          setBatchWeekdays(prev =>
                            active ? prev.filter(x => x !== w.day) : [...prev, w.day].sort()
                          );
                        }}
                        className={`w-6 h-6 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                          active
                            ? 'bg-blue-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {w.label}
                      </button>
                    );
                  })}
                </div>

                <div className="h-3 w-[1px] bg-blue-200 mx-0.5" />

                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchWeekdays([1, 3]);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 cursor-pointer"
                  >
                    周一/三 (30课)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchWeekdays([4, 5]);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 cursor-pointer"
                  >
                    周四/五 (20课)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchWeekdays([2, 4]);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 cursor-pointer"
                  >
                    周二/四 (20课)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchWeekdays([1, 2, 3, 4, 5]);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 cursor-pointer"
                  >
                    周一至五 (每天)
                  </button>
                </div>
              </div>

              {batchScheduleNotice && (
                <div className="mt-2 p-1.5 bg-emerald-100 border border-emerald-300 rounded text-emerald-800 text-[11px] font-medium flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                  <span>{batchScheduleNotice}</span>
                </div>
              )}
            </div>

            {/* Quick Batch Modality & Milestone Tools */}
            <div className="py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 my-1 space-y-1.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-slate-600 font-medium">形式快速切换:</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next: Record<number, SessionMode> = {};
                      for (let i = 1; i <= totalSessions; i++) next[i] = 'offline';
                      setTempModes(next);
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 cursor-pointer text-[11px]"
                  >
                    全部线下
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next: Record<number, SessionMode> = {};
                      for (let i = 1; i <= totalSessions; i++) next[i] = 'online';
                      setTempModes(next);
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-blue-600 hover:bg-blue-50 cursor-pointer text-[11px]"
                  >
                    全部线上
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const next: Record<number, SessionMode> = {};
                      for (let i = 1; i <= totalSessions; i++) {
                        next[i] = i % 5 === 0 ? 'online' : 'offline';
                      }
                      setTempModes(next);
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 cursor-pointer text-[11px]"
                  >
                    逢5节线上
                  </button>
                </div>
              </div>

              {/* 大考节点快速配置 */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-200/80">
                <span className="text-rose-900 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>重要大考预设:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultMs = getDefaultMilestonesForSessions(totalSessions);
                      const flat: Record<number, string> = {};
                      for (const [k, v] of Object.entries(defaultMs)) {
                        flat[Number(k)] = getSessionMilestoneLabel(v);
                      }
                      setTempMilestones(flat);
                    }}
                    className="px-2 py-0.5 bg-rose-50 border border-rose-300 text-rose-800 hover:bg-rose-100 rounded text-[11px] font-semibold cursor-pointer shadow-2xs"
                  >
                    ⚡ 一键套用标准大考（期中/小测/口语/期末）
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempMilestones({})}
                    className="px-2 py-0.5 bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 rounded text-[11px] cursor-pointer"
                  >
                    清空大考标记
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of Sessions */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 py-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => {
                  const dateVal = tempDates[day] ?? currentClass.sessionDates?.[day] ?? '';
                  const modeVal = tempModes[day] ?? currentClass.sessionModes?.[day] ?? 'offline';
                  const milestoneVal = tempMilestones[day] ?? getSessionMilestoneLabel(currentClass.sessionMilestones?.[day]);
                  const isOnline = modeVal === 'online';
                  const weekdayTag = getWeekdayName(dateVal);

                  return (
                    <div
                      key={day}
                      className={`flex flex-col gap-1.5 p-2 rounded-lg border transition-colors ${
                        milestoneVal
                          ? 'bg-rose-50/50 border-rose-300 shadow-2xs'
                          : isOnline
                          ? 'bg-sky-50/60 border-sky-200'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
                            {day}
                          </span>
                          <CuteDatePickerInput
                            value={dateVal}
                            onChange={val => setTempDates(prev => ({ ...prev, [day]: val }))}
                            placeholder="选择日期"
                            showWeekdayBadge={false}
                          />
                          {weekdayTag ? (
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold shrink-0">
                              {weekdayTag}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 shrink-0">待定</span>
                          )}
                        </div>

                        {/* Modality toggle switch */}
                        <button
                          type="button"
                          onClick={() => {
                            const nextMode: SessionMode = isOnline ? 'offline' : 'online';
                            setTempModes(prev => ({ ...prev, [day]: nextMode }));
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                            isOnline
                              ? 'bg-blue-600 text-white font-semibold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isOnline ? (
                            <>
                              <Video className="w-3 h-3" />
                              <span>线上</span>
                            </>
                          ) : (
                            <>
                              <MapPin className="w-3 h-3" />
                              <span>线下</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Milestone row */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>考试标记:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <select
                            value={milestoneVal}
                            onChange={e =>
                              setTempMilestones(prev => ({
                                ...prev,
                                [day]: e.target.value
                              }))
                            }
                            className={`px-1.5 py-0.5 rounded border text-[11px] font-semibold cursor-pointer focus:outline-none ${
                              milestoneVal
                                ? 'bg-rose-100 border-rose-300 text-rose-800 font-bold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <option value="">- 无 (普通上课) -</option>
                            <option value="小测">🔴 小测</option>
                            <option value="小测一">🔴 小测一</option>
                            <option value="小测二">🔴 小测二</option>
                            <option value="期中考试">🔴 期中考试</option>
                            <option value="口语考试">🔴 口语考试</option>
                            <option value="期末考试">🔴 期末考试</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 同周期班级一键同步勾选 */}
            {siblingClasses.length > 0 && (
              <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncCohortInBatch}
                    onChange={e => setSyncCohortInBatch(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-amber-900">
                      ⚡ 自动同步至同【{cohortDisplayName}】课群的 {siblingClasses.length} 个班级
                    </span>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      同课群（周一至周三课 / 周四至周五课）公历日期和大考节点完全一致，勾选后全班级立即生效。
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                共 {totalSessions} 课时 · 遇放假/调休可随时直接修改日期
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatchSchedule}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  保存课时排期与大考
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 确认删除末尾课时弹窗 */}
      {isConfirmDeleteSessionOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    确定删除第 {totalSessions} 课时吗？
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    少上了课时或提前结课？可安全移除末尾课时
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConfirmDeleteSessionOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="font-semibold text-amber-900 mb-1">课时与考勤规则说明:</div>
                <ul className="list-disc list-inside space-y-1 text-amber-800">
                  <li>删除后班级总课时将由 <strong>{totalSessions} 课</strong> 调整为 <strong>{totalSessions - 1} 课</strong>。</li>
                  <li>末尾第 {totalSessions} 课的考勤记录与排期信息将被清理。</li>
                  <li><strong>考勤分数计算规则完全保持不变</strong>：出勤1分、迟到3次扣0.5、请假扣0.25、旷课扣0.5、停课/空白不扣分。</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteSessionOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteSession) onDeleteSession();
                  setIsConfirmDeleteSessionOpen(false);
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                确定删除第 {totalSessions} 课
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确定改动考勤记录弹窗 (满足：浏览的地方，能改动但需要确定改动的地方) */}
      {confirmingCell && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  确定修改考勤记录
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  学生: <span className="font-bold text-slate-800">{confirmingCell.studentName}</span> (学号 #{confirmingCell.studentNo}) · 第 {confirmingCell.day} 课 ({confirmingCell.dateStr})
                </p>
              </div>
              <button
                onClick={() => setConfirmingCell(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">
                    请选择改动后的状态 *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    当前记录: <strong className="text-slate-700">{confirmingCell.currentStatus || '未记录'}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: '1', label: '1 正常出勤', hint: '0扣分', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                    { val: 'L', label: 'L 迟到', hint: '3次-0.5分', badge: 'bg-sky-50 text-sky-800 border-sky-200' },
                    { val: 'P', label: 'P 请假', hint: '每次-0.25分', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
                    { val: 'A', label: 'A 旷课', hint: '每次-0.5分', badge: 'bg-rose-50 text-rose-800 border-rose-200' },
                    { val: '-', label: '- 停课/换班', hint: '0扣分', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
                    { val: '', label: '清空/未填', hint: '插班不扣分', badge: 'bg-slate-50 text-slate-500 border-slate-200' }
                  ].map(item => {
                    const isSelected = confirmingCell.selectedStatus === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() =>
                          setConfirmingCell(prev =>
                            prev ? { ...prev, selectedStatus: item.val as AttendanceStatus } : null
                          )
                        }
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/90 ring-2 ring-blue-300 font-bold text-blue-900 shadow-2xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center justify-between">
                          <span>{item.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  备注原因 (请假/旷课必填或备忘，时间自动生成)
                </label>
                <input
                  type="text"
                  value={confirmingCell.note}
                  onChange={e =>
                    setConfirmingCell(prev => (prev ? { ...prev, note: e.target.value } : null))
                  }
                  placeholder="例如: 生病发烧请假、工作加班、家中有急事..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {['生病请假', '事假/私事', '签证居留办理', '家中有急事', '交通延误'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() =>
                        setConfirmingCell(prev => (prev ? { ...prev, note: r } : null))
                      }
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConfirmingCell(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStudentAttendance(
                      confirmingCell.studentId,
                      confirmingCell.day,
                      confirmingCell.selectedStatus,
                      confirmingCell.note
                    );
                    setConfirmingCell(null);
                  }}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>确定改动</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 同周期排期与大考同步管理弹窗 (周一~周三课同步、周四~周五课同步) */}
      {isCohortSyncModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    同周期排期与大考完全同步
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    周一至周三课群 / 周四至周五课群公历日期与考试节点一键对齐
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCohortSyncModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl space-y-1.5 text-blue-900">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>业务同步规则说明：</span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800">
                  如您所要求：<strong>周一到周三上的课，所有日期完全同步，只是上课时段不同</strong>；同样<strong>周四和周五上的课也是完全同步</strong>。
                  无需各个班级重复录入！只要以一个班级为基准，即可一键把公历日期、授课形式及小测/期中/口语/期末红字考点全部同步给同课群班级。
                </p>
              </div>

              {/* 当前班级基准 */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">当前基准班级:</span>
                  <span className="font-bold text-slate-900 font-mono">{currentClass.name}</span>
                </div>
                <div className="flex items-center justify-between mt-1 text-slate-600">
                  <span>当前课群周期:</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[11px]">
                    {cohortDisplayName}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-slate-600">
                  <span>重要大考节点:</span>
                  <span className="text-rose-600 font-semibold">
                    {Object.keys(currentClass.sessionMilestones || {}).length > 0
                      ? `已标注 ${Object.keys(currentClass.sessionMilestones || {}).length} 个考试节点`
                      : '暂未标注（可先在排期设置中套用大考）'}
                  </span>
                </div>
              </div>

              {/* 同周期内待同步的平行班级列表 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-slate-700">
                    同课群平行班级 ({siblingClasses.length} 个) :
                  </span>
                  <span className="text-[11px] text-slate-400">均属 {cohortDisplayName}</span>
                </div>

                {siblingClasses.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    当前暂无其他同周期的平行班级，新建周一/周三或周四/周五班级后即可一键同步。
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                    {siblingClasses.map(sb => {
                      const msCount = Object.keys(sb.sessionMilestones || {}).length;
                      return (
                        <div
                          key={sb.id}
                          className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-xs">{sb.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {sb.schedule || '时间未设'} · 共 {sb.totalSessions} 课时
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                              将同步 {Object.keys(currentClass.sessionDates || {}).length} 个课时日期
                            </span>
                            {msCount > 0 && (
                              <div className="text-[9px] text-slate-400 mt-0.5">已有 {msCount} 个考点将更新</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCohortSyncModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  关闭
                </button>
                {siblingClasses.length > 0 && onSyncCohortSchedules && (
                  <button
                    type="button"
                    onClick={() => {
                      onSyncCohortSchedules(currentClass.id, currentCohort);
                      setIsCohortSyncModalOpen(false);
                    }}
                    className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>以【{currentClass.name}】为基准一键同步所有平行班</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 粘贴上课进度弹窗 (满足：每班可能会一样，也会不一样，所以添加复制粘贴按钮，可以我直接粘贴进去) */}
      {isProgressPasteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    粘贴上课进度到【{currentClass.name}】
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    每班进度可能相同也可能不同 · 支持一键粘贴或从其他班级复制
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProgressPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {pasteNotice && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{pasteNotice}</span>
              </div>
            )}

            <div className="mt-4 space-y-4 text-xs">
              {/* Option 1: 粘贴已在剪贴板/内存中复制的进度 */}
              {cachedCopiedProgress && (
                <div className="p-3.5 bg-blue-50/70 border-2 border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-950 flex items-center gap-1.5">
                      <Copy className="w-3.5 h-3.5 text-blue-600" />
                      <span>检测到已复制的班级进度:</span>
                    </span>
                    <span className="text-[10px] bg-blue-200 text-blue-900 font-bold px-2 py-0.5 rounded-full">
                      已就绪
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-blue-200 text-slate-700 space-y-1">
                    <div>来源班级: <strong className="text-blue-900">{cachedCopiedProgress.sourceClassName}</strong></div>
                    <div>教到第几课: <strong className="text-slate-900">第 {cachedCopiedProgress.currentTeachingDay} 课</strong></div>
                    <div className="truncate">教学内容: <span className="font-medium text-slate-800">{cachedCopiedProgress.currentTeachingTopic || '无'}</span></div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApplyProgressFromData(cachedCopiedProgress)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>一键将此进度粘贴应用到【{currentClass.name}】</span>
                  </button>
                </div>
              )}

              {/* Option 2: 从其他班级快速选择复制 */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>从其他平行班级快速导入进度:</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSourceClassId}
                    onChange={e => setSelectedSourceClassId(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- 选择要复制进度的班级 --</option>
                    {(allClasses || [])
                      .filter(c => c.id !== currentClass.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.schedule || '时间待定'}) · 教到第 {c.currentTeachingDay || 1} 课
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selectedSourceClassId}
                    onClick={() => {
                      const src = (allClasses || []).find(c => c.id === selectedSourceClassId);
                      if (src) {
                        handleApplyProgressFromData({
                          sourceClassName: src.name,
                          currentTeachingDay: src.currentTeachingDay || 1,
                          currentTeachingTopic: src.currentTeachingTopic || '',
                          sessionProgress: src.sessionProgress || {}
                        });
                      }
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
                  >
                    复制过来
                  </button>
                </div>
              </div>

              {/* Option 3: 直接粘贴文本 */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>直接粘贴文字（从微信/Word/备课本）:</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">支持单课或多行大纲</span>
                </div>
                <textarea
                  value={manualPasteText}
                  onChange={e => setManualPasteText(e.target.value)}
                  placeholder="在此直接按 Ctrl+V 粘贴文字：&#10;• 单行：如《中文》第四课 课文生词与对话练习&#10;• 多行：每行一课（第1行对应第1课、第2行对应第2课...）"
                  rows={4}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setManualPasteText('')}
                    className="px-3 py-1 text-slate-500 hover:bg-slate-200 rounded text-xs cursor-pointer"
                  >
                    清空
                  </button>
                  <button
                    type="button"
                    disabled={!manualPasteText.trim()}
                    onClick={handleBatchParsePastedText}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    确定粘贴进去
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 mt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsProgressPasteModalOpen(false)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 全学期 1~30 课时总进度大纲弹窗 */}
      {isSyllabusModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-blue-600" />
                  <span>【{currentClass.name}】全学期课时进度大纲 ({totalSessions} 课)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  输入或修改任意课时的教学大纲即刻自动保存 · 当前教到第 {currentTeachingDay} 课
                </p>
              </div>
              <button
                onClick={() => setIsSyllabusModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg my-2 text-xs">
              <span className="text-slate-600">
                可直接修改各课讲授内容，或一键设为今日教学课时
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsSyllabusModalOpen(false);
                    setIsProgressPasteModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 font-semibold border border-blue-200 rounded cursor-pointer shadow-2xs"
                >
                  <ClipboardPaste className="w-3 h-3 inline mr-1" />
                  <span>批量粘贴大纲</span>
                </button>
              </div>
            </div>

            {/* Grid/List of All Sessions */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 py-1">
              {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => {
                const dateStr = currentClass.sessionDates?.[day] || '';
                const weekday = dateStr ? getWeekdayName(dateStr) : '';
                const mode = currentClass.sessionModes?.[day] === 'online' ? '线上' : '线下';
                const milestone = getSessionMilestoneLabel(currentClass.sessionMilestones?.[day]);
                const isCurrent = day === currentTeachingDay;
                const progressText = currentClass.sessionProgress?.[day] || (isCurrent ? currentClass.currentTeachingTopic || '' : '');

                return (
                  <div
                    key={day}
                    className={`p-2 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                      isCurrent
                        ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-200 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                        isCurrent ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {day}
                      </span>
                      <div className="text-[11px] leading-tight">
                        <span className="font-mono font-bold text-slate-800">{dateStr || '待定'}</span>
                        {weekday && <span className="ml-1 text-blue-600 font-semibold">{weekday}</span>}
                        <span className="ml-1 text-slate-400">({mode})</span>
                      </div>
                      {milestone && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-600 text-white font-bold shadow-2xs">
                          🔴 {milestone}
                        </span>
                      )}
                    </div>

                    {/* Topic text input */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        value={progressText}
                        onChange={e => handleUpdateTopicText(e.target.value, day)}
                        placeholder={`第 ${day} 课授课内容...`}
                        className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                      />
                    </div>

                    {/* Set as Today button */}
                    <button
                      type="button"
                      onClick={() => handleSelectTeachingDay(day)}
                      className={`px-2.5 py-1 text-xs rounded font-semibold cursor-pointer shrink-0 transition-colors ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isCurrent ? '今日所教 ✓' : '设为今天'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSyllabusModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
