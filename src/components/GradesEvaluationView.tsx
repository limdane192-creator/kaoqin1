/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Trash2,
  MessageSquare,
  Calculator,
  Calendar,
  BookOpen,
  Sparkles,
  Loader2,
  Check,
  Info,
  Save,
  UserPlus,
  ArrowRightLeft,
  Edit3
} from 'lucide-react';
import { ClassRoom, Student, Assignment, StudentScores, StudentEvaluation, BehaviorNote } from '../types';
import {
  calculateStudentAttendance,
  calculateStudentHomework,
  getEvaluationBadgeColor,
  computeStudentScores
} from '../utils/calculations';
import { requestAIEvaluation } from '../utils/aiEvaluation';

interface GradesEvaluationViewProps {
  currentClass: ClassRoom;
  students: Student[];
  assignments: Assignment[];
  onUpdateStudentScores: (studentId: string, scores: Partial<StudentScores>) => void;
  onUpdateStudentEvaluation: (studentId: string, evaluation: Partial<StudentEvaluation>) => void;
  onAddBehaviorNote: (studentId: string, note: Omit<BehaviorNote, 'id'>) => void;
  onDeleteBehaviorNote: (studentId: string, noteId: string) => void;
  onSelectStudentModal: (student: Student) => void;
  onOpenAddStudent?: () => void;
  onOpenEditStudent?: (student: Student) => void;
  onOpenTransferStudent?: (student: Student) => void;
  onSaveData?: () => void;
  isJustSaved?: boolean;
}

