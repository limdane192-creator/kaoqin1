/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Student } from '../types';

export interface WeekCycle {
  weekNumber: number;      // 1, 2, ..., 10
  startDay: number;        // 起始课时 (如 1)
  endDay: number;          // 结束课时 (如 3 或 2)
  sessionDays: number[];   // 包含的课时数组 [1, 2, 3]
  dateRangeText: string;   // 日期范围文本 (如 "11/07 ~ 11/11")
}

export interface StudentWeeklyStats {
  studentId: string;
  studentName: string;
  studentNo: number;
  weekNumber: number;
  presentCount: number;     // 1 正常出勤次数
  lateCount: number;        // L 迟到次数
  leaveCount: number;       // P 请假次数
  absentCount: number;      // A 旷课次数
  exemptCount: number;      // - 停课/换班次数
  unrecordedCount: number;  // 未点名次数
  totalSessionsInWeek: number;
  attendanceRate: number;   // 出勤率 (0~100)
  statusList: { day: number; status: string; date?: string; note?: string }[];
  hasWarning: boolean;
  warningReason: string;
}

export interface ClassWeeklySummary {
  weekNumber: number;
  dateRangeText: string;
  sessionDays: number[];
  totalExpectedPersonSessions: number; // 总应到人次
  totalPresent: number;               // 1 总到课人次
  totalLate: number;                  // L 总迟到人次
  totalLeave: number;                 // P 总请假人次
  totalAbsent: number;                // A 总旷课人次
  totalExempt: number;                // - 停课人次
  totalUnrecorded: number;            // 未记录人次
  attendanceRate: number;             // 出勤百分比
  warningStudentsCount: number;       // 本周有预警的学生人数
}

/**
 * 智能推断每周上课天数/课时数：
 * - 用户规则：
 *   - 周一/周三 安排：3天为一周 (10周共30天) -> 3 课时/周
 *   - 周四/周五 安排：2天为一周 (10周共20天) -> 2 课时/周
 *   - 也可以根据 totalSessions 自动整除：30课时即 3课/周，20课时即 2课/周，50课时即 5课/周
 */
export function getSmartSessionsPerWeek(scheduleStr = '', totalSessions = 30): number {
  const s = scheduleStr.trim();

  if (s.includes('周四/周五') || s.includes('周四和周五') || s.includes('周四、周五')) {
    return 2;
  }
  if (s.includes('周一/周三') || s.includes('周一和周三') || s.includes('周一、周三')) {
    return 3;
  }
  if (s.includes('周二/周四')) {
    return 2;
  }
  if (s.includes('周一至周五') || s.includes('每天')) {
    return 5;
  }

  // 根据总课时与 10 周规律推断
  if (totalSessions % 10 === 0 && totalSessions > 0) {
    return Math.max(1, totalSessions / 10);
  }

  if (totalSessions <= 24) return 2;
  if (totalSessions <= 35) return 3;
  return 3;
}

/**
 * 构建全班的所有周次周期列表 (默认排到 10 周，如有超额课时则顺延增加周次)
 */
export function buildWeekCycles(
  totalSessions: number,
  sessionsPerWeek: number,
  sessionDates: Record<number, string> = {}
): WeekCycle[] {
  const cycles: WeekCycle[] = [];
  const safeSessionsPerWeek = Math.max(1, sessionsPerWeek);
  const totalWeeks = Math.max(10, Math.ceil(totalSessions / safeSessionsPerWeek));

  for (let w = 1; w <= totalWeeks; w++) {
    const startDay = (w - 1) * safeSessionsPerWeek + 1;
    const endDay = Math.min(w * safeSessionsPerWeek, totalSessions);

    if (startDay > totalSessions) {
      // 达到10周但无更多课时，保留前10周空槽位或按需截止
      if (w > 10) break;
      cycles.push({
        weekNumber: w,
        startDay: 0,
        endDay: 0,
        sessionDays: [],
        dateRangeText: '未排期'
      });
      continue;
    }

    const sessionDays: number[] = [];
    for (let d = startDay; d <= endDay; d++) {
      sessionDays.push(d);
    }

    // 计算日期区间
    const firstDate = sessionDates[startDay] || '';
    const lastDate = sessionDates[endDay] || '';
    let dateRangeText = '待排期';
    if (firstDate && lastDate) {
      dateRangeText = firstDate === lastDate ? firstDate : `${firstDate} ~ ${lastDate}`;
    } else if (firstDate) {
      dateRangeText = `自 ${firstDate}`;
    }

    cycles.push({
      weekNumber: w,
      startDay,
      endDay,
      sessionDays,
      dateRangeText
    });
  }

  return cycles;
}

