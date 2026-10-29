/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Calendar,
  BookOpen,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { Student, ClassRoom, Assignment } from '../types';
import {
  calculateStudentAttendance,
  calculateStudentHomework,
  getEvaluationBadgeColor,
  computeStudentScores
} from '../utils/calculations';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  classes: ClassRoom[];
  assignments: Assignment[];
  onOpenTransfer?: (student: Student) => void;
  onOpenEdit?: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  classes,
  assignments,
  onOpenTransfer,
  onOpenEdit
}) => {
  if (!student) return null;

  const currentClass = classes.find(c => c.id === student.classId);
  const classAssignments = assignments.filter(a => a.classId === student.classId);
  const attStats = calculateStudentAttendance(student, currentClass?.totalSessions || 30);
  const hwStats = calculateStudentHomework(student.id, classAssignments);
  const badgeColor = getEvaluationBadgeColor(student.evaluation.grade);

  const sc = computeStudentScores(student.scores);

  // 整理请假/旷课历史记录
  const leaveRecords: { day: number; date: string; status: string; reason: string }[] = [];
  const totalDays = currentClass?.totalSessions || 30;

  for (let d = 1; d <= totalDays; d++) {
    const status = student.attendance[d];
    const note = student.attendanceNotes?.[d];
    if (status === 'P' || status === 'A' || status === 'L' || note) {
      leaveRecords.push({
        day: d,
        date: currentClass?.sessionDates?.[d] || `第${d}课`,
        status: status === 'P' ? '请假' : status === 'A' ? '旷课' : status === 'L' ? '迟到' : status === '1' ? '出勤' : '停课',
        reason: note || (status === 'P' ? '事假/病假' : status === 'A' ? '未请假旷课' : status === 'L' ? '迟到' : '无特殊说明')
      });
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
              <span className="font-mono text-xs text-slate-500">学号 No.{student.no}</span>
              {student.gender && (
                <span className="text-[11px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.2 rounded font-normal">
                  {student.gender}
                </span>
              )}
              {student.evaluation.grade && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
                >
                  {student.evaluation.grade}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              所在班级：<span className="font-semibold text-slate-800">{currentClass?.name || '未知班级'}</span>
              {' · '}
              {currentClass?.schedule}
              {currentClass?.room && ` · 教室: ${currentClass.room}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {onOpenEdit && (
              <button
                onClick={() => {
                  onOpenEdit(student);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                title="修改姓名、学号或性别"
              >
                修改信息
              </button>
            )}
            {onOpenTransfer && (
              <button
                onClick={() => {
                  onOpenTransfer(student);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                title="换班/转班 (早班改晚班等，保留全部历史分数)"
              >
                换班/转班
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar text-xs">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 text-[11px]">出勤率</div>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                {attStats.attendanceRate}%
              </div>
              <div className="text-[10px] text-slate-400">
                出勤 {attStats.presentCount} · 假 {attStats.leaveCount} · 旷 {attStats.absentCount}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 text-[11px]">作业完成率</div>
              <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">
                {hwStats.completionRate}%
              </div>
              <div className="text-[10px] text-slate-400">
                已交 {hwStats.submittedCount + hwStats.lateCount} · 缺交 {hwStats.missingCount}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <div className="text-slate-400 text-[11px]">学期总评分 (100%)</div>
              <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
                {sc.manualTotal ?? '-'}
                <span className="text-xs font-normal text-slate-400 ml-0.5">分</span>
              </div>
              <div className="text-[10px] text-slate-400">
                HW 10% · Quiz 20% · Mid 20% · 口语 10% · Final 30%
              </div>
            </div>
          </div>

          {/* Detailed Score Rubric Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>学期各考查分项与权重明细 (考勤10% + 作业10% + Quiz20% + 期中20% + 口语10% + 期末30% = 100%)</span>
            </h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-7 divide-x divide-slate-200 text-center border-b border-slate-200 bg-slate-100/60 font-semibold text-[10px] sm:text-[11px] py-1.5">
                <div>考勤 (10%)</div>
                <div>作业 (10%)</div>
                <div>Quiz 1 (10%)</div>
                <div>Quiz 2 (10%)</div>
                <div>期中 Mid (20%)</div>
                <div>口语 Sp (10%)</div>
                <div>期末 Final (30%)</div>
              </div>
              <div className="grid grid-cols-7 divide-x divide-slate-200 text-center font-mono py-2 bg-white text-xs">
                <div>
                  <div className="font-bold text-emerald-800">{sc.attWeighted ?? 0}%</div>
                  <div className="text-[10px] text-slate-400">{sc.attDays ?? attStats.presentCount}天 / {sc.attTarget || 30}天</div>
                </div>
                <div>
                  <div className="font-bold text-teal-800">{sc.hwWeighted ?? 0}%</div>
                  <div className="text-[10px] text-slate-400">{sc.hwCount ?? 0}次 / {sc.hwTarget || 20}次</div>
                </div>
                <div>
                  <div className="font-bold text-sky-800">{sc.quiz1Weighted ?? 0}%</div>
                  <div className="text-[10px] text-slate-400">原分 {sc.quiz1 ?? '-'}</div>
                </div>
                <div>
                  <div className="font-bold text-sky-800">{sc.quiz2Weighted ?? 0}%</div>
                  <div className="text-[10px] text-slate-400">原分 {sc.quiz2 ?? '-'}</div>
                </div>
                <div>
                  <div className="font-bold text-indigo-800">{sc.midtermWeighted ?? 0}%</div>
                  <div className="text-[10px] text-slate-400">原分 {sc.midterm ?? '-'}</div>
                </div>
                <div>
                  <div className="font-bold text-amber-800">{sc.oralWeighted ?? 0}%</div>
                  <div className="text-[10px] text-slate-400">原分 {sc.oral ?? '-'}</div>
                </div>
                <div>
                  <div className="font-bold text-violet-800">{sc.finalExamWeighted ?? 0}%</div>
                  <div className="text-[10px] text-slate-400">原分 {sc.finalExam ?? '-'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: 请假与旷课历史记录 */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-500" />
              <span>考勤请假与异常记录 ({leaveRecords.length}条)</span>
            </h3>

            {leaveRecords.length === 0 ? (
              <div className="p-3 bg-emerald-50/50 rounded-lg text-emerald-700 border border-emerald-100 text-center">
                全勤出勤，本学期无请假、迟到或旷课记录
              </div>
            ) : (
              <div className="space-y-1.5">
                {leaveRecords.map((r, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 text-[11px]">
                        第{r.day}课 ({r.date})
                      </span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                          r.status === '请假'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === '旷课'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <div className="text-slate-700 font-medium text-right flex-1">
                      {r.reason}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: 作业提交记录明细 */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span>作业收缴与提交日期追踪 ({classAssignments.length}项)</span>
            </h3>

            {classAssignments.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                班级尚未布置作业
              </div>
            ) : (
              <div className="space-y-1.5">
                {classAssignments.map(a => {
                  const sub = a.submissions[student.id];
                  const isMissing = !sub || sub.status === 'missing';
                  const isSubmitted = sub?.status === 'submitted';
                  const isLate = sub?.status === 'late';

                  return (
                    <div
                      key={a.id}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 ${
                        isMissing
                          ? 'bg-rose-50/50 border-rose-100'
                          : 'bg-slate-50 border-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{a.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          布置: {a.assignedDate} · 截止: {a.dueDate}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isMissing ? (
                          <span className="font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded text-[11px]">
                            ❌ 缺交未交
                          </span>
                        ) : isSubmitted ? (
                          <div className="text-right">
                            <span className="font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                              ✔️ 已交 ({sub?.submittedDate || '已收'})
                            </span>
                            {typeof sub?.score === 'number' && (
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                得分: {sub.score}分
                              </div>
                            )}
                          </div>
                        ) : isLate ? (
                          <span className="font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                            ⚠️ 补交 ({sub?.submittedDate || '迟交'})
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">免交</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: 教师期末综合评语与标签 */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-500" />
              <span>教师期末综合评定</span>
            </h3>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(student.evaluation.tags || []).map((t, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-full"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <p className="text-slate-800 text-xs leading-relaxed">
                {student.evaluation.remarks || '教师暂未撰写期末综合评语，可在“分数录入与期末评定”中直接填写。'}
              </p>
            </div>
          </div>

          {/* Section 4: 课堂具体表现记录日志 */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>日常课堂具体表现成长记录 ({student.evaluation.behaviorNotes?.length || 0}条)</span>
            </h3>

            {(!student.evaluation.behaviorNotes || student.evaluation.behaviorNotes.length === 0) ? (
              <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center">
                暂无日常表现随记
              </div>
            ) : (
              <div className="space-y-2">
                {student.evaluation.behaviorNotes.map(b => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] text-slate-400">{b.date}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          b.type === 'positive'
                            ? 'bg-emerald-100 text-emerald-800'
                            : b.type === 'concern'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {b.type === 'positive' ? '积极闪光' : b.type === 'concern' ? '需关注' : '随记'}
                      </span>
                    </div>
                    <p className="text-slate-700">{b.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onOpenTransfer && (
              <button
                onClick={() => {
                  onOpenTransfer(student);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                转班/换班 (保留全部成绩)
              </button>
            )}
            {onOpenEdit && (
              <button
                onClick={() => {
                  onOpenEdit(student);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                修改学生资料
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            关闭档案
          </button>
        </div>
      </div>
    </div>
  );
};
