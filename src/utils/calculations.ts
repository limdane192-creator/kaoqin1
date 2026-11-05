/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Assignment, StudentSubmission, StudentScores } from '../types';

export interface StudentAttendanceStats {
  presentCount: number; // 正常出勤 (1)
  lateCount: number; // 迟到 (L)
  leaveCount: number; // 请假 (P)
  absentCount: number; // 旷课 (A)
  exemptCount: number; // 换班生/免修/停课 (-) - 不扣分
  unrecordedCount: number; // 空白未填 - 半学期插班生不扣分
  totalRecorded: number; // 已记录考勤总课时
  attendanceRate: number; // 出勤率百分比 (0-100)
  attendanceScore10: number; // 考勤得分(10分制，满分10分=10%)：只扣请假(0.25)、旷课(0.5)、迟到(每3次0.5)
  attendanceScore: number; // 百分制 (attendanceScore10 * 10)
  deductions: {
    leaveDeduction: number;
    absentDeduction: number;
    lateDeduction: number;
    totalDeductions: number;
  };
}

/**
 * 考勤统计与评分规则：
 * - 满分10分 (占总评 10%)
 * - 考勤空没填的地方不扣分 (半学期才报名的插班生)
 * - '-' 记为换班生，分数也不扣
 * - '1' 正常出勤不扣分
 * - 只扣请假 (P)：一次扣 0.25 分
 * - 旷课 (A)：一次扣 0.5 分
 * - 迟到 (L)：每满 3 次扣 0.5 分
 */
export function calculateStudentAttendance(
  student: Student,
  totalSessions: number = 30
): StudentAttendanceStats {
  let presentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  let absentCount = 0;
  let exemptCount = 0;
  let unrecordedCount = 0;

  for (let i = 1; i <= totalSessions; i++) {
    const status = student.attendance[i];
    if (status === '1') presentCount++;
    else if (status === 'L') lateCount++;
    else if (status === 'P') leaveCount++;
    else if (status === 'A') absentCount++;
    else if (status === '-') exemptCount++;
    else unrecordedCount++;
  }

  // 扣分明细计算
  const leaveDeduction = Number((leaveCount * 0.25).toFixed(2));
  const absentDeduction = Number((absentCount * 0.5).toFixed(2));
  const lateDeduction = Number((Math.floor(lateCount / 3) * 0.5).toFixed(2));
  const totalDeductions = Number((leaveDeduction + absentDeduction + lateDeduction).toFixed(2));

  // 10分制考勤得分 (对应成绩总评 10% 权重)
  const attendanceScore10 = Math.max(0, Number((10 - totalDeductions).toFixed(2)));

  // 有效在籍开课课时 (排除换班和未报名课时)
  const activeHeldSessions = presentCount + lateCount + leaveCount + absentCount;

  // 出勤率计算 (仅基于学生实际在籍开课次数)
  const attendanceRate = activeHeldSessions > 0
    ? Math.min(100, Math.round(((presentCount + lateCount * 0.5) / activeHeldSessions) * 100))
    : 100;

  return {
    presentCount,
    lateCount,
    leaveCount,
    absentCount,
    exemptCount,
    unrecordedCount,
    totalRecorded: activeHeldSessions,
    attendanceRate,
    attendanceScore10,
    attendanceScore: Number((attendanceScore10 * 10).toFixed(1)),
    deductions: {
      leaveDeduction,
      absentDeduction,
      lateDeduction,
      totalDeductions
    }
  };
}

export interface StudentHomeworkStats {
  totalAssigned: number;
  submittedCount: number;
  lateCount: number;
  missingCount: number;
  excusedCount: number;
  completionRate: number;
  homeworkScore10: number; // 作业得分(10分制，满分10分=10%)
  averageScore: number;
  totalEarnedScore: number; // 实际得分总和
  totalPossibleScore: number; // 应得满分总和 (考核分母)
  missingAssignments: {
    assignmentId: string;
    title: string;
    assignedDate: string;
    dueDate: string;
  }[];
}

/**
 * 作业成绩与提交得分计算：
 * 1. 动态适应实际布置次数（学期不固定20次，可多可少，以实际布置为基准）
 * 2. 满分10分 (占学期总评 10%)
 * 3. 每次作业满分默认为 a.maxScore 或 100分：
 *    - 全部提交且都满分 -> 获得 10.0 满分
 *    - 缺交 (missing/未交) -> 扣分扣比例 (该次得0分，计入应得分母)
 *    - 提交了但分数不高 -> 按实际得分比例扣分
 *    - 豁免 (excused) -> 不计入考核分母，不扣分
 *    - 仅勾选已交但未录入具体小分 -> 默认按该次作业满分计算
 */