/**
 * 根据指定课时获取其所属的周次编号
 */
export function getWeekNumberForSession(day: number, sessionsPerWeek: number): number {
  if (day <= 0) return 1;
  const safe = Math.max(1, sessionsPerWeek);
  return Math.ceil(day / safe);
}

/**
 * 统计单个学生在特定周次内的考勤数据
 */
export function calculateStudentWeeklyStats(
  student: Student,
  week: WeekCycle,
  sessionDates: Record<number, string> = {}
): StudentWeeklyStats {
  let presentCount = 0;
  let lateCount = 0;
  let leaveCount = 0;
  let absentCount = 0;
  let exemptCount = 0;
  let unrecordedCount = 0;

  const statusList = week.sessionDays.map(day => {
    const status = student.attendance[day] || '';
    const note = student.attendanceNotes?.[day] || '';
    const date = sessionDates[day] || '';

    if (status === '1') presentCount++;
    else if (status === 'L') lateCount++;
    else if (status === 'P') leaveCount++;
    else if (status === 'A') absentCount++;
    else if (status === '-') exemptCount++;
    else unrecordedCount++;

    return { day, status, date, note };
  });

  const totalSessionsInWeek = week.sessionDays.length;
  const activeExpected = totalSessionsInWeek - exemptCount;
  const attendanceRate = activeExpected > 0 ? Math.round((presentCount / activeExpected) * 100) : 100;

  let hasWarning = false;
  let warningReason = '';

  if (absentCount > 0) {
    hasWarning = true;
    warningReason = `旷课 ${absentCount} 次`;
  } else if (lateCount >= 2) {
    hasWarning = true;
    warningReason = `迟到 ${lateCount} 次`;
  } else if (leaveCount >= 2) {
    hasWarning = true;
    warningReason = `请假 ${leaveCount} 次`;
  } else if (presentCount === totalSessionsInWeek && totalSessionsInWeek > 0) {
    warningReason = '全勤';
  }

  return {
    studentId: student.id,
    studentName: student.name,
    studentNo: student.no,
    weekNumber: week.weekNumber,
    presentCount,
    lateCount,
    leaveCount,
    absentCount,
    exemptCount,
    unrecordedCount,
    totalSessionsInWeek,
    attendanceRate,
    statusList,
    hasWarning,
    warningReason
  };
}

/**
 * 统计全班在特定周次内的总体考勤数据与预警概览
 */
export function calculateClassWeeklySummary(
  students: Student[],
  week: WeekCycle,
  sessionDates: Record<number, string> = {}
): ClassWeeklySummary {
  let totalPresent = 0;
  let totalLate = 0;
  let totalLeave = 0;
  let totalAbsent = 0;
  let totalExempt = 0;
  let totalUnrecorded = 0;
  let warningStudentsCount = 0;

  students.forEach(student => {
    const stats = calculateStudentWeeklyStats(student, week, sessionDates);
    totalPresent += stats.presentCount;
    totalLate += stats.lateCount;
    totalLeave += stats.leaveCount;
    totalAbsent += stats.absentCount;
    totalExempt += stats.exemptCount;
    totalUnrecorded += stats.unrecordedCount;
    if (stats.hasWarning) {
      warningStudentsCount++;
    }
  });

  const totalExpectedPersonSessions = students.length * week.sessionDays.length;
  const validDenominator = totalExpectedPersonSessions - totalExempt;
  const attendanceRate = validDenominator > 0 ? Math.round((totalPresent / validDenominator) * 100) : 100;

  return {
    weekNumber: week.weekNumber,
    dateRangeText: week.dateRangeText,
    sessionDays: week.sessionDays,
    totalExpectedPersonSessions,
    totalPresent,
    totalLate,
    totalLeave,
    totalAbsent,
    totalExempt,
    totalUnrecorded,
    attendanceRate,
    warningStudentsCount
  };
}
