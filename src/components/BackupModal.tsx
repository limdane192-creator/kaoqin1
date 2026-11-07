/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { X, Download, Upload, RefreshCw, Check, AlertCircle, Copy, FileText, CheckCircle2 } from 'lucide-react';
import { ClassRoom, Student, Assignment, Semester } from '../types';
import { exportBackupJSON, importBackupJSON } from '../utils/storage';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  semesters?: Semester[];
  onRestore: (classes: ClassRoom[], students: Student[], assignments: Assignment[], semesters?: Semester[]) => void;
  onReset: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  assignments,
  semesters,
  onRestore,
  onReset
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pendingRestore, setPendingRestore] = useState<{
    classes: ClassRoom[];
    students: Student[];
    assignments: Assignment[];
    semesters?: Semester[];
    sourceDesc: string;
  } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const fileName = `backup_${yyyy}${mm}${dd}.json`;

      const jsonStr = exportBackupJSON(classes, students, assignments, undefined, semesters);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMsg({
        type: 'success',
        text: `已成功生成并下载备份文件【${fileName}】！包含 ${classes.length} 个班级、${students.length} 名学生、${assignments.length} 项作业全部完整数据。`
      });
    } catch (e) {
      console.error(e);
      setMsg({ type: 'error', text: '导出备份文件失败，请尝试下方“复制备份文本”直接保存。' });
    }
  };

  const handleCopyBackupText = async () => {
    try {
      const jsonStr = exportBackupJSON(classes, students, assignments, undefined, semesters);
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      setMsg({
        type: 'success',
        text: `已成功将完整备份数据复制到剪贴板（共 ${jsonStr.length} 字符），您可以粘贴保存到记事本或微信备忘录中随时恢复！`
      });
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: '复制到剪贴板失败，请使用“下载备份”功能。' });
    }
  };

  const handleProcessJSON = (content: string, sourceName: string) => {
    try {
      const restored = importBackupJSON(content);
      if (restored && restored.classes && restored.classes.length > 0) {
        setPendingRestore({
          classes: restored.classes,
          students: restored.students,
          assignments: restored.assignments || [],
          semesters: restored.semesters,
          sourceDesc: `${sourceName}（含 ${restored.classes.length} 个班级、${restored.students.length} 名学生、${restored.assignments?.length || 0} 项作业）`
        });
        setMsg({
          type: 'info',
          text: `已成功识别备份数据！请核对下方概览，点击“确认立即恢复”即可完成恢复。`
        });
      } else {
        setMsg({ type: 'error', text: '无法识别备份内容，请确保选中的是本系统导出的 .json 文件或文本。' });
      }
    } catch (e) {
      setMsg({ type: 'error', text: '备份文件解析失败，请检查文件是否损坏或格式是否正确。' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      handleProcessJSON(content, `文件: ${file.name}`);
    };
    reader.onerror = () => {
      setMsg({ type: 'error', text: '读取本地文件失败，请检查浏览器权限。' });
    };
    reader.readAsText(file);
    // Reset file input value so selecting the same file triggers onChange
    e.target.value = '';
  };

  const handleConfirmExecuteRestore = () => {
    if (!pendingRestore) return;
    onRestore(
      pendingRestore.classes,
      pendingRestore.students,
      pendingRestore.assignments,
      pendingRestore.semesters
    );
    setMsg({
      type: 'success',
      text: `🎉 备份数据已成功恢复！所有班级、学生考勤与作业记录已完全重新载入并实时保存。`
    });
    setPendingRestore(null);
    setIsPasteMode(false);
    setPasteContent('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 flex flex-col max-h-[90vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">数据备份、恢复与重置</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              确保您在多班级带教过程中的记录万无一失 · 支持文件与文本双重备份
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {msg && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs flex items-start gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : msg.type === 'info'
                ? 'bg-blue-50 text-blue-900 border border-blue-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : msg.type === 'info' ? (
              <Check className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span className="leading-relaxed">{msg.text}</span>
          </div>
        )}

        {/* 待恢复确认提示卡片 */}
        {pendingRestore && (
          <div className="mt-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>已识别待恢复备份数据</span>
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">
                待确认覆盖
              </span>
            </div>
            <div className="text-xs text-amber-900 bg-white/80 p-2.5 rounded-lg border border-amber-200">
              <div className="font-semibold text-slate-800 mb-1">{pendingRestore.sourceDesc}</div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                确认后将用此备份覆盖当前系统的班级、在册学生、考勤排期与平时成绩，并立即自动实时保存。
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                放弃恢复
              </button>
              <button
                type="button"
                onClick={handleConfirmExecuteRestore}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>确认立即覆盖恢复全部数据</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 space-y-3 text-xs">
          {/* Download & Copy */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">导出数据备份</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  包含全部 {classes.length} 个班级、{students.length} 名学生、考勤及作业
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200 shadow-2xs transition-colors cursor-pointer shrink-0"
                  title="下载 .json 格式的完整备份文件到您的电脑"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>下载备份</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyBackupText}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
                  title="直接将整份备份文本复制到剪贴板，可粘贴存入文本文件"
                >
                  <Copy className="w-3 h-3 text-slate-500" />
                  <span>{copied ? '已复制！' : '复制文本'}</span>
                </button>
              </div>
            </div>
            <div className="text-[10px] text-slate-400 bg-white p-2 rounded-lg border border-slate-100">
              💡 建议考勤排期变动较多或学期末时下载一份备份文件存入电脑（如 <code>D:\A课件\51.备份\2.考勤备份</code>），随时可在任意电脑上原样恢复。
            </div>
          </div>

          {/* Import via File */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">导入恢复备份</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  从已导出的 JSON 备份文件恢复全部记录
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
                  title="从电脑中选取此前下载的 backup_*.json 文件"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>选择文件</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPasteMode(!isPasteMode)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer shrink-0 ${
                    isPasteMode
                      ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                  title="如果在某些浏览器中无法选择文件，可直接在此处粘贴 JSON 文本恢复"
                >
                  <FileText className="w-3 h-3" />
                  <span>{isPasteMode ? '收起粘贴' : '粘贴文本'}</span>
                </button>
              </div>
            </div>

            {/* Direct Paste JSON area */}
            {isPasteMode && (
              <div className="mt-2 space-y-2 pt-2 border-t border-slate-200 animate-in fade-in">
                <label className="block text-[11px] font-semibold text-slate-700">
                  直接粘贴备份文本 (.json 文本内容)：
                </label>
                <textarea
                  value={pasteContent}
                  onChange={e => setPasteContent(e.target.value)}
                  placeholder="在此直接按 Ctrl+V 粘贴备份 JSON 内容（以 { 开头）..."
                  rows={4}
                  className="w-full text-[11px] font-mono p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 custom-scrollbar"
                />
                <div className="flex justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPasteContent('')}
                    className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded text-xs cursor-pointer"
                  >
                    清空
                  </button>
                  <button
                    type="button"
                    disabled={!pasteContent.trim()}
                    onClick={() => handleProcessJSON(pasteContent, '直接粘贴文本')}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-semibold rounded text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    解析并恢复
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset */}
          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-rose-900">恢复系统示范数据</div>
                <div className="text-rose-600 text-[11px] mt-0.5">
                  重置为包含 8 个标准示范班级和学生考勤的初始模版
                </div>
              </div>
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>重置预设</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onReset();
                      setShowResetConfirm(false);
                      setMsg({ type: 'success', text: '已成功恢复预设 8 个班级的示范模版数据！' });
                    }}
                    className="px-3 py-1 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg shadow-xs cursor-pointer"
                  >
                    确定重置
                  </button>
                </div>
              )}
            </div>
            {showResetConfirm && (
              <div className="text-[11px] text-rose-700 bg-rose-100/70 p-2 rounded-lg border border-rose-200">
                ⚠️ 提示：重置将清空当前自定义添加的班级和学生记录，还原为 8 个标准示范班级模板。建议先点击上方“下载备份”。
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
