/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 课时真实日历排期辅助工具库
 * 支持：自动解析班级上课时间（如周一/周三、周四/周五）、真实日历顺延推算、假期手动调整、增删课时日期推导
 */

export const WEEKDAY_NAMES_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 从上课时间安排字符串中提取每周上课的星期几 (0=周日, 1=周一, ..., 6=周六)
 */
export function parseWeekdaysFromSchedule(scheduleStr: string): number[] {
  if (!scheduleStr) return [1, 3]; // 默认周一/周三
  const s = scheduleStr.trim();
  const set = new Set<number>();

  if (s.includes('周一至周五') || s.includes('周一到周五') || s.includes('工作日') || s.includes('每天')) {
    return [1, 2, 3, 4, 5];
  }
  if (s.includes('周末') || s.includes('双休')) {
    return [6, 0];
  }

  // 星期一到星期日
  if (s.includes('周一') || s.includes('星期一') || s.includes('礼拜一') || /mon/i.test(s)) set.add(1);
  if (s.includes('周二') || s.includes('星期二') || s.includes('礼拜二') || /tue/i.test(s)) set.add(2);
  if (s.includes('周三') || s.includes('星期三') || s.includes('礼拜三') || /wed/i.test(s)) set.add(3);
  if (s.includes('周四') || s.includes('星期四') || s.includes('礼拜四') || /thu/i.test(s)) set.add(4);
  if (s.includes('周五') || s.includes('星期五') || s.includes('礼拜五') || /fri/i.test(s)) set.add(5);
  if (s.includes('周六') || s.includes('星期六') || s.includes('礼拜六') || /sat/i.test(s)) set.add(6);
  if (s.includes('周日') || s.includes('周天') || s.includes('星期日') || s.includes('星期天') || /sun/i.test(s)) set.add(0);

  const arr = Array.from(set).sort((a, b) => a - b);
  return arr.length > 0 ? arr : [1, 3];
}

/**
 * 解析用户输入的任意格式日期文本 (如 11/7, 11-07, 11月7日, 2026-11-07)
 */
export function parseFlexibleDate(dateStr: string, defaultYear = new Date().getFullYear()): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const str = dateStr.trim();

  // 1. 匹配 YYYY-MM-DD 或 YYYY/MM/DD 或 YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10) - 1;
    const d = parseInt(ymdMatch[3], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  }

  // 1b. 匹配 YY-MM-DD 或 YY/MM/DD (例如 27-03-15)
  const shortYmdMatch = str.match(/^(\d{2})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (shortYmdMatch) {
    const shortY = parseInt(shortYmdMatch[1], 10);
    const y = shortY < 70 ? 2000 + shortY : 1900 + shortY;
    const m = parseInt(shortYmdMatch[2], 10) - 1;
    const d = parseInt(shortYmdMatch[3], 10);
    const date = new Date(y, m, d);
    return isNaN(date.getTime()) ? null : date;
  }

  // 2. 匹配 MM/DD 或 MM-DD 或 M月D日
  const mdMatch = str.match(/^(\d{1,2})[-/.月](\d{1,2})/);
  if (mdMatch) {
    const m = parseInt(mdMatch[1], 10) - 1;
    const d = parseInt(mdMatch[2], 10);
    const date = new Date(defaultYear, m, d);
    return isNaN(date.getTime()) ? null : date;
  }

  // 3. 原生 Date 解析 fallback
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * 格式化为 MM/DD (两位月/两位日，方便表格对齐)
 */
export function formatShortDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
}

/**
 * 格式化为标准 YYYY-MM-DD
 */
export function formatFullDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 获取星期几中文简称 (支持 Date 对象或任意日期字符串)
 */
export function getWeekdayName(d: Date | string | null | undefined): string {
  if (!d) return '';
  if (typeof d === 'string') {
    const parsed = parseFlexibleDate(d);
    return parsed ? WEEKDAY_NAMES_CN[parsed.getDay()] || '' : '';
  }
  if (isNaN(d.getTime())) return '';
  return WEEKDAY_NAMES_CN[d.getDay()] || '';
}

/**
 * 自动排课算法：从起始课时开始，按班级上课星期规律顺延排满至总课时
 * 例如：起始课 2027-03-02 (周二)，班级为周二/周四，排第2课为 2027-03-04 (周四)...
 * 支持保留年份或月/日格式
 */