export function calculateStudentHomework(
  studentId: string,
  assignments: Assignment[],
  customTargetCount?: number
): StudentHomeworkStats {
  const totalAssigned = assignments.length;
  let submittedCount = 0;
  let lateCount = 0;
  let missingCount = 0;
  let excusedCount = 0;
  let gradedCount = 0;
  let totalScoreSum = 0;

  let totalEarnedScore = 0;
  let totalPossibleScore = 0;

  const missingAssignments: {
    assignmentId: string;
    title: string;
    assignedDate: string;
    dueDate: string;
  }[] = [];

  for (const a of assignments) {
    const maxScore = a.maxScore && a.maxScore > 0 ? a.maxScore : 100;
    const sub: StudentSubmission | undefined = a.submissions?.[studentId];

    if (!sub || sub.status === 'missing') {
      missingCount++;
      missingAssignments.push({
        assignmentId: a.id,
        title: a.title,
        assignedDate: a.assignedDate,
        dueDate: a.dueDate
      });
      // 缺交：该次作业实得 0 分，但计入总应得满分分母（按比例扣除作业分）
      totalPossibleScore += maxScore;
    } else if (sub.status === 'excused') {
      // 豁免/免修：不计入学生考核分母，不扣分
      excusedCount++;
    } else if (sub.status === 'submitted' || sub.status === 'late') {
      if (sub.status === 'submitted') {
        submittedCount++;
      } else {
        lateCount++;
      }

      totalPossibleScore += maxScore;

      if (typeof sub.score === 'number') {
        const earned = Math.max(0, Math.min(maxScore, sub.score));
        totalEarnedScore += earned;
        totalScoreSum += sub.score;
        gradedCount++;
      } else {
        // 如果教师勾选了已交或补交，但未填具体打分，默认获得该作业的完整基础满分
        totalEarnedScore += maxScore;
        totalScoreSum += maxScore;
        gradedCount++;
      }
    }
  }

  // 若教师设定了高于实际布置次数的特定固定目标（如提前锁定期末20次，但当前只布置了部分），
  // 则差额部分按未布置/未提交折算；若未指定或选择自适应（<= 实际布置数），则完全按实际布置作业为准
  let effectivePossible = totalPossibleScore;
  if (customTargetCount && customTargetCount > totalAssigned && totalAssigned > 0) {
    const extraHwCount = customTargetCount - totalAssigned;
    effectivePossible += extraHwCount * 100;
  }

  const effectiveAssignmentsCount = customTargetCount && customTargetCount > totalAssigned
    ? customTargetCount - excusedCount
    : Math.max(0, totalAssigned - excusedCount);

  const doneCount = submittedCount + lateCount;
  let completionRate = 100;
  let homeworkScore10 = 10;

  if (effectiveAssignmentsCount > 0) {
    completionRate = Math.min(100, Math.round((doneCount / effectiveAssignmentsCount) * 100));
    // 教学实用原则：按做的次数来折算作业总分 (完成次数 / 应完成总数 * 10分)
    homeworkScore10 = Number(((doneCount / effectiveAssignmentsCount) * 10).toFixed(2));
  } else if (totalAssigned === 0) {
    // 尚未布置任何作业时，不扣分，作业满分10分，完成率100%
    completionRate = 100;
    homeworkScore10 = 10;
  }

  // 平均分（基于已提交打分的平均百分制得分）
  const averageScore = gradedCount > 0
    ? Math.round(totalScoreSum / gradedCount)
    : (totalAssigned > 0 && doneCount === 0 ? 0 : 100);

  return {
    totalAssigned,
    submittedCount,
    lateCount,
    missingCount,
    excusedCount,
    completionRate,
    homeworkScore10: Math.max(0, Math.min(10, homeworkScore10)),
    averageScore,
    totalEarnedScore,
    totalPossibleScore: effectivePossible,
    missingAssignments
  };
}

export function getEvaluationBadgeColor(grade?: string): { bg: string; text: string; border: string } {
  switch (grade) {
    case '优秀':
    case 'A+':
    case 'A':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case '良好':
    case 'B+':
    case 'B':
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case '合格':
    case 'C':
      return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case '待提高':
    case 'D':
      return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
  }
}

/**
 * 学校官方成绩打分与权重计算体系：
 * - 考勤 (10%): 满分10分，扣减请假(-0.25)、旷课(-0.5)、迟到(每3次-0.5)
 * - 作业 (10%): 满分10分，15-20次不定，按完成次数自动填充或根据作业打分折算
 * - 小测试 Quiz (两次共20%): Quiz 1 (10%) + Quiz 2 (10%)
 * - 期中考试 Mid (20%): 满分100分，midterm * 0.2
 * - 口语考试 Sp (10%): 满分100分，oral * 0.1
 * - 期末考试 Final (30%): 满分100分，finalExam * 0.3
 * - 学期总评分: 100% 满分实时加总
 */
