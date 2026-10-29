/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { ClassRoom, Student, Assignment } from '../types';
import { calculateStudentAttendance, calculateStudentHomework, computeStudentScores } from './calculations';

export function exportAllClassesToExcel(
  classes: ClassRoom[],
  students: Student[],
  assignments: Assignment[]
) {
  const wb = XLSX.utils.book_new();

  // 1. 各班级汇总概览 Sheet
  const summaryHeaders = [
    '序号', '班级名称', '课程代码', '上课时间', '班级周期类型', '教室', '学期',
    '学生人数', '平均出勤率', '作业总布置数', '全班缺交人次'
  ];
  const summaryRows = classes.map((c, idx) => {
    const classStudents = students.filter(s => s.classId === c.id);
    const classAssignments = assignments.filter(a => a.classId === c.id);

    let totalAttendanceRate = 0;
    let totalMissingCount = 0;

    classStudents.forEach(s => {
      const att = calculateStudentAttendance(s, c.totalSessions);
      const hw = calculateStudentHomework(s.id, classAssignments);
      totalAttendanceRate += att.attendanceRate;
      totalMissingCount += hw.missingCount;
    });

    const avgAttendance = classStudents.length > 0
      ? (totalAttendanceRate / classStudents.length).toFixed(1) + '%'
      : '0.0%';

    const scheduleTypeDesc = c.totalSessions === 20 || c.name.toUpperCase().includes('TF')
      ? '周四周五班 (满学期20天/10周)'
      : '周一到三班 (满学期30天/10周)';

    return [
      idx + 1,
      c.name,
      c.code,
      c.schedule,
      scheduleTypeDesc,
      c.room,
      c.semester,
      classStudents.length,
      avgAttendance,
      classAssignments.length,
      totalMissingCount
    ];
  });

  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
  XLSX.utils.book_append_sheet(wb, wsSummary, '各班级概览');

  // 2. 为每个班级生成独立的详细工作表 (严格对齐学校官方考核标准: 考勤10% + 作业10% + Quiz20% + 期中20% + 口语10% + 期末30% = 100%)
  classes.forEach(c => {
    const classStudents = students.filter(s => s.classId === c.id);
    const sessions = Math.min(30, c.totalSessions || 30);
    const hwTarget = c.totalHwTarget || 20;

    // 表头构建
    const headers: string[] = ['学号', '姓名', '性别'];
    for (let day = 1; day <= sessions; day++) {
      const dateStr = c.sessionDates?.[day] || `第${day}课`;
      const modeStr = c.sessionModes?.[day] === 'online' ? ' 线上' : '';
      headers.push(`${day}(${dateStr}${modeStr})`);
    }
    headers.push(
      '出勤(次)', '迟到(次)', '请假(次)', '旷课(次)', '出勤率',
      `考勤天数(${sessions}天)`, '考勤折算(10%)',
      `作业完成(${hwTarget}次)`, '作业折算(10%)',
      'Quiz1(100分)', 'Q1折算(10%)',
      'Quiz2(100分)', 'Q2折算(10%)',
      'Quiz总折算(20%)',
      '期中Mid(100分)', '期中折算(20%)',
      '口语Sp(100分)', '口语折算(10%)',
      '期末Final(100分)', '期末折算(30%)',
      '学期总评分(100%)', '综合等第', '期末综合评定评语'
    );

    const rows: (string | number)[][] = [];

    classStudents.forEach(stu => {
      const att = calculateStudentAttendance(stu, sessions);
      const hw = calculateStudentHomework(stu.id, assignments.filter(a => a.classId === c.id), hwTarget);
      const sc = computeStudentScores(stu.scores, sessions, hwTarget, att.attendanceScore10, hw.homeworkScore10);

      const row: (string | number)[] = [
        stu.no,
        stu.name,
        stu.gender || '未知'
      ];

      // 填充每天考勤
      for (let day = 1; day <= sessions; day++) {
        const val = stu.attendance[day] || '';
        row.push(val);
      }

      // 统计与打分权重全明细 (百分比自动折算)
      row.push(
        att.presentCount,
        att.lateCount,
        att.leaveCount,
        att.absentCount,
        `${att.attendanceRate}%`,
        sc.attDays ?? att.presentCount,
        sc.attWeighted !== undefined ? `${sc.attWeighted}%` : '-',
        sc.hwCount ?? '-',
        sc.hwWeighted !== undefined ? `${sc.hwWeighted}%` : '-',
        sc.quiz1 ?? '-',
        sc.quiz1Weighted !== undefined ? `${sc.quiz1Weighted}%` : '-',
        sc.quiz2 ?? '-',
        sc.quiz2Weighted !== undefined ? `${sc.quiz2Weighted}%` : '-',
        sc.quizTotal !== undefined ? `${sc.quizTotal}%` : '-',
        sc.midterm ?? '-',
        sc.midtermWeighted !== undefined ? `${sc.midtermWeighted}%` : '-',
        sc.oral ?? '-',
        sc.oralWeighted !== undefined ? `${sc.oralWeighted}%` : '-',
        sc.finalExam ?? '-',
        sc.finalExamWeighted !== undefined ? `${sc.finalExamWeighted}%` : '-',
        sc.manualTotal ?? '-',
        stu.evaluation.grade || '未评',
        stu.evaluation.remarks || '无'
      );

      rows.push(row);
    });

    const sheetName = c.name.replace(/[\\/?*[\]]/g, '_').substring(0, 31);
    const wsClass = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, wsClass, sheetName);
  });

  // 3. 全局“作业缺交催交总表”
  const missingHeaders = ['班级', '学号', '学生姓名', '缺交作业名称', '布置日期', '截止日期'];
  const missingRows: (string | number)[][] = [];

  classes.forEach(c => {
    const classStudents = students.filter(s => s.classId === c.id);
    const classAssignments = assignments.filter(a => a.classId === c.id);

    classStudents.forEach(stu => {
      const hw = calculateStudentHomework(stu.id, classAssignments);
      hw.missingAssignments.forEach(ma => {
        missingRows.push([
          c.name,
          stu.no,
          stu.name,
          ma.title,
          ma.assignedDate,
          ma.dueDate
        ]);
      });
    });
  });

  const wsMissing = XLSX.utils.aoa_to_sheet([missingHeaders, ...missingRows]);
  XLSX.utils.book_append_sheet(wb, wsMissing, '作业缺交催交清单');

  // 4. “期末综合评定汇总表” (考勤10% + 作业10% + Quiz20% + 期中20% + 口语10% + 期末30%)
  const evalHeaders = [
    '班级', '学号', '学生姓名',
    '考勤(10%)', '作业(10%)', 'Quiz总(20%)', '期中(20%)', '口语(10%)', '期末(30%)',
    '学期总分(100%)', '综合等第', '学生标签', '教师期末综合评语'
  ];
  const evalRows: (string | number)[][] = [];

  classes.forEach(c => {
    const classStudents = students.filter(s => s.classId === c.id);
    const sessions = c.totalSessions || 30;
    const hwTarget = c.totalHwTarget || 20;

    classStudents.forEach(stu => {
      const sc = computeStudentScores(stu.scores, sessions, hwTarget);

      evalRows.push([
        c.name,
        stu.no,
        stu.name,
        sc.attWeighted !== undefined ? `${sc.attWeighted}%` : '-',
        sc.hwWeighted !== undefined ? `${sc.hwWeighted}%` : '-',
        sc.quizTotal !== undefined ? `${sc.quizTotal}%` : '-',
        sc.midtermWeighted !== undefined ? `${sc.midtermWeighted}%` : '-',
        sc.oralWeighted !== undefined ? `${sc.oralWeighted}%` : '-',
        sc.finalExamWeighted !== undefined ? `${sc.finalExamWeighted}%` : '-',
        sc.manualTotal ?? '-',
        stu.evaluation.grade || '未评',
        (stu.evaluation.tags || []).join('、') || '-',
        stu.evaluation.remarks || '无'
      ]);
    });
  });

  const wsEval = XLSX.utils.aoa_to_sheet([evalHeaders, ...evalRows]);
  XLSX.utils.book_append_sheet(wb, wsEval, '期末综合评定表');

  // 导出下载
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `学校考核管理全班级综合报表_${dateStr}.xlsx`);
}

