/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, AlertTriangle, CheckCircle2, TrendingUp, Sparkles, BookOpen, Clock, Lightbulb } from 'lucide-react';
import { Student, Assignment, ClassRoom } from '../types';
import { calculateStudentAttendance, calculateStudentHomework, computeStudentScores } from '../utils/calculations';

interface StudentDiagnosisChartProps {
  student: Student;
  currentClass?: ClassRoom;
  assignments: Assignment[];
}

export interface DiagnosisItem {
  type: 'strength' | 'weakness' | 'suggestion';
  title: string;
  desc: string;
  scoreRatio?: number; // 0 to 1
}

export function generateStudentDiagnosis(
  student: Student,
  currentClass?: ClassRoom,
  assignments: Assignment[] = []
): {
  strengths: DiagnosisItem[];
  weaknesses: DiagnosisItem[];
  suggestions: DiagnosisItem[];
  rubricStats: {
    category: string;
    weight: string;
    earned: number;
    max: number;
    percent: number;
    level: '优秀' | '良好' | '待提升' | '未考';
    color: string;
  }[];
} {
  const classAssignments = assignments.filter(a => a.classId === student.classId);
  const targetAttDays = currentClass?.totalSessions || 30;
  const targetHwCount = classAssignments.length > 0 ? classAssignments.length : (currentClass?.totalHwTarget || 10);

  const attStats = calculateStudentAttendance(student, targetAttDays);
  const hwStats = calculateStudentHomework(student.id, classAssignments);
  const sc = computeStudentScores(
    student.scores,
    targetAttDays,
    targetHwCount,
    attStats.attendanceScore10,
    hwStats.homeworkScore10
  );

  const strengths: DiagnosisItem[] = [];
  const weaknesses: DiagnosisItem[] = [];
  const suggestions: DiagnosisItem[] = [];

  // 1. 考勤诊断 (10分)
  const attScore = sc.attWeighted ?? attStats.attendanceScore10;
  if (attStats.absentCount === 0 && attStats.lateCount === 0 && attStats.leaveCount === 0) {
    strengths.push({
      type: 'strength',
      title: '纪律极佳 · 全勤标兵',
      desc: `本学期已上 ${attStats.presentCount} 课，出勤率 100%，无迟到旷课，作息端正自律。`,
      scoreRatio: 1
    });
  } else {
    if (attStats.absentCount > 0) {
      weaknesses.push({
        type: 'weakness',
        title: '存在旷课缺席',
        desc: `本学期累计旷课 ${attStats.absentCount} 次，直接扣减考勤分 ${attStats.deductions.absentDeduction} 分，影响学期评级。`,
        scoreRatio: Math.max(0, attScore / 10)
      });
    }
    if (attStats.lateCount >= 2) {
      weaknesses.push({
        type: 'weakness',
        title: '迟到次数偏多',
        desc: `累计迟到 ${attStats.lateCount} 次，已扣除 ${attStats.deductions.lateDeduction} 分，建议提前10分钟做好上课准备。`,
        scoreRatio: Math.max(0, attScore / 10)
      });
    }
    if (attStats.leaveCount >= 2) {
      suggestions.push({
        type: 'suggestion',
        title: '请假缺课补漏',
        desc: `因事或因病请假 ${attStats.leaveCount} 次，建议课后主动联系老师或同学补齐缺漏板书与课件。`
      });
    }
  }

  // 2. 作业诊断 (10分)
  const hwScore = sc.hwWeighted ?? hwStats.homeworkScore10;
  if (hwStats.missingCount === 0 && hwStats.submittedCount > 0) {
    strengths.push({
      type: 'strength',
      title: '学风优良 · 作业全交',
      desc: `布置的 ${targetHwCount} 次作业已全部保质按时提交，完成率 100%，平时分满分。`,
      scoreRatio: 1
    });
  } else if (hwStats.missingCount > 0) {
    weaknesses.push({
      type: 'weakness',
      title: '作业缺交待补齐',
      desc: `尚有 ${hwStats.missingCount} 次作业未按时交回，按比例扣减平时作业分，抓紧补交可争取挽回平时分。`,
      scoreRatio: hwStats.completionRate / 100
    });
  }

  // 3. 小测诊断 (Quiz 1: 10%, Quiz 2: 10%)
  if ((sc.quiz1 !== undefined && sc.quiz1 >= 85) || (sc.quiz2 !== undefined && sc.quiz2 >= 85)) {
    strengths.push({
      type: 'strength',
      title: '阶段测验扎实',
      desc: `随堂小测成绩达标出色（Q1: ${sc.quiz1 ?? '-'}分 / Q2: ${sc.quiz2 ?? '-'}分），基础生词与语法掌握牢固。`,
      scoreRatio: 0.9
    });
  }
  if ((sc.quiz1 !== undefined && sc.quiz1 < 60) || (sc.quiz2 !== undefined && sc.quiz2 < 60)) {
    weaknesses.push({
      type: 'weakness',
      title: '小测基础需强化',
      desc: `部分随堂测验成绩未达及格线，反映近期单元生词遗忘率偏高，建议做好错题归纳。`
    });
  }

  // 4. 期中考试诊断 (20%)
  if (sc.midterm !== undefined) {
    if (sc.midterm >= 85) {
      strengths.push({
        type: 'strength',
        title: '期中考试拔尖',
        desc: `期中考试斩获 ${sc.midterm} 分高分，在全班处于优等生梯队，综合理解能力强。`,
        scoreRatio: sc.midterm / 100
      });
    } else if (sc.midterm < 60) {
      weaknesses.push({
        type: 'weakness',
        title: '期中考试失分较多',
        desc: `期中卷面 ${sc.midterm} 分，核心句型和阅读理解失分明显，需及时安排针对性复习。`,
        scoreRatio: sc.midterm / 100
      });
    }
  }

  // 5. 口语测试诊断 (10%)
  if (sc.oral !== undefined) {
    if (sc.oral >= 85) {
      strengths.push({
        type: 'strength',
        title: '听说口语流利',
        desc: `口语测试得 ${sc.oral} 分，发音标准，表达自信大方，语调自然。`,
        scoreRatio: sc.oral / 100
      });
    } else if (sc.oral < 65) {
      suggestions.push({
        type: 'suggestion',
        title: '多听多练提高语感',
        desc: `口语测试 ${sc.oral} 分，存在发音犹豫或词汇量不足，建议每天坚持课文跟读15分钟。`
      });
    }
  }

  // 6. 期末考试诊断 (30%)
  if (sc.finalExam !== undefined) {
    if (sc.finalExam >= 85) {
      strengths.push({
        type: 'strength',
        title: '期末大考优异',
        desc: `期末终考取得 ${sc.finalExam} 分优异成绩，学期知识点融会贯通，表现杰出。`,
        scoreRatio: sc.finalExam / 100
      });
    } else if (sc.finalExam < 60) {
      weaknesses.push({
        type: 'weakness',
        title: '期末考查需补漏',
        desc: `期末卷面成绩 ${sc.finalExam} 分，建议寒暑假期间全面温故整册教材基础知识。`,
        scoreRatio: sc.finalExam / 100
      });
    }
  }

  // 若优点较少，补充鼓励性优点
  if (strengths.length === 0) {
    strengths.push({
      type: 'strength',
      title: '学习态度端正',
      desc: '在班级中积极融入课堂，按时参加考勤与学习，具备良好的成长潜能。'
    });
  }

  // 若缺点较少，补充精益求精建议
  if (weaknesses.length === 0) {
    suggestions.push({
      type: 'suggestion',
      title: '保持优势 · 争创全优',
      desc: '当前各模块表现均衡出色，继续保持自律习惯，争取在各项考核中保持领先！'
    });
  }

  // 计算六个核心维度的直观条形统计
  const qTotal = (sc.quiz1Weighted || 0) + (sc.quiz2Weighted || 0);

  type LevelType = '优秀' | '良好' | '待提升' | '未考';

  const getQuizLevel = (): LevelType => {
    if (sc.quiz1 === undefined && sc.quiz2 === undefined) return '未考';
    const qVal = sc.quizTotal ?? qTotal;
    if (qVal >= 16) return '优秀';
    if (qVal >= 12) return '良好';
    return '待提升';
  };

  const getExamLevel = (val: number | undefined): LevelType => {
    if (val === undefined) return '未考';
    if (val >= 85) return '优秀';
    if (val >= 60) return '良好';
    return '待提升';
  };

  const rubricStats: {
    category: string;
    weight: string;
    earned: number;
    max: number;
    percent: number;
    level: LevelType;
    color: string;
  }[] = [
    {
      category: '出勤纪律',
      weight: '10%',
      earned: attScore,
      max: 10,
      percent: Math.round((attScore / 10) * 100),
      level: attScore >= 9 ? '优秀' : attScore >= 7 ? '良好' : '待提升',
      color: 'bg-emerald-500'
    },
    {
      category: '作业收缴',
      weight: '10%',
      earned: hwScore,
      max: 10,
      percent: Math.round((hwScore / 10) * 100),
      level: hwScore >= 9 ? '优秀' : hwScore >= 7 ? '良好' : '待提升',
      color: 'bg-teal-500'
    },
    {
      category: '随堂小测',
      weight: '20%',
      earned: sc.quizTotal ?? qTotal,
      max: 20,
      percent: (sc.quiz1 !== undefined || sc.quiz2 !== undefined) ? Math.round(((sc.quizTotal ?? qTotal) / 20) * 100) : 0,
      level: getQuizLevel(),
      color: 'bg-sky-500'
    },
    {
      category: '期中考试',
      weight: '20%',
      earned: sc.midtermWeighted ?? 0,
      max: 20,
      percent: sc.midterm !== undefined ? sc.midterm : 0,
      level: getExamLevel(sc.midterm),
      color: 'bg-indigo-500'
    },
    {
      category: '口语会话',
      weight: '10%',
      earned: sc.oralWeighted ?? 0,
      max: 10,
      percent: sc.oral !== undefined ? sc.oral : 0,
      level: getExamLevel(sc.oral),
      color: 'bg-amber-500'
    },
    {
      category: '期末终考',
      weight: '30%',
      earned: sc.finalExamWeighted ?? 0,
      max: 30,
      percent: sc.finalExam !== undefined ? sc.finalExam : 0,
      level: getExamLevel(sc.finalExam),
      color: 'bg-violet-500'
    }
  ];

  return { strengths, weaknesses, suggestions, rubricStats };
}