export function computeStudentScores(
  scores: Partial<StudentScores>,
  defaultAttTarget: number = 30,
  defaultHwTarget: number = 20,
  autoAttScore?: number,
  autoHwScore?: number
): StudentScores {
  // 1. 考勤 10%
  const attTarget = scores.attTarget || defaultAttTarget;
  const attDays = typeof scores.attDays === 'number' ? scores.attDays : undefined;
  
  // 考勤折算分：优先使用已有设置，如果没有则使用根据规则计算的自动考勤分 (满分10分)
  let attWeighted: number | undefined = scores.attWeighted;
  if (attWeighted === undefined) {
    if (typeof autoAttScore === 'number') {
      attWeighted = autoAttScore;
    } else if (attDays !== undefined && attTarget > 0) {
      attWeighted = Number(Math.min(10, (attDays / attTarget) * 10).toFixed(2));
    }
  }

  // 2. 作业 10%
  const hwTarget = scores.hwTarget || defaultHwTarget;
  const hwCount = typeof scores.hwCount === 'number' ? scores.hwCount : undefined;
  let hwWeighted: number | undefined = scores.hwWeighted;
  if (hwWeighted === undefined) {
    if (typeof autoHwScore === 'number') {
      hwWeighted = autoHwScore;
    } else if (hwCount !== undefined && hwTarget > 0) {
      hwWeighted = Number(Math.min(10, (hwCount / hwTarget) * 10).toFixed(2));
    }
  }

  // 3. Quiz 1 (10%)
  const q1 = typeof scores.quiz1 === 'number' ? scores.quiz1 : undefined;
  const q1Weighted = q1 !== undefined ? Number((q1 * 0.1).toFixed(2)) : undefined;

  // 4. Quiz 2 (10%)
  const q2 = typeof scores.quiz2 === 'number' ? scores.quiz2 : undefined;
  const q2Weighted = q2 !== undefined ? Number((q2 * 0.1).toFixed(2)) : undefined;

  // Quiz总折算 (20%)
  let quizTotal: number | undefined = undefined;
  if (q1Weighted !== undefined || q2Weighted !== undefined) {
    quizTotal = Number(((q1Weighted || 0) + (q2Weighted || 0)).toFixed(2));
  }

  // 5. 期中考试 (20%)
  const mid = typeof scores.midterm === 'number' ? scores.midterm : undefined;
  const midWeighted = mid !== undefined ? Number((mid * 0.2).toFixed(2)) : undefined;

  // 6. 口语考试 (10%)
  const oral = typeof scores.oral === 'number' ? scores.oral : undefined;
  const oralWeighted = oral !== undefined ? Number((oral * 0.1).toFixed(2)) : undefined;

  // 7. 期末考试 (30%)
  const finalExam = typeof scores.finalExam === 'number' ? scores.finalExam : undefined;
  const finalExamWeighted = finalExam !== undefined ? Number((finalExam * 0.3).toFixed(2)) : undefined;

  // 综合总分 (100%满分) 自动加总：考勤(10%) + 作业(10%) + 小测(20%) + 期中(20%) + 口语(10%) + 期末(30%)
  const calculatedSum = Number(
    (
      (attWeighted || 0) +
      (hwWeighted || 0) +
      (quizTotal || 0) +
      (midWeighted || 0) +
      (oralWeighted || 0) +
      (finalExamWeighted || 0)
    ).toFixed(2)
  );

  return {
    ...scores,
    attDays,
    attTarget,
    attWeighted,
    hwCount,
    hwTarget,
    hwWeighted,
    quiz1: q1,
    quiz1Weighted: q1Weighted,
    quiz2: q2,
    quiz2Weighted: q2Weighted,
    quizTotal,
    midterm: mid,
    midtermWeighted: midWeighted,
    oral,
    oralWeighted,
    finalExam,
    finalExamWeighted,
    calculatedSum,
    manualTotal: scores.manualTotal !== undefined ? scores.manualTotal : (calculatedSum > 0 ? calculatedSum : undefined)
  };
}

/**
 * 根据学期总分自动计算评定等第：
 * - 90分及以上: 优秀 (A)
 * - 80分 ~ 89.9分: 良好 (B)
 * - 60分 ~ 79.9分: 合格 (C)
 * - 60分以下: 待提高 (D)
 */
export function getGradeFromScore(score: number | undefined | null): '优秀' | '良好' | '合格' | '待提高' {
  if (typeof score !== 'number' || isNaN(score) || score <= 0) return '待提高';
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 60) return '合格';
  return '待提高';
}

/**
 * 学生姓名 A-Z 拼音/字母排序比较函数
 * 支持英文、拼音、汉字双语姓名按 A-Z 字母升序排序
 */
export function compareStudentNamesAZ(nameA: string, nameB: string): number {
  const cleanA = (nameA || '').trim();
  const cleanB = (nameB || '').trim();
  return cleanA.localeCompare(cleanB, 'zh-Hans-CN', {
    numeric: true,
    sensitivity: 'base'
  });
}

/**
 * 将学生列表按姓名 A-Z 排序
 */
export function sortStudentsByNameAZ<T extends { name: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => compareStudentNamesAZ(a.name, b.name));
}
