/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Users,
  Save,
  Check,
  FileSpreadsheet,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ArrowDownAZ,
  Edit3,
  CalendarDays,
  X,
  BarChart3,
  TrendingUp,
  Layers,
  CalendarRange,
  AlertTriangle,
  Filter,
  ChevronRight
} from 'lucide-react';
import { CuteAttendanceCat } from './CuteIllustrations';
import { CuteCalendarPicker, CuteDatePickerInput } from './CuteCalendarPicker';
import { ClassRoom, Student, AttendanceStatus, SessionMode } from '../types';
import { compareStudentNamesAZ } from '../utils/calculations';
import { getWeekdayName } from '../utils/scheduleHelper';
import { StudentAvatarBadge } from '../utils/avatarHelper';
import {
  getSmartSessionsPerWeek,
  buildWeekCycles,
  getWeekNumberForSession,
  calculateStudentWeeklyStats,
  calculateClassWeeklySummary,
  WeekCycle
} from '../utils/cycleHelper';

interface DailyRollCallViewProps {
  currentClass: ClassRoom;
  students: Student[];
  onUpdateStudentAttendance: (
    studentId: string,
    day: number,
    status: AttendanceStatus,
    note?: string
  ) => void;
  onBatchSetAttendance: (day: number, status: AttendanceStatus) => void;
  onSelectStudentModal: (student: Student) => void;
  onSwitchToBrowse: () => void;
  onSaveData?: () => void;
  isJustSaved?: boolean;
  onSortClassStudentsAZ?: () => void;
  onUpdateSessionConfig?: (day: number, date: string, mode: SessionMode) => void;
  onOpenAvatarPicker?: (student: Student) => void;
}

