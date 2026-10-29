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
  missingAssignments: {
    assignmentId: string;
    title: string;
    assignedDate: string;
    dueDate: string;
  }[];
}

export function calculateStudentHomework(
  studentId: string,
  assignments: Assignment[],
  targetHwCount: number = 20
): StudentHomeworkStats {
  let totalAssigned = assignments.length;
  let submittedCount = 0;
  let lateCount = 0;
  let missingCount = 0;
  let excusedCount = 0;
  let totalScoreSum = 0;
  let gradedCount = 0;
  const missingAssignments: {
    assignmentId: string;
    title: string;
    assignedDate: string;
    dueDate: string;
  }[] = [];

  for (const a of assignments) {
    const sub: StudentSubmission | undefined = a.submissions[studentId];
    if (!sub || sub.status === 'missing') {
      missingCount++;
      missingAssignments.push({
        assignmentId: a.id,
        title: a.title,
        assignedDate: a.assignedDate,
        dueDate: a.dueDate
      });
    } else if (sub.status === 'submitted') {
      submittedCount++;
      if (typeof sub.score === 'number') {
        totalScoreSum += sub.score;
        gradedCount++;
      }
    } else if (sub.status === 'late') {
      lateCount++;
      if (typeof sub.score === 'number') {
        totalScoreSum += sub.score;
        gradedCount++;
      }
    } else if (sub.status === 'excused') {
      excusedCount++;
    }
  }

  const effectiveTotal = Math.max(1, targetHwCount || totalAssigned || 20);
  const doneCount = submittedCount + lateCount;
  const completionRate = Math.min(100, Math.round((doneCount / effectiveTotal) * 100));

  // 10分制作业得分 (占总评 10%)
  // 若有具体打分取平均分折算，否则按完成次数比例折算 (满分10分)
  let homeworkScore10: number;
  if (gradedCount > 0) {
    const avg = totalScoreSum / gradedCount; // 0-100
    homeworkScore10 = Number(Math.min(10, avg * 0.1).toFixed(2));
  } else {
    homeworkScore10 = Number(Math.min(10, (doneCount / effectiveTotal) * 10).toFixed(2));
  }

  const averageScore = gradedCount > 0 ? Math.round(totalScoreSum / gradedCount) : 0;

  return {
    totalAssigned,
    submittedCount,
    lateCount,
    missingCount,
    excusedCount,
    completionRate,
    homeworkScore10,
    averageScore,
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

  // 综合总分 (100%满分)
  const sum = Number(
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
    manualTotal: scores.manualTotal !== undefined ? scores.manualTotal : (sum > 0 ? sum : undefined)
  };
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
