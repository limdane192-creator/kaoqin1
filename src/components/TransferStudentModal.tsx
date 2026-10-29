/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ArrowRightLeft, Check, ShieldCheck, ArrowRight, Lock, Clock, AlertCircle } from 'lucide-react';
import { Student, ClassRoom, Semester } from '../types';

interface TransferStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  classes: ClassRoom[];
  semesters: Semester[];
  onTransferStudent: (studentId: string, targetClassId: string, customStudentNo?: number) => void;
}

export const TransferStudentModal: React.FC<TransferStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  classes,
  semesters,
  onTransferStudent
}) => {
  if (!isOpen || !student) return null;

  const currentClass = classes.find(c => c.id === student.classId);
  const currentSemester = semesters.find(s => s.id === currentClass?.semesterId) || {
    id: currentClass?.semesterId || 'sem_48',
    name: currentClass?.semester || '48学期'
  };

  // 只能换到同一学期的其他班级，严禁跨学期调动
  const availableTargetClasses = classes.filter(
    c => c.semesterId === currentClass?.semesterId && c.id !== student.classId
  );

  const [selectedTargetClassId, setSelectedTargetClassId] = useState<string>(
    availableTargetClasses[0]?.id || ''
  );

  const targetClass = classes.find(c => c.id === selectedTargetClassId);

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetClassId) return;

    onTransferStudent(student.id, selectedTargetClassId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                学生换班 / 转班 (同周期班级互转)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                限在【{currentSemester.name}】内部班级之间调换（如早班改晚班），不可跨学期
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleConfirmTransfer} className="mt-4 space-y-4 text-xs">
          {/* Semester Lock Notice */}
          <div className="flex items-center justify-between bg-slate-100/80 px-3 py-2 rounded-lg text-slate-600 border border-slate-200">
            <div className="flex items-center gap-2 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>所属学期已锁定：</span>
              <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                {currentSemester.name}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">学期独立隔离 · 仅同级互转</span>
          </div>

          {/* Student Banner */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="text-[11px] text-slate-400 mb-1">正在调班的学生</div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-slate-900">{student.name}</span>
                <span className="text-xs font-mono text-slate-400 ml-2">原学号 #{student.no}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  原班级: {currentClass?.name || '未知班级'}
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {currentClass?.schedule}
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Arrow Indicator */}
          <div className="flex items-center justify-center text-slate-400">
            <div className="flex items-center gap-2 bg-blue-50/60 text-blue-700 px-3 py-1 rounded-full border border-blue-100 text-xs font-medium">
              <span>{currentClass?.name || '当前班级'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-bold text-blue-900">{targetClass?.name || '选择目标班级'}</span>
            </div>
          </div>

          {/* Select Target Class within the current semester */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>目标班级 (如: 早班改晚班、换时间段) *</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {currentSemester.name}内可选 ({availableTargetClasses.length} 个)
              </span>
            </label>

            {availableTargetClasses.length === 0 ? (
              <div className="p-3.5 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">当前学期（{currentSemester.name}）暂无可调转的其他班级</div>
                  <div className="text-[11px] text-amber-700 mt-1 leading-relaxed">
                    根据系统规则，学生只能在<strong>同一个学期内部</strong>的班级之间调换，不能转到其他学期。若该学生需要转到其他时间段（如晚班或周末班），请先在当前学期下点击顶部的<strong>【加班】</strong>创建该班级。
                  </div>
                </div>
              </div>
            ) : (
              <select
                required
                value={selectedTargetClassId}
                onChange={e => setSelectedTargetClassId(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium text-slate-900"
              >
                {availableTargetClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.schedule} (教室: {c.room || '待定'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Safe data retention assurance banner */}
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-emerald-900 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>数据保护承诺：同周期换班，成绩与评语100%保留</span>
            </div>
            <ul className="text-[11px] text-emerald-800 space-y-1 list-disc list-inside">
              <li>小测 Quiz 1/2、期中、口语、期末卷面成绩及折算分严格保留。</li>
              <li>已有的考勤统计分、作业折算分及学期总评自动带入目标新班级。</li>
              <li>教师撰写的期末综合评语、AI评语、学生标签及日常课堂表现记录完整迁移。</li>
              <li>系统自动为该生分配目标班级的新学号，花名册井然有序。</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!selectedTargetClassId}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>确认调班并保留全部成绩</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
