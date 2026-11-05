/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Calendar as CalendarIcon, X } from 'lucide-react';
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

  // If value contains a 4-digit year, default format is YYYY-MM-DD
  const hasYear = /\b\d{4}\b/.test(value || '');
  const [outputFormat, setOutputFormat] = useState<'MM/DD' | 'YYYY-MM-DD'>(
    hasYear ? 'YYYY-MM-DD' : defaultFormat
  );

  const [currentYear, setCurrentYear] = useState<number>(
    parsedInitial ? parsedInitial.getFullYear() : now.getFullYear()
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
      }
    }
  }, [value]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleSelectDate = (date: Date) => {
    const formatted = formatSelectedDate(date, outputFormat);
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
    return fmt === 'YYYY-MM-DD' ? `${y}-${m}-${day}` : `${m}/${day}`;
  }

  // Generate 42 cells (6 rows * 7 columns, Monday-first ISO week)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  // getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  // We want Monday = 0, Tuesday = 1, ..., Sunday = 6
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
      className={`bg-white rounded-xl shadow-lg border border-slate-200/90 p-3.5 select-none w-[270px] text-slate-800 ${className}`}
      onClick={e => e.stopPropagation()}
    >
      {/* Header matching user image: "November 2026 ▾" and "↑" / "↓" */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
          className="flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors py-0.5 px-1 -ml-1 rounded hover:bg-slate-50 cursor-pointer"
          title="点击切换年份或月份"
        >
          <span>
            {MONTH_NAMES_EN[currentMonth]} {currentYear}
          </span>
          <span className="text-[10px] text-slate-500 font-normal ml-0.5">
            ({MONTH_NAMES_CN[currentMonth]})
          </span>
          <span className="text-[11px] text-slate-500 font-normal">▾</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="上一月"
          >
            <ChevronUp className="w-4 h-4 stroke-[2.5]" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="下一月"
          >
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Quick Month/Year Dropdown Drawer */}
      {showMonthYearPicker && (
        <div className="mb-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-semibold text-[11px]">选择年份</span>
            <div className="flex items-center gap-1">
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setCurrentYear(y)}
                  className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                    currentYear === y
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-white border border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="font-semibold text-[11px] text-slate-600 mb-1">月份选择</div>
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

      {/* Bottom Footer: Clear (left) & Today (right) matching user screenshot */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-[#0066FF] hover:text-blue-800 font-medium cursor-pointer transition-colors hover:underline"
        >
          Clear
        </button>
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
