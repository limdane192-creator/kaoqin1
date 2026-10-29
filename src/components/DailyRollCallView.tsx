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
  ArrowDownAZ
} from 'lucide-react';
import { ClassRoom, Student, AttendanceStatus, SessionMode } from '../types';
import { compareStudentNamesAZ } from '../utils/calculations';

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
  onSortClassStudentsAZ
}) => {
  const totalSessions = currentClass.totalSessions || 30;

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

  // 一键全员出勤 (1)
  const handleBatchAllPresent = () => {
    onBatchSetAttendance(selectedDay, '1');
  };

  // 单人更改状态
  const handleStatusChange = (student: Student, newStatus: AttendanceStatus) => {
    let currentNote = student.attendanceNotes?.[selectedDay] || '';

    // 如果选择请假 (P)，自动记录时间戳并提供原因
    if (newStatus === 'P' && !currentNote) {
      const autoReason = editingReasons[student.id] || '事假/病假';
      currentNote = `[${formattedTimeStr}登记] ${autoReason}`;
    }

    onUpdateStudentAttendance(student.id, selectedDay, newStatus, currentNote);
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

  const sessionDateText = currentClass.sessionDates?.[selectedDay] || shortDateStr;
  const sessionMode = currentClass.sessionModes?.[selectedDay] || 'offline';

  return (
    <div className="space-y-4">
      {/* Top Banner: Today's Class & Auto Date / Time Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Session Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg p-1 text-xs">
              <span className="text-slate-500 pl-1">当前点名课时:</span>
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(Number(e.target.value))}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-xs font-bold text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {Array.from({ length: totalSessions }, (_, i) => i + 1).map(day => {
                  const dDate = currentClass.sessionDates?.[day] || `课时${day}`;
                  const dMode = currentClass.sessionModes?.[day] === 'online' ? '线上' : '线下';
                  return (
                    <option key={day} value={day}>
                      第 {day} 课 ({dDate} · {dMode})
                    </option>
                  );
                })}
              </select>
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
                (共 {students.length} 名在册学生)
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
                  {/* Left: Student Identity */}
                  <div className="flex items-center gap-3 shrink-0 min-w-[200px]">
                    <span
                      className={`w-7 h-7 rounded-lg font-mono text-xs font-bold flex items-center justify-center shrink-0 ${
                        sortOrder === 'az'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                      title={sortOrder === 'az' ? `A-Z 序号 ${idx + 1}（学号 No.${student.no}）` : `学号 No.${student.no}`}
                    >
                      {sortOrder === 'az' ? idx + 1 : student.no}
                    </span>
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
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        {student.gender && <span>{student.gender}</span>}
                        {existingNote && (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            {existingNote}
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
  );
};