export const DailyRollCallView: React.FC<DailyRollCallViewProps> = ({
  currentClass,
  students,
  onUpdateStudentAttendance,
  onBatchSetAttendance,
  onSelectStudentModal,
  onSwitchToBrowse,
  onSaveData,
  isJustSaved,
  onSortClassStudentsAZ,
  onUpdateSessionConfig,
  onOpenAvatarPicker
}) => {
  const totalSessions = currentClass.totalSessions || 30;

  // 智能教学周期设置 (周一/周三 -> 3天/周，周四/周五 -> 2天/周，10周总览)
  const defaultSessionsPerWeek = useMemo(() => {
    return getSmartSessionsPerWeek(currentClass.schedule, totalSessions);
  }, [currentClass.schedule, totalSessions]);

  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(defaultSessionsPerWeek);

  useEffect(() => {
    setSessionsPerWeek(getSmartSessionsPerWeek(currentClass.schedule, totalSessions));
  }, [currentClass.id, currentClass.schedule, totalSessions]);

  // 构建 1~10 周智能周期列表
  const weekCycles = useMemo(() => {
    return buildWeekCycles(totalSessions, sessionsPerWeek, currentClass.sessionDates || {});
  }, [totalSessions, sessionsPerWeek, currentClass.sessionDates]);

  // 点名台视图模式: 'daily' (今日课时点名) | 'weekly-stats' (周次考勤透视分析)
  const [viewMode, setViewMode] = useState<'daily' | 'weekly-stats'>('daily');

  // 当前查看/分析的周次 (1 ~ 10)
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);

  // 周度分析筛选模式: 全部学生 / 仅看有预警
  const [weeklyFilterWarningOnly, setWeeklyFilterWarningOnly] = useState<boolean>(false);

  // 周度分析视图模式: 单周详情 / 10周全景对比
  const [weeklyTableMode, setWeeklyTableMode] = useState<'single-week' | 'all-10-weeks'>('single-week');

  // 名册排序模式：默认按姓名 A-Z 拼音/字母排序
  const [sortOrder, setSortOrder] = useState<'az' | 'no'>('az');

  const sortedStudents = useMemo(() => {
    const list = [...students];
    if (sortOrder === 'az') {
      return list.sort((a, b) => compareStudentNamesAZ(a.name, b.name));
    }
    return list.sort((a, b) => a.no - b.no);
  }, [students, sortOrder]);

  // 1. 自动生成当前日期与时间 (格式: 2026-10-28 星期三 14:30)
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const weekDayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const formattedDateStr = `${currentDateTime.getFullYear()}-${String(
    currentDateTime.getMonth() + 1
  ).padStart(2, '0')}-${String(currentDateTime.getDate()).padStart(2, '0')}`;
  const formattedTimeStr = `${String(currentDateTime.getHours()).padStart(2, '0')}:${String(
    currentDateTime.getMinutes()
  ).padStart(2, '0')}`;
  const weekDayStr = weekDayNames[currentDateTime.getDay()];
  const shortDateStr = `${String(currentDateTime.getMonth() + 1).padStart(2, '0')}/${String(
    currentDateTime.getDate()
  ).padStart(2, '0')}`;

  // 2. 自动匹配今天的课时编号
  // 逻辑: 优先匹配 sessionDates 中等于今天短日期的课时；若无，找首个尚未全部点名的课时；默认第1课
  const initialDay = useMemo(() => {
    if (currentClass.sessionDates) {
      for (let d = 1; d <= totalSessions; d++) {
        if (currentClass.sessionDates[d] === shortDateStr || currentClass.sessionDates[d] === formattedDateStr) {
          return d;
        }
      }
    }
    // 寻找第一个有空白考勤的课时
    for (let d = 1; d <= totalSessions; d++) {
      const anyEmpty = students.some(s => !s.attendance[d]);
      if (anyEmpty) return d;
    }
    return 1;
  }, [currentClass.id, totalSessions]);

  const [selectedDay, setSelectedDay] = useState<number>(initialDay);

  useEffect(() => {
    setSelectedDay(initialDay);
  }, [initialDay, currentClass.id]);

  // 当前点名课时所属的周次 (1 ~ 10)
  const currentSessionWeekNumber = useMemo(() => {
    return getWeekNumberForSession(selectedDay, sessionsPerWeek);
  }, [selectedDay, sessionsPerWeek]);

  // 同步当前周次
  useEffect(() => {
    setSelectedWeekNumber(currentSessionWeekNumber);
  }, [currentSessionWeekNumber]);

  // 当前激活/查看的周次对象
  const activeWeekCycle = useMemo(() => {
    return weekCycles.find(w => w.weekNumber === selectedWeekNumber) || weekCycles[0] || {
      weekNumber: 1,
      startDay: 1,
      endDay: sessionsPerWeek,
      sessionDays: [1],
      dateRangeText: ''
    };
  }, [weekCycles, selectedWeekNumber, sessionsPerWeek]);

  // 当前周次全班统计数据
  const activeClassWeeklySummary = useMemo(() => {
    if (!activeWeekCycle || activeWeekCycle.sessionDays.length === 0) return null;
    return calculateClassWeeklySummary(students, activeWeekCycle, currentClass.sessionDates || {});
  }, [students, activeWeekCycle, currentClass.sessionDates]);

  // 请假原因快捷常用标签
  const quickLeaveReasons = [
    '生病请假',
    '事假/私事',
    '签证/居留办理',
    '家中有急事',
    '工作加班出差',
    '交通延误',
    '身体不适'
  ];

  // 临时编辑中的请假/旷课原因 (studentId -> input text)
  const [editingReasons, setEditingReasons] = useState<Record<string, string>>({});

  // 课时日期同步与即时编辑状态
  const [sessionDateInput, setSessionDateInput] = useState<string>('');
  const [isEditingSessionDate, setIsEditingSessionDate] = useState<boolean>(false);
  const [isDateCalendarOpen, setIsDateCalendarOpen] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  useEffect(() => {
    setSessionDateInput(currentClass.sessionDates?.[selectedDay] || '');
  }, [selectedDay, currentClass.sessionDates]);

  // 统计今天(选定课时)的点名数据
  const stats = useMemo(() => {
    let present = 0;
    let late = 0;
    let leave = 0;
    let absent = 0;
    let exempt = 0;
    let unrecorded = 0;

    students.forEach(s => {
      const st = s.attendance[selectedDay];
      if (st === '1') present++;
      else if (st === 'L') late++;
      else if (st === 'P') leave++;
      else if (st === 'A') absent++;
      else if (st === '-') exempt++;
      else unrecorded++;
    });

    return {
      total: students.length,
      present,
      late,
      leave,
      absent,
      exempt,
      unrecorded,
      completed: present + late + leave + absent + exempt
    };
  }, [students, selectedDay]);

  const sessionDateText = currentClass.sessionDates?.[selectedDay] || '';
  const sessionMode = currentClass.sessionModes?.[selectedDay] || 'offline';
  const sessionWeekday = getWeekdayName(sessionDateText);

  // 一键全员出勤 (1) - 自动如实同步真实日期
  const handleBatchAllPresent = () => {
    if (onUpdateSessionConfig && !currentClass.sessionDates?.[selectedDay]) {
      onUpdateSessionConfig(selectedDay, shortDateStr, sessionMode);
    }
    onBatchSetAttendance(selectedDay, '1');
  };

  // 单人更改状态 - 自动如实同步真实日期至考勤表
  const handleStatusChange = (student: Student, newStatus: AttendanceStatus) => {
    if (onUpdateSessionConfig && !currentClass.sessionDates?.[selectedDay]) {
      onUpdateSessionConfig(selectedDay, shortDateStr, sessionMode);
    }

    let currentNote = student.attendanceNotes?.[selectedDay] || '';

    // 如果选择请假 (P)，自动记录时间戳并提供原因
    if (newStatus === 'P' && !currentNote) {
      const autoReason = editingReasons[student.id] || '事假/病假';
      currentNote = `[${formattedTimeStr}登记] ${autoReason}`;
    }

    onUpdateStudentAttendance(student.id, selectedDay, newStatus, currentNote);
  };

  // 同步当前课时日期为今天真实日期
  const handleSyncToToday = () => {
    if (onUpdateSessionConfig) {
      onUpdateSessionConfig(selectedDay, shortDateStr, sessionMode);
      setSyncNotice(`已将第 ${selectedDay} 课排期如实同步为今天 (${shortDateStr})，考勤记录已忠实更新！`);
      setTimeout(() => setSyncNotice(null), 3500);
    }
  };

  // 保存自定义修改的课时日期 (如遇放假调休手动改期)
  const handleSaveCustomDate = () => {
    if (onUpdateSessionConfig) {
      onUpdateSessionConfig(selectedDay, sessionDateInput.trim(), sessionMode);
      setIsEditingSessionDate(false);
      setSyncNotice(`第 ${selectedDay} 课日期已成功修改为【${sessionDateInput.trim() || '未设'}】并同步至考勤台账！`);
      setTimeout(() => setSyncNotice(null), 3500);
    }
  };

  // 更新请假/旷课具体原因并附加时间戳
  const handleUpdateReason = (studentId: string, reasonText: string) => {
    setEditingReasons(prev => ({ ...prev, [studentId]: reasonText }));
    const stu = students.find(s => s.id === studentId);
    if (!stu) return;

    const currentStatus = stu.attendance[selectedDay] || 'P';
    const noteWithTimestamp = reasonText.trim()
      ? `[${formattedTimeStr}登记] ${reasonText.trim()}`
      : '';
    onUpdateStudentAttendance(studentId, selectedDay, currentStatus, noteWithTimestamp);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Today's Class & Auto Date / Time Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CuteAttendanceCat size={48} className="p-0.5 bg-emerald-50 rounded-xl border border-emerald-200/60 shadow-2xs shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-600 text-white text-xs font-bold tracking-wide">
                  今日点名台
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {currentClass.name} · 实时学生点名表
                </h2>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500 font-medium">
                  {currentClass.schedule} · 教室: {currentClass.room || '待定'}
                </span>
              </div>

            {/* Auto Generated Date & Time Strip */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>今天: {formattedDateStr} ({weekDayStr})</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>点名时间: {formattedTimeStr} (自动生成记录)</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
                授课形式: <strong className="text-slate-800">{sessionMode === 'online' ? '线上网课' : '线下教室'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Session Selector & Real Date Sync */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg p-1 text-xs">
              <span className="text-slate-500 pl-1">当前课时:</span>
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => {
                  const dDate = currentClass.sessionDates?.[day] || `未设`;
                  const dMode = currentClass.sessionModes?.[day] === 'online' ? '线上' : '线下';
                  return (
                    <option key={day} value={day}>
                      第 {day} 课 ({dDate} · {dMode})
                    </option>
                  );
                })}
              </select>

              {/* Interactive Calendar Date Picker Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDateCalendarOpen(!isDateCalendarOpen)}
                  className={`flex items-center gap-1.5 bg-white border rounded px-2.5 py-1 text-[11px] cursor-pointer transition-all shadow-2xs hover:bg-blue-50/50 ${
                    isDateCalendarOpen
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-slate-300 hover:border-blue-400'
                  }`}
                  title="点击打开日历选表设置日期，避免手动输入出错"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-mono font-bold text-slate-800">
                    {sessionDateText || '点击选日期'}
                  </span>
                  {sessionWeekday && (
                    <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 border border-blue-200 px-1 py-0.2 rounded">
                      {sessionWeekday}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 ml-0.5">▾</span>
                </button>

                {isDateCalendarOpen && (
                  <div className="absolute left-0 mt-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <CuteCalendarPicker
                      value={sessionDateText}
                      onChange={(newDate) => {
                        if (onUpdateSessionConfig) {
                          onUpdateSessionConfig(selectedDay, newDate, sessionMode);
                          setSyncNotice(`第 ${selectedDay} 课排期日期已更新为【${newDate || '未设'}】！`);
                          setTimeout(() => setSyncNotice(null), 3000);
                        }
                        setIsDateCalendarOpen(false);
                      }}
                      onClose={() => setIsDateCalendarOpen(false)}
                      showFormatToggle
                    />
                  </div>
                )}
              </div>

              {/* Quick Set to Today button if different */}
              {sessionDateText !== shortDateStr && onUpdateSessionConfig && (
                <button
                  type="button"
                  onClick={handleSyncToToday}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  title="如实将此课时日期登记为今天真实公历日期"
                >
                  <Check className="w-3 h-3" />
                  <span>设为今天 ({shortDateStr})</span>
                </button>
              )}
            </div>

            {/* Quick Batch All Present */}
            <button
              onClick={handleBatchAllPresent}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="一键将选定课时全班设为 1 (出勤)，再单独标记个别迟到或请假"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>全员到齐 (一键全勤)</span>
            </button>

            {/* Switch to Full Browse */}
            <button
              onClick={onSwitchToBrowse}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="切换到 30 课时全周期考勤浏览台账"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>考勤总览台账</span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
            </button>

            {/* Save Data Button */}
            {onSaveData && (
              <button
                onClick={onSaveData}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isJustSaved
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                }`}
              >
                {isJustSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已存好</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>保存今日点名</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sync / Update Notice Banner */}
        {syncNotice && (
          <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{syncNotice}</span>
            </span>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-emerald-500 hover:text-emerald-700 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Inline Date Editor Popover */}
        {isEditingSessionDate && (
          <div className="mt-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-900">修改第 {selectedDay} 课排期公历日期:</span>
              <input
                type="text"
                value={sessionDateInput}
                onChange={e => setSessionDateInput(e.target.value)}
                placeholder="例如: 11/07 或 2026-11-07"
                className="w-32 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-slate-500 text-[11px]">如遇放假、调休或调课，可在此手动修改真实上课日期</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSessionDateInput(shortDateStr)}
                className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs cursor-pointer"
              >
                填入今天 ({shortDateStr})
              </button>
              <button
                type="button"
                onClick={() => setIsEditingSessionDate(false)}
                className="px-2.5 py-1 text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveCustomDate}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded cursor-pointer shadow-2xs"
              >
                确定更新日期
              </button>
            </div>
          </div>
        )}

        {/* Real-time KPI Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-4 mt-4 border-t border-slate-100 text-center">
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-[11px] text-slate-400">在册总人数</div>
            <div className="text-base font-bold font-mono text-slate-800 mt-0.5">{stats.total}人</div>
          </div>
          <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
            <div className="text-[11px] text-emerald-700 font-medium">1 正常出勤</div>
            <div className="text-base font-bold font-mono text-emerald-800 mt-0.5">{stats.present}人</div>
          </div>
          <div className="bg-sky-50/70 p-2 rounded-lg border border-sky-100">
            <div className="text-[11px] text-sky-700 font-medium">L 迟到(3次-0.5)</div>
            <div className="text-base font-bold font-mono text-sky-800 mt-0.5">{stats.late}人</div>
          </div>
          <div className="bg-amber-50/70 p-2 rounded-lg border border-amber-100">
            <div className="text-[11px] text-amber-700 font-medium">P 请假(-0.25)</div>
            <div className="text-base font-bold font-mono text-amber-800 mt-0.5">{stats.leave}人</div>
          </div>
          <div className="bg-rose-50/70 p-2 rounded-lg border border-rose-100">
            <div className="text-[11px] text-rose-700 font-medium">A 旷课(-0.5)</div>
            <div className="text-base font-bold font-mono text-rose-800 mt-0.5">{stats.absent}人</div>
          </div>
          <div className="bg-slate-100/70 p-2 rounded-lg border border-slate-200">
            <div className="text-[11px] text-slate-600 font-medium">- 停课/换班(0扣)</div>
            <div className="text-base font-bold font-mono text-slate-700 mt-0.5">{stats.exempt}人</div>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
            <div className="text-[11px] text-slate-400">点名进度</div>
            <div className="text-base font-bold font-mono text-blue-700 mt-0.5">
              {stats.completed}/{stats.total}
            </div>
          </div>
        </div>
      </div>

      {/* 智能教学周期与周度考勤学情透视导航栏 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 space-y-3">
        {/* Header of Cycle Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900">
                  教学智能周期 (10周阶梯排课)
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                  当前设定：每周 {sessionsPerWeek} 天 · 共 {weekCycles.length} 周 ({totalSessions} 课时)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {currentClass.schedule.includes('周一/周三') || sessionsPerWeek === 3
                  ? '已智能识别为周一/周三(3天一周)，顺延排列至10周(共30天)；支持按周追踪每个学生的到课与缺旷'
                  : currentClass.schedule.includes('周四/周五') || sessionsPerWeek === 2
                  ? '已智能识别为周四/周五(2天一周)，顺延排列至10周(共20天)；支持按周追踪每个学生的到课与缺旷'
                  : `当前按每周 ${sessionsPerWeek} 课时排期周期，10周阶梯统计；可按周查看学生出勤与缺旷`}
              </p>
            </div>
          </div>

          {/* Right: Cycle Preset Buttons & View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Quick Cycle Rule Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
              <span className="text-slate-500 pl-1.5 pr-0.5 font-medium">排期周期:</span>
              <button
                type="button"
                onClick={() => setSessionsPerWeek(3)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  sessionsPerWeek === 3
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="周一/周三等课程：3天为一周，10周共30天"
              >
                3天/周 (30课)
              </button>
              <button
                type="button"
                onClick={() => setSessionsPerWeek(2)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  sessionsPerWeek === 2
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="周四/周五等课程：2天为一周，10周共20天"
              >
                2天/周 (20课)
              </button>
              <button
                type="button"
                onClick={() => setSessionsPerWeek(5)}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  sessionsPerWeek === 5
                    ? 'bg-white text-blue-700 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="周一至周五工作日：5天为一周"
              >
                5天/周
              </button>
            </div>

            {/* View Mode Toggle: [ 📋 实时课时点名 ] | [ 📊 周次考勤透视分析 ] */}
            <div className="flex items-center bg-slate-900 text-white rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('daily')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'daily'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>实时课时点名</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('weekly-stats')}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'weekly-stats'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>周次考勤透视分析</span>
              </button>
            </div>
          </div>
        </div>

        {/* 10-Week Pill Selector Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 custom-scrollbar">
          {weekCycles.map(w => {
            const isSelected = selectedWeekNumber === w.weekNumber;
            const isCurrentSessionWeek = currentSessionWeekNumber === w.weekNumber;

            return (
              <button
                key={w.weekNumber}
                type="button"
                onClick={() => {
                  setSelectedWeekNumber(w.weekNumber);
                  // If in daily mode, also jump selectedDay to the first session of that week
                  if (viewMode === 'daily' && w.startDay > 0) {
                    setSelectedDay(w.startDay);
                  }
                }}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-left border transition-all cursor-pointer min-w-[108px] ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200'
                    : isCurrentSessionWeek
                    ? 'bg-blue-50/70 border-blue-300 text-slate-800 hover:bg-blue-100'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs">
                    第 {w.weekNumber} 周
                  </span>
                  {isCurrentSessionWeek && (
                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-blue-600 text-white'
                    }`}>
                      当前
                    </span>
                  )}
                </div>
                <div className={`text-[10px] mt-0.5 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {w.startDay > 0 ? `第 ${w.startDay}-${w.endDay} 课` : '未排期'}
                </div>
                <div className={`text-[10px] truncate max-w-[100px] ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                  {w.dateRangeText}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mode 1: 实时课时点名 */}
      {viewMode === 'daily' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Rules Prompt Bar */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-2 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>点名打分规则：</strong>满分10分(占总评10%)。正常出勤 0扣分 · 请假每次 -0.25分 · 旷课每次 -0.5分 · 迟到每3次 -0.5分 · 空白插班与换班不扣分。
              </span>
            </div>
            <span className="text-[11px] text-blue-700 font-medium bg-white px-2 py-0.5 rounded border border-blue-200">
              选【P 请假】可输入请假事由，系统自动打上时间戳
            </span>
          </div>

          {/* Student Roll Call Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span>第 {selectedDay} 课 学生点名名册</span>
                  <span className="text-slate-400 font-normal">
                    (共 {students.length} 名在册学生 · 属于第 {currentSessionWeekNumber} 周)
                  </span>
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full">
                  <ArrowDownAZ className="w-3 h-3 text-blue-600" />
                  <span>{sortOrder === 'az' ? '已按姓名 A-Z 字母排序' : '按学号 No. 排序'}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">点名排序：</span>
                <div className="inline-flex rounded-lg p-0.5 bg-slate-200/80 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setSortOrder('az')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      sortOrder === 'az'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="按学生姓名 A-Z 拼音/字母升序排序"
                  >
                    <span>按姓名 A-Z</span>
                    {sortOrder === 'az' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortOrder('no')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      sortOrder === 'no'
                        ? 'bg-white text-blue-700 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="按原始学号 No.1 开始排序"
                  >
                    <span>按学号 No.</span>
                    {sortOrder === 'no' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                  </button>
                </div>
                {onSortClassStudentsAZ && (
                  <button
                    type="button"
                    onClick={onSortClassStudentsAZ}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    title="将全班学生的学号永久按 A-Z 升序重排"
                  >
                    <ArrowDownAZ className="w-3.5 h-3.5 text-slate-500" />
                    <span>永久重排 A-Z 学号</span>
                  </button>
                )}
              </div>
            </div>

            {students.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                该班级尚未录入学生，请点击顶部【+ 录入插班生】或【加班】添加学生。
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedStudents.map((student, idx) => {
                  const currentStatus = student.attendance[selectedDay] || '';
                  const existingNote = student.attendanceNotes?.[selectedDay] || '';
                  const isLeave = currentStatus === 'P';
                  const isAbsent = currentStatus === 'A';
                  const isLate = currentStatus === 'L';
                  const isPresent = currentStatus === '1';
                  const isExempt = currentStatus === '-';

                  // 统计当前学生在当前周次内的考勤数据
                  const currentWeekStats = calculateStudentWeeklyStats(
                    student,
                    activeWeekCycle,
                    currentClass.sessionDates || {}
                  );

                  return (
                    <div
                      key={student.id}
                      className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLeave
                          ? 'bg-amber-50/30'
                          : isAbsent
                          ? 'bg-rose-50/30'
                          : isLate
                          ? 'bg-sky-50/30'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                      {/* Left: Student Identity & Real-time Weekly Statistics Badge */}
                      <div className="flex items-start gap-2.5 shrink-0 min-w-[270px]">
                        <span
                          className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            sortOrder === 'az'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                          title={sortOrder === 'az' ? `A-Z 序号 ${idx + 1}（学号 No.${student.no}）` : `学号 No.${student.no}`}
                        >
                          {sortOrder === 'az' ? idx + 1 : student.no}
                        </span>

                        {/* Cute Cartoon or Custom Photo Avatar */}
                        <StudentAvatarBadge
                          student={student}
                          size="md"
                          onClick={() => onOpenAvatarPicker?.(student)}
                          showChangeHint
                          className="shrink-0 mt-0.5 cursor-pointer ring-1 ring-slate-200 hover:ring-blue-400 transition-all"
                        />

                        <div>
                          <button
                            type="button"
                            onClick={() => onSelectStudentModal(student)}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left text-xs cursor-pointer flex items-center gap-1.5"
                            title="查看学生历史考勤档案与分数"
                          >
                            <span>{student.name}</span>
                            {sortOrder === 'az' && (
                              <span className="text-[10px] text-slate-400 font-normal font-mono">
                                (No.{student.no})
                              </span>
                            )}
                          </button>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                            {student.gender && <span>{student.gender}</span>}
                            {existingNote && (
                              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                {existingNote}
                              </span>
                            )}
                          </div>

                          {/* 本周考勤实时追踪徽章 (满足：每一周查看就知道学生情况) */}
                          <div className="flex flex-wrap items-center gap-1 mt-1 text-[11px]">
                            <span className="text-slate-500 font-semibold text-[10px]">第{selectedWeekNumber}周:</span>
                            <span
                              className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-mono font-medium border border-emerald-200"
                              title={`第${selectedWeekNumber}周正常到课 ${currentWeekStats.presentCount} 次`}
                            >
                              出勤 <strong>{currentWeekStats.presentCount}</strong>
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono font-medium border ${
                                currentWeekStats.lateCount > 0
                                  ? 'bg-sky-50 text-sky-800 border-sky-300 font-bold'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                              title={`第${selectedWeekNumber}周迟到 ${currentWeekStats.lateCount} 次`}
                            >
                              迟到 <strong>{currentWeekStats.lateCount}</strong>
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono font-medium border ${
                                currentWeekStats.leaveCount > 0
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                              title={`第${selectedWeekNumber}周请假 ${currentWeekStats.leaveCount} 次`}
                            >
                              请假 <strong>{currentWeekStats.leaveCount}</strong>
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono font-medium border ${
                                currentWeekStats.absentCount > 0
                                  ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                              }`}
                              title={`第${selectedWeekNumber}周旷课 ${currentWeekStats.absentCount} 次`}
                            >
                              旷课 <strong>{currentWeekStats.absentCount}</strong>
                            </span>
                            {currentWeekStats.hasWarning && (
                              <span className="text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 font-bold text-[10px] flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>{currentWeekStats.warningReason}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Fast Status Switcher Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* 1 出勤 */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student, '1')}
                          className={`w-9 h-8 sm:w-10 sm:h-8 rounded-lg text-sm font-bold transition-all cursor-pointer border flex items-center justify-center ${
                            isPresent
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs ring-2 ring-emerald-200'
                              : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200'
                          }`}
                          title="1 出勤：正常到课，满分"
                        >
                          1
                        </button>

                        {/* L 迟到 */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student, 'L')}
                          className={`w-9 h-8 sm:w-10 sm:h-8 rounded-lg text-sm font-bold transition-all cursor-pointer border flex items-center justify-center ${
                            isLate
                              ? 'bg-sky-600 text-white border-sky-600 shadow-2xs ring-2 ring-sky-200'
                              : 'bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border-slate-200'
                          }`}
                          title="L 迟到：每满3次扣0.5分"
                        >
                          L
                        </button>

                        {/* P 请假 */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student, 'P')}
                          className={`w-9 h-8 sm:w-10 sm:h-8 rounded-lg text-sm font-bold transition-all cursor-pointer border flex items-center justify-center ${
                            isLeave
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs ring-2 ring-amber-200'
                              : 'bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border-slate-200'
                          }`}
                          title="P 请假：一次扣0.25分，需记录请假原因"
                        >
                          P
                        </button>

                        {/* A 旷课 */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student, 'A')}
                          className={`w-9 h-8 sm:w-10 sm:h-8 rounded-lg text-sm font-bold transition-all cursor-pointer border flex items-center justify-center ${
                            isAbsent
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs ring-2 ring-rose-200'
                              : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200'
                          }`}
                          title="A 旷课：一次扣0.5分"
                        >
                          A
                        </button>

                        {/* - 停课/换班 */}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student, '-')}
                          className={`w-9 h-8 sm:w-10 sm:h-8 rounded-lg text-sm font-bold transition-all cursor-pointer border flex items-center justify-center ${
                            isExempt
                              ? 'bg-slate-700 text-white border-slate-700 shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                          title="- 停课/换班(不扣)：0扣分"
                        >
                          -
                        </button>

                        {/* 清空未点名 */}
                        {currentStatus && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student, '')}
                            className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded cursor-pointer ml-1"
                            title="清空重置"
                          >
                            重置
                          </button>
                        )}
                      </div>

                      {/* Right: Leave Reason Input (Auto visible when P is selected, or on demand) */}
                      <div className="w-full sm:w-72 shrink-0">
                        {isLeave ? (
                          <div className="space-y-1 animate-in fade-in duration-150">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                placeholder="输入请假原因 (如: 发烧生病/家中有事)..."
                                defaultValue={
                                  existingNote
                                    ? existingNote.replace(/^\[\d{2}:\d{2}登记\]\s*/, '')
                                    : editingReasons[student.id] || ''
                                }
                                onChange={e => handleUpdateReason(student.id, e.target.value)}
                                className="w-full text-xs p-1.5 border border-amber-300 bg-amber-50/70 focus:bg-white rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-amber-900 placeholder-amber-400"
                              />
                            </div>
                            {/* Quick Reason Badges */}
                            <div className="flex flex-wrap gap-1">
                              {quickLeaveReasons.slice(0, 4).map(qr => (
                                <button
                                  key={qr}
                                  type="button"
                                  onClick={() => handleUpdateReason(student.id, qr)}
                                  className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 hover:text-amber-800 border border-slate-200 hover:border-amber-300 cursor-pointer"
                                >
                                  {qr}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : isAbsent ? (
                          <div className="text-[11px] text-rose-600 font-medium">
                            ⚠️ 旷课已登记（扣0.5分），建议课后联系跟进
                          </div>
                        ) : isLate ? (
                          <div className="text-[11px] text-sky-700 font-medium">
                            🕒 迟到已记录（每满3次扣0.5分）
                          </div>
                        ) : isPresent ? (
                          <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>正常出勤 (满分)</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-300">待点名...</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: 周次周期考勤透视分析 (Tab 2) */}
      {viewMode === 'weekly-stats' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Week KPI Overview Cards */}
          {activeClassWeeklySummary && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-400 font-medium">第 {selectedWeekNumber} 周到课率</div>
                <div className="text-lg font-bold font-mono text-blue-700 mt-1">
                  {activeClassWeeklySummary.attendanceRate}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">共 {activeClassWeeklySummary.totalExpectedPersonSessions} 人次</div>
              </div>
              <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-2xs">
                <div className="text-[11px] text-emerald-700 font-medium">1 正常到课</div>
                <div className="text-lg font-bold font-mono text-emerald-800 mt-1">
                  {activeClassWeeklySummary.totalPresent} 次
                </div>
                <div className="text-[10px] text-emerald-600 mt-0.5">全员出勤良好</div>
              </div>
              <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 shadow-2xs">
                <div className="text-[11px] text-sky-700 font-medium">L 迟到次数</div>
                <div className="text-lg font-bold font-mono text-sky-800 mt-1">
                  {activeClassWeeklySummary.totalLate} 次
                </div>
                <div className="text-[10px] text-sky-600 mt-0.5">满3次扣0.5分</div>
              </div>
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 shadow-2xs">
                <div className="text-[11px] text-amber-700 font-medium">P 请假人次</div>
                <div className="text-lg font-bold font-mono text-amber-800 mt-1">
                  {activeClassWeeklySummary.totalLeave} 次
                </div>
                <div className="text-[10px] text-amber-600 mt-0.5">每次扣0.25分</div>
              </div>
              <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 shadow-2xs">
                <div className="text-[11px] text-rose-700 font-medium">A 旷课人次</div>
                <div className="text-lg font-bold font-mono text-rose-800 mt-1">
                  {activeClassWeeklySummary.totalAbsent} 次
                </div>
                <div className="text-[10px] text-rose-600 mt-0.5">每次扣0.5分</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className="text-[11px] text-slate-500 font-medium">需关注/预警</div>
                <div className="text-lg font-bold font-mono text-rose-600 mt-1">
                  {activeClassWeeklySummary.warningStudentsCount} 人
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">旷课或缺课偏多</div>
              </div>
            </div>
          )}

          {/* Sub Toolbar: Single Week vs 10-Week Grand Matrix */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>
                  {weeklyTableMode === 'single-week'
                    ? `第 ${selectedWeekNumber} 周 学生考勤透视清单 (${activeWeekCycle.dateRangeText} · 第 ${activeWeekCycle.startDay}-${activeWeekCycle.endDay} 课)`
                    : '1-10周 全学期周期对比大表 (全景考勤透视)'}
                </span>
              </span>
              <span className="text-slate-400 text-xs">|</span>
              <span className="text-slate-500 text-[11px]">共 {students.length} 名在册学生</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle Table Mode */}
              <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setWeeklyTableMode('single-week')}
                  className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                    weeklyTableMode === 'single-week'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  第 {selectedWeekNumber} 周单周透视
                </button>
                <button
                  type="button"
                  onClick={() => setWeeklyTableMode('all-10-weeks')}
                  className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-all ${
                    weeklyTableMode === 'all-10-weeks'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1-10周全景对比
                </button>
              </div>

              {/* Warning Only Filter */}
              <button
                type="button"
                onClick={() => setWeeklyFilterWarningOnly(!weeklyFilterWarningOnly)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer flex items-center gap-1 ${
                  weeklyFilterWarningOnly
                    ? 'bg-rose-50 text-rose-700 border-rose-300 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>{weeklyFilterWarningOnly ? '显示全班' : '仅看预警学生'}</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {weeklyTableMode === 'single-week' ? (
              // Single Week Table
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-center">序号</th>
                      <th className="py-2.5 px-3 min-w-[140px]">学生姓名</th>
                      <th className="py-2.5 px-3 text-center w-20">1 出勤</th>
                      <th className="py-2.5 px-3 text-center w-20">L 迟到</th>
                      <th className="py-2.5 px-3 text-center w-20">P 请假</th>
                      <th className="py-2.5 px-3 text-center w-20">A 旷课</th>
                      <th className="py-2.5 px-3 text-center w-20">出勤率</th>
                      <th className="py-2.5 px-3 min-w-[200px]">本周各节课明细</th>
                      <th className="py-2.5 px-3 min-w-[130px]">本周学情研判</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedStudents
                      .map((student, idx) => {
                        const weeklyStats = calculateStudentWeeklyStats(
                          student,
                          activeWeekCycle,
                          currentClass.sessionDates || {}
                        );
                        return { student, idx, weeklyStats };
                      })
                      .filter(({ weeklyStats }) => {
                        if (!weeklyFilterWarningOnly) return true;
                        return (
                          weeklyStats.hasWarning ||
                          weeklyStats.absentCount > 0 ||
                          weeklyStats.leaveCount > 0 ||
                          weeklyStats.lateCount > 0
                        );
                      })
                      .map(({ student, idx, weeklyStats }) => (
                        <tr
                          key={student.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            weeklyStats.absentCount > 0
                              ? 'bg-rose-50/30'
                              : weeklyStats.leaveCount > 0
                              ? 'bg-amber-50/20'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">
                            {sortOrder === 'az' ? idx + 1 : student.no}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <StudentAvatarBadge
                                student={student}
                                size="sm"
                                onClick={() => onOpenAvatarPicker?.(student)}
                                className="cursor-pointer shrink-0"
                              />
                              <div>
                                <button
                                  type="button"
                                  onClick={() => onSelectStudentModal(student)}
                                  className="font-bold text-slate-900 hover:text-blue-600 text-left cursor-pointer"
                                >
                                  {student.name}
                                </button>
                                <span className="text-[10px] text-slate-400 font-mono ml-1">
                                  (No.{student.no})
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-full font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {weeklyStats.presentCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full font-mono ${
                                weeklyStats.lateCount > 0
                                  ? 'bg-sky-50 text-sky-800 font-bold border border-sky-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {weeklyStats.lateCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full font-mono ${
                                weeklyStats.leaveCount > 0
                                  ? 'bg-amber-50 text-amber-800 font-bold border border-amber-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {weeklyStats.leaveCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full font-mono ${
                                weeklyStats.absentCount > 0
                                  ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300 animate-pulse'
                                  : 'text-slate-400'
                              }`}
                            >
                              {weeklyStats.absentCount}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700">
                            {weeklyStats.attendanceRate}%
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {weeklyStats.statusList.map(item => (
                                <span
                                  key={item.day}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${
                                    item.status === '1'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : item.status === 'L'
                                      ? 'bg-sky-50 text-sky-800 border-sky-200 font-bold'
                                      : item.status === 'P'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200 font-bold'
                                      : item.status === 'A'
                                      ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                                      : item.status === '-'
                                      ? 'bg-slate-100 text-slate-600 border-slate-200'
                                      : 'bg-slate-50 text-slate-400 border-dashed border-slate-300'
                                  }`}
                                  title={`第 ${item.day} 课 (${item.date || '待定'})：${
                                    item.status || '未点名'
                                  }${item.note ? ` · ${item.note}` : ''}`}
                                >
                                  <span className="text-[10px] text-slate-400">D{item.day}:</span>
                                  <strong>{item.status || '-'}</strong>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {weeklyStats.absentCount > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px] flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>旷课待跟进</span>
                              </span>
                            ) : weeklyStats.leaveCount > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                                请假备忘
                              </span>
                            ) : weeklyStats.lateCount >= 2 ? (
                              <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 text-[11px]">
                                迟到偏多
                              </span>
                            ) : weeklyStats.presentCount === activeWeekCycle.sessionDays.length &&
                              activeWeekCycle.sessionDays.length > 0 ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                                ✅ 全勤模范
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">正常</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // 10-Week Grand Matrix
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] font-semibold">
                    <tr>
                      <th className="py-2.5 px-2 w-10 text-center sticky left-0 bg-slate-50 z-10">序号</th>
                      <th className="py-2.5 px-3 min-w-[120px] sticky left-10 bg-slate-50 z-10">学生姓名</th>
                      {weekCycles.map(w => (
                        <th key={w.weekNumber} className="py-2.5 px-2 text-center min-w-[90px]">
                          <div>第 {w.weekNumber} 周</div>
                          <div className="text-[9px] text-slate-400 font-normal">
                            {w.startDay > 0 ? `${w.startDay}-${w.endDay}课` : ''}
                          </div>
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center w-24">10周总缺旷</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedStudents.map((student, idx) => {
                      let totalSemesterAbsent = 0;
                      let totalSemesterLeave = 0;
                      let totalSemesterLate = 0;

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-2 text-center font-mono text-slate-500 sticky left-0 bg-white">
                            {sortOrder === 'az' ? idx + 1 : student.no}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 sticky left-10 bg-white">
                            <div className="flex items-center gap-1.5">
                              <StudentAvatarBadge
                                student={student}
                                size="xs"
                                onClick={() => onOpenAvatarPicker?.(student)}
                                className="cursor-pointer shrink-0"
                              />
                              <button
                                type="button"
                                onClick={() => onSelectStudentModal(student)}
                                className="hover:text-blue-600 text-left cursor-pointer truncate"
                              >
                                {student.name}
                              </button>
                            </div>
                          </td>
                          {weekCycles.map(w => {
                            const stats = calculateStudentWeeklyStats(
                              student,
                              w,
                              currentClass.sessionDates || {}
                            );
                            totalSemesterAbsent += stats.absentCount;
                            totalSemesterLeave += stats.leaveCount;
                            totalSemesterLate += stats.lateCount;

                            return (
                              <td key={w.weekNumber} className="py-2 px-1 text-center font-mono">
                                {stats.totalSessionsInWeek === 0 ? (
                                  <span className="text-slate-300">-</span>
                                ) : stats.absentCount > 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-300 text-[10px]">
                                    A:{stats.absentCount} 1:{stats.presentCount}
                                  </span>
                                ) : stats.leaveCount > 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200 text-[10px]">
                                    P:{stats.leaveCount} 1:{stats.presentCount}
                                  </span>
                                ) : stats.lateCount > 0 ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-200 text-[10px]">
                                    L:{stats.lateCount} 1:{stats.presentCount}
                                  </span>
                                ) : stats.presentCount === stats.totalSessionsInWeek ? (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200 text-[10px]">
                                    勤:{stats.presentCount}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 text-[11px]">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="py-2.5 px-3 text-center">
                            {totalSemesterAbsent > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-300 text-[10px]">
                                旷 {totalSemesterAbsent}次
                              </span>
                            ) : totalSemesterLeave > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 font-medium text-[10px]">
                                假 {totalSemesterLeave}次
                              </span>
                            ) : (
                              <span className="text-emerald-700 text-[10px] font-semibold">良好</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
