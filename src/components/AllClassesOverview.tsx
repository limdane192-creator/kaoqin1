/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Download,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { ClassRoom, Student, Assignment } from '../types';
import { calculateStudentAttendance, calculateStudentHomework } from '../utils/calculations';
import { exportSingleClassToExcel } from '../utils/excelExport';

interface AllClassesOverviewProps {
  classes: ClassRoom[];
  students: Student[];
  assignments: Assignment[];
  onSelectClass: (id: string) => void;
  onOpenNewClass: () => void;
}

export const AllClassesOverview: React.FC<AllClassesOverviewProps> = ({
  classes,
  students,
  assignments,
  onSelectClass,
  onOpenNewClass
}) => {
  const totalClassesCount = classes.length;
  const totalStudentsCount = students.length;

  let totalAttendanceSum = 0;
  let totalMissingHomeworkCount = 0;

  students.forEach(s => {
    const classInfo = classes.find(c => c.id === s.classId);
    const classAssignments = assignments.filter(a => a.classId === s.classId);
    const att = calculateStudentAttendance(s, classInfo?.totalSessions || 30);
    const hw = calculateStudentHomework(s.id, classAssignments);

    totalAttendanceSum += att.attendanceRate;
    totalMissingHomeworkCount += hw.missingCount;
  });

  const overallAvgAttendance = totalStudentsCount > 0
    ? (totalAttendanceSum / totalStudentsCount).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Strip */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              全学期教学管理全景看板
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              您当前负责带教 <span className="font-semibold text-slate-800">{totalClassesCount} 个班级</span>，覆盖 {totalStudentsCount} 名学生，实时监控各班出勤与作业完成态势
            </p>
          </div>

          <button
            onClick={onOpenNewClass}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
          >
            ＋ 新建或添加班级模版
          </button>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>带教班级数</span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {totalClassesCount}
              <span className="text-xs font-normal text-slate-500 ml-1">个班</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">已达8个以上班级教学标准</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>在籍总学生</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {totalStudentsCount}
              <span className="text-xs font-normal text-slate-500 ml-1">人</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">支持跨班全局搜索学生</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>全校平均出勤率</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {overallAvgAttendance}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">自动剔除停课免修时段</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>待催交缺交作业</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {totalMissingHomeworkCount}
              <span className="text-xs font-normal text-slate-500 ml-1">人次</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">支持一键生成催交清单</div>
          </div>
        </div>
      </div>

      {/* Grid of Class Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {classes.map(c => {
          const classStudents = students.filter(s => s.classId === c.id);
          const classAssignments = assignments.filter(a => a.classId === c.id);

          let classAttSum = 0;
          let classMissingSum = 0;
          let warningStudentCount = 0;

          classStudents.forEach(stu => {
            const att = calculateStudentAttendance(stu, c.totalSessions);
            const hw = calculateStudentHomework(stu.id, classAssignments);
            classAttSum += att.attendanceRate;
            classMissingSum += hw.missingCount;
            if (att.attendanceRate < 80 || att.absentCount >= 2) {
              warningStudentCount++;
            }
          });

          const classAvgAtt = classStudents.length > 0
            ? Math.round(classAttSum / classStudents.length)
            : 0;

          return (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{c.name}</h3>
                    <p className="text-[11px] font-mono text-slate-400">{c.code}</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {classStudents.length}人
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{c.schedule}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    教室: {c.room} · 共 {c.totalSessions} 课时
                  </div>
                </div>

                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-500">平均出勤率</span>
                      <span className="font-bold font-mono tabular-nums text-slate-800">
                        {classAvgAtt}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          classAvgAtt >= 90 ? 'bg-emerald-500' : classAvgAtt >= 80 ? 'bg-blue-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${classAvgAtt}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">已布置作业</span>
                    <span className="font-semibold text-slate-800">{classAssignments.length} 项</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">缺交待补交</span>
                    {classMissingSum > 0 ? (
                      <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                        {classMissingSum} 人次
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-medium">全齐</span>
                    )}
                  </div>

                  {warningStudentCount > 0 && (
                    <div className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>{warningStudentCount} 位学生考勤需关注</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-2">
                <button
                  onClick={() => onSelectClass(c.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <span>进入班级</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => exportSingleClassToExcel(c, students, assignments)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  title="导出该班 Excel 表格"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
