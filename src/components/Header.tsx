/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Download,
  Plus,
  Database,
  ChevronDown,
  Save,
  Check,
  FileDown,
  FileUp,
  FileSpreadsheet,
  Menu,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { ClassRoom, Student, Assignment } from '../types';
import { exportAllClassesToExcel, exportSingleClassToExcel } from '../utils/excelExport';

interface HeaderProps {
  currentTab: 'rollcall' | 'attendance' | 'homework' | 'grades' | 'journal' | 'overview';
  setCurrentTab: (tab: 'rollcall' | 'attendance' | 'homework' | 'grades' | 'journal' | 'overview') => void;
  classes: ClassRoom[];
  currentClass: ClassRoom;
  students: Student[];
  assignments: Assignment[];
  onOpenNewClass: () => void;
  onOpenNewAssignment?: () => void;
  onResetData?: () => void;
  onOpenBackup: () => void;
  onSaveData?: () => void;
  lastSavedTime?: Date | null;
  isJustSaved?: boolean;
  onExportStandardExcel?: () => void;
  onExportJSONBackup?: () => void;
  onImportJSONBackup?: () => void;
  onOpenSemesterReset?: () => void;
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapseSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  classes,
  currentClass,
  students,
  assignments,
  onOpenNewClass,
  onOpenBackup,
  onSaveData,
  lastSavedTime,
  isJustSaved,
  onExportStandardExcel,
  onExportJSONBackup,
  onImportJSONBackup,
  onOpenSemesterReset,
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onToggleCollapseSidebar
}) => {
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const handleExportAll = () => {
    exportAllClassesToExcel(classes, students, assignments);
    setExportDropdownOpen(false);
  };

  const handleExportCurrent = () => {
    exportSingleClassToExcel(currentClass, students, assignments);
    setExportDropdownOpen(false);
  };

  const TAB_TITLE_MAP: Record<string, { title: string; desc: string }> = {
    rollcall: {
      title: '📋 每日点名表',
      desc: '课时签到 · 迟到请假旷课快速标记'
    },
    attendance: {
      title: '📅 全周期考勤台账',
      desc: '30课时横向全景 · 换班转班状态浏览'
    },
    homework: {
      title: '📝 作业收缴与催交',
      desc: '按提交次数计平时分 · 智能逾期过滤高亮'
    },
    grades: {
      title: '📊 成绩录入与期末评定',
      desc: '考查分项折算加总 · 官方结业证书导出'
    },
    journal: {
      title: '📖 教师随笔札记',
      desc: '日常课堂表现随记 · 备课与反思'
    },
    overview: {
      title: '🏫 全班级教学概览',
      desc: '带教班级横向对比 · 综合统计'
    }
  };

  const currentTabMeta = TAB_TITLE_MAP[currentTab] || {
    title: '教学管理台账',
    desc: '柬埔寨-东盟国际学院'
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-amber-200/70 sticky top-0 z-20 shadow-2xs font-sans">
      <div className="w-full px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Mobile hamburger & Desktop collapse button & Current View Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            {onToggleMobileSidebar && (
              <button
                type="button"
                onClick={onToggleMobileSidebar}
                className="md:hidden p-2 rounded-xl text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                title="展开左侧导航菜单"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            {onToggleCollapseSidebar && (
              <button
                type="button"
                onClick={onToggleCollapseSidebar}
                className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer border shadow-2xs ${
                  isSidebarCollapsed
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-bold border-amber-400 ring-2 ring-amber-300/50'
                    : 'bg-amber-50 hover:bg-amber-100/90 text-amber-900 border-amber-200/90 hover:border-amber-300'
                }`}
                title={
                  isSidebarCollapsed
                    ? '展开左侧功能导航栏 (点击恢复)'
                    : '将左侧导航栏缩到看不见 (全屏浏览右侧表格，完全不挡内容)'
                }
              >
                {isSidebarCollapsed ? (
                  <>
                    <PanelLeftOpen className="w-4 h-4 text-amber-950" />
                    <span className="text-xs font-black">展开导航 🐾</span>
                  </>
                ) : (
                  <>
                    <PanelLeftClose className="w-4 h-4 text-amber-900" />
                    <span className="text-xs font-semibold hidden xl:inline">收起左栏</span>
                  </>
                )}
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
                  <span>{currentTabMeta.title}</span>
                </h2>
                <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300">
                  {currentClass.name}
                </span>
              </div>
              <p className="text-[11px] text-amber-800/80 font-medium hidden sm:block truncate mt-0.5">
                {currentTabMeta.desc}
              </p>
            </div>
          </div>

          {/* Right: Actions Bar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 实时自动保存指示徽章 (满足用户要求：直接去掉手动保存按钮，修改或添加直接自动实时保存) */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs select-none"
              title="实时自动保存已启用：您在网页上的任何录入与修改，均已即刻自动存入本地，无需重复手动点击保存，永不丢失！"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>已自动保存</span>
              {lastSavedTime && (
                <span className="hidden sm:inline text-[10px] text-emerald-600 font-mono opacity-80">
                  {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>

            {/* Standard Excel 1.Excel.xlsx Export */}
            {onExportStandardExcel && (
              <button
                type="button"
                onClick={onExportStandardExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/90 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="导出排版对齐且带出勤底色标记的 1.Excel.xlsx"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">导出</span>
                <span>1.Excel.xlsx</span>
              </button>
            )}

            {/* 清空备开学按钮 */}
            {onOpenSemesterReset && (
              <button
                type="button"
                onClick={onOpenSemesterReset}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="还没开始上新学期？点击一键清空考勤与作业记录，或重置班级花名册"
              >
                <span>🧹 清空备开学</span>
              </button>
            )}

            {/* JSON Backup Button */}
            {onExportJSONBackup && (
              <button
                type="button"
                onClick={onExportJSONBackup}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="导出JSON备份文件"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>备份</span>
              </button>
            )}

            {/* JSON Restore Button */}
            {onImportJSONBackup && (
              <button
                type="button"
                onClick={onImportJSONBackup}
                className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="选择本地JSON文件恢复数据"
              >
                <FileUp className="w-3.5 h-3.5 text-amber-600" />
                <span>还原</span>
              </button>
            )}

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出表格</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {exportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-56 bg-white border border-amber-200/90 rounded-2xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    {onExportStandardExcel && (
                      <>
                        <button
                          onClick={() => {
                            setExportDropdownOpen(false);
                            onExportStandardExcel();
                          }}
                          className="w-full text-left px-3 py-2 text-slate-800 hover:bg-emerald-50 flex flex-col cursor-pointer bg-emerald-50/40"
                        >
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            导出 1.Excel.xlsx (彩色底色)
                          </span>
                          <span className="text-[10px] text-emerald-700">对齐排版 · 颜色标注 · 方便打印</span>
                        </button>
                        <div className="border-t border-slate-100 my-0.5" />
                      </>
                    )}
                    <button
                      onClick={handleExportAll}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-amber-50 flex flex-col cursor-pointer"
                    >
                      <span className="font-bold text-slate-900">导出全班级Excel</span>
                      <span className="text-[10px] text-slate-400">全部8+班级完整工作簿 (多Sheet)</span>
                    </button>
                    <div className="border-t border-slate-100 my-0.5" />
                    <button
                      onClick={handleExportCurrent}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-amber-50 flex flex-col cursor-pointer"
                    >
                      <span className="font-bold text-slate-900">导出当前班级表格</span>
                      <span className="text-[10px] text-slate-400">{currentClass.name} 单班台账</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onOpenBackup}
              className="p-1.5 text-slate-400 hover:text-amber-800 hover:bg-amber-100/70 rounded-xl transition-colors cursor-pointer"
              title="数据备份与恢复中心"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
