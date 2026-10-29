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
  ArrowDownAZ
} from 'lucide-react';
import { ClassRoom, Student, AttendanceStatus, SessionMode } from '../types';
import { calculateStudentAttendance } from '../utils/calculations';

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

  // Full schedule modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [tempDates, setTempDates] = useState<Record<number, string>>({});
  const [tempModes, setTempModes] = useState<Record<number, SessionMode>>({});

  const totalSessions = currentClass.totalSessions || 30;

  // Open batch schedule modal
  const handleOpenScheduleModal = () => {
    setTempDates({ ...(currentClass.sessionDates || {}) });
    setTempModes({ ...(currentClass.sessionModes || {}) });
    setIsScheduleModalOpen(true);
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
      {/* Action / Helper Bar */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Class info & legend */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">{currentClass.name} 全周期考勤浏览台账</h2>
              <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-normal">
                （浏览核对模式 · 单击格子确定改动）
              </span>
              {onOpenEditClass && (
                <button
                  onClick={onOpenEditClass}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded cursor-pointer transition-colors border border-blue-200"
                  title="修改当前班级归属学期、班级名称、排期课时与追加学生"
                >
                  <Settings2 className="w-3 h-3 text-blue-600" />
                  <span>改班/修改归属学期</span>
                </button>
              )}
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                {currentClass.schedule} · 教室: {currentClass.room} · 共 {currentClass.totalSessions} 课时
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                <span>线下 {totalSessions - onlineCount} 节</span>
                <span className="text-slate-300">/</span>
                <span className="text-blue-600">线上网课 {onlineCount} 节</span>
              </span>
            </div>
            {/* Status legend */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px] flex items-center justify-center">1</span>
                <span>出勤</span>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-sky-50 text-sky-700 font-semibold text-[11px] flex items-center justify-center">L</span>
                <span>迟到(3次-0.5)</span>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-amber-50 text-amber-700 font-semibold text-[11px] flex items-center justify-center">P</span>
                <span>请假(-0.25)</span>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-rose-50 text-rose-700 font-semibold text-[11px] flex items-center justify-center">A</span>
                <span>旷课(-0.5)</span>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-slate-100 text-slate-400 text-[11px] flex items-center justify-center">-</span>
                <span>停课/换班(不扣)</span>
              </span>
              <span className="text-slate-400 text-[11px] ml-1">（单击表格任意格子开启修改确认窗口，点表头编辑排期）</span>
            </div>
          </div>

          {/* Right: Batch operations & filter & Schedule Modal */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onSwitchToRollCall && (
              <button
                onClick={onSwitchToRollCall}
                className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="进入今日快速点名界面"
              >
                <UserCheck className="w-3.5 h-3.5 text-white" />
                <span>去今日课堂点名</span>
              </button>
            )}

            {/* Quick schedule manager button */}
            <button
              onClick={handleOpenScheduleModal}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              title="统一设定所有课时日期及线上/线下形式"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>排期与形式</span>
            </button>

            {onSortClassStudentsAZ && (
              <button
                type="button"
                onClick={onSortClassStudentsAZ}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                title="按学生姓名 A-Z 拼音/字母升序重新排列全班学生并顺延重编学号"
              >
                <ArrowDownAZ className="w-3.5 h-3.5 text-blue-600" />
                <span>名册 A-Z 排序</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-md p-0.5 text-xs">
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
              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
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
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                title="随时录入新学生或插班生（支持单人或批量）"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ 录入插班生</span>
              </button>
            )}

            <button
              onClick={onOpenBatchImport}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
              title="批量粘贴姓名导入名单"
            >
              <span>批量导入</span>
            </button>

            {onSaveData && (
              <button
                onClick={onSaveData}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all flex items-center gap-1 cursor-pointer ${
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

                  return (
                    <th
                      key={day}
                      onClick={() => setEditingSession({ day, date: dateStr, mode })}
                      className={`py-1.5 px-1.5 border-r border-slate-100 text-center min-w-[42px] transition-colors cursor-pointer select-none group relative ${
                        isOnline ? 'bg-sky-50/70 hover:bg-sky-100/80' : 'hover:bg-slate-100/80'
                      }`}
                      title={`第${day}课 · ${dateStr || '点击输入日期'} · ${isOnline ? '线上上课' : '线下上课'} (点击可编辑日期与形式)`}
                    >
                      <div className="font-semibold text-[11px] text-slate-700 group-hover:text-blue-600 transition-colors">
                        {day}
                      </div>
                      <div className="text-[9px] text-slate-500 font-normal truncate max-w-[44px] mx-auto">
                        {dateStr || '-'}
                      </div>
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
                  <td colSpan={totalSessions + 9} className="py-12 text-center text-slate-400">
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
      {editingSession && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  修改第 {editingSession.day} 课时排期
                </h3>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  上课日期
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editingSession.date}
                    onChange={e => setEditingSession({ ...editingSession, date: e.target.value })}
                    placeholder="如: 08/24 或 9月15日"
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const m = String(today.getMonth() + 1).padStart(2, '0');
                      const d = String(today.getDate()).padStart(2, '0');
                      setEditingSession({ ...editingSession, date: `${m}/${d}` });
                    }}
                    className="px-2 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg shrink-0 cursor-pointer"
                    title="填入今日月日"
                  >
                    今天
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  支持任意文本格式（如 09/01 或 2026-09-01）
                </p>
              </div>

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
                    setEditingSession({
                      day: prevDay,
                      date: currentClass.sessionDates?.[prevDay] || '',
                      mode: currentClass.sessionModes?.[prevDay] || 'offline'
                    });
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
                    setEditingSession({
                      day: nextDay,
                      date: currentClass.sessionDates?.[nextDay] || '',
                      mode: currentClass.sessionModes?.[nextDay] || 'offline'
                    });
                  }}
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>下一课</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* Quick Batch Tools */}
            <div className="py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-200 my-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600 font-medium">快捷批量操作:</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const next: Record<number, SessionMode> = {};
                    for (let i = 1; i <= totalSessions; i++) next[i] = 'offline';
                    setTempModes(next);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  全部设为线下
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next: Record<number, SessionMode> = {};
                    for (let i = 1; i <= totalSessions; i++) next[i] = 'online';
                    setTempModes(next);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-blue-600 hover:bg-blue-50 cursor-pointer"
                >
                  全部设为线上
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next: Record<number, SessionMode> = {};
                    for (let i = 1; i <= totalSessions; i++) {
                      // 每逢周五或第5/10/15/20/25/30课设为线上，其他线下
                      next[i] = i % 5 === 0 ? 'online' : 'offline';
                    }
                    setTempModes(next);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  周期网课 (逢5节线上)
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

                  return (
                    <div
                      key={day}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                        isOnline ? 'bg-sky-50/60 border-sky-200' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono text-[11px] shrink-0">
                          {day}
                        </span>
                        <input
                          type="text"
                          value={dateVal}
                          placeholder={`如 08/${day < 10 ? '0' + day : day}`}
                          onChange={e => {
                            const val = e.target.value;
                            setTempDates(prev => ({ ...prev, [day]: val }));
                          }}
                          className="w-24 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
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
                共 {totalSessions} 课时 · 线上 {Object.values(tempModes).filter(m => m === 'online').length} 课时
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
