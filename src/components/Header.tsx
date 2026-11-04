/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Plus, Database, ChevronDown, Save, Check, FileDown, FileUp, FileSpreadsheet, Sparkles } from 'lucide-react';
import { ClassRoom, Student, Assignment } from '../types';
import { exportAllClassesToExcel, exportSingleClassToExcel } from '../utils/excelExport';
import { CutePandaStudent } from './CuteIllustrations';

interface HeaderProps {
  currentTab: 'rollcall' | 'attendance' | 'homework' | 'grades' | 'journal' | 'overview';
  setCurrentTab: (tab: 'rollcall' | 'attendance' | 'homework' | 'grades' | 'journal' | 'overview') => void;
  classes: ClassRoom[];
  currentClass: ClassRoom;
  students: Student[];
  assignments: Assignment[];
  onOpenNewClass: () => void;
  onOpenNewAssignment: () => void;
  onResetData: () => void;
  onOpenBackup: () => void;
  onSaveData?: () => void;
  lastSavedTime?: Date | null;
  isJustSaved?: boolean;
  onExportStandardExcel?: () => void;
  onExportJSONBackup?: () => void;
  onImportJSONBackup?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
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
  onImportJSONBackup
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

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-amber-200/70 sticky top-0 z-40 shadow-2xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Brand Wordmark & Mascot */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative group cursor-pointer" onClick={() => setCurrentTab('rollcall')}>
              <CutePandaStudent size={36} className="drop-shadow-2xs" />
              <span className="absolute -bottom-1 -right-1 text-[10px]">🌸</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 text-base tracking-tight hover:text-amber-900 transition-colors">
                  教学跟踪妮士
                </span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded-full border border-amber-300">
                  萌趣教学版 🐾
                </span>
              </div>
              <p className="text-[10px] text-amber-800/80 font-medium hidden md:block">
                柬埔寨-东盟国际学院 · 中文部 · {classes.length}个带教班级
              </p>
            </div>
          </div>

          {/* Navigation Links - Cute Bubbly Tabs */}
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-amber-50/60 p-1 rounded-2xl border border-amber-200/50">
            <button
              onClick={() => setCurrentTab('rollcall')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                currentTab === 'rollcall'
                  ? 'bg-amber-400 text-amber-950 shadow-xs border border-amber-300'
                  : 'text-slate-600 hover:text-amber-900 hover:bg-amber-100/50'
              }`}
            >
              <span>📋</span>
              <span>点名表</span>
            </button>

            <button
              onClick={() => setCurrentTab('attendance')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                currentTab === 'attendance'
                  ? 'bg-amber-400 text-amber-950 shadow-xs border border-amber-300'
                  : 'text-slate-600 hover:text-amber-900 hover:bg-amber-100/50'
              }`}
            >
              <span>📅</span>
              <span>全周期考勤</span>
            </button>

            <button
              onClick={() => setCurrentTab('homework')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 relative ${
                currentTab === 'homework'
                  ? 'bg-amber-400 text-amber-950 shadow-xs border border-amber-300'
                  : 'text-slate-600 hover:text-amber-900 hover:bg-amber-100/50'
              }`}
            >
              <span>📝</span>
              <span>作业收缴</span>
            </button>

            <button
              onClick={() => setCurrentTab('grades')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                currentTab === 'grades'
                  ? 'bg-amber-400 text-amber-950 shadow-xs border border-amber-300'
                  : 'text-slate-600 hover:text-amber-900 hover:bg-amber-100/50'
              }`}
            >
              <span>📊</span>
              <span>成绩与评定</span>
            </button>

            <button
              onClick={() => setCurrentTab('journal')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                currentTab === 'journal'
                  ? 'bg-amber-400 text-amber-950 shadow-xs border border-amber-300'
                  : 'text-slate-600 hover:text-amber-900 hover:bg-amber-100/50'
              }`}
            >
              <span>📖</span>
              <span>教师随笔</span>
            </button>

            <button
              onClick={() => setCurrentTab('overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                currentTab === 'overview'
                  ? 'bg-amber-400 text-amber-950 shadow-xs border border-amber-300'
                  : 'text-slate-600 hover:text-amber-900 hover:bg-amber-100/50'
              }`}
            >
              <span>🏫</span>
              <span>班级全貌</span>
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Save Data Button */}
            {onSaveData && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onSaveData}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs border ${
                    isJustSaved
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-200'
                      : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400 shadow-amber-500/20 active:scale-98'
                  }`}
                  title="立即将所有班级、考勤、成绩与作业保存至浏览器本地（数据永不丢失）"
                >
                  {isJustSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white animate-in zoom-in-75 duration-150" />
                      <span>已安全保存 ✨</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>保存数据 💾</span>
                    </>
                  )}
                </button>

                {lastSavedTime && (
                  <span
                    className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono"
                    title={`已自动实时写入浏览器本地缓存。最后确认保存：${lastSavedTime.toLocaleTimeString()}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>
                      {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Standard Excel Export */}
            {onExportStandardExcel && (
              <button
                type="button"
                onClick={onExportStandardExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100/80 hover:bg-emerald-200/90 border border-emerald-300 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="导出排版对齐且带出勤底色标记的 1.Excel.xlsx"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">导出</span>
                <span>1.Excel.xlsx</span>
              </button>
            )}

            {/* JSON Backup Button */}
            {onExportJSONBackup && (
              <button
                type="button"
                onClick={onExportJSONBackup}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="导出JSON完整备份文件"
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-amber-50 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="选择本地JSON文件恢复所有数据"
              >
                <FileUp className="w-3.5 h-3.5 text-amber-600" />
                <span>还原</span>
              </button>
            )}

            <button
              onClick={onOpenNewClass}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-100/70 hover:bg-amber-200 rounded-xl transition-colors cursor-pointer border border-amber-300"
            >
              <Plus className="w-3.5 h-3.5 text-amber-700" />
              <span>加班</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {exportDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setExportDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-amber-200/90 rounded-2xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
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
                          <span className="text-[10px] text-emerald-700">对齐排版 · 颜色标注 · 完美打印</span>
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
