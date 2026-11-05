/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CheckSquare,
  CalendarDays,
  FileCheck2,
  GraduationCap,
  BookOpenText,
  Building2,
  Plus,
  Database,
  X,
  Sparkles,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BarChart3,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { ClassRoom, Student, Assignment } from '../types';
import { CutePandaStudent, CutePawIcon } from './CuteIllustrations';

export type NavTabType = 'rollcall' | 'attendance' | 'homework' | 'grades' | 'journal' | 'overview';

interface SidebarProps {
  currentTab: NavTabType;
  setCurrentTab: (tab: NavTabType) => void;
  classes: ClassRoom[];
  currentClass: ClassRoom;
  students: Student[];
  assignments: Assignment[];
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenNewClass: () => void;
  onOpenBackup: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItemConfig {
  id: NavTabType;
  label: string;
  subtitle: string;
  emoji: string;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  classes,
  currentClass,
  students,
  assignments,
  isOpenMobile,
  onCloseMobile,
  onOpenNewClass,
  onOpenBackup,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [isChartCollapsed, setIsChartCollapsed] = React.useState<boolean>(false);

  const classStudents = students.filter(s => s.classId === currentClass.id);
  const currentClassStudentsCount = classStudents.length;

  // 快捷统计班级总体出勤率与作业缴交率
  const classAttendanceRate = React.useMemo(() => {
    let totalSessionsRecorded = 0;
    let presentSessions = 0;
    classStudents.forEach(stu => {
      Object.values(stu.attendance || {}).forEach(status => {
        if (status) {
          totalSessionsRecorded++;
          if (status === '1') presentSessions++;
          else if (status === 'L') presentSessions += 0.8;
          else if (status === 'P') presentSessions += 0.9;
        }
      });
    });
    if (totalSessionsRecorded === 0) return 100;
    return Math.min(100, Math.round((presentSessions / totalSessionsRecorded) * 100));
  }, [classStudents]);

  const classHwRate = React.useMemo(() => {
    const classAssignments = assignments.filter(a => a.classId === currentClass.id);
    if (classAssignments.length === 0 || classStudents.length === 0) return 100;
    const totalPossible = classAssignments.length * classStudents.length;
    let totalSubmitted = 0;
    classAssignments.forEach(a => {
      classStudents.forEach(s => {
        const sub = a.submissions?.[s.id];
        if (sub && (sub.status === 'submitted' || sub.status === 'late')) {
          totalSubmitted++;
        }
      });
    });
    return Math.round((totalSubmitted / totalPossible) * 100);
  }, [assignments, currentClass.id, classStudents]);

  // 统计距离截止时间不足48小时的紧急作业总数
  const urgent48hCount = React.useMemo(() => {
    const now = Date.now();
    return assignments.filter(a => {
      if (!a.dueDate) return false;
      const parts = a.dueDate.split(/[-/]/);
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
        dueTime = new Date(a.dueDate).getTime();
      }
      const diffMs = dueTime - now;
      const hours = diffMs / (1000 * 60 * 60);
      return hours >= 0 && hours <= 48;
    }).length;
  }, [assignments]);

  const NAV_ITEMS: NavItemConfig[] = [
    {
      id: 'rollcall',
      label: '点名表',
      subtitle: '每日签到与出勤快速登记',
      emoji: '📋'
    },
    {
      id: 'attendance',
      label: '全周期考勤',
      subtitle: '全学期30课时明细浏览',
      emoji: '📅'
    },
    {
      id: 'homework',
      label: '作业收缴',
      subtitle: '智能逾期过滤与一键催交',
      emoji: '📝',
      badge: urgent48hCount > 0 ? `🔥 ${urgent48hCount}项临近` : '逾期催交'
    },
    {
      id: 'grades',
      label: '成绩与评定',
      subtitle: '考查分项折算与期末结业证',
      emoji: '📊'
    },
    {
      id: 'journal',
      label: '教师随笔',
      subtitle: '课堂观察纪实与备课备忘',
      emoji: '📖'
    },
    {
      id: 'overview',
      label: '班级全貌',
      subtitle: '全校8+带教班级横向概览',
      emoji: '🏫',
      badge: urgent48hCount > 0 ? '🔥 截止预警' : undefined
    }
  ];

