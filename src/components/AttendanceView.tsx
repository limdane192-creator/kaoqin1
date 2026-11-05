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
  RotateCcw
} from 'lucide-react';
import { ClassRoom, Student, AttendanceStatus, SessionMode } from '../types';
import { calculateStudentAttendance } from '../utils/calculations';
import { CuteCalendarPicker, CuteDatePickerInput } from './CuteCalendarPicker';
import {
  parseWeekdaysFromSchedule,
  parseFlexibleDate,
  formatShortDate,
  getWeekdayName,
  autoGenerateSessionDates,
  WEEKDAY_NAMES_CN
} from '../utils/scheduleHelper';
import { getSmartSessionsPerWeek, getWeekNumberForSession } from '../utils/cycleHelper';

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
  onUpdateSessionConfig: (day: number, date: string, mode: SessionMode) => void;
  onBatchUpdateSessions?: (dates: Record<number, string>, modes: Record<number, SessionMode>) => void;
  onAddSession?: () => void;
  onDeleteSession?: () => void;
  onSaveData?: () => void;
  isJustSaved?: boolean;
  onSortClassStudentsAZ?: () => void;
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
  onSortClassStudentsAZ
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

  // Session date & modality editor state
  const [editingSession, setEditingSession] = useState<{
    day: number;
    date: string;
    mode: SessionMode;
  } | null>(null);

  // Session deletion confirmation modal
  const [isConfirmDeleteSessionOpen, setIsConfirmDeleteSessionOpen] = useState(false);

  // Auto-schedule options inside editingSession modal
  const [selectedWeekdaysForEdit, setSelectedWeekdaysForEdit] = useState<number[]>([]);
  const [autoScheduleNotice, setAutoScheduleNotice] = useState<string | null>(null);

  // Full schedule modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [tempDates, setTempDates] = useState<Record<number, string>>({});
  const [tempModes, setTempModes] = useState<Record<number, SessionMode>>({});
  const [batchStartDay, setBatchStartDay] = useState<number>(1);
  const [batchStartDate, setBatchStartDate] = useState<string>('');
  const [batchWeekdays, setBatchWeekdays] = useState<number[]>([]);
  const [batchScheduleNotice, setBatchScheduleNotice] = useState<string | null>(null);

  const totalSessions = currentClass.totalSessions || 30;

  // Open single session modal with parsed weekdays
  const handleOpenEditSession = (day: number, dateStr: string, mode: SessionMode) => {
    setEditingSession({ day, date: dateStr, mode });
    setSelectedWeekdaysForEdit(parseWeekdaysFromSchedule(currentClass.schedule));
    setAutoScheduleNotice(null);
  };

  // Open batch schedule modal
  const handleOpenScheduleModal = () => {
    const existing = { ...(currentClass.sessionDates || {}) };
    setTempDates(existing);
    setTempModes({ ...(currentClass.sessionModes || {}) });
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
      onBatchUpdateSessions(generated, currentClass.sessionModes || {});
    } else {
      for (let d = editingSession.day; d <= totalSessions; d++) {
        if (generated[d]) {
          onUpdateSessionConfig(d, generated[d], currentClass.sessionModes?.[d] || 'offline');
        }
      }
    }

    const weekdayStr = weekdays.map(w => WEEKDAY_NAMES_CN[w]).join('/');
    setAutoScheduleNotice(`已从第 ${editingSession.day} 课 (${editingSession.date}) 按【${weekdayStr}】自动顺延生成至第 ${totalSessions} 课真实日期！`);
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
      onBatchUpdateSessions(tempDates, tempModes);
    } else {
      // Fallback: update individually
      for (let day = 1; day <= totalSessions; day++) {
        const d = tempDates[day] ?? currentClass.sessionDates?.[day] ?? '';
        const m = tempModes[day] ?? currentClass.sessionModes?.[day] ?? 'offline';
        onUpdateSessionConfig(day, d, m);
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
              title="统一设定所有课时日期及线上/线下形式"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>排期与形式</span>
            </button>

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

            {onSaveData && (
              <button
                onClick={onSaveData}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  isJustSaved
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                }`}
                title="保存考勤与所有班级数据到本地"
              >
                {isJustSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已存好</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>保存考勤</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

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
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-20 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 border-r border-slate-200 w-12 text-center sticky left-0 bg-slate-50 z-30 text-slate-500 font-normal">学号</th>
                <th className="py-2.5 px-4 border-r border-slate-200 min-w-[130px] sticky left-12 bg-slate-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  学生姓名
                </th>
                {/* 课时日期与线上/线下列表头 */}
                {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => {
                  const dateStr = currentClass.sessionDates?.[day] || '';
                  const mode = currentClass.sessionModes?.[day] || 'offline';
                  const isOnline = mode === 'online';
                  const parsedDate = parseFlexibleDate(dateStr);
                  const weekdayLabel = parsedDate ? getWeekdayName(parsedDate) : '';
                  const sessionsPerWeek = getSmartSessionsPerWeek(currentClass.schedule, totalSessions);
                  const weekNum = getWeekNumberForSession(day, sessionsPerWeek);

                  return (
                    <th
                      key={day}
                      onClick={() => handleOpenEditSession(day, dateStr, mode)}
                      className={`py-1.5 px-1.5 border-r border-slate-100 text-center min-w-[44px] transition-colors cursor-pointer select-none group relative ${
                        isOnline ? 'bg-sky-50/70 hover:bg-sky-100/80' : 'hover:bg-slate-100/80'
                      }`}
                      title={`第${day}课 (第${weekNum}周) · ${dateStr ? `${dateStr} (${weekdayLabel || '点击编辑'})` : '点击输入日期'} · ${isOnline ? '线上上课' : '线下上课'} (点击可编辑日期与自动顺延排期)`}
                    >
                      <div className="text-[8px] font-mono text-slate-400 group-hover:text-blue-500 leading-none">
                        W{weekNum}
                      </div>
                      <div className="font-semibold text-[11px] text-slate-700 group-hover:text-blue-600 transition-colors">
                        {day}
                      </div>
                      <div className="text-[9px] text-slate-500 font-normal truncate max-w-[48px] mx-auto font-mono">
                        {dateStr || '-'}
                      </div>
                      {weekdayLabel && (
                        <div className="text-[8px] text-blue-600 scale-90 font-medium leading-none">
                          {weekdayLabel}
                        </div>
                      )}
                      <div className="mt-0.5 flex justify-center">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded font-medium bg-blue-100 text-blue-700 scale-90 origin-center">
                            线上
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded font-medium bg-slate-100 text-slate-500 scale-90 origin-center">
                            线下
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}

                {/* 加课表头快捷按钮 */}
                {onAddSession && (
                  <th
                    onClick={onAddSession}
                    className="py-1 px-1.5 border-r border-slate-200 text-center min-w-[34px] bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer select-none group"
                    title="点击增加 1 节课时（多上课时可灵活追加）"
                  >
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-bold text-emerald-700">加课</span>
                    </div>
                  </th>
                )}

                {/* 统计列 */}
                <th className="py-2 px-2.5 border-r border-slate-100 text-center text-slate-700 font-medium">出勤</th>
                <th className="py-2 px-2.5 border-r border-slate-100 text-center text-slate-700 font-medium">迟到</th>
                <th className="py-2 px-2.5 border-r border-slate-100 text-center text-slate-700 font-medium">请假</th>
                <th className="py-2 px-2.5 border-r border-slate-200 text-center text-slate-700 font-medium">旷课</th>
                <th className="py-2 px-3 border-r border-slate-200 text-center font-bold bg-slate-100/80 text-slate-900">出勤率</th>
                <th className="py-2 px-3 border-r border-slate-200 text-center text-slate-700 bg-slate-100/50">考勤分</th>
                <th className="py-2 px-3 text-center text-slate-500 font-normal">备注理由</th>
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
                            className="py-1 px-0.5 text-center cursor-pointer hover:bg-blue-50/70 transition-colors relative group select-none border-r border-slate-100"
                            title={`单击修改考勤：第${day}课 (${currentClass.sessionDates?.[day] || '待定'}) · 当前: ${val || '未记录'}${note ? ` (${note})` : ''}`}
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

                {/* Step Previous / Next buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500">
                  <button
                    type="button"
                    disabled={editingSession.day <= 1}
                    onClick={() => {
                      const prevDay = editingSession.day - 1;
                      onUpdateSessionConfig(editingSession.day, editingSession.date, editingSession.mode);
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
                      onUpdateSessionConfig(editingSession.day, editingSession.date, editingSession.mode);
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
                      onUpdateSessionConfig(editingSession.day, editingSession.date, editingSession.mode);
                      setEditingSession(null);
                    }}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md cursor-pointer"
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

            {/* Quick Batch Modality Tools */}
            <div className="py-2 px-3 bg-slate-50 rounded-lg border border-slate-200 my-1 flex flex-wrap items-center justify-between gap-2 text-xs">
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

            {/* Grid of Sessions */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 py-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => {
                  const dateVal = tempDates[day] ?? currentClass.sessionDates?.[day] ?? '';
                  const modeVal = tempModes[day] ?? currentClass.sessionModes?.[day] ?? 'offline';
                  const isOnline = modeVal === 'online';
                  const weekdayTag = getWeekdayName(dateVal);

                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        isOnline ? 'bg-sky-50/60 border-sky-200' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
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
                  );
                })}
              </div>
            </div>

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
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  保存课时排期
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
    </div>
  );
};
