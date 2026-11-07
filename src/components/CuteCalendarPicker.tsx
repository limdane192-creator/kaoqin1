/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Calendar as CalendarIcon, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { parseFlexibleDate, formatShortDate, getWeekdayName } from '../utils/scheduleHelper';

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_CN = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月'
];

const WEEKDAY_HEADERS = [
  { en: 'Mo', cn: '一' },
  { en: 'Tu', cn: '二' },
  { en: 'We', cn: '三' },
  { en: 'Th', cn: '四' },
  { en: 'Fr', cn: '五' },
  { en: 'Sa', cn: '六' },
  { en: 'Su', cn: '日' }
];

export interface CuteCalendarPickerProps {
  value?: string;
  onChange: (formattedDate: string, dateObj: Date | null) => void;
  onClose?: () => void;
  defaultFormat?: 'MM/DD' | 'YYYY-MM-DD';
  showFormatToggle?: boolean;
  className?: string;
}

export const CuteCalendarPicker: React.FC<CuteCalendarPickerProps> = ({
  value = '',
  onChange,
  onClose,
  defaultFormat = 'MM/DD',
  showFormatToggle = false,
  className = ''
}) => {
  const parsedInitial = parseFlexibleDate(value);
  const now = new Date();
  const baseCalendarYear = now.getFullYear();

  // 支持从当前年份前2年直至未来15年以上 (例如 2024 ~ 2042)
  const MIN_YEAR = 2024;
  const MAX_YEAR = Math.max(2042, baseCalendarYear + 15);
  const ALL_AVAILABLE_YEARS = Array.from(
    { length: MAX_YEAR - MIN_YEAR + 1 },
    (_, i) => MIN_YEAR + i
  );

  // 快捷年份按钮：今年、明年(2027)、后年(2028)、2029、2030、未来5年、未来10年、未来15年
  const QUICK_YEARS = [
    baseCalendarYear,
    baseCalendarYear + 1,
    baseCalendarYear + 2,
    baseCalendarYear + 3,
    baseCalendarYear + 4,
    baseCalendarYear + 5,
    baseCalendarYear + 10,
    baseCalendarYear + 15
  ].filter(y => y <= MAX_YEAR);

  // If value contains a 4-digit year, default format is YYYY-MM-DD
  const hasYear = /\b\d{4}\b/.test(value || '');
  const [outputFormat, setOutputFormat] = useState<'MM/DD' | 'YYYY-MM-DD'>(
    hasYear ? 'YYYY-MM-DD' : defaultFormat
  );

  const [currentYear, setCurrentYear] = useState<number>(
    parsedInitial ? parsedInitial.getFullYear() : baseCalendarYear
  );
  const [currentMonth, setCurrentMonth] = useState<number>(
    parsedInitial ? parsedInitial.getMonth() : now.getMonth()
  );

  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  // Sync state if external value changes significantly
  useEffect(() => {
    if (value) {
      const parsed = parseFlexibleDate(value);
      if (parsed) {
        setCurrentYear(parsed.getFullYear());
        setCurrentMonth(parsed.getMonth());
        if (parsed.getFullYear() !== baseCalendarYear) {
          setOutputFormat('YYYY-MM-DD');
        }
      }
    }
  }, [value, baseCalendarYear]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => Math.max(MIN_YEAR, prev - 1));
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => Math.min(MAX_YEAR, prev + 1));
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handlePrevYear = () => {
    setCurrentYear(prev => Math.max(MIN_YEAR, prev - 1));
  };

  const handleNextYear = () => {
    setCurrentYear(prev => Math.min(MAX_YEAR, prev + 1));
  };

  const handleSelectDate = (date: Date) => {
    // 若选择了非当前年份（如2027年及未来15年），强制保留完整年份格式，避免刷新丢失年份
    const effectiveFormat = (currentYear !== baseCalendarYear) ? 'YYYY-MM-DD' : outputFormat;
    const formatted = formatSelectedDate(date, effectiveFormat);
    onChange(formatted, date);
  };

  const handleClear = () => {
    onChange('', null);
    if (onClose) onClose();
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    const formatted = formatSelectedDate(today, outputFormat);
    onChange(formatted, today);
  };

  function formatSelectedDate(d: Date, fmt: 'MM/DD' | 'YYYY-MM-DD'): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    // 如果年份不是基准年份，始终保留完整年份 YYYY-MM-DD
    if (fmt === 'YYYY-MM-DD' || y !== baseCalendarYear) {
      return `${y}-${m}-${day}`;
    }
    return `${m}/${day}`;
  }

  // Generate 42 cells (6 rows * 7 columns, Monday-first ISO week)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset < 0) startOffset = 6; // Sunday becomes offset 6

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: Array<{
    date: Date;
    dayNumber: number;
    isCurrentMonth: boolean;
    isSelected: boolean;
    isToday: boolean;
  }> = [];

  // Trailing days from previous month
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const d = new Date(currentYear, currentMonth - 1, dayNum);
    calendarDays.push({
      date: d,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isSelected: isSameDate(d, parsedInitial),
      isToday: isSameDate(d, now)
    });
  }

  // Current month days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const d = new Date(currentYear, currentMonth, dayNum);
    calendarDays.push({
      date: d,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isSelected: isSameDate(d, parsedInitial),
      isToday: isSameDate(d, now)
    });
  }

  // Remaining cells from next month to make 35 or 42 cells
  const remaining = (calendarDays.length <= 35 ? 35 : 42) - calendarDays.length;
  for (let dayNum = 1; dayNum <= remaining; dayNum++) {
    const d = new Date(currentYear, currentMonth + 1, dayNum);
    calendarDays.push({
      date: d,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isSelected: isSameDate(d, parsedInitial),
      isToday: isSameDate(d, now)
    });
  }

  function isSameDate(d1: Date | null, d2: Date | null): boolean {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-xl border border-slate-200/95 p-3 select-none w-[284px] text-slate-800 ${className}`}
      onClick={e => e.stopPropagation()}
    >
      {/* 顶部主导航栏：支持点击抽屉、年份下拉切换、一键跳至2027年及未来15年 */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          {/* 年份快速下拉选择器 (带未来15年标识) */}
          <select
            value={currentYear}
            onChange={(e) => {
              const selectedY = Number(e.target.value);
              setCurrentYear(selectedY);
              if (selectedY !== baseCalendarYear) {
                setOutputFormat('YYYY-MM-DD');
              }
            }}
            className="text-xs font-black text-blue-900 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 rounded px-1.5 py-1 cursor-pointer focus:outline-none transition-colors"
            title="选择年份（支持至未来15年）"
          >
            {ALL_AVAILABLE_YEARS.map(y => {
              const diff = y - baseCalendarYear;
              let suffix = '';
              if (diff === 0) suffix = ' (今年)';
              else if (diff === 1) suffix = ' (明年2027)';
              else if (diff === 2) suffix = ' (后年)';
              else if (diff > 2) suffix = ` (+${diff}年)`;
              return (
                <option key={y} value={y}>
                  {y}年{suffix}
                </option>
              );
            })}
          </select>

          {/* 月份切换按钮/下拉抽屉触发 */}
          <button
            type="button"
            onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
            className="flex items-center gap-0.5 text-xs font-bold text-slate-800 hover:text-blue-600 transition-colors py-1 px-1.5 rounded hover:bg-slate-100 cursor-pointer"
            title="点击展开快捷年月面板"
          >
            <span>{MONTH_NAMES_EN[currentMonth]}</span>
            <span className="text-[11px] text-slate-500 font-normal">
              ({MONTH_NAMES_CN[currentMonth]})
            </span>
            <span className="text-[10px] text-slate-400">▾</span>
          </button>
        </div>

        {/* 导航步进按钮群：同时具备【快速步进年】与【步进月】 */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handlePrevYear}
            disabled={currentYear <= MIN_YEAR}
            className="w-5 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="上一年 (-1年)"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-5 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="上一月"
          >
            <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-5 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="下一月"
          >
            <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleNextYear}
            disabled={currentYear >= MAX_YEAR}
            className="w-5 h-6 flex items-center justify-center rounded hover:bg-blue-50 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed font-bold"
            title="下一年 (+1年，快速跨至2027年)"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 当处于未来年份（如2027年）时的明确状态提示标签 */}
      {currentYear !== baseCalendarYear && (
        <div className="mb-2 px-2 py-1 bg-amber-50 border border-amber-200/80 rounded-md flex items-center justify-between text-[11px] text-amber-900 animate-in fade-in">
          <span className="font-bold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
            已定格: {currentYear}年 ({currentYear > baseCalendarYear ? `未来+${currentYear - baseCalendarYear}年` : '历史年份'})
          </span>
          <button
            type="button"
            onClick={() => {
              setCurrentYear(baseCalendarYear);
              setCurrentMonth(now.getMonth());
            }}
            className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
            title="回退到今年"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            回到今年
          </button>
        </div>
      )}

      {/* Quick Month/Year Dropdown Drawer: 支持直达2027年及未来15年 */}
      {showMonthYearPicker && (
        <div className="mb-2.5 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 animate-in fade-in duration-150">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[11px] text-slate-700">快速选年份 (覆盖未来15年)</span>
              <span className="text-[10px] text-slate-400">2024~{MAX_YEAR}</span>
            </div>
            {/* 常用快速年份胶囊 */}
            <div className="flex flex-wrap gap-1">
              {QUICK_YEARS.map(y => {
                const isSelected = currentYear === y;
                const is2027 = y === 2027;
                return (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setCurrentYear(y);
                      if (y !== baseCalendarYear) {
                        setOutputFormat('YYYY-MM-DD');
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-2xs'
                        : is2027
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 hover:bg-amber-200'
                        : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    {y}{y === 2027 ? '★27年' : y === baseCalendarYear ? '今年' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="font-bold text-[11px] text-slate-700 mb-1">月份快速选择</div>
            <div className="grid grid-cols-4 gap-1">
              {MONTH_NAMES_CN.map((mCn, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentMonth(idx);
                    setShowMonthYearPicker(false);
                  }}
                  className={`py-1 text-center rounded text-[11px] cursor-pointer transition-colors ${
                    currentMonth === idx
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {mCn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Weekday headers: Mo Tu We Th Fr Sa Su */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {WEEKDAY_HEADERS.map((w, idx) => (
          <div
            key={idx}
            className="text-xs font-semibold text-slate-700 py-1"
            title={`${w.en} (周${w.cn})`}
          >
            {w.en}
          </div>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((item, idx) => {
          const { dayNumber, isCurrentMonth, isSelected, isToday } = item;

          let btnClasses =
            'h-7 w-7 mx-auto flex items-center justify-center text-xs transition-all cursor-pointer rounded-sm ';

          if (isSelected) {
            // Highlighted in solid vibrant blue with white text like screenshot
            btnClasses += 'bg-[#0066FF] text-white font-bold shadow-2xs ';
          } else if (isToday) {
            // Today has a clear square outline like day 4 in screenshot
            btnClasses +=
              'border border-slate-700 font-bold text-slate-900 bg-white hover:bg-slate-100 ';
          } else if (!isCurrentMonth) {
            // Trailing / leading days in gray
            btnClasses += 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 ';
          } else {
            // Normal current month days
            btnClasses += 'text-slate-800 hover:bg-slate-100 font-medium ';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectDate(item.date)}
              className={btnClasses}
              title={`${item.date.getFullYear()}-${item.date.getMonth() + 1}-${item.date.getDate()}`}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>

      {/* Optional format toggle */}
      {showFormatToggle && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>格式:</span>
          <div className="flex gap-1 font-mono">
            <button
              type="button"
              onClick={() => setOutputFormat('MM/DD')}
              className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                outputFormat === 'MM/DD'
                  ? 'bg-blue-100 text-blue-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              MM/DD
            </button>
            <button
              type="button"
              onClick={() => setOutputFormat('YYYY-MM-DD')}
              className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                outputFormat === 'YYYY-MM-DD'
                  ? 'bg-blue-100 text-blue-700 font-bold'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              YYYY-MM-DD
            </button>
          </div>
        </div>
      )}

      {/* Bottom Footer: Clear (left), Quick 2027 Jump (center), Today (right) */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-slate-500 hover:text-rose-600 font-medium cursor-pointer transition-colors"
        >
          Clear
        </button>

        {currentYear !== 2027 ? (
          <button
            type="button"
            onClick={() => {
              setCurrentYear(2027);
              setOutputFormat('YYYY-MM-DD');
            }}
            className="text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
            title="一键直达2027年"
          >
            ★ 直达2027年
          </button>
        ) : (
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            2027年日历
          </span>
        )}

        <button
          type="button"
          onClick={handleToday}
          className="text-xs text-[#0066FF] hover:text-blue-800 font-medium cursor-pointer transition-colors hover:underline"
        >
          Today
        </button>
      </div>
    </div>
  );
};

/**
 * Interactive Date Picker Popover Button
 * Teachers click to open the exact calendar popup shown in the screenshot,
 * avoiding manual date typing mistakes.
 */
export interface CuteDatePickerInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  showWeekdayBadge?: boolean;
  align?: 'left' | 'right';
}

export const CuteDatePickerInput: React.FC<CuteDatePickerInputProps> = ({
  value,
  onChange,
  placeholder = '选择上课日期',
  className = '',
  showWeekdayBadge = true,
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const parsedDate = parseFlexibleDate(value);
  const weekday = parsedDate ? getWeekdayName(parsedDate) : '';

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-300 hover:border-blue-400 rounded-lg text-xs font-mono font-medium text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer ${
          isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''
        }`}
        title="点击打开日历选课时日期 (不易填错)"
      >
        <CalendarIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className={value ? 'text-slate-900 font-bold' : 'text-slate-400 font-normal'}>
          {value || placeholder}
        </span>
        {showWeekdayBadge && weekday && (
          <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1 py-0.5 rounded font-semibold ml-0.5">
            {weekday}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          } animate-in fade-in zoom-in-95 duration-100`}
        >
          <CuteCalendarPicker
            value={value}
            onChange={(newVal) => {
              onChange(newVal);
              setIsOpen(false);
            }}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
