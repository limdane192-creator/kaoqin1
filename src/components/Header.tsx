/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Plus, Database, ChevronDown, Save, Check, FileDown, FileUp, FileSpreadsheet } from 'lucide-react';
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
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand Wordmark & Semester metadata */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="font-bold text-slate-900 text-base tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span>
              教学跟踪妮士
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium hidden md:inline">
              {classes.length}个带教班级 · 教师台账
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setCurrentTab('rollcall')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                currentTab === 'rollcall'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              点名
            </button>
            <button
              onClick={() => setCurrentTab('attendance')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                currentTab === 'attendance'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              考勤
            </button>
            <button
              onClick={() => setCurrentTab('homework')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                currentTab === 'homework'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              作业
            </button>
            <button
              onClick={() => setCurrentTab('grades')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                currentTab === 'grades'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              成绩
            </button>
            <button
              onClick={() => setCurrentTab('journal')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                currentTab === 'journal'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              反思
            </button>
            <button
              onClick={() => setCurrentTab('overview')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                currentTab === 'overview'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              总览
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Explicit Save Data Button */}
            {onSaveData && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onSaveData}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer shadow-2xs border ${
                    isJustSaved
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 ring-2 ring-emerald-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  }`}
                  title="立即将所有班级、考勤、成绩与手记保存至本地浏览器（明天打开依然完好保留）"
                >
                  {isJustSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white animate-in zoom-in-75 duration-150" />
                      <span>已安全保存</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>保存数据</span>
                    </>
                  )}
                </button>

                {lastSavedTime && (
                  <span
                    className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono"
                    title={`数据已自动实时写入浏览器本地缓存。最后确认保存时间：${lastSavedTime.toLocaleTimeString()}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>
                      {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Standard Excel 1.Excel.xlsx Export */}
            {onExportStandardExcel && (
              <button
                type="button"
                onClick={onExportStandardExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-all shadow-2xs cursor-pointer"
                title="导出排版对齐且带出勤底色标记的 1.Excel.xlsx（可复制到 D:\A课件\51.备份\1.Excel考勤备份）"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">导出</span>
                <span>1.Excel.xlsx</span>
              </button>
            )}

            {/* JSON Backup Button */}
            {onExportJSONBackup && (
              <button
                type="button"
                onClick={onExportJSONBackup}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-all shadow-2xs cursor-pointer"
                title="导出JSON备份文件（可复制到 D:\A课件\51.备份\2.考勤备份）"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>导出JSON备份</span>
              </button>
            )}

            {/* JSON Restore Button */}
            {onImportJSONBackup && (
              <button
                type="button"
                onClick={onImportJSONBackup}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-all shadow-2xs cursor-pointer"
                title="选择本地JSON文件恢复所有班级数据"
              >
                <FileUp className="w-3.5 h-3.5 text-amber-600" />
                <span>导入JSON恢复数据</span>
              </button>
            )}

            <button
              onClick={onOpenNewClass}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>新建班级</span>
            </button>

            {/* Export Dropdown (保留原有全部导出功能) */}
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs cursor-pointer"
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
                  <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 text-xs">
                    {onExportStandardExcel && (
                      <>
                        <button
                          onClick={() => {
                            setExportDropdownOpen(false);
                            onExportStandardExcel();
                          }}
                          className="w-full text-left px-3 py-2 text-slate-800 hover:bg-emerald-50 flex flex-col cursor-pointer bg-emerald-50/40"
                        >
                          <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                            导出 1.Excel.xlsx (彩色底色)
                          </span>
                          <span className="text-[10px] text-emerald-600">按网页展示对齐 · 出勤底色 · 方便打印</span>
                        </button>
                        <div className="border-t border-slate-100 my-0.5" />
                      </>
                    )}
                    <button
                      onClick={handleExportAll}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex flex-col cursor-pointer"
                    >
                      <span className="font-semibold text-slate-900">导出全班级Excel</span>
                      <span className="text-[10px] text-slate-400">全部8+班级完整工作簿 (多Sheet)</span>
                    </button>
                    <div className="border-t border-slate-100 my-0.5" />
                    <button
                      onClick={handleExportCurrent}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex flex-col cursor-pointer"
                    >
                      <span className="font-semibold text-slate-900">导出当前班级表格</span>
                      <span className="text-[10px] text-slate-400">{currentClass.name} 单班台账</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onOpenBackup}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
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
