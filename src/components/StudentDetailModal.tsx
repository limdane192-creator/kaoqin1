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
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Student, ClassRoom, Assignment } from '../types';
import {
  calculateStudentAttendance,
  calculateStudentHomework,
  getEvaluationBadgeColor,
  computeStudentScores
} from '../utils/calculations';
import { CutePandaStudent, CuteAttendanceCat, CuteHomeworkBunny, CuteSunBadge } from './CuteIllustrations';
import { StudentAvatarBadge } from '../utils/avatarHelper';
import { StudentDiagnosisChart } from './StudentDiagnosisChart';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  classes: ClassRoom[];
  assignments: Assignment[];
  onOpenTransfer?: (student: Student) => void;
  onOpenEdit?: (student: Student) => void;
  onOpenAvatarPicker?: (student: Student) => void;
  onOpenCertificate?: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  classes,
  assignments,
  onOpenTransfer,
  onOpenEdit,
  onOpenAvatarPicker,
  onOpenCertificate
}) => {
  if (!student) return null;

  const currentClass = classes.find(c => c.id === student.classId);
  const classAssignments = assignments.filter(a => a.classId === student.classId);
  const attStats = calculateStudentAttendance(student, currentClass?.totalSessions || 30);
  const hwStats = calculateStudentHomework(student.id, classAssignments);
  const badgeColor = getEvaluationBadgeColor(student.evaluation.grade);

  const targetAttDays = currentClass?.totalSessions || 30;
  const targetHwCount = classAssignments.length > 0 ? classAssignments.length : (currentClass?.totalHwTarget || 10);
  const sc = computeStudentScores(
    student.scores,
    targetAttDays,
    targetHwCount,
    attStats.attendanceScore10,
    hwStats.homeworkScore10
  );

  // 整理请假/旷课历史记录
  const leaveRecords: { day: number; date: string; status: string; reason: string }[] = [];
  const totalDays = targetAttDays;

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
        {/* Header with Cute Avatar Badge and neat layout */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-blue-50/70 via-slate-50 to-emerald-50/40">
          <div className="flex items-center gap-3">
            <div
              className="relative group/avatar cursor-pointer"
              onClick={() => onOpenAvatarPicker?.(student)}
              title="点击更换学生卡通头像或上传本人真实照片"
            >
              <StudentAvatarBadge student={student} size="lg" className="rounded-2xl shadow-2xs ring-2 ring-blue-100 hover:ring-blue-400 transition-all" />
              <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 shadow-2xs">
                <Sparkles className="w-2.5 h-2.5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{student.name}</h2>
                <span className="font-mono text-xs text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded font-semibold">
                  No.{student.no}
                </span>
                {student.gender && (
                  <span className="text-[11px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.2 rounded font-normal">
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
              <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-blue-700 bg-blue-100/80 px-1.5 py-0.2 rounded text-[11px]">
                  {currentClass?.name || '未知班级'}
                </span>
                <span>{currentClass?.schedule}</span>
                {currentClass?.room && <span className="text-slate-400">· 教室: {currentClass.room}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {onOpenCertificate && (
              <button
                onClick={() => {
                  onOpenCertificate(student);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 rounded-md transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                title="查看结业证书，支持 HTML 下载、一键打印与导入 WPS 打印"
              >
                <Award className="w-3.5 h-3.5 text-amber-700" />
                <span>结业证书</span>
              </button>
            )}
            {onOpenAvatarPicker && (
              <button
                onClick={() => onOpenAvatarPicker(student)}
                className="px-2 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shadow-2xs"
                title="挑选卡通头像或上传照片"
              >
                选头像
              </button>
            )}
            {onOpenEdit && (
              <button
                onClick={() => {
                  onOpenEdit(student);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shadow-2xs"
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
                className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-md transition-colors cursor-pointer shadow-2xs"
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
          {/* Quick Metrics Cards with Cute Icons */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-emerald-800 text-[11px] font-semibold">
                <CuteAttendanceCat size={20} />
                <span>出勤 (10%)</span>
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700 mt-0.5">
                {sc.attWeighted ?? attStats.attendanceScore10}%
              </div>
              <div className="text-[10px] text-slate-500">
                出勤 {attStats.presentCount}天 · 假 {attStats.leaveCount} · 旷 {attStats.absentCount}
              </div>
            </div>

            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-amber-900 text-[11px] font-semibold">
                <CuteHomeworkBunny size={20} />
                <span>作业 (10%)</span>
              </div>
              <div className="text-lg font-bold font-mono text-teal-700 mt-0.5">
                {sc.hwWeighted ?? hwStats.homeworkScore10}%
              </div>
              <div className="text-[10px] text-slate-500">
                已交 {hwStats.submittedCount + hwStats.lateCount}次 / 共 {targetHwCount}次
              </div>
            </div>

            <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-center relative overflow-hidden">
              <div className="flex items-center justify-center gap-1.5 text-indigo-900 text-[11px] font-semibold">
                <CuteSunBadge size={20} />
                <span>总评分 (100%)</span>
              </div>
              <div className="text-lg font-bold font-mono text-indigo-700 mt-0.5">
                {sc.manualTotal !== undefined ? (
                  <>
                    {sc.manualTotal}
                    <span className="text-xs font-normal text-slate-400 ml-0.5">分</span>
                  </>
                ) : (
                  <>
                    {Number(((sc.attWeighted ?? attStats.attendanceScore10) + (sc.hwWeighted ?? hwStats.homeworkScore10)).toFixed(2))}
                    <span className="text-xs font-normal text-slate-400 ml-0.5">分 (平时累积)</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-slate-500">
                考勤10% · 作业10% · 考核80%
              </div>
            </div>
          </div>

          {/* Detailed Score Rubric Breakdown */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>学期各考查分项与权重明细 (考勤10% + 作业10% + Quiz20% + 期中20% + 口语10% + 期末30% = 100%)</span>
            </h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="grid grid-cols-7 divide-x divide-slate-200 text-center border-b border-slate-200 bg-slate-100/70 font-semibold text-[10px] sm:text-[11px] py-1.5">
                <div>考勤 (10%)</div>
                <div>作业 (10%)</div>
                <div>Quiz 1 (10%)</div>
                <div>Quiz 2 (10%)</div>
                <div>期中 Mid (20%)</div>
                <div>口语 Sp (10%)</div>
                <div>期末 Final (30%)</div>
              </div>
              <div className="grid grid-cols-7 divide-x divide-slate-200 text-center font-mono py-2 bg-white text-xs">
                {/* 考勤 */}
                <div title={`考勤评分：满分10分，请假扣${attStats.deductions.leaveDeduction}分，旷课扣${attStats.deductions.absentDeduction}分，迟到扣${attStats.deductions.lateDeduction}分`}>
                  <div className="font-bold text-emerald-800 text-sm">
                    {sc.attWeighted ?? attStats.attendanceScore10}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {attStats.presentCount}天 / {targetAttDays}天
                  </div>
                  <div className="text-[9px]">
                    {attStats.deductions.totalDeductions > 0 ? (
                      <span className="text-rose-600 font-medium">扣{attStats.deductions.totalDeductions}分</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">全勤满分</span>
                    )}
                  </div>
                </div>

                {/* 作业 */}
                <div title={`作业得分：满分10分，实得${hwStats.totalEarnedScore}/${hwStats.totalPossibleScore}分，已交${hwStats.submittedCount + hwStats.lateCount}次，缺交${hwStats.missingCount}次`}>
                  <div className="font-bold text-teal-800 text-sm">
                    {sc.hwWeighted ?? hwStats.homeworkScore10}%
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {hwStats.submittedCount + hwStats.lateCount}次 / {targetHwCount}次
                  </div>
                  <div className="text-[9px]">
                    {hwStats.missingCount > 0 ? (
                      <span className="text-amber-600 font-medium">缺{hwStats.missingCount}次</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">全部交齐</span>
                    )}
                  </div>
                </div>

                {/* Quiz 1 */}
                <div>
                  <div className="font-bold text-sky-800 text-sm">
                    {sc.quiz1Weighted !== undefined ? `${sc.quiz1Weighted}%` : '-'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {sc.quiz1 !== undefined ? `原分 ${sc.quiz1}` : '未录入'}
                  </div>
                </div>

                {/* Quiz 2 */}
                <div>
                  <div className="font-bold text-sky-800 text-sm">
                    {sc.quiz2Weighted !== undefined ? `${sc.quiz2Weighted}%` : '-'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {sc.quiz2 !== undefined ? `原分 ${sc.quiz2}` : '未录入'}
                  </div>
                </div>

                {/* 期中 Mid */}
                <div>
                  <div className="font-bold text-indigo-800 text-sm">
                    {sc.midtermWeighted !== undefined ? `${sc.midtermWeighted}%` : '-'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {sc.midterm !== undefined ? `原分 ${sc.midterm}` : '未录入'}
                  </div>
                </div>

                {/* 口语 Sp */}
                <div>
                  <div className="font-bold text-amber-800 text-sm">
                    {sc.oralWeighted !== undefined ? `${sc.oralWeighted}%` : '-'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {sc.oral !== undefined ? `原分 ${sc.oral}` : '未录入'}
                  </div>
                </div>

                {/* 期末 Final */}
                <div>
                  <div className="font-bold text-violet-800 text-sm">
                    {sc.finalExamWeighted !== undefined ? `${sc.finalExamWeighted}%` : '-'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {sc.finalExam !== undefined ? `原分 ${sc.finalExam}` : '未录入'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 学情优点与缺点多维图表诊断分析 (可视化图表 + 亮点优势与薄弱环节) */}
          <StudentDiagnosisChart
            student={student}
            currentClass={currentClass}
            assignments={assignments}
          />

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