export function exportSingleClassToExcel(
  classRoom: ClassRoom,
  students: Student[],
  assignments: Assignment[]
) {
  const wb = XLSX.utils.book_new();
  const classStudents = students.filter(s => s.classId === classRoom.id);
  const classAssignments = assignments.filter(a => a.classId === classRoom.id);
  const sessions = Math.min(30, classRoom.totalSessions || 30);
  const hwTarget = classRoom.totalHwTarget || 20;

  // 考勤与成绩主表
  const headers: string[] = ['学号', '姓名', '性别'];
  for (let day = 1; day <= sessions; day++) {
    const dateStr = classRoom.sessionDates?.[day] || `第${day}课`;
    const modeStr = classRoom.sessionModes?.[day] === 'online' ? ' 线上' : '';
    headers.push(`${day}(${dateStr}${modeStr})`);
  }
  headers.push(
    '出勤(次)', '迟到(次)', '请假(次)', '旷课(次)', '出勤率',
    `考勤天数(${sessions}天)`, '考勤折算(10%)',
    `作业完成(${hwTarget}次)`, '作业折算(10%)',
    'Quiz1(100分)', 'Q1折算(10%)',
    'Quiz2(100分)', 'Q2折算(10%)',
    'Quiz总折算(20%)',
    '期中Mid(100分)', '期中折算(20%)',
    '口语Sp(100分)', '口语折算(10%)',
    '期末Final(100分)', '期末折算(30%)',
    '学期总评分(100%)', '综合等第', '期末综合评定评语'
  );

  const rows: (string | number)[][] = [];

  classStudents.forEach(stu => {
    const att = calculateStudentAttendance(stu, sessions);
    const hw = calculateStudentHomework(stu.id, classAssignments, hwTarget);
    const sc = computeStudentScores(stu.scores, sessions, hwTarget, att.attendanceScore10, hw.homeworkScore10);

    const row: (string | number)[] = [
      stu.no,
      stu.name,
      stu.gender || '未知'
    ];

    for (let day = 1; day <= sessions; day++) {
      row.push(stu.attendance[day] || '');
    }

    row.push(
      att.presentCount,
      att.lateCount,
      att.leaveCount,
      att.absentCount,
      `${att.attendanceRate}%`,
      sc.attDays ?? att.presentCount,
      sc.attWeighted !== undefined ? `${sc.attWeighted}%` : '-',
      sc.hwCount ?? '-',
      sc.hwWeighted !== undefined ? `${sc.hwWeighted}%` : '-',
      sc.quiz1 ?? '-',
      sc.quiz1Weighted !== undefined ? `${sc.quiz1Weighted}%` : '-',
      sc.quiz2 ?? '-',
      sc.quiz2Weighted !== undefined ? `${sc.quiz2Weighted}%` : '-',
      sc.quizTotal !== undefined ? `${sc.quizTotal}%` : '-',
      sc.midterm ?? '-',
      sc.midtermWeighted !== undefined ? `${sc.midtermWeighted}%` : '-',
      sc.oral ?? '-',
      sc.oralWeighted !== undefined ? `${sc.oralWeighted}%` : '-',
      sc.finalExam ?? '-',
      sc.finalExamWeighted !== undefined ? `${sc.finalExamWeighted}%` : '-',
      sc.manualTotal ?? '-',
      stu.evaluation.grade || '未评',
      stu.evaluation.remarks || '无'
    );

    rows.push(row);
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, `${classRoom.name}_综合台账`);

  // 作业明细表
  if (classAssignments.length > 0) {
    const hwHeaders = ['学号', '学生姓名', ...classAssignments.map(a => `${a.title}(${a.assignedDate})`)];
    const hwRows = classStudents.map(stu => {
      const row: (string | number)[] = [stu.no, stu.name];
      classAssignments.forEach(a => {
        const sub = a.submissions[stu.id];
        if (!sub || sub.status === 'missing') {
          row.push('❌ 缺交');
        } else if (sub.status === 'submitted') {
          row.push(`✔️ 已交 (${sub.submittedDate || '已收'})`);
        } else if (sub.status === 'late') {
          row.push(`⚠️ 补交 (${sub.submittedDate || '迟交'})`);
        } else {
          row.push('免交');
        }
      });
      return row;
    });

    const wsHw = XLSX.utils.aoa_to_sheet([hwHeaders, ...hwRows]);
    XLSX.utils.book_append_sheet(wb, wsHw, '作业提交明细');
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${classRoom.name}_考勤成绩评定_${dateStr}.xlsx`);
}

/**
 * 优化标准Excel导出功能 (导出为 1.Excel.xlsx)
 * - 固定文件名: 1.Excel.xlsx
 * - 表格排版整齐、行列对齐、表头清晰、字段顺序与网页展示保持一致
 * - 自动适配列宽，干净清爽，方便直接查看与打印
 * - 单元格底色标记: 1 (出勤) 绿色、L (迟到) 橙色、P (请假) 黄色、A (旷课) 红色、- (停课换班) 无底色
 */
export async function exportStandardStyledExcel(
  classes: ClassRoom[],
  currentClass: ClassRoom,
  students: Student[],
  assignments: Assignment[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = '教学跟踪妮士';
  workbook.lastModifiedBy = '林达妮';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 确保当前活跃班级排在最前面导出，其他班级紧随其后
  const orderedClasses = [
    currentClass,
    ...classes.filter(c => c.id !== currentClass.id)
  ];

  for (const c of orderedClasses) {
    const classStudents = students.filter(s => s.classId === c.id);
    const classAssignments = assignments.filter(a => a.classId === c.id);
    const sessions = Math.min(30, c.totalSessions || 30);
    const hwTarget = c.totalHwTarget || 20;

    // 清理工作表名称（Excel限制最大31字符且不可包含部分特殊符号）
    const safeSheetName = (c.id === currentClass.id ? `【当前班】${c.name}` : c.name)
      .replace(/[\\/?*[\]]/g, '_')
      .slice(0, 31);

    const worksheet = workbook.addWorksheet(safeSheetName, {
      pageSetup: {
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
      },
      views: [{ state: 'frozen', xSplit: 3, ySplit: 2 }]
    });

    // 1. 构建主表头标题 (Row 1)
    const onlineCount = Array.from({ length: sessions }, (_, i) => i + 1)
      .filter(d => c.sessionModes?.[d] === 'online').length;

    const bannerTitle = `【教学跟踪妮士 · 班级台账】班级: ${c.name}   课程代码: ${c.code || '-'}   时间: ${c.schedule}   教室: ${c.room}   课时: 共${sessions}课时 (线下${sessions - onlineCount}节 / 线上${onlineCount}节)   在册学生: ${classStudents.length}人`;

    // 2. 表头字段定义 (Row 2 - 严格保持网页展示顺序)
    const headerCols: { key: string; header: string; width: number }[] = [
      { key: 'no', header: '学号', width: 8 },
      { key: 'name', header: '姓名', width: 12 },
      { key: 'gender', header: '性别', width: 7 }
    ];

    // 课时考勤列 (1..sessions)
    for (let day = 1; day <= sessions; day++) {
      const dStr = c.sessionDates?.[day] || '';
      const modeStr = c.sessionModes?.[day] === 'online' ? '(网)' : '';
      const label = dStr ? `第${day}课\n${dStr}${modeStr}` : `第${day}课${modeStr}`;
      headerCols.push({
        key: `day_${day}`,
        header: label,
        width: 7.5
      });
    }

    // 汇总与考核指标 (网页顺序)
    headerCols.push(
      { key: 'presentCount', header: '出勤\n(次)', width: 8 },
      { key: 'lateCount', header: '迟到\n(次)', width: 8 },
      { key: 'leaveCount', header: '请假\n(次)', width: 8 },
      { key: 'absentCount', header: '旷课\n(次)', width: 8 },
      { key: 'attRate', header: '出勤率', width: 9 },
      { key: 'attWeighted', header: '考勤折算\n(10%)', width: 11 },
      { key: 'hwCount', header: `作业完成\n(满${hwTarget}次)`, width: 10 },
      { key: 'hwWeighted', header: '作业折算\n(10%)', width: 11 },
      { key: 'quiz1', header: 'Quiz 1\n(100分)', width: 9 },
      { key: 'quiz1Weighted', header: 'Q1折算\n(10%)', width: 9 },
      { key: 'quiz2', header: 'Quiz 2\n(100分)', width: 9 },
      { key: 'quiz2Weighted', header: 'Q2折算\n(10%)', width: 9 },
      { key: 'quizTotal', header: 'Quiz总\n(20%)', width: 10 },
      { key: 'midterm', header: '期中Mid\n(100分)', width: 9 },
      { key: 'midtermWeighted', header: '期中折算\n(20%)', width: 10 },
      { key: 'oral', header: '口语Sp\n(100分)', width: 9 },
      { key: 'oralWeighted', header: '口语折算\n(10%)', width: 10 },
      { key: 'finalExam', header: '期末Final\n(100分)', width: 9 },
      { key: 'finalExamWeighted', header: '期末折算\n(30%)', width: 10 },
      { key: 'manualTotal', header: '学期总评\n(100%)', width: 11 },
      { key: 'grade', header: '综合等第', width: 9 },
      { key: 'remarks', header: '期末综合评定评语', width: 34 }
    );

    const totalCols = headerCols.length;

    // Row 1: Banner Header
    const row1 = worksheet.addRow([bannerTitle]);
    worksheet.mergeCells(1, 1, 1, totalCols);
    row1.height = 32;
    const bannerCell = worksheet.getCell(1, 1);
    bannerCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate 800
    };
    bannerCell.font = {
      name: '微软雅黑',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    bannerCell.alignment = {
      horizontal: 'left',
      vertical: 'middle',
      indent: 1
    };

    // Row 2: Column Headers
    const row2Headers = headerCols.map(col => col.header);
    const row2 = worksheet.addRow(row2Headers);
    row2.height = 34;

    row2.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' } // Slate 100
      };
      cell.font = {
        name: '微软雅黑',
        size: 9.5,
        bold: true,
        color: { argb: 'FF0F172A' }
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    // Row 3 onwards: Student Data
    classStudents.forEach(stu => {
      const att = calculateStudentAttendance(stu, sessions);
      const hw = calculateStudentHomework(stu.id, classAssignments, hwTarget);
      const sc = computeStudentScores(stu.scores, sessions, hwTarget, att.attendanceScore10, hw.homeworkScore10);

      const rowValues: (string | number)[] = [
        stu.no,
        stu.name,
        stu.gender || '未知'
      ];

      // Day attendance values
      for (let day = 1; day <= sessions; day++) {
        rowValues.push(stu.attendance[day] || '');
      }

      // Statistics & Weights
      rowValues.push(
        att.presentCount,
        att.lateCount,
        att.leaveCount,
        att.absentCount,
        `${att.attendanceRate}%`,
        sc.attWeighted !== undefined ? `${sc.attWeighted}%` : '-',
        sc.hwCount ?? '-',
        sc.hwWeighted !== undefined ? `${sc.hwWeighted}%` : '-',
        sc.quiz1 ?? '-',
        sc.quiz1Weighted !== undefined ? `${sc.quiz1Weighted}%` : '-',
        sc.quiz2 ?? '-',
        sc.quiz2Weighted !== undefined ? `${sc.quiz2Weighted}%` : '-',
        sc.quizTotal !== undefined ? `${sc.quizTotal}%` : '-',
        sc.midterm ?? '-',
        sc.midtermWeighted !== undefined ? `${sc.midtermWeighted}%` : '-',
        sc.oral ?? '-',
        sc.oralWeighted !== undefined ? `${sc.oralWeighted}%` : '-',
        sc.finalExam ?? '-',
        sc.finalExamWeighted !== undefined ? `${sc.finalExamWeighted}%` : '-',
        sc.manualTotal ?? '-',
        stu.evaluation.grade || '未评',
        stu.evaluation.remarks || '无'
      );

      const dataRow = worksheet.addRow(rowValues);
      dataRow.height = 24;

      dataRow.eachCell((cell, colIndex) => {
        // Base formatting
        cell.font = { name: '微软雅黑', size: 9.5 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };

        // Alignments
        if (colIndex === 2) {
          // Name: left aligned with slight bold
          cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
          cell.font = { name: '微软雅黑', size: 9.5, bold: true, color: { argb: 'FF1E293B' } };
        } else if (colIndex === totalCols) {
          // Remarks: left aligned with wrap
          cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        // Attendance Day Cells Formatting (Col 4 to 3 + sessions)
        if (colIndex >= 4 && colIndex <= 3 + sessions) {
          const val = String(cell.value || '').trim();
          cell.alignment = { horizontal: 'center', vertical: 'middle' };

          if (val === '1') {
            // 1（出勤）绿色
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFC6EFCE' } // Soft pastel green
            };
            cell.font = {
              name: '微软雅黑',
              size: 10,
              bold: true,
              color: { argb: 'FF006100' } // Dark green text
            };
          } else if (val === 'L') {
            // L（迟到）橙色
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFEBAA' } // Soft pastel orange
            };
            cell.font = {
              name: '微软雅黑',
              size: 10,
              bold: true,
              color: { argb: 'FF9A5B00' } // Dark orange text
            };
          } else if (val === 'P') {
            // P（请假）黄色
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFF2B2' } // Soft pastel yellow
            };
            cell.font = {
              name: '微软雅黑',
              size: 10,
              bold: true,
              color: { argb: 'FF7A5800' } // Dark gold/yellow text
            };
          } else if (val === 'A') {
            // A（旷课）红色
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC7CE' } // Soft pastel red
            };
            cell.font = {
              name: '微软雅黑',
              size: 10,
              bold: true,
              color: { argb: 'FF9C0006' } // Dark red text
            };
          } else if (val === '-') {
            // -（停课换班）无底色
            cell.font = {
              name: '微软雅黑',
              size: 10,
              color: { argb: 'FF94A3B8' } // Soft slate text
            };
          }
        }

        // Final score highlight
        if (colIndex === totalCols - 2) {
          cell.font = { name: '微软雅黑', size: 10, bold: true, color: { argb: 'FF1D4ED8' } };
        }

        // Evaluation Grade highlight
        if (colIndex === totalCols - 1) {
          const gradeVal = String(cell.value || '');
          if (gradeVal === '优秀') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EA' } };
            cell.font = { name: '微软雅黑', size: 9.5, bold: true, color: { argb: 'FF137333' } };
          } else if (gradeVal === '良好') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F0FE' } };
            cell.font = { name: '微软雅黑', size: 9.5, bold: true, color: { argb: 'FF1A73E8' } };
          } else if (gradeVal === '待提高') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE8E6' } };
            cell.font = { name: '微软雅黑', size: 9.5, bold: true, color: { argb: 'FFC5221F' } };
          }
        }
      });
    });

    // Row: Legend & Rules explanation footer
    const legendRow = worksheet.addRow([
      '【底色标记规则】 1 (出勤/绿色, 0扣分)   |   L (迟到/橙色, 3次扣0.5分)   |   P (请假/黄色, 每次扣0.25分)   |   A (旷课/红色, 每次扣0.5分)   |   - (停课换班/无底色, 0扣分)   |   成绩折算: 考勤10% + 作业10% + Quiz20% + 期中20% + 口语10% + 期末30% = 100%'
    ]);
    legendRow.height = 24;
    worksheet.mergeCells(worksheet.rowCount, 1, worksheet.rowCount, totalCols);
    const legendCell = worksheet.getCell(worksheet.rowCount, 1);
    legendCell.font = { name: '微软雅黑', size: 9, italic: true, color: { argb: 'FF64748B' } };
    legendCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    legendCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };

    // Apply auto-fit column widths
    headerCols.forEach((colDef, idx) => {
      worksheet.getColumn(idx + 1).width = colDef.width;
    });
  }

  // 写入二进制流并在浏览器中下载为固定文件名 1.Excel.xlsx
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = '1.Excel.xlsx';
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);
}