  const handleNavClick = (tabId: NavTabType) => {
    setCurrentTab(tabId);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 bg-white/95 backdrop-blur-md border-r border-amber-200/80 shadow-sm font-sans">
      {/* 1. Header / Brand Mascot */}
      <div>
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="relative cursor-pointer group" onClick={() => handleNavClick('rollcall')}>
              <CutePandaStudent size={42} className="drop-shadow-2xs transition-transform group-hover:scale-105" />
              <span className="absolute -bottom-1 -right-1 text-[11px]">🌸</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-slate-900 text-base tracking-tight">
                  教学跟踪妮士
                </h1>
              </div>
              <p className="text-[10px] font-bold text-amber-800/90 mt-0.5 flex items-center gap-1">
                <span>柬东国际学院 · 中文部</span>
                <span className="text-[9px]">🐾</span>
              </p>
            </div>
          </div>

          {/* Close button for Mobile drawer & Collapse button for Desktop */}
          <div className="flex items-center gap-1">
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden md:flex p-1.5 text-amber-900/60 hover:text-amber-950 hover:bg-amber-100 rounded-xl transition-all cursor-pointer items-center justify-center group"
                title="将左侧导航栏缩到看不见 (全屏浏览右侧表格，完全不挡内容)"
              >
                <PanelLeftClose className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              </button>
            )}
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-amber-100/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Class Quick Glance Card */}
        <div className="mb-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between gap-2 shadow-2xs">
          <div className="min-w-0">
            <div className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
              <span>当前带教班级</span>
              <span>🎒</span>
            </div>
            <div className="text-xs font-black text-slate-900 truncate mt-0.5">
              {currentClass.name}
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold bg-amber-200/70 text-amber-950 px-2 py-0.5 rounded-full shrink-0">
            {currentClassStudentsCount}人
          </span>
        </div>

        {/* Collapsible Mini Stat Chart Widget (缩到看不见的图表) */}
        <div className="mb-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl overflow-hidden transition-all shadow-2xs">
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-amber-100/60 border-b border-amber-200/60">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900">
              <BarChart3 className="w-3.5 h-3.5 text-amber-700" />
              <span>出勤与作业速览图表</span>
            </div>
            <button
              type="button"
              onClick={() => setIsChartCollapsed(!isChartCollapsed)}
              className="text-[10px] text-amber-800 hover:text-amber-950 px-1.5 py-0.5 rounded hover:bg-amber-200/70 font-semibold cursor-pointer flex items-center gap-0.5 transition-colors"
              title={isChartCollapsed ? '展开图表' : '点击将图表缩到看不见，不占空间'}
            >
              <span>{isChartCollapsed ? '展开图表' : '缩到看不见'}</span>
              {isChartCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>
          </div>

          {!isChartCollapsed && (
            <div className="p-2.5 space-y-2 text-[11px] animate-in fade-in duration-150">
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1 font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>📅 出勤率</span>
                  </span>
                  <span className="font-bold text-emerald-700 font-mono">{classAttendanceRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${classAttendanceRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-[10px] mb-1 font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>📝 作业提交率</span>
                  </span>
                  <span className="font-bold text-blue-700 font-mono">{classHwRate}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/70">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${classHwRate}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Navigation List (Left-hand Side Vertical Tabs - No more vertical text squishing!) */}
        <div className="space-y-1.5">
          <div className="px-2 pb-1 text-[10px] font-bold text-amber-900/60 uppercase tracking-wider flex items-center justify-between">
            <span>系统功能浏览导航</span>
            <span className="text-[9px]">✨</span>
          </div>

          {NAV_ITEMS.map(item => {
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 font-black shadow-sm shadow-amber-400/25 border border-amber-300 ring-2 ring-amber-300/40'
                    : 'text-slate-700 hover:text-amber-950 hover:bg-amber-50/80 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-base shrink-0 group-hover:scale-110 transition-transform">
                    {item.emoji}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs tracking-tight truncate flex items-center gap-1.5">
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                            item.badge.includes('🔥')
                              ? 'bg-orange-500 text-white font-black shadow-xs ring-1 ring-orange-300 animate-pulse'
                              : isActive
                              ? 'bg-amber-950 text-amber-100'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className={`text-[10px] truncate leading-tight mt-0.5 ${
                      isActive ? 'text-amber-950/80 font-medium' : 'text-slate-400'
                    }`}>
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isActive ? 'text-amber-950 translate-x-0.5' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                }`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Footer Actions & Backup */}
      <div className="pt-3 border-t border-amber-100 space-y-2 mt-4">
        {/* Quick add class */}
        <button
          type="button"
          onClick={() => {
            onOpenNewClass();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 bg-amber-100/70 hover:bg-amber-200/80 rounded-xl transition-colors cursor-pointer border border-amber-300/80 shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-amber-700" />
          <span>添加新教学班级</span>
        </button>

        {/* Backup button */}
        <button
          type="button"
          onClick={() => {
            onOpenBackup();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-amber-50/80 rounded-xl transition-colors cursor-pointer border border-slate-200"
          title="数据备份与还原管理"
        >
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>数据备份与恢复中心</span>
        </button>

        {/* Teacher Signature Badge */}
        <div className="text-center pt-1.5">
          <p className="text-[10px] text-slate-400 font-serif flex items-center justify-center gap-1">
            <span>林达妮 老师 · 专属教务台账</span>
            <span>🌸</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Left Sidebar (支持缩到看不见，完全不挡右边所有表格内容) */}
      <aside
        className={`hidden md:block shrink-0 sticky top-0 h-screen z-30 overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'
        }`}
      >
        <div className="w-64 h-full">
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer (Slide out with backdrop) */}
      {isOpenMobile && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