export function autoGenerateSessionDates({
  fromDay = 1,
  startDateStr,
  weekdays,
  totalSessions = 30,
  existingDates = {},
  baseYear = new Date().getFullYear()
}: {
  fromDay?: number;
  startDateStr: string;
  weekdays: number[];
  totalSessions: number;
  existingDates?: Record<number, string>;
  baseYear?: number;
}): Record<number, string> {
  const dates: Record<number, string> = { ...existingDates };
  const startDate = parseFlexibleDate(startDateStr, baseYear);
  if (!startDate) return dates;

  // 检查是否包含显式年份 (4位或2位)
  const hadYear = /\b\d{4}\b/.test(startDateStr) || /^\d{2}[-/.]/.test(startDateStr.trim());
  const formatFn = hadYear ? formatFullDate : formatShortDate;

  // 确保有效星期规律
  const activeWeekdays = weekdays.length > 0 ? weekdays : [startDate.getDay()];

  // 设置起始课日期
  dates[fromDay] = formatFn(startDate);

  let current = new Date(startDate.getTime());

  for (let day = fromDay + 1; day <= totalSessions; day++) {
    // 顺延查找下一个符合上课星期的真实日期
    do {
      current.setDate(current.getDate() + 1);
    } while (!activeWeekdays.includes(current.getDay()));

    dates[day] = formatFn(current);
  }

  return dates;
}

/**
 * 当教师在考勤中添加新课时 (例如第 31 课) 时，根据上一课日期自动推算下一课真实日期
 */
export function calculateNextSessionDate(
  lastDateStr: string,
  weekdays: number[],
  baseYear = new Date().getFullYear()
): string {
  const lastDate = parseFlexibleDate(lastDateStr, baseYear);
  if (!lastDate) {
    const today = new Date();
    return formatShortDate(today);
  }

  const hadYear = /\b\d{4}\b/.test(lastDateStr);
  const activeWeekdays = weekdays.length > 0 ? weekdays : [1, 3];
  const next = new Date(lastDate.getTime());

  do {
    next.setDate(next.getDate() + 1);
  } while (!activeWeekdays.includes(next.getDay()));

  return hadYear ? formatFullDate(next) : formatShortDate(next);
}

/**
 * 获取教学里程碑/重要考试展示标签 (如 "小测", "期中考试", "口语考试", "期末考试")
 */
export function getSessionMilestoneLabel(
  milestone?: { type?: string; label?: string } | string
): string {
  if (!milestone) return '';
  if (typeof milestone === 'string') return milestone;
  return milestone.label || '';
}

/**
 * 判断班级归属的上课时间周期组 (Cohort)
 * - 周一到周三班群 (MW)
 * - 周四到周五班群 (TF)
 * - 周末班群 (Weekend)
 */
export type ScheduleCohortType = 'mw' | 'tf' | 'weekend' | 'other';

export function getScheduleCohort(schedule = '', className = ''): ScheduleCohortType {
  const combined = `${schedule} ${className}`.toLowerCase();
  
  // 1. 周一至周三课群 (包含 CG-PRE GCP1, GCP系列, MW, 周一/周三等)
  if (
    combined.includes('mw') ||
    combined.includes('gcp') ||
    combined.includes('gc-pre') ||
    combined.includes('cg-pre') ||
    (combined.includes('周一') && combined.includes('周三')) ||
    combined.includes('周一到周三') ||
    combined.includes('周一至周三') ||
    combined.includes('周一和周三') ||
    combined.includes('周一、周三') ||
    (combined.includes('周一') && !combined.includes('周四') && !combined.includes('周五')) ||
    (combined.includes('周三') && !combined.includes('周四') && !combined.includes('周五'))
  ) {
    return 'mw';
  }

  // 2. 周四至周五课群 (包含 TF, 周四/周五等)
  if (
    combined.includes('tf') ||
    (combined.includes('周四') && combined.includes('周五')) ||
    combined.includes('周四到周五') ||
    combined.includes('周四至周五') ||
    combined.includes('周四和周五') ||
    combined.includes('周四、周五') ||
    (combined.includes('周二') && combined.includes('周五')) ||
    (combined.includes('周四') && !combined.includes('周一') && !combined.includes('周三')) ||
    (combined.includes('周五') && !combined.includes('周一') && !combined.includes('周三'))
  ) {
    return 'tf';
  }

  // 3. 周末班群
  if (
    combined.includes('周六') ||
    combined.includes('周日') ||
    combined.includes('周末') ||
    combined.includes('sat') ||
    combined.includes('sun')
  ) {
    return 'weekend';
  }

  return 'other';
}

export function getCohortDisplayName(cohort: ScheduleCohortType): string {
  switch (cohort) {
    case 'mw':
      return '周一至周三课群 (Mon-Wed)';
    case 'tf':
      return '周四至周五课群 (Thu-Fri)';
    case 'weekend':
      return '周末班群 (Sat/Sun)';
    default:
      return '独立排期班级';
  }
}

/**
 * 将某个班级设定的自定义周次周期结构（如第1周2天、第2周3天...），自适应同步给同课群其他班级
 */