export const StudentDiagnosisChart: React.FC<StudentDiagnosisChartProps> = ({
  student,
  currentClass,
  assignments
}) => {
  const { strengths, weaknesses, suggestions, rubricStats } = generateStudentDiagnosis(
    student,
    currentClass,
    assignments
  );

  return (
    <div className="space-y-4">
      {/* Visual Diagnostic Bar Chart */}
      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-900">学情多维能力表现诊断图表</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">100% 满分加权模型</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {rubricStats.map((item, i) => (
            <div key={i} className="bg-white p-2.5 rounded-lg border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-slate-700">{item.category}</span>
                <span className="text-[10px] text-slate-400 font-mono">({item.weight})</span>
              </div>

              <div className="flex items-baseline justify-between mb-1.5">
                <div className="font-mono text-sm font-bold text-slate-900">
                  {item.level === '未考' ? '-' : `${item.earned}分`}
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                    item.level === '优秀'
                      ? 'bg-emerald-100 text-emerald-800'
                      : item.level === '良好'
                      ? 'bg-blue-100 text-blue-800'
                      : item.level === '待提升'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {item.level}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                  style={{ width: `${Math.min(100, Math.max(item.level === '未考' ? 0 : 5, item.percent))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths & Weaknesses Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* 1. 优势与长处 */}
        <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>🌟 优势与亮点表现 ({strengths.length})</span>
          </div>
          <div className="space-y-1.5">
            {strengths.map((s, idx) => (
              <div key={idx} className="p-2 bg-white rounded-lg border border-emerald-100 shadow-2xs">
                <div className="font-semibold text-emerald-900 text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{s.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed pl-4">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. 缺点与薄弱分析 */}
        <div className="bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/80 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-900 font-bold">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <span>💡 缺点待提升与改进建议 ({weaknesses.length + suggestions.length})</span>
          </div>
          <div className="space-y-1.5">
            {weaknesses.map((w, idx) => (
              <div key={idx} className="p-2 bg-white rounded-lg border border-rose-100 shadow-2xs">
                <div className="font-semibold text-rose-800 text-xs flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>{w.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed pl-4">
                  {w.desc}
                </p>
              </div>
            ))}
            {suggestions.map((sg, idx) => (
              <div key={idx} className="p-2 bg-white rounded-lg border border-amber-100 shadow-2xs">
                <div className="font-semibold text-amber-800 text-xs flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>{sg.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed pl-4">
                  {sg.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
