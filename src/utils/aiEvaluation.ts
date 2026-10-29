/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student, Assignment, StudentScores, StudentEvaluation } from '../types';
import { calculateStudentAttendance, calculateStudentHomework, computeStudentScores } from './calculations';

export interface GeneratedEvaluationResult {
  remarks: string;
  tags: string[];
  grade: StudentEvaluation['grade'];
  source: 'gemini' | 'fallback';
}

/**
 * 智能规则生成评语备选引擎 (当API未配置或网络不可用时秒级提供贴切且有针对性的教师评语)
 */
export function generateLocalPedagogicalEvaluation(
  student: Student,
  assignments: Assignment[],
  attTarget: number = 30,
  hwTarget: number = 20
): GeneratedEvaluationResult {
  const attStats = calculateStudentAttendance(student, attTarget);
  const hwStats = calculateStudentHomework(student.id, assignments, hwTarget);
  const scores = computeStudentScores(
    student.scores,
    attTarget,
    hwTarget,
    attStats.attendanceScore10,
    hwStats.homeworkScore10
  );

  const total = scores.manualTotal ?? 0;
  const tags: string[] = [];
  const commentParts: string[] = [];

  // 1. 等第判断
  let grade: StudentEvaluation['grade'] = '合格';
  if (total >= 90) grade = '优秀';
  else if (total >= 80) grade = '良好';
  else if (total >= 60) grade = '合格';
  else grade = '待提高';

  // 2. 出勤分析
  if (attStats.absentCount === 0 && attStats.lateCount === 0 && attStats.leaveCount === 0) {
    tags.push('全勤模范');
    commentParts.push('本学期出勤纪律极佳，上课从未缺席或迟到，展现了极强的自律性与端正的学习态度。');
  } else if (attStats.absentCount > 0) {
    tags.push('出勤待提升');
    commentParts.push(`本学期累计旷课${attStats.absentCount}次，考勤纪律仍需重点加强，按时到校是学好课程的前提保障。`);
  } else if (attStats.leaveCount >= 3) {
    tags.push('需注意出勤');
    commentParts.push(`学期中因事/病请假${attStats.leaveCount}次，建议课后主动联系老师或同学补齐缺漏知识点。`);
  } else {
    tags.push('出勤良好');
    commentParts.push('上课出勤表现稳定，能较好地遵循课堂作息与纪律。');
  }

  // 3. 作业分析
  if (hwStats.missingCount === 0 && hwStats.submittedCount > 0) {
    tags.push('作业全交');
    commentParts.push('课后作业每次均按时保质完成，书写工整认真，巩固扎实。');
  } else if (hwStats.missingCount > 0) {
    tags.push('需跟进作业');
    commentParts.push(`尚有${hwStats.missingCount}次作业未能按时提交，希望今后提高时间管理能力，养成按时交作业的良好习惯。`);
  }

  // 4. 考试与专项分析 (口语/测试/期中/期末)
  if (scores.oral !== undefined && scores.oral >= 85) {
    tags.push('发音标准');
    commentParts.push('口语表达自然流利，发音准确，互动积极。');
  }

  if (scores.midterm !== undefined && scores.midterm >= 85) {
    tags.push('期中优秀');
  }

  if (scores.finalExam !== undefined && scores.finalExam >= 85) {
    tags.push('期末优异');
  }

  // 5. 课堂表现笔记提取
  const notes = student.evaluation.behaviorNotes || [];
  const positiveNotes = notes.filter(n => n.type === 'positive');
  if (positiveNotes.length > 0) {
    tags.push('课堂活跃');
    commentParts.push('在日常课堂互动中思维活跃，乐于回答问题与参与交流。');
  }

  // 综合总评句
  if (grade === '优秀') {
    commentParts.push('综合各模块成绩优异，是班级的学习榜样，期待新学期继续保持卓越！');
  } else if (grade === '良好') {
    commentParts.push('各方面基础良好，只要在细节上更进一步，定能取得更大的突破！');
  } else if (grade === '合格') {
    commentParts.push('顺利完成本学期学业指标，建议假期多做口语朗读与生词温故，新学期力争上游！');
  } else {
    commentParts.push('本学期基础尚显薄弱，需及时查漏补缺，老师会持续提供辅导，加油！');
  }

  // 去重标签保留 3-4 个
  const uniqueTags = Array.from(new Set(tags)).slice(0, 4);

  return {
    remarks: commentParts.join(' '),
    tags: uniqueTags,
    grade,
    source: 'fallback'
  };
}

/**
 * 本地智能教学评语生成 (纯离线可用，无需任何网络请求或第三方API)
 */
export async function requestAIEvaluation(
  student: Student,
  assignments: Assignment[],
  attTarget: number = 30,
  hwTarget: number = 20
): Promise<GeneratedEvaluationResult> {
  // 遵循纯静态离线可用要求，直接使用本地规则引擎生成个性化评价
  return Promise.resolve(generateLocalPedagogicalEvaluation(student, assignments, attTarget, hwTarget));
}
