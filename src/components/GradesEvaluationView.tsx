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
  Edit3,
  Award,
  BarChart2
} from 'lucide-react';
import { ClassRoom, Student, Assignment, StudentScores, StudentEvaluation, BehaviorNote } from '../types';
import {
  calculateStudentAttendance,
  calculateStudentHomework,
  getEvaluationBadgeColor,
  computeStudentScores,
  getGradeFromScore
} from '../utils/calculations';
import { requestAIEvaluation } from '../utils/aiEvaluation';
import { StudentAvatarBadge } from '../utils/avatarHelper';

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
  onOpenAvatarPicker?: (student: Student) => void;
  onOpenCertificate?: (student: Student) => void;
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
  isJustSaved,
  onOpenAvatarPicker,
  onOpenCertificate
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
  // 作业基准：默认动态自适应实际布置的作业总数 (学期可多可少，不再硬性限制20次)
  const [selectedHwTarget, setSelectedHwTarget] = useState<number | 'auto'>('auto');
  const classHwTarget = selectedHwTarget === 'auto'
    ? (classAssignments.length > 0 ? classAssignments.length : 10)
    : selectedHwTarget;

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

  // 一键将自动考勤与自动作业统计结果正式写入已保存成绩对象，并自动更新总分与等第
  const handleAutoFillAllAttendanceAndHw = () => {
    students.forEach(stu => {
      const attStats = calculateStudentAttendance(stu, classAttTarget);
      const hwStats = calculateStudentHomework(stu.id, classAssignments, classHwTarget);
      const nextScores: Partial<StudentScores> = {
        ...stu.scores,
        attDays: attStats.presentCount,
        attTarget: classAttTarget,
        attWeighted: attStats.attendanceScore10,
        hwCount: hwStats.submittedCount + hwStats.lateCount,
        hwTarget: classHwTarget,
        hwWeighted: hwStats.homeworkScore10
      };
      delete nextScores.manualTotal;
      const updated = computeStudentScores(
        nextScores,
        classAttTarget,
        classHwTarget,
        attStats.attendanceScore10,
        hwStats.homeworkScore10
      );
      updated.manualTotal = updated.calculatedSum;
      onUpdateStudentScores(stu.id, updated);
      onUpdateStudentEvaluation(stu.id, { grade: getGradeFromScore(updated.calculatedSum) });
    });
  };

  // 自动根据当前各项折算分重新加总全班学期总分并自动同步等第 (考勤+作业+小测+期中+口语+期末)
  const handleSyncAllTotalsAndGrades = () => {
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
      // 考勤10% + 作业10% + 小测20% + 期中20% + 口语10% + 期末30%
      const autoTotal = sc.calculatedSum ?? sc.manualTotal ?? 0;
      const updatedScores = {
        ...stu.scores,
        manualTotal: autoTotal,
        calculatedSum: autoTotal
      };
      onUpdateStudentScores(stu.id, updatedScores);

      // 自动评定等第: >=90优秀, >=80良好, >=60合格, <60待提高
      const autoGrade = getGradeFromScore(autoTotal);
      onUpdateStudentEvaluation(stu.id, { grade: autoGrade });
    });
  };

  // 自动根据当前总分评定等第 (>=90优秀, >=80良好, >=60合格, <60待提高)
  const handleAutoAssignGrades = handleSyncAllTotalsAndGrades;

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
              <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium border border-teal-100 flex items-center gap-1">
                <Info className="w-3 h-3" />
                作业自适应得分：满分10分，按实交/缺交及打分加权自动折算 (缺交按比例扣分，全交满分)
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

            {/* HW Target (Dynamic auto or flexible custom target) */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-600">
              <span className="text-slate-400">作业基准:</span>
              <select
                value={selectedHwTarget}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedHwTarget(val === 'auto' ? 'auto' : Number(val));
                }}
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                title="选择作业考核基准：默认根据实际布置的作业总数自适应"
              >
                <option value="auto">
                  实际布置 ({classAssignments.length}次 · 自动自适应)
                </option>
                <option value={10}>固定 10 次</option>
                <option value={12}>固定 12 次</option>
                <option value={15}>固定 15 次</option>
                <option value={18}>固定 18 次</option>
                <option value={20}>固定 20 次</option>
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
              onClick={handleSyncAllTotalsAndGrades}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition-all cursor-pointer shadow-2xs"
              title="根据考勤+作业+小测+期中+口语+期末自动重新加总全班学期总分并自动匹配等第"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600" />
              <span>自动加总分与等第 ✨</span>
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
                  <div className="text-[10px] text-teal-700 font-normal">得分与缺交加权折算</div>
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
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-200 bg-slate-100/90 text-slate-900 font-bold text-center min-w-[95px]">
                  <div>学期总评</div>
                  <div className="text-[10px] text-emerald-700 font-medium">自动加总(100%)</div>
                </th>

                {/* 等第 & 评语 */}
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-200 text-center min-w-[85px]">
                  <div>等第</div>
                  <div className="text-[10px] text-blue-700 font-medium">自动根据总分</div>
                </th>
                <th rowSpan={2} className="py-2 px-4 border-r border-slate-200 text-left min-w-[320px]">
                  期末综合评定评语与标签 (支持AI一键生成)
                </th>
                <th rowSpan={2} className="py-2 px-3 border-r border-slate-200 text-center min-w-[70px]">
                  课堂记录
                </th>
                <th rowSpan={2} className="py-2 px-3 text-center min-w-[130px] bg-amber-50/50 text-amber-900 font-bold">
                  结业证书与诊断
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
                <th className="py-1.5 px-2 border-r border-slate-100" title="已交次数 / 考核基准布置数">
                  已交/布置
                </th>
                <th className="py-1.5 px-2 border-r border-slate-200 text-slate-700 font-medium" title="按实际布置总次数与得分加权折算 (满分10分，缺交按比例扣分，得分低扣分)">
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

                // 自动加总 = 考勤(10%) + 作业(10%) + 小测(20%) + 期中(20%) + 口语(10%) + 期末(30%)
                const autoCalculatedTotal = sc.calculatedSum ?? 0;
                // 有效总分：如果手动微调过则保留，否则优先采用自动加总结果
                const effectiveTotalScore = sc.manualTotal !== undefined ? sc.manualTotal : autoCalculatedTotal;
                // 根据总分实时自动生成的等第 (>=90优秀, >=80良好, >=60合格, <60待提高)
                const autoGrade = getGradeFromScore(effectiveTotalScore);
                const currentGrade = stu.evaluation.grade || autoGrade;
                const badgeColor = getEvaluationBadgeColor(currentGrade);
                const isAutoMatched = sc.manualTotal === undefined || sc.manualTotal === autoCalculatedTotal;

                // 录入考勤、作业、小测、期中、口语、期末任意分值时，自动实时重新求和出总分，并自动生成等第
                const handleFieldChange = (field: keyof StudentScores, rawVal: string) => {
                  const val = rawVal === '' ? undefined : Number(rawVal);
                  const nextScores: Partial<StudentScores> = {
                    ...stu.scores,
                    attTarget: classAttTarget,
                    hwTarget: classHwTarget,
                    [field]: val
                  };

                  // 修改各分项时，清除旧 manualTotal，让系统自动根据各科折算分相加
                  if (field !== 'manualTotal') {
                    delete nextScores.manualTotal;
                  }

                  const updated = computeStudentScores(
                    nextScores,
                    classAttTarget,
                    classHwTarget,
                    autoAttScore,
                    autoHwScore
                  );

                  // 自动加总出新总分 (考勤 + 作业 + 小测 + 期中 + 口语 + 期末)
                  if (field !== 'manualTotal') {
                    updated.manualTotal = updated.calculatedSum;
                  }

                  onUpdateStudentScores(stu.id, updated);

                  // 等第实时自动联动生成！
                  const newTotal = updated.manualTotal ?? updated.calculatedSum ?? 0;
                  const newAutoGrade = getGradeFromScore(newTotal);
                  onUpdateStudentEvaluation(stu.id, { grade: newAutoGrade });
                };

                // 一键恢复并同步为自动加总求和
                const handleResetToAutoSum = () => {
                  const nextScores = { ...stu.scores };
                  delete nextScores.manualTotal;
                  const updated = computeStudentScores(
                    nextScores,
                    classAttTarget,
                    classHwTarget,
                    autoAttScore,
                    autoHwScore
                  );
                  updated.manualTotal = updated.calculatedSum;
                  onUpdateStudentScores(stu.id, updated);

                  const newAutoGrade = getGradeFromScore(updated.calculatedSum);
                  onUpdateStudentEvaluation(stu.id, { grade: newAutoGrade });
                };

                const isGeneratingThisStudent = generatingAiId === stu.id;

                return (
                  <tr key={stu.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* 学号 */}
                    <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">
                      {stu.no}
                    </td>

                    {/* 姓名 */}
                    <td className="py-2 px-3 sticky left-12 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-100 min-w-[150px]">
                      <div className="flex items-center justify-between gap-1.5 group/stu">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <StudentAvatarBadge
                            student={stu}
                            size="xs"
                            onClick={() => onOpenAvatarPicker?.(stu)}
                            className="cursor-pointer shrink-0"
                            title="点击挑选卡通头像或上传照片"
                          />
                          <button
                            onClick={() => onSelectStudentModal(stu)}
                            className="font-medium text-slate-800 hover:text-blue-600 transition-colors cursor-pointer text-left truncate"
                            title="点击查看该学生详细档案与学情诊断"
                          >
                            <span className="truncate">{stu.name}</span>
                          </button>
                        </div>
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

                    {/* 2. 作业完成次数与基准 */}
                    <td className="py-1.5 px-1.5 text-center border-r border-slate-100">
                      <div className="font-mono tabular-nums text-xs font-semibold text-slate-700">
                        {hwStats.submittedCount + hwStats.lateCount}/{classHwTarget}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {hwStats.missingCount > 0 ? (
                          <span className="text-amber-600 font-medium">缺{hwStats.missingCount}次</span>
                        ) : (
                          <span className="text-emerald-600 font-medium">全交齐</span>
                        )}
                      </div>
                    </td>

                    {/* 作业 10% 折算分 (支持直接调整或自动计算) */}
                    <td className="py-1.5 px-2 text-center font-mono tabular-nums font-bold text-slate-800 border-r border-slate-200">
                      <input
                        type="number"
                        min={0}
                        max={10}
                        step="0.05"
                        value={sc.hwWeighted ?? ''}
                        placeholder={String(autoHwScore)}
                        onChange={e => handleFieldChange('hwWeighted', e.target.value)}
                        className="w-13 text-center text-xs font-mono font-bold tabular-nums bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-400 rounded px-1 py-1 transition-all"
                        title={`作业考核分: ${autoHwScore}分 (应得满分: ${hwStats.totalPossibleScore}, 实得总分: ${hwStats.totalEarnedScore}, 缺交: ${hwStats.missingCount}次, 完成率: ${hwStats.completionRate}%)`}
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

                    {/* 8. 学期总评分 (100% 满分) - 自动根据考勤+作业+小测+期中+口语+期末计算 */}
                    <td className="py-1.5 px-2.5 bg-slate-100/50 text-center border-r border-slate-200">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number"
                            step="any"
                            value={effectiveTotalScore || ''}
                            placeholder="总分"
                            onChange={e => {
                              const val = e.target.value === '' ? undefined : Number(e.target.value);
                              const updated = computeStudentScores(
                                {
                                  ...stu.scores,
                                  attTarget: classAttTarget,
                                  hwTarget: classHwTarget,
                                  manualTotal: val
                                },
                                classAttTarget,
                                classHwTarget,
                                autoAttScore,
                                autoHwScore
                              );
                              onUpdateStudentScores(stu.id, updated);
                              if (val !== undefined) {
                                const newGrade = getGradeFromScore(val);
                                onUpdateStudentEvaluation(stu.id, { grade: newGrade });
                              }
                            }}
                            className="w-16 text-center text-xs font-black font-mono tabular-nums bg-white border border-slate-300 rounded px-1 py-1 text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                            title={`自动加总公式：考勤(${sc.attWeighted || 0}) + 作业(${sc.hwWeighted || 0}) + 小测(${sc.quizTotal || 0}) + 期中(${sc.midtermWeighted || 0}) + 口语(${sc.oralWeighted || 0}) + 期末(${sc.finalExamWeighted || 0}) = ${autoCalculatedTotal}分`}
                          />
                        </div>

                        {/* 自动加总状态标签 */}
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 py-0.2 rounded font-semibold whitespace-nowrap"
                            title={`各分项自动加总求和: ${autoCalculatedTotal}分`}
                          >
                            自动加总
                          </span>
                          {!isAutoMatched && (
                            <button
                              type="button"
                              onClick={handleResetToAutoSum}
                              className="text-[9px] text-blue-600 hover:text-blue-800 underline cursor-pointer whitespace-nowrap"
                              title="点击同步为实际自动加总值"
                            >
                              同步({autoCalculatedTotal})
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 综合等第 - 自动根据总分生成 (>=90优秀, >=80良好, >=60合格, <60待提高) */}
                    <td className="py-1.5 px-2.5 border-r border-slate-200 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <select
                          value={currentGrade}
                          onChange={e =>
                            onUpdateStudentEvaluation(stu.id, {
                              grade: e.target.value as StudentEvaluation['grade']
                            })
                          }
                          className={`text-xs px-2 py-1 rounded font-bold border cursor-pointer transition-colors ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
                          title={`总分 ${effectiveTotalScore} 分 -> 自动生成等第: ${autoGrade} (亦可手动自定)`}
                        >
                          <option value="">未评定</option>
                          <option value="优秀">优秀 (A)</option>
                          <option value="良好">良好 (B)</option>
                          <option value="合格">合格 (C)</option>
                          <option value="待提高">待提高 (D)</option>
                        </select>
                        <span className="text-[9px] text-slate-400 scale-90 font-mono whitespace-nowrap">
                          {effectiveTotalScore >= 90 ? '≥90 优秀' : effectiveTotalScore >= 80 ? '80-89 良好' : effectiveTotalScore >= 60 ? '60-79 合格' : '<60 待提高'}
                        </span>
                      </div>
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
                    <td className="py-1.5 px-3 text-center border-r border-slate-200">
                      <button
                        onClick={() => setActiveStudentForBehavior(stu)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span>{stu.evaluation.behaviorNotes?.length || 0}条</span>
                      </button>
                    </td>

                    {/* 结业证书与学情诊断 */}
                    <td className="py-1.5 px-2 text-center whitespace-nowrap bg-amber-50/20">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenCertificate && (
                          <button
                            onClick={() => onOpenCertificate(stu)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-amber-900 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 rounded transition-colors cursor-pointer shadow-2xs"
                            title="生成并下载该学生的结业证书 (HTML网页格式 / 自带打印与WPS排版)"
                          >
                            <Award className="w-3 h-3 text-amber-700" />
                            <span>结业证</span>
                          </button>
                        )}
                        <button
                          onClick={() => onSelectStudentModal(stu)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors cursor-pointer shadow-2xs"
                          title="查看该学生优缺点学情诊断分析图表"
                        >
                          <BarChart2 className="w-3 h-3 text-blue-600" />
                          <span>诊断</span>
                        </button>
                      </div>
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
