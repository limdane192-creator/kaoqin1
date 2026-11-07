/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  CalendarRange,
  Plus,
  Minus,
  RotateCcw,
  Sparkles,
  Check,
  Calendar,
  AlertCircle,
  HelpCircle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ClassRoom, WeekCycleConfig } from '../types';
import { WeekCycle } from '../utils/cycleHelper';
import { getWeekdayName } from '../utils/scheduleHelper';

interface CustomWeekCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassRoom;
  onSaveCustomWeekCycles: (classId: string, cycles: WeekCycleConfig[]) => void;
}

export const CustomWeekCycleModal: React.FC<CustomWeekCycleModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  onSaveCustomWeekCycles
}) => {
  if (!isOpen) return null;

  const totalSessions = currentClass.totalSessions || 30;
  const sessionDates = currentClass.sessionDates || {};

  // Initialize draft cycles based on existing custom cycles or smart defaults
  const [draftCycles, setDraftCycles] = useState<WeekCycleConfig[]>(() => {
    if (currentClass.customWeekCycles && currentClass.customWeekCycles.length > 0) {
      return JSON.parse(JSON.stringify(currentClass.customWeekCycles));
    }

    // Default: 3 sessions per week for 30 sessions, or 2 for 20
    const perWeek = currentClass.schedule.includes('周四') || currentClass.schedule.includes('周五')
      ? 2
      : totalSessions <= 24 ? 2 : 3;

    const list: WeekCycleConfig[] = [];
    let curDay = 1;
    let wNum = 1;

    while (curDay <= totalSessions) {
      const end = Math.min(totalSessions, curDay + perWeek - 1);
      const days: number[] = [];
      for (let d = curDay; d <= end; d++) {
        days.push(d);
      }
      list.push({
        weekNumber: wNum,
        startDay: curDay,
        endDay: end,
        sessionDays: days,
        label: `第 ${wNum} 周`
      });
      curDay = end + 1;
      wNum++;
    }
    return list;
  });

  // Re-calculate session ranges based on session counts of each week
  const recomputeCycleRanges = (cycles: WeekCycleConfig[]): WeekCycleConfig[] => {
    let currentDay = 1;
    const recomputed: WeekCycleConfig[] = [];

    cycles.forEach((c, idx) => {
      const desiredCount = Math.max(1, (c.sessionDays?.length || (c.endDay - c.startDay + 1) || 3));
      const startDay = currentDay;
      const endDay = Math.min(totalSessions, startDay + desiredCount - 1);

      const days: number[] = [];
      for (let d = startDay; d <= endDay; d++) {
        days.push(d);
      }

      recomputed.push({
        weekNumber: idx + 1,
        startDay,
        endDay,
        sessionDays: days,
        label: `第 ${idx + 1} 周`
      });

      currentDay = endDay + 1;
    });

    return recomputed;
  };

  // Change the number of days in a specific week
  const handleChangeWeekDays = (weekIndex: number, delta: number) => {
    const nextList = [...draftCycles];
    const current = nextList[weekIndex];
    if (!current) return;

    const currentCount = current.sessionDays?.length || (current.endDay - current.startDay + 1) || 1;
    const nextCount = Math.max(1, currentCount + delta);

    // Mock count array
    current.sessionDays = Array.from({ length: nextCount }, (_, i) => i + 1);
    const updated = recomputeCycleRanges(nextList);
    setDraftCycles(updated);
  };

  // Directly set the number of days for a specific week (e.g. 1天, 2天, 3天, 5天)
  const handleSetWeekDaysDirect = (weekIndex: number, exactDays: number) => {
    const nextList = [...draftCycles];
    const current = nextList[weekIndex];
    if (!current) return;

    current.sessionDays = Array.from({ length: exactDays }, (_, i) => i + 1);
    const updated = recomputeCycleRanges(nextList);
    setDraftCycles(updated);
  };

  // Add a new week to the end
  const handleAddWeek = () => {
    const nextList = [...draftCycles];
    const last = nextList[nextList.length - 1];
    const nextWeekNum = nextList.length + 1;
    const start = last ? last.endDay + 1 : 1;
    const end = Math.min(totalSessions, start + 2); // Default 3 days

    nextList.push({
      weekNumber: nextWeekNum,
      startDay: start,
      endDay: end,
      sessionDays: Array.from({ length: Math.max(1, end - start + 1) }, (_, i) => start + i),
      label: `第 ${nextWeekNum} 周`
    });

    const updated = recomputeCycleRanges(nextList);
    setDraftCycles(updated);
  };

  // Remove a week
  const handleDeleteWeek = (weekIndex: number) => {
    if (draftCycles.length <= 1) return;
    const nextList = draftCycles.filter((_, idx) => idx !== weekIndex);
    const updated = recomputeCycleRanges(nextList);
    setDraftCycles(updated);
  };

  // Preset 1: 均分每周 3 天 (周一/三班)
  const handlePreset3Days = () => {
    const list: WeekCycleConfig[] = [];
    let cur = 1;
    let w = 1;
    while (cur <= totalSessions) {
      const end = Math.min(totalSessions, cur + 2);
      const days = [];
      for (let d = cur; d <= end; d++) days.push(d);
      list.push({ weekNumber: w, startDay: cur, endDay: end, sessionDays: days, label: `第 ${w} 周` });
      cur = end + 1;
      w++;
    }
    setDraftCycles(list);
  };

  // Preset 2: 均分每周 2 天 (周四/五班)
  const handlePreset2Days = () => {
    const list: WeekCycleConfig[] = [];
    let cur = 1;
    let w = 1;
    while (cur <= totalSessions) {
      const end = Math.min(totalSessions, cur + 1);
      const days = [];
      for (let d = cur; d <= end; d++) days.push(d);
      list.push({ weekNumber: w, startDay: cur, endDay: end, sessionDays: days, label: `第 ${w} 周` });
      cur = end + 1;
      w++;
    }
    setDraftCycles(list);
  };

  // Preset 3: 均分每周 5 天 (工作日班)
  const handlePreset5Days = () => {
    const list: WeekCycleConfig[] = [];
    let cur = 1;
    let w = 1;
    while (cur <= totalSessions) {
      const end = Math.min(totalSessions, cur + 4);
      const days = [];
      for (let d = cur; d <= end; d++) days.push(d);
      list.push({ weekNumber: w, startDay: cur, endDay: end, sessionDays: days, label: `第 ${w} 周` });
      cur = end + 1;
      w++;
    }
    setDraftCycles(list);
  };

  // Preset 4: 均分每周 1 天
  const handlePreset1Day = () => {
    const list: WeekCycleConfig[] = [];
    for (let d = 1; d <= totalSessions; d++) {
      list.push({ weekNumber: d, startDay: d, endDay: d, sessionDays: [d], label: `第 ${d} 周` });
    }
    setDraftCycles(list);
  };

  // Preset 5: 按公历自然周自动合并 (若排期日期属于同一周一至周日则合并为同一周)
  const handlePresetNaturalCalendarWeeks = () => {
    const daysWithDates = Array.from({ length: totalSessions }, (_, i) => i + 1);
    const groups: { [key: string]: number[] } = {};

    daysWithDates.forEach(day => {
      const dateStr = sessionDates[day];
      if (dateStr) {
        // Parse date
        const parts = dateStr.includes('-')
          ? dateStr.split('-').map(Number)
          : dateStr.includes('/')
          ? dateStr.split('/').map(Number)
          : [];
        let dObj: Date | null = null;
        if (parts.length === 3) {
          dObj = new Date(parts[0], parts[1] - 1, parts[2]);
        } else if (parts.length === 2) {
          dObj = new Date(new Date().getFullYear(), parts[0] - 1, parts[1]);
        }

        if (dObj && !isNaN(dObj.getTime())) {
          // Calculate Monday of that week
          const dayOfWeek = dObj.getDay();
          const diffToMon = (dayOfWeek + 6) % 7;
          const monDate = new Date(dObj);
          monDate.setDate(dObj.getDate() - diffToMon);
          const monKey = `${monDate.getFullYear()}-${monDate.getMonth() + 1}-${monDate.getDate()}`;
          if (!groups[monKey]) groups[monKey] = [];
          groups[monKey].push(day);
          return;
        }
      }

      // Fallback
      const fallbackKey = `group_${Math.ceil(day / 3)}`;
      if (!groups[fallbackKey]) groups[fallbackKey] = [];
      groups[fallbackKey].push(day);
    });

    const list: WeekCycleConfig[] = [];
    let w = 1;
    Object.values(groups).forEach(sessionDays => {
      if (sessionDays.length > 0) {
        sessionDays.sort((a, b) => a - b);
        list.push({
          weekNumber: w,
          startDay: sessionDays[0],
          endDay: sessionDays[sessionDays.length - 1],
          sessionDays,
          label: `第 ${w} 周`
        });
        w++;
      }
    });

    const updated = recomputeCycleRanges(list);
    setDraftCycles(updated);
  };

  // Total sessions assigned
  const totalAssignedSessions = draftCycles.reduce(
    (sum, c) => sum + (c.sessionDays?.length || 0),
    0
  );

  const handleSave = () => {
    // Clean and validate
    const valid = draftCycles.filter(c => c.sessionDays && c.sessionDays.length > 0);
    onSaveCustomWeekCycles(currentClass.id, valid);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner">
              <CalendarRange className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  调整周次周期 (自定义每周天数)
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  班级: {currentClass.name}
                </span>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                支持自由设置每一周包含 1天、2天、3天、5天；如遇节假日调课或考试，可灵活定制考勤表头周次分组
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* Preset Buttons Strip */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>快速一键周期模板：</span>
              </span>
              <span className="text-[11px] text-amber-700">
                可先选用最接近的模板，再在下方微调某一周（如把某周改为1天或5天）
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePreset3Days}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                title="周一/周三上课等常用：每周3天，共10周30课"
              >
                <span>⚡ 均分 3 天/周 (30课/10周)</span>
              </button>
              <button
                type="button"
                onClick={handlePreset2Days}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                title="周四/周五上课等常用：每周2天，共10周20课"
              >
                <span>⚡ 均分 2 天/周 (20课/10周)</span>
              </button>
              <button
                type="button"
                onClick={handlePreset5Days}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                title="全日制连续上课：每周5天"
              >
                <span>⚡ 均分 5 天/周 (工作日班)</span>
              </button>
              <button
                type="button"
                onClick={handlePreset1Day}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                title="每周单课：每周1天"
              >
                <span>⚡ 均分 1 天/周</span>
              </button>
              <button
                type="button"
                onClick={handlePresetNaturalCalendarWeeks}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                title="根据表格排期公历日期，同属于自然周一至周日的自动合并为同一教学周"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>📅 按公历真实自然周归并</span>
              </button>
            </div>
          </div>

          {/* Live Preview Strip (Matching 图2) */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>考勤表头周次分组即时预览 (图2 表头效果)：</span>
              </span>
              <span className={`text-xs font-mono font-bold ${totalAssignedSessions === totalSessions ? 'text-emerald-700' : 'text-amber-700'}`}>
                已覆盖课时: {totalAssignedSessions} / {totalSessions} 课时
              </span>
            </div>

            {/* Mini Visual Table Header */}
            <div className="overflow-x-auto custom-scrollbar border border-slate-300 rounded-lg bg-white">
              <div className="flex divide-x divide-slate-300 min-w-max text-center">
                {draftCycles.map((cycle, idx) => {
                  const daysCount = cycle.sessionDays?.length || 0;
                  const isEven = idx % 2 === 0;
                  const firstDate = sessionDates[cycle.startDay] || '';
                  const lastDate = sessionDates[cycle.endDay] || '';
                  const dateStr = firstDate && lastDate ? `${firstDate}~${lastDate}` : firstDate || '待排期';

                  return (
                    <div
                      key={idx}
                      className={`p-2 transition-colors min-w-[90px] ${
                        isEven ? 'bg-amber-100/90 text-amber-950' : 'bg-orange-100/90 text-orange-950'
                      }`}
                      style={{ flex: daysCount }}
                    >
                      <div className="flex items-center justify-center gap-1 font-bold text-xs whitespace-nowrap">
                        <span className={`w-3.5 h-3.5 rounded-full text-[9px] flex items-center justify-center font-black ${
                          isEven ? 'bg-amber-400 text-amber-950' : 'bg-orange-400 text-orange-950'
                        }`}>
                          {cycle.weekNumber}
                        </span>
                        <span>第 {cycle.weekNumber} 周</span>
                        <span className="text-[10px] bg-white/70 px-1 py-0.2 rounded font-mono font-bold">
                          {daysCount}天
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-600 mt-0.5 truncate">
                        第 {cycle.startDay} ~ {cycle.endDay} 课
                      </div>
                      <div className="text-[9px] font-mono text-slate-500 truncate">
                        ({dateStr})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Week by Week Configuration Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900">
                周次明细调整列表（共 {draftCycles.length} 周）：
              </span>
              <button
                type="button"
                onClick={handleAddWeek}
                className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>增加下一周</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {draftCycles.map((cycle, idx) => {
                const daysCount = cycle.sessionDays?.length || 0;
                const firstDate = sessionDates[cycle.startDay] || '';
                const lastDate = sessionDates[cycle.endDay] || '';
                const dateText = firstDate && lastDate ? `${firstDate} ~ ${lastDate}` : firstDate || '公历日期未排';

                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-amber-400 bg-white shadow-2xs hover:shadow-xs transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                          {cycle.weekNumber}
                        </span>
                        <span className="font-extrabold text-xs text-slate-900">
                          第 {cycle.weekNumber} 周
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          (第 {cycle.startDay} - {cycle.endDay} 课)
                        </span>
                      </div>

                      {draftCycles.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteWeek(idx)}
                          className="text-[11px] text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                          title="删除此周"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Stepper & Quick Days Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-600 font-medium">本周包含：</span>
                        <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50 p-0.5">
                          <button
                            type="button"
                            disabled={daysCount <= 1}
                            onClick={() => handleChangeWeekDays(idx, -1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed rounded"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold font-mono text-blue-900">
                            {daysCount} 天
                          </span>
                          <button
                            type="button"
                            disabled={daysCount >= 7}
                            onClick={() => handleChangeWeekDays(idx, 1)}
                            className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed rounded"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Quick shortcut pills */}
                      <div className="flex items-center gap-1 text-[11px]">
                        {[1, 2, 3, 5].map(d => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleSetWeekDaysDirect(idx, d)}
                            className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors cursor-pointer ${
                              daysCount === d
                                ? 'bg-amber-500 text-white font-bold'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {d}天
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Date hint */}
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>公历日期: {dateText}</span>
                      <span className="text-slate-500 font-mono">
                        {cycle.sessionDays?.map(d => `D${d}`).join(', ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>保存后考勤表格顶部周次合并栏（图2）将即刻按您的设定展示，并自动实时保存。</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>保存并应用自定义周次周期</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