export function adaptWeekCyclesForClass(
  targetClass: { totalSessions?: number; schedule?: string; name?: string },
  sourceCycles: { weekNumber: number; startDay: number; endDay: number; sessionDays?: number[]; label?: string }[]
): { weekNumber: number; startDay: number; endDay: number; sessionDays: number[]; label: string }[] {
  const total = targetClass.totalSessions || 30;
  let currentDay = 1;
  const result: { weekNumber: number; startDay: number; endDay: number; sessionDays: number[]; label: string }[] = [];

  sourceCycles.forEach((cycle, idx) => {
    if (currentDay > total) return;
    const dayCount = cycle.sessionDays?.length || Math.max(1, cycle.endDay - cycle.startDay + 1);
    const startDay = currentDay;
    const endDay = Math.min(total, startDay + dayCount - 1);
    const days: number[] = [];
    for (let d = startDay; d <= endDay; d++) {
      days.push(d);
    }
    result.push({
      weekNumber: idx + 1,
      startDay,
      endDay,
      sessionDays: days,
      label: cycle.label || `第 ${idx + 1} 周`
    });
    currentDay = endDay + 1;
  });

  // 若源周期天数未满目标班级总课时，按课群常规天数自动顺延
  if (currentDay <= total) {
    const defaultPerWeek = (targetClass.schedule?.includes('周四') || targetClass.schedule?.includes('周五')) ? 2 : 3;
    let wNum = result.length + 1;
    while (currentDay <= total) {
      const endDay = Math.min(total, currentDay + defaultPerWeek - 1);
      const days: number[] = [];
      for (let d = currentDay; d <= endDay; d++) days.push(d);
      result.push({
        weekNumber: wNum,
        startDay: currentDay,
        endDay,
        sessionDays: days,
        label: `第 ${wNum} 周`
      });
      currentDay = endDay + 1;
      wNum++;
    }
  }

  return result;
}

/**
 * 生成【首周2天 + 常规3天/周】预设（周一至周三常用，满足第一周两天需求）
 */
export function createFirstWeek2DaysPreset(
  totalSessions = 30
): { weekNumber: number; startDay: number; endDay: number; sessionDays: number[]; label: string }[] {
  const list: { weekNumber: number; startDay: number; endDay: number; sessionDays: number[]; label: string }[] = [];
  let cur = 1;
  let w = 1;

  while (cur <= totalSessions) {
    // 第1周固定为2天，其余周均分3天
    const perWeek = w === 1 ? 2 : 3;
    const end = Math.min(totalSessions, cur + perWeek - 1);
    const days: number[] = [];
    for (let d = cur; d <= end; d++) days.push(d);
    list.push({ weekNumber: w, startDay: cur, endDay: end, sessionDays: days, label: `第 ${w} 周` });
    cur = end + 1;
    w++;
  }

  return list;
}

/**
 * 生成【首周1天 + 常规2天/周】预设（周四至周五常用，满足一周只有一天需求）
 */
export function createFirstWeek1DayPreset(
  totalSessions = 20
): { weekNumber: number; startDay: number; endDay: number; sessionDays: number[]; label: string }[] {
  const list: { weekNumber: number; startDay: number; endDay: number; sessionDays: number[]; label: string }[] = [];
  let cur = 1;
  let w = 1;

  while (cur <= totalSessions) {
    // 第1周固定为1天，其余周均分2天
    const perWeek = w === 1 ? 1 : 2;
    const end = Math.min(totalSessions, cur + perWeek - 1);
    const days: number[] = [];
    for (let d = cur; d <= end; d++) days.push(d);
    list.push({ weekNumber: w, startDay: cur, endDay: end, sessionDays: days, label: `第 ${w} 周` });
    cur = end + 1;
    w++;
  }

  return list;
}

/**
 * 依据课时总数生成教学推荐的重要考试分布 (小测、期中考试、口语考试、期末考试)
 */
export function getDefaultMilestonesForSessions(
  totalSessions = 30
): Record<number, { type: 'quiz' | 'midterm' | 'oral' | 'final'; label: string }> {
  if (totalSessions >= 28) {
    // 30课标准排期
    return {
      8: { type: 'quiz', label: '小测一' },
      15: { type: 'midterm', label: '期中考试' },
      22: { type: 'quiz', label: '小测二' },
      27: { type: 'oral', label: '口语考试' },
      [totalSessions]: { type: 'final', label: '期末考试' }
    };
  }
  if (totalSessions >= 20) {
    // 20~24课排期
    const mid = Math.round(totalSessions * 0.5);
    const quiz = Math.round(totalSessions * 0.3);
    const oral = Math.round(totalSessions * 0.85);
    return {
      [quiz]: { type: 'quiz', label: '小测一' },
      [mid]: { type: 'midterm', label: '期中考试' },
      [oral]: { type: 'oral', label: '口语考试' },
      [totalSessions]: { type: 'final', label: '期末考试' }
    };
  }
  // 短学期 / 16课
  const mid = Math.round(totalSessions * 0.5);
  const oral = Math.max(1, totalSessions - 2);
  return {
    4: { type: 'quiz', label: '小测' },
    [mid]: { type: 'midterm', label: '期中考试' },
    [oral]: { type: 'oral', label: '口语考试' },
    [totalSessions]: { type: 'final', label: '期末考试' }
  };
}
