/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { X, Download, Upload, RefreshCw, Check, AlertCircle } from 'lucide-react';
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
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackup = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const fileName = `backup_${yyyy}${mm}${dd}.json`;

    const jsonStr = exportBackupJSON(classes, students, assignments, undefined, semesters);
    const blob = new Blob([jsonStr], { type: 'application/json' });
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
      text: '此JSON为考勤备份文件，无法直接阅读，查看数据请使用导出表格功能；数据改动较多时建议及时备份，可复制保存到 D:\\A课件\\51.备份\\2.考勤备份'
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('导入会覆盖当前所有数据，确定继续吗？')) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const content = ev.target?.result as string;
        const restored = importBackupJSON(content);
        if (restored) {
          onRestore(restored.classes, restored.students, restored.assignments, restored.semesters);
          setMsg({ type: 'success', text: '备份数据恢复成功！已重新加载所有班级和记录并同步到localStorage。' });
        } else {
          setMsg({ type: 'error', text: '备份文件格式不正确，无法解析。' });
        }
      } catch (err) {
        setMsg({ type: 'error', text: '读取文件失败，请确保是正确的备份文件。' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">数据备份、恢复与重置</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              确保您在多班级带教过程中的记录万无一失
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
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {msg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        <div className="mt-4 space-y-3 text-xs">
          {/* Download */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">导出数据备份</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                包含全部 {classes.length} 个班级、{students.length} 名学生、考勤及作业
              </div>
            </div>
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载备份</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">导入恢复备份</div>
              <div className="text-slate-500 text-[11px] mt-0.5">
                从已导出的 JSON 备份文件恢复全部记录
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-medium rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>选择文件</span>
            </button>
          </div>

          {/* Reset */}
          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
            <div>
              <div className="font-semibold text-rose-900">恢复系统示范数据</div>
              <div className="text-rose-600 text-[11px] mt-0.5">
                重置为包含 8 个标准示范班级和学生考勤的初始模版
              </div>
            </div>
            <button
              onClick={() => {
                if (window.confirm('确定要重置并恢复系统预设示范数据吗？当前新增的内容将被覆盖。')) {
                  onReset();
                  setMsg({ type: 'success', text: '已成功恢复预设 8 个班级的示范模版数据。' });
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>重置预设</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
          <button
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