export const GradesEvaluationView: React.FC<GradesEvaluationViewProps> = ({
  currentClass,
  students,
  assignments,
  onUpdateStudentScores,
  onUpdateStudentEvaluation,
  onAddBehaviorNote,
  onDeleteBehaviorNote,
  onSelectStudentModal,
  onOpenAddStudent,
  onOpenEditStudent,
  onOpenTransferStudent,
  onSaveData,
  isJustSaved
}) => {
  const classAssignments = assignments.filter(a => a.classId === currentClass.id);
  const [activeStudentForBehavior, setActiveStudentForBehavior] = useState<Student | null>(null);
  const [generatingAiId, setGeneratingAiId] = useState<string | null>(null);
  const [isBatchGeneratingAi, setIsBatchGeneratingAi] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  // Behavior Note Form
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'positive' | 'concern' | 'neutral'>('positive');
  const [newNoteDate, setNewNoteDate] = useState(new Date().toISOString().slice(0, 10));

  // 班级默认学期天数与作业目标配置
  // 周一到周三班：满学期30天(10周)；周四周五班：满学期20天(10周)
  const defaultAttTarget =
    currentClass.name.toUpperCase().includes('TF') ||
    currentClass.schedule.includes('周四') ||
    currentClass.schedule.includes('周五') ||
    currentClass.totalSessions <= 24
      ? 20
      : 30;

  const [classAttTarget, setClassAttTarget] = useState<number>(defaultAttTarget);
  const [classHwTarget, setClassHwTarget] = useState<number>(currentClass.totalHwTarget || 20);

  // 常用标签预设
  const commonTags = [
    '全勤标兵', '作业全交', '积极发言', '进步之星', '热心互助', '发音标准', '需跟进作业', '出勤待提升'
  ];

  // 1. AI 单人生成评语与标签
  const handleGenerateSingleAI = async (student: Student) => {
    try {
      setGeneratingAiId(student.id);
      const res = await requestAIEvaluation(student, classAssignments, classAttTarget, classHwTarget);
      onUpdateStudentEvaluation(student.id, {
        remarks: res.remarks,
        tags: res.tags,
        grade: res.grade,
        aiGeneratedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('AI evaluation generation failed', err);
    } finally {
      setGeneratingAiId(null);
    }
  };

  // 2. 全班一键 AI 批量生成评语与标签
  const handleBatchGenerateAI = async () => {
    if (students.length === 0 || isBatchGeneratingAi) return;
    setIsBatchGeneratingAi(true);
    setBatchProgress({ current: 0, total: students.length });

    for (let i = 0; i < students.length; i++) {
      const stu = students[i];
      setBatchProgress({ current: i + 1, total: students.length });
      try {
        const res = await requestAIEvaluation(stu, classAssignments, classAttTarget, classHwTarget);
        onUpdateStudentEvaluation(stu.id, {
          remarks: res.remarks,
          tags: res.tags,
          grade: res.grade,
          aiGeneratedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error(`Failed to generate AI evaluation for ${stu.name}`, e);
      }
    }

    setIsBatchGeneratingAi(false);
    setBatchProgress(null);
  };

  // 3. 计算班级总体成绩统计 (结合自动考勤与作业得分)
  let totalManualScore = 0;
  let scoredCount = 0;
  let excellentCount = 0; // >= 90
  let passCount = 0; // >= 60

  students.forEach(s => {
    const attStats = calculateStudentAttendance(s, classAttTarget);
    const hwStats = calculateStudentHomework(s.id, classAssignments, classHwTarget);
    const sc = computeStudentScores(
      s.scores,
      classAttTarget,
      classHwTarget,
      attStats.attendanceScore10,
      hwStats.homeworkScore10
    );
    const finalScore = sc.manualTotal;
    if (typeof finalScore === 'number' && !isNaN(finalScore)) {
      totalManualScore += finalScore;
      scoredCount++;
      if (finalScore >= 90) excellentCount++;
      if (finalScore >= 60) passCount++;
    }
  });

  const avgScore = scoredCount > 0 ? (totalManualScore / scoredCount).toFixed(1) : '-';
  const excellentRate = scoredCount > 0 ? Math.round((excellentCount / scoredCount) * 100) : 0;
  const passRate = scoredCount > 0 ? Math.round((passCount / scoredCount) * 100) : 0;

  // 一键将自动考勤与自动作业统计结果正式写入已保存成绩对象
  const handleAutoFillAllAttendanceAndHw = () => {
    students.forEach(stu => {
      const attStats = calculateStudentAttendance(stu, classAttTarget);
      const hwStats = calculateStudentHomework(stu.id, classAssignments, classHwTarget);
      const updated = computeStudentScores(
        {
          ...stu.scores,
          attDays: attStats.presentCount,
          attTarget: classAttTarget,
          attWeighted: attStats.attendanceScore10,
          hwCount: hwStats.submittedCount + hwStats.lateCount,
          hwTarget: classHwTarget,
          hwWeighted: hwStats.homeworkScore10
        },
        classAttTarget,
        classHwTarget,
        attStats.attendanceScore10,
        hwStats.homeworkScore10
      );
      onUpdateStudentScores(stu.id, updated);
    });
  };

  // 自动根据当前总分评定等第 (>=90优秀, >=80良好, >=60合格, <60待提高)
  const handleAutoAssignGrades = () => {
    students.forEach(stu => {
      const attStats = calculateStudentAttendance(stu, classAttTarget);
      const hwStats = calculateStudentHomework(stu.id, classAssignments, classHwTarget);
      const sc = computeStudentScores(
        stu.scores,
        classAttTarget,
        classHwTarget,
        attStats.attendanceScore10,
        hwStats.homeworkScore10
      );
      const total = sc.manualTotal ?? 0;
      let grade: StudentEvaluation['grade'] = '合格';
      if (total >= 90) grade = '优秀';
      else if (total >= 80) grade = '良好';
      else if (total >= 60) grade = '合格';
      else grade = '待提高';

      onUpdateStudentEvaluation(stu.id, { grade });
    });
  };

  return (
    <div className="space-y-3">
      {/* Top Banner: Crisp, Minimalist Header & Controls */}
      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Class Title & Subtle Formula */}
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-slate-900">
                {currentClass.name} 成绩台账与综合评定
              </h2>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-600">
                考勤 10% + 作业 10% + 小测 20% + 期中 20% + 口语 10% + 期末 30% = 100%
              </span>
            </div>
            {/* Quick Metrics & Attendance Rule Hint */}
            <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-slate-500">
              <span>班均分: <strong className="text-slate-800 font-mono">{avgScore}</strong></span>
              <span>·</span>
              <span>优秀率: <strong className="text-slate-800 font-mono">{excellentRate}%</strong></span>
              <span>·</span>
              <span>及格率: <strong className="text-slate-800 font-mono">{passRate}%</strong></span>
              <span>·</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-100 flex items-center gap-1">
                <Info className="w-3 h-3" />
                考勤自动算分：只扣请假(-0.25)、旷课(-0.5)、迟到(每3次-0.5)，空和换班生(-)均不扣分
              </span>
            </div>
          </div>

          {/* Right: Targets & Action Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Class semester attendance target */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600">
              <span className="text-slate-400">学期天数:</span>
              <select
                value={classAttTarget}
                onChange={e => setClassAttTarget(Number(e.target.value))}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={30}>30天 (MW班)</option>
                <option value={20}>20天 (TF班)</option>
                <option value={16}>16天 (周末班)</option>
              </select>
            </div>

            {/* HW Target (15-20 times flexible) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600">
              <span className="text-slate-400">作业目标:</span>
              <select
                value={classHwTarget}
                onChange={e => setClassHwTarget(Number(e.target.value))}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={20}>20次</option>
                <option value={18}>18次</option>
                <option value={16}>16次</option>
                <option value={15}>15次</option>
              </select>
            </div>

            {/* Add Student Button */}
            {onOpenAddStudent && (
              <button
                onClick={onOpenAddStudent}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors cursor-pointer shadow-2xs"
                title="随时录入新学生或插班生"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600" />
                <span>+ 录入插班生</span>
              </button>
            )}

            {/* AI Batch Generate Button */}
            <button
              onClick={handleBatchGenerateAI}
              disabled={isBatchGeneratingAi}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-md transition-colors shadow-2xs cursor-pointer"
              title="根据考勤、作业及成绩一键为全班学生批量生成期末综合评语和特征标签"
            >
              {isBatchGeneratingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>生成中 {batchProgress?.current}/{batchProgress?.total}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI一键生成全班评语</span>
                </>
              )}
            </button>

            <button
              onClick={handleAutoAssignGrades}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors cursor-pointer"
              title="根据当前百分比总评自动评定综合等第"
            >
              <Calculator className="w-3.5 h-3.5 text-slate-500" />
              <span>自动评等第</span>
            </button>

            {onSaveData && (
              <button
                onClick={onSaveData}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all cursor-pointer ${
                  isJustSaved
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                }`}
                title="立即保存成绩台账与综合评语"
              >
                {isJustSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已存好</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>保存成绩</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table: Clean, Calm Spreadsheet Aesthetics */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar max-h-[640px]">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 z-20 border-b border-slate-200">
              {/* Row 1: Main Category Blocks */}
              <tr className="border-b border-slate-200 text-center text-xs">
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-200 w-12 sticky left-0 bg-slate-50 z-30 text-slate-500 font-normal">
                  学号
                </th>
                <th rowSpan={2} className="py-2.5 px-4 border-r border-slate-200 min-w-[130px] text-left sticky left-12 bg-slate-50 z-30 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  学生姓名
                </th>

                {/* 1. 考勤 10% */}
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 bg-slate-50 text-slate-800">
                  <div>考勤 (10%)</div>
                  <div className="text-[10px] text-emerald-700 font-normal">系统自动统计扣分</div>
                </th>

                {/* 2. 作业 10% */}
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 bg-slate-50 text-slate-800">
                  <div>作业 (10%)</div>
                  <div className="text-[10px] text-teal-700 font-normal">自动填充完成度</div>
                </th>

                {/* 3. Quiz 1 & Quiz 2 */}
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 bg-slate-50 text-slate-800">
                  小测试 1
                </th>
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 bg-slate-50 text-slate-800">
                  小测试 2
                </th>
                <th rowSpan={2} className="py-2 px-2.5 border-r border-slate-200 bg-slate-100/70 text-slate-800 font-medium">
                  <div>小测总计</div>
                  <div className="text-[10px] text-slate-400 font-normal">20%</div>
                </th>

                {/* 4. 期中 Mid 20% */}
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 bg-slate-50 text-slate-800">
                  期中考试 (20%)
                </th>

                {/* 5. 口语 Sp 10% */}
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 bg-slate-50 text-slate-800">
                  口语测试 (10%)
                </th>

                {/* 6. 期末 Final 30% */}
                <th colSpan={2} className="py-1.5 px-2 border-r border-slate-200 bg-slate-50 text-slate-800">
                  期末考试 (30%)
                </th>

                {/* 7. 学期总评分 100% */}
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-200 bg-slate-100/90 text-slate-900 font-bold text-center min-w-[90px]">
                  <div>学期总评</div>
                  <div className="text-[10px] text-slate-500 font-normal">100% 满分</div>
                </th>

                {/* 等第 & 评语 */}
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-200 text-center min-w-[80px]">
                  等第
                </th>
                <th rowSpan={2} className="py-2 px-4 border-r border-slate-200 text-left min-w-[320px]">
                  期末综合评定评语与标签 (支持AI一键生成)
                </th>
                <th rowSpan={2} className="py-2 px-3 text-center min-w-[70px]">
                  课堂记录
                </th>
              </tr>

              {/* Row 2: Sub-columns */}
              <tr className="border-b border-slate-200 text-center text-[11px] text-slate-500 font-normal">
                {/* 考勤 */}
                <th className="py-1.5 px-2 border-r border-slate-100">
                  出勤天数
                </th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-slate-700 font-medium">
                  考勤(10%)
                </th>

                {/* 作业 */}
                <th className="py-1.5 px-2 border-r border-slate-100">
                  已交/目标
                </th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-slate-700 font-medium">
                  作业(10%)
                </th>

                {/* Quiz1 */}
                <th className="py-1.5 px-2 border-r border-slate-100">
                  100pt
                </th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-slate-700 font-medium">
                  10%
                </th>

                {/* Quiz2 */}
                <th className="py-1.5 px-2 border-r border-slate-100">
                  100pt
                </th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-slate-700 font-medium">
                  10%
                </th>

                {/* Mid */}
                <th className="py-1.5 px-2 border-r border-slate-100">
                  100pt
                </th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-slate-700 font-medium">
                  20%
                </th>

                {/* 口语 */}
                <th className="py-1.5 px-2 border-r border-slate-100">
                  100pt
                </th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-slate-700 font-medium">
                  10%
                </th>

                {/* 期末 */}
                <th className="py-1.5 px-2 border-r border-slate-100">
                  100pt
                </th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-slate-700 font-medium">
                  30%
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {students.map(stu => {
                // 实时自动统计考勤（只扣请假、旷课、迟到；空和-不扣分）
                const attStats = calculateStudentAttendance(stu, classAttTarget);
                // 实时自动统计作业
                const hwStats = calculateStudentHomework(stu.id, classAssignments, classHwTarget);

                const autoAttScore = attStats.attendanceScore10;
                const autoHwScore = hwStats.homeworkScore10;

                const sc = computeStudentScores(
                  stu.scores,
                  classAttTarget,
                  classHwTarget,
                  autoAttScore,
                  autoHwScore
                );
                const badgeColor = getEvaluationBadgeColor(stu.evaluation.grade);

                // Helper to update student score field with immediate recompute
                const handleFieldChange = (field: keyof StudentScores, rawVal: string) => {
                  const val = rawVal === '' ? undefined : Number(rawVal);
                  const updated = computeStudentScores(
                    {
                      ...stu.scores,
                      attTarget: classAttTarget,
                      hwTarget: classHwTarget,
                      [field]: val
                    },
                    classAttTarget,
                    classHwTarget,
                    autoAttScore,
                    autoHwScore
                  );
                  onUpdateStudentScores(stu.id, updated);
                };

                const isGeneratingThisStudent = generatingAiId === stu.id;

                return (
                  <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 学号 */}
                    <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                      {stu.no}
                    </td>

                    {/* 姓名 */}
                    <td className="py-2 px-3 sticky left-12 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100 min-w-[130px]">
                      <div className="flex items-center justify-between gap-1 group/stu">
                        <button
                          onClick={() => onSelectStudentModal(stu)}
                          className="font-medium text-slate-800 hover:text-blue-600 transition-colors cursor-pointer text-left truncate"
                          title="点击查看该学生档案"
                        >
                          <span className="truncate">{stu.name}</span>
                        </button>
                        <div className="opacity-0 group-hover/stu:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                          {onOpenEditStudent && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditStudent(stu);
                              }}
                              className="p-0.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded cursor-pointer"
                              title="修改学生姓名/学号"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                          {onOpenTransferStudent && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTransferStudent(stu);
                              }}
                              className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                              title="换班/转班 (早班改晚班等，保留全部历史分数)"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 1. 考勤天数与扣分提示 */}
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                      <div className="font-mono tabular-nums text-xs font-semibold text-slate-700">
                        {attStats.presentCount}天
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {attStats.deductions.totalDeductions > 0 ? (
                          <span className="text-rose-600">扣{attStats.deductions.totalDeductions}分</span>
                        ) : (
                          <span className="text-emerald-600">全勤</span>
                        )}
                      </div>
                    </td>

                    {/* 考勤 10% 折算分 (支持直接调整或自动计算) */}
                    <td className="py-1.5 px-2 text-center font-mono tabular-nums font-bold text-slate-800 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step="0.05"
                        value={sc.attWeighted ?? ''}
                        placeholder={String(autoAttScore)}
                        onChange={e => handleFieldChange('attWeighted', e.target.value)}
                        className="w-13 text-center text-xs font-mono font-bold tabular-nums bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded px-1 py-1 transition-all"
                        title={`自动算分: 10 - 请假(${attStats.deductions.leaveDeduction}) - 旷课(${attStats.deductions.absentDeduction}) - 迟到(${attStats.deductions.lateDeduction}) = ${autoAttScore}分`}
                      />
                    </td>

                    {/* 2. 作业完成次数与目标 */}
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                      <div className="font-mono tabular-nums text-xs font-semibold text-slate-700">
                        {hwStats.submittedCount + hwStats.lateCount}/{classHwTarget}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {hwStats.missingCount > 0 ? (
                          <span className="text-amber-600">缺{hwStats.missingCount}次</span>
                        ) : (
                          <span className="text-emerald-600">齐</span>
                        )}
                      </div>
                    </td>

                    {/* 作业 10% 折算分 (支持直接调整或自动计算) */}
                    <td className="py-1.5 px-2 text-center font-mono tabular-nums font-bold text-slate-800 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step="0.1"
                        value={sc.hwWeighted ?? ''}
                        placeholder={String(autoHwScore)}
                        onChange={e => handleFieldChange('hwWeighted', e.target.value)}
                        className="w-13 text-center text-xs font-mono font-bold tabular-nums bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded px-1 py-1 transition-all"
                        title={`自动作业分: ${autoHwScore}分 (完成率 ${hwStats.completionRate}%)`}
                      />
                    </td>

                    {/* 3. Quiz 1 (100分制) */}
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={sc.quiz1 ?? ''}
                        placeholder="分"
                        onChange={e => handleFieldChange('quiz1', e.target.value)}
                        className="w-13 text-center text-xs font-mono tabular-nums bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded px-1 py-1 transition-all"
                      />
                    </td>
                    {/* Q1 10% 折算 */}
                    <td className="py-1.5 px-2 text-center font-mono tabular-nums text-slate-600 border-r border-slate-200">
                      {sc.quiz1Weighted !== undefined ? `${sc.quiz1Weighted}%` : '-'}
                    </td>

                    {/* 4. Quiz 2 (100分制) */}
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={sc.quiz2 ?? ''}
                        placeholder="分"
                        onChange={e => handleFieldChange('quiz2', e.target.value)}
                        className="w-13 text-center text-xs font-mono tabular-nums bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded px-1 py-1 transition-all"
                      />
                    </td>
                    {/* Q2 10% 折算 */}
                    <td className="py-1.5 px-2 text-center font-mono tabular-nums text-slate-600 border-r border-slate-200">
                      {sc.quiz2Weighted !== undefined ? `${sc.quiz2Weighted}%` : '-'}
                    </td>

                    {/* Quiz总折算 (20%) */}
                    <td className="py-1.5 px-2.5 bg-slate-50/50 text-center font-mono tabular-nums font-semibold text-slate-800 border-r border-slate-200">
                      {sc.quizTotal !== undefined ? `${sc.quizTotal}%` : '-'}
                    </td>

                    {/* 5. 期中 Mid (100分制) */}
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={sc.midterm ?? ''}
                        placeholder="分"
                        onChange={e => handleFieldChange('midterm', e.target.value)}
                        className="w-13 text-center text-xs font-mono tabular-nums bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded px-1 py-1 transition-all"
                      />
                    </td>
                    {/* 期中 20% 折算 */}
                    <td className="py-1.5 px-2.5 text-center font-mono tabular-nums font-semibold text-slate-700 border-r border-slate-200">
                      {sc.midtermWeighted !== undefined ? `${sc.midtermWeighted}%` : '-'}
                    </td>

                    {/* 6. 口语 Sp (100分制) */}
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={sc.oral ?? ''}
                        placeholder="分"
                        onChange={e => handleFieldChange('oral', e.target.value)}
                        className="w-13 text-center text-xs font-mono tabular-nums bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded px-1 py-1 transition-all"
                      />
                    </td>
                    {/* 口语 10% 折算 */}
                    <td className="py-1.5 px-2 text-center font-mono tabular-nums text-slate-600 border-r border-slate-200">
                      {sc.oralWeighted !== undefined ? `${sc.oralWeighted}%` : '-'}
                    </td>

                    {/* 7. 期末 Final (100分制) */}
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={sc.finalExam ?? ''}
                        placeholder="分"
                        onChange={e => handleFieldChange('finalExam', e.target.value)}
                        className="w-13 text-center text-xs font-mono tabular-nums bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded px-1 py-1 transition-all"
                      />
                    </td>
                    {/* 期末 30% 折算 */}
                    <td className="py-1.5 px-2.5 text-center font-mono tabular-nums font-semibold text-slate-700 border-r border-slate-200">
                      {sc.finalExamWeighted !== undefined ? `${sc.finalExamWeighted}%` : '-'}
                    </td>

                    {/* 8. 学期总评分 (100% 满分) */}
                    <td className="py-1.5 px-2.5 bg-slate-100/50 text-center border-r border-slate-200">
                      <input
                        type="number"
                        step="any"
                        value={sc.manualTotal ?? ''}
                        placeholder="总分"
                        onChange={e => {
                          const val = e.target.value === '' ? undefined : Number(e.target.value);
                          onUpdateStudentScores(stu.id, {
                            ...stu.scores,
                            manualTotal: val
                          });
                        }}
                        className="w-16 text-center text-xs font-bold font-mono tabular-nums bg-white border border-slate-300 rounded px-1 py-1 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        title="各分项折算实时加总，教师亦可随时手动直接录入或微调"
                      />
                    </td>

                    {/* 综合等第 */}
                    <td className="py-1.5 px-3 border-r border-slate-200 text-center">
                      <select
                        value={stu.evaluation.grade}
                        onChange={e =>
                          onUpdateStudentEvaluation(stu.id, {
                            grade: e.target.value as StudentEvaluation['grade']
                          })
                        }
                        className={`text-xs px-2 py-0.5 rounded font-medium border cursor-pointer ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
                      >
                        <option value="">未评定</option>
                        <option value="优秀">优秀 (A)</option>
                        <option value="良好">良好 (B)</option>
                        <option value="合格">合格 (C)</option>
                        <option value="待提高">待提高 (D)</option>
                      </select>
                    </td>

                    {/* 期末评语与标签 (支持AI生成) */}
                    <td className="py-1.5 px-4 border-r border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={stu.evaluation.remarks}
                          placeholder="输入期末评语，或点击右侧 AI 生成..."
                          onChange={e =>
                            onUpdateStudentEvaluation(stu.id, { remarks: e.target.value })
                          }
                          className="flex-1 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-300 rounded px-2 py-1 text-slate-700 focus:outline-none"
                        />

                        {/* Single Student AI Generator Button */}
                        <button
                          onClick={() => handleGenerateSingleAI(stu)}
                          disabled={isGeneratingThisStudent || isBatchGeneratingAi}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer shrink-0"
                          title="根据考勤、作业及测验成绩AI生成评语和标签"
                        >
                          {isGeneratingThisStudent ? (
                            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                          ) : (
                            <Sparkles className="w-3 h-3 text-blue-500" />
                          )}
                          <span>AI评语</span>
                        </button>
                      </div>

                      {/* Tags Strip */}
                      <div className="flex flex-wrap items-center gap-1">
                        {(stu.evaluation.tags || []).map((t, tidx) => (
                          <span
                            key={tidx}
                            className="inline-flex items-center gap-0.5 text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded"
                          >
                            <span>{t}</span>
                            <button
                              onClick={() => {
                                const newTags = (stu.evaluation.tags || []).filter((_, i) => i !== tidx);
                                onUpdateStudentEvaluation(stu.id, { tags: newTags });
                              }}
                              className="text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <select
                          value=""
                          onChange={e => {
                            if (!e.target.value) return;
                            const current = stu.evaluation.tags || [];
                            if (!current.includes(e.target.value)) {
                              onUpdateStudentEvaluation(stu.id, { tags: [...current, e.target.value] });
                            }
                          }}
                          className="text-[10px] text-slate-400 bg-transparent border border-dashed border-slate-200 hover:border-slate-300 rounded px-1 py-0.2 cursor-pointer"
                        >
                          <option value="">+加标签</option>
                          {commonTags.map(ct => (
                            <option key={ct} value={ct}>
                              {ct}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* 具体课堂表现成长记录 */}
                    <td className="py-1.5 px-3 text-center">
                      <button
                        onClick={() => setActiveStudentForBehavior(stu)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span>{stu.evaluation.behaviorNotes?.length || 0}条</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Behavior Notes Drawer / Modal */}
      {activeStudentForBehavior && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-5 border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activeStudentForBehavior.name} · 课堂表现记录
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  日常表现备注与成长日志，期末可作为综合评定依据
                </p>
              </div>
              <button
                onClick={() => setActiveStudentForBehavior(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Existing notes list */}
            <div className="flex-1 overflow-y-auto py-3 space-y-2 custom-scrollbar">
              {(!activeStudentForBehavior.evaluation.behaviorNotes ||
                activeStudentForBehavior.evaluation.behaviorNotes.length === 0) ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  暂无表现记录，在下方输入框添加第一条记录
                </div>
              ) : (
                activeStudentForBehavior.evaluation.behaviorNotes.map(n => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] text-slate-400">{n.date}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            n.type === 'positive'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : n.type === 'concern'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {n.type === 'positive' ? '积极' : n.type === 'concern' ? '需关注' : '随记'}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{n.content}</p>
                    </div>

                    <button
                      onClick={() =>
                        onDeleteBehaviorNote(activeStudentForBehavior.id, n.id)
                      }
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="删除记录"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new note form */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newNoteDate}
                  onChange={e => setNewNoteDate(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
                />
                <select
                  value={newNoteType}
                  onChange={e =>
                    setNewNoteType(e.target.value as 'positive' | 'concern' | 'neutral')
                  }
                  className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700"
                >
                  <option value="positive">积极表现</option>
                  <option value="concern">需关注</option>
                  <option value="neutral">日常纪要</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoteContent}
                  onChange={e => setNewNoteContent(e.target.value)}
                  placeholder="例如：课堂发言积极、发音标准、作业工整..."
                  className="flex-1 text-xs border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newNoteContent.trim()) {
                      onAddBehaviorNote(activeStudentForBehavior.id, {
                        date: newNoteDate,
                        content: newNoteContent.trim(),
                        type: newNoteType
                      });
                      setNewNoteContent('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (!newNoteContent.trim()) return;
                    onAddBehaviorNote(activeStudentForBehavior.id, {
                      date: newNoteDate,
                      content: newNoteContent.trim(),
                      type: newNoteType
                    });
                    setNewNoteContent('');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
