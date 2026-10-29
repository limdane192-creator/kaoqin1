/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  X,
  Lock,
  ShieldCheck,
  FileSpreadsheet,
  FileDown,
  FileUp,
  Copy,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { exportStandardStyledExcel } from './utils/excelExport';
import {
  loadSemesters,
  saveSemesters,
  loadSelectedSemesterId,
  saveSelectedSemesterId,
  loadClasses,
  saveClasses,
  loadStudents,
  saveStudents,
  loadAssignments,
  saveAssignments,
  loadSelectedClassId,
  saveSelectedClassId,
  loadJournalEntries,
  saveJournalEntries,
  resetToSampleData
} from './utils/storage';
import {
  Semester,
  SessionMode,
  ClassRoom,
  Student,
  Assignment,
  AttendanceStatus,
  StudentSubmission,
  StudentScores,
  StudentEvaluation,
  BehaviorNote,
  TeacherJournalEntry
} from './types';
import { Header } from './components/Header';
import { ClassSelector } from './components/ClassSelector';
import { DailyRollCallView } from './components/DailyRollCallView';
import { AttendanceView } from './components/AttendanceView';
import { HomeworkView } from './components/HomeworkView';
import { GradesEvaluationView } from './components/GradesEvaluationView';
import { TeacherJournalView } from './components/TeacherJournalView';
import { AllClassesOverview } from './components/AllClassesOverview';
import { StudentDetailModal } from './components/StudentDetailModal';
import { NewClassModal } from './components/NewClassModal';
import { EditClassModal } from './components/EditClassModal';
import { NewAssignmentModal } from './components/NewAssignmentModal';
import { BatchImportStudentsModal } from './components/BatchImportStudentsModal';
import { AddStudentModal } from './components/AddStudentModal';
import { EditStudentModal } from './components/EditStudentModal';
import { TransferStudentModal } from './components/TransferStudentModal';
import { BackupModal } from './components/BackupModal';

export default function App() {
  const [semesters, setSemesters] = useState<Semester[]>(loadSemesters);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>(loadSelectedSemesterId);
  const [classes, setClasses] = useState<ClassRoom[]>(loadClasses);
  const [students, setStudents] = useState<Student[]>(loadStudents);
  const [assignments, setAssignments] = useState<Assignment[]>(loadAssignments);
  const [journalEntries, setJournalEntries] = useState<TeacherJournalEntry[]>(loadJournalEntries);
  const [selectedClassId, setSelectedClassId] = useState<string>(loadSelectedClassId);
  const [currentTab, setCurrentTab] = useState<'rollcall' | 'attendance' | 'homework' | 'grades' | 'journal' | 'overview'>('rollcall');
  const [searchQuery, setSearchQuery] = useState('');

  // Save feedback state
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(new Date());
  const [isJustSaved, setIsJustSaved] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<{ show: boolean; title: string; desc: string } | null>(null);

  // Teacher Authentication Gate (打开网页先弹出输入框，输入“林达妮”才可以进入台账，输入错误无法进入)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('auth_teacher_verified') === 'true';
    } catch {
      return false;
    }
  });
  const [authInputName, setAuthInputName] = useState('');
  const [authError, setAuthError] = useState('');

  // Export prompt & path notice modal (Excel & JSON)
  const [exportNoticeModal, setExportNoticeModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    pathHint?: string;
    fileName: string;
    type: 'json' | 'excel';
  } | null>(null);

  // JSON Overwrite Import Confirmation Modal
  const [importConfirmModal, setImportConfirmModal] = useState<{
    isOpen: boolean;
    fileContent: string;
    fileName?: string;
  } | null>(null);

  const [copiedPath, setCopiedPath] = useState(false);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [isNewClassModalOpen, setIsNewClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<Student | null>(null);
  const [isNewAssignmentModalOpen, setIsNewAssignmentModalOpen] = useState(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Sync state to LocalStorage
  useEffect(() => {
    saveSemesters(semesters);
    setLastSavedTime(new Date());
  }, [semesters]);

  useEffect(() => {
    saveSelectedSemesterId(selectedSemesterId);
  }, [selectedSemesterId]);

  useEffect(() => {
    saveClasses(classes);
    setLastSavedTime(new Date());
  }, [classes]);

  useEffect(() => {
    saveStudents(students);
    setLastSavedTime(new Date());
  }, [students]);

  useEffect(() => {
    saveAssignments(assignments);
    setLastSavedTime(new Date());
  }, [assignments]);

  useEffect(() => {
    saveSelectedClassId(selectedClassId);
  }, [selectedClassId]);

  useEffect(() => {
    saveJournalEntries(journalEntries);
    setLastSavedTime(new Date());
  }, [journalEntries]);

  // Explicit Manual Save
  const handleManualSave = () => {
    saveSemesters(semesters);
    saveClasses(classes);
    saveStudents(students);
    saveAssignments(assignments);
    saveJournalEntries(journalEntries);
    saveSelectedClassId(selectedClassId);
    saveSelectedSemesterId(selectedSemesterId);

    const now = new Date();
    setLastSavedTime(now);
    setIsJustSaved(true);

    setSaveToast({
      show: true,
      title: '数据已安全保存！',
      desc: `已将全部 ${classes.length} 个班级、${students.length} 名在册学生、考勤排期与各项成绩安全存入浏览器。明天或任意时刻重新打开网页均会自动加载，绝不会丢失！`
    });

    setTimeout(() => {
      setIsJustSaved(false);
    }, 2500);

    setTimeout(() => {
      setSaveToast(null);
    }, 5000);
  };

  // Semester switching handler
  const handleSelectSemester = (semId: string) => {
    setSelectedSemesterId(semId);
    const classesInSem = classes.filter(c => c.semesterId === semId);
    if (classesInSem.length > 0 && !classesInSem.some(c => c.id === selectedClassId)) {
      setSelectedClassId(classesInSem[0].id);
    }
  };

  const handleAddSemester = (name: string) => {
    const newId = `sem_${Date.now()}`;
    const newSem: Semester = {
      id: newId,
      name,
      createdAt: Date.now()
    };
    setSemesters(prev => [...prev, newSem]);
    setSelectedSemesterId(newId);
  };

  const handleDeleteSemester = (semId: string) => {
    const targetSem = semesters.find(s => s.id === semId);
    const affectedClasses = classes.filter(c => c.semesterId === semId);

    // 如果系统中仅剩一个学期被删除，自动生成一个干净的空白“新学期”
    if (semesters.length <= 1) {
      const freshSemId = `sem_${Date.now()}`;
      const freshSem: Semester = {
        id: freshSemId,
        name: '新学期',
        createdAt: Date.now()
      };
      setSemesters([freshSem]);
      saveSemesters([freshSem]);
      setSelectedSemesterId(freshSemId);
      saveSelectedSemesterId(freshSemId);

      const remainingClasses = classes.filter(c => c.semesterId !== semId);
      setClasses(remainingClasses);
      saveClasses(remainingClasses);

      const remainingStudents = students.filter(s =>
        remainingClasses.some(c => c.id === s.classId)
      );
      setStudents(remainingStudents);
      saveStudents(remainingStudents);

      const remainingAssignments = assignments.filter(a =>
        remainingClasses.some(c => c.id === a.classId)
      );
      setAssignments(remainingAssignments);
      saveAssignments(remainingAssignments);

      setSaveToast({
        show: true,
        title: '学期已成功删除',
        desc: `已删除学期【${targetSem?.name || ''}】，系统已自动为您新建空白学期。`
      });
      setTimeout(() => setSaveToast(null), 3500);
      return;
    }

    // 正常多学期删除
    const remainingSemesters = semesters.filter(s => s.id !== semId);
    setSemesters(remainingSemesters);
    saveSemesters(remainingSemesters);

    if (affectedClasses.length > 0) {
      const remainingClasses = classes.filter(c => c.semesterId !== semId);
      setClasses(remainingClasses);
      saveClasses(remainingClasses);

      const remainingStudents = students.filter(s =>
        remainingClasses.some(c => c.id === s.classId)
      );
      setStudents(remainingStudents);
      saveStudents(remainingStudents);

      const remainingAssignments = assignments.filter(a =>
        remainingClasses.some(c => c.id === a.classId)
      );
      setAssignments(remainingAssignments);
      saveAssignments(remainingAssignments);
    }

    if (selectedSemesterId === semId) {
      const nextSemId = remainingSemesters[0]?.id || '';
      setSelectedSemesterId(nextSemId);
      saveSelectedSemesterId(nextSemId);
      const nextClasses = classes.filter(c => c.semesterId === nextSemId);
      if (nextClasses.length > 0) {
        setSelectedClassId(nextClasses[0].id);
        saveSelectedClassId(nextClasses[0].id);
      }
    }

    setSaveToast({
      show: true,
      title: '学期已成功删除',
      desc: `已成功删除学期【${targetSem?.name || ''}】。`
    });
    setTimeout(() => setSaveToast(null), 3500);
  };

  // Classes filtered by currently selected semester
  const semesterClasses = classes.filter(c => c.semesterId === selectedSemesterId);

  // Current active class (guarantee selection from current semester if available)
  const currentClass =
    semesterClasses.find(c => c.id === selectedClassId) ||
    semesterClasses[0] ||
    classes.find(c => c.id === selectedClassId) ||
    classes[0] || {
      id: 'default',
      name: '默认班级',
      code: 'CHN-101',
      schedule: '周一/周三',
      room: 'A-101',
      semesterId: selectedSemesterId,
      semester: semesters.find(s => s.id === selectedSemesterId)?.name || '48学期',
      totalSessions: 30,
      sessionDates: {},
      sessionModes: {}
    };

  const currentClassStudents = students.filter(s => s.classId === currentClass.id);

  // 1. 更新学生出勤
  const handleUpdateStudentAttendance = (
    studentId: string,
    day: number,
    status: AttendanceStatus,
    note?: string
  ) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s;
        const nextAttendance = { ...s.attendance, [day]: status };
        const nextNotes = { ...s.attendanceNotes };
        if (note !== undefined) {
          if (note.trim()) {
            nextNotes[day] = note.trim();
          } else {
            delete nextNotes[day];
          }
        }
        return {
          ...s,
          attendance: nextAttendance,
          attendanceNotes: nextNotes
        };
      })
    );
  };

  // 2. 批量设置某一天全班考勤
  const handleBatchSetAttendance = (day: number, status: AttendanceStatus) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.classId !== currentClass.id) return s;
        return {
          ...s,
          attendance: { ...s.attendance, [day]: status }
        };
      })
    );
  };

  // 3. 更新作业提交情况 (哪一天交、得分、评语、状态)
  const handleUpdateSubmission = (
    assignmentId: string,
    studentId: string,
    updates: Partial<StudentSubmission>
  ) => {
    setAssignments(prev =>
      prev.map(a => {
        if (a.id !== assignmentId) return a;
        const currentSub = a.submissions[studentId] || { status: 'missing' };
        return {
          ...a,
          submissions: {
            ...a.submissions,
            [studentId]: {
              ...currentSub,
              ...updates
            }
          }
        };
      })
    );
  };

  // 4. 一键将选定作业所有未交学生设为今天已交
  const handleBatchSubmitToday = (assignmentId: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setAssignments(prev =>
      prev.map(a => {
        if (a.id !== assignmentId) return a;
        const nextSubs = { ...a.submissions };
        currentClassStudents.forEach(stu => {
          const current = nextSubs[stu.id];
          if (!current || current.status === 'missing') {
            nextSubs[stu.id] = {
              status: 'submitted',
              submittedDate: todayStr
            };
          }
        });
        return {
          ...a,
          submissions: nextSubs
        };
      })
    );
  };

  // 5. 更新学生成绩
  const handleUpdateStudentScores = (studentId: string, scores: Partial<StudentScores>) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          scores: { ...s.scores, ...scores }
        };
      })
    );
  };

  // 6. 更新学生期末综合评定
  const handleUpdateStudentEvaluation = (
    studentId: string,
    evaluation: Partial<StudentEvaluation>
  ) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          evaluation: { ...s.evaluation, ...evaluation }
        };
      })
    );
  };

  // 7. 添加课堂具体表现记录
  const handleAddBehaviorNote = (studentId: string, note: Omit<BehaviorNote, 'id'>) => {
    const noteWithId: BehaviorNote = {
      ...note,
      id: `b_${Date.now()}`
    };
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s;
        const existingNotes = s.evaluation.behaviorNotes || [];
        return {
          ...s,
          evaluation: {
            ...s.evaluation,
            behaviorNotes: [noteWithId, ...existingNotes]
          }
        };
      })
    );
  };

  // 8. 删除课堂表现记录
  const handleDeleteBehaviorNote = (studentId: string, noteId: string) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s;
        const existingNotes = s.evaluation.behaviorNotes || [];
        return {
          ...s,
          evaluation: {
            ...s.evaluation,
            behaviorNotes: existingNotes.filter(n => n.id !== noteId)
          }
        };
      })
    );
  };

  // 9. 新建班级
  const handleCreateClass = (newClass: ClassRoom, initialStudentNames: string[]) => {
    setClasses(prev => [...prev, newClass]);
    setSelectedClassId(newClass.id);
    if (newClass.semesterId) {
      setSelectedSemesterId(newClass.semesterId);
    }

    if (initialStudentNames.length > 0) {
      const newStudents: Student[] = initialStudentNames.map((name, i) => ({
        id: `s_${newClass.id}_${Date.now()}_${i}`,
        classId: newClass.id,
        no: i + 1,
        name,
        attendance: {},
        attendanceNotes: {},
        scores: {},
        evaluation: {
          grade: '',
          remarks: '',
          tags: [],
          behaviorNotes: []
        }
      }));
      setStudents(prev => [...prev, ...newStudents]);
    }
  };

  // 9.1 更新/修改班级信息与归属学期
  const handleUpdateClass = (
    classId: string,
    updates: Partial<ClassRoom>,
    newStudentNames?: string[]
  ) => {
    setClasses(prev =>
      prev.map(c => {
        if (c.id !== classId) return c;
        return { ...c, ...updates };
      })
    );

    if (updates.semesterId && updates.semesterId !== selectedSemesterId) {
      setSelectedSemesterId(updates.semesterId);
    }

    if (newStudentNames && newStudentNames.length > 0) {
      const existingInClass = students.filter(s => s.classId === classId);
      const startNo = existingInClass.reduce((max, s) => Math.max(max, s.no), 0) + 1;
      const appendedStudents: Student[] = newStudentNames.map((name, i) => ({
        id: `s_${classId}_${Date.now()}_${i}`,
        classId,
        no: startNo + i,
        name,
        attendance: {},
        attendanceNotes: {},
        scores: {},
        evaluation: {
          grade: '',
          remarks: '',
          tags: ['新报名'],
          behaviorNotes: []
        }
      }));
      setStudents(prev => [...prev, ...appendedStudents]);
    }

    setSaveToast({
      show: true,
      title: '班级信息更新成功！',
      desc: `班级【${updates.name || currentClass.name}】已成功更新归属学期 (${updates.semester || currentClass.semester}) 与排期课时${newStudentNames && newStudentNames.length > 0 ? `，并追加 ${newStudentNames.length} 名学生` : ''}。`
    });
    setTimeout(() => setSaveToast(null), 4000);
  };

  // 9.2 删除班级
  const handleDeleteClass = (classId: string) => {
    const deletingClass = classes.find(c => c.id === classId);
    setClasses(prev => prev.filter(c => c.id !== classId));
    setStudents(prev => prev.filter(s => s.classId !== classId));
    setAssignments(prev => prev.filter(a => a.classId !== classId));

    const remainingInSem = classes.filter(c => c.semesterId === selectedSemesterId && c.id !== classId);
    if (remainingInSem.length > 0) {
      setSelectedClassId(remainingInSem[0].id);
    } else {
      const otherClasses = classes.filter(c => c.id !== classId);
      if (otherClasses.length > 0) {
        setSelectedClassId(otherClasses[0].id);
        if (otherClasses[0].semesterId) {
          setSelectedSemesterId(otherClasses[0].semesterId);
        }
      }
    }

    setSaveToast({
      show: true,
      title: '班级已删除',
      desc: `班级【${deletingClass?.name || ''}】已被移除。`
    });
    setTimeout(() => setSaveToast(null), 3000);
  };

  // 9.3 快速录入插班生
  const handleAddSingleStudent = (newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
    setSaveToast({
      show: true,
      title: '插班生录入成功！',
      desc: `学生【${newStudent.name}】（学号 No.${newStudent.no}）已成功加入【${currentClass.name}】花名册。前期课时未记录不计扣分。`
    });
    setTimeout(() => setSaveToast(null), 3500);
  };

  // 9.4 修改学生信息
  const handleUpdateStudent = (studentId: string, updates: Partial<Student>) => {
    setStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, ...updates } : s))
    );
    setSaveToast({
      show: true,
      title: '学生资料已更新',
      desc: `已成功保存学生【${updates.name || ''}】的姓名与资料。`
    });
    setTimeout(() => setSaveToast(null), 3000);
  };

  // 9.5 移除学生档案
  const handleDeleteStudent = (studentId: string) => {
    const deleting = students.find(s => s.id === studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
    setSaveToast({
      show: true,
      title: '已移除学生',
      desc: `已从当前班级名册中移除【${deleting?.name || ''}】。`
    });
    setTimeout(() => setSaveToast(null), 3000);
  };

  // 9.6 学生换班/转班 (严格限制在同一学期内部各班级互转，分数与评语无损保留)
  const handleTransferStudent = (studentId: string, targetClassId: string, customStudentNo?: number) => {
    const student = students.find(s => s.id === studentId);
    const targetClass = classes.find(c => c.id === targetClassId);
    if (!student || !targetClass) return;

    const oldClass = classes.find(c => c.id === student.classId);

    // 限制：只能换到同属一个学期的其他班级，严禁跨学期调动
    if (oldClass && targetClass.semesterId !== oldClass.semesterId) {
      setSaveToast({
        show: true,
        title: '不可跨学期转班',
        desc: `学生换班只能在同一学期（${oldClass.semester}）内部各班级之间调换，不能换到其他学期。`
      });
      setTimeout(() => setSaveToast(null), 4000);
      return;
    }

    const targetStudents = students.filter(s => s.classId === targetClassId);
    const newNo = customStudentNo || (targetStudents.reduce((max, s) => Math.max(max, s.no), 0) + 1);

    setStudents(prev =>
      prev.map(s => {
        if (s.id !== studentId) return s;
        return {
          ...s,
          classId: targetClassId,
          no: newNo
          // student.scores, student.evaluation, student.behaviorNotes, etc. are 100% PRESERVED!
        };
      })
    );

    // Switch active class to target class so teacher sees the student immediately
    setSelectedClassId(targetClassId);

    setSaveToast({
      show: true,
      title: '换班成功！分数与评语已完全保留',
      desc: `学生【${student.name}】已成功从【${oldClass?.name || ''}】调入【${targetClass.name}】（新学号 No.${newNo}），同在【${targetClass.semester}】内。其已取得的小测试、期中、口语、期末卷面成绩及综合评语均完整保留！`
    });
    setTimeout(() => setSaveToast(null), 5000);
  };

  // 10. 更新课时日期与线上/线下形式
  const handleUpdateSessionConfig = (day: number, date: string, mode: SessionMode) => {
    setClasses(prev =>
      prev.map(c => {
        if (c.id !== currentClass.id) return c;
        return {
          ...c,
          sessionDates: { ...(c.sessionDates || {}), [day]: date },
          sessionModes: { ...(c.sessionModes || {}), [day]: mode }
        };
      })
    );
  };

  // 11. 批量更新课时排期与形式
  const handleBatchUpdateSessions = (
    dates: Record<number, string>,
    modes: Record<number, SessionMode>
  ) => {
    setClasses(prev =>
      prev.map(c => {
        if (c.id !== currentClass.id) return c;
        return {
          ...c,
          sessionDates: { ...(c.sessionDates || {}), ...dates },
          sessionModes: { ...(c.sessionModes || {}), ...modes }
        };
      })
    );
  };

  // 12. 布置新作业
  const handleCreateAssignment = (assignment: Assignment) => {
    setAssignments(prev => [assignment, ...prev]);
  };

  // 12.5 删除已布置的作业
  const handleDeleteAssignment = (assignmentId: string) => {
    const deleting = assignments.find(a => a.id === assignmentId);
    setAssignments(prev => prev.filter(a => a.id !== assignmentId));
    setSaveToast({
      show: true,
      title: '作业已删除',
      desc: `已成功删除布置好的作业【${deleting?.title || ''}】及其所有学生提交记录。`
    });
    setTimeout(() => setSaveToast(null), 3500);
  };

  // 13. 批量导入学生名单
  const handleAddStudents = (newStudents: Student[]) => {
    setStudents(prev => [...prev, ...newStudents]);
  };

  // 13.5 将班级名册按姓名 A-Z 拼音/字母升序重新排序并重排学号 (No.1 ~ No.N)
  const handleSortClassStudentsAZ = (classId?: string) => {
    const targetClassId = classId || currentClass.id;
    const targetClass = classes.find(c => c.id === targetClassId);

    setStudents(prev => {
      const classStus = prev.filter(s => s.classId === targetClassId);
      const otherStus = prev.filter(s => s.classId !== targetClassId);

      // A-Z 排序
      const sorted = [...classStus].sort((a, b) =>
        a.name.trim().localeCompare(b.name.trim(), 'zh-Hans-CN', {
          numeric: true,
          sensitivity: 'base'
        })
      );

      // 顺延重排学号 1, 2, 3...
      const renumbered = sorted.map((s, index) => ({
        ...s,
        no: index + 1
      }));

      return [...otherStus, ...renumbered];
    });

    setSaveToast({
      show: true,
      title: '名册已按 A-Z 排序完成',
      desc: `班级【${targetClass?.name || ''}】的学生已按姓名 A-Z 字母升序重新排列，并已顺延重排学号 No.1~No.N。`
    });
    setTimeout(() => setSaveToast(null), 3500);
  };

  // 14. 重置演示数据
  const handleResetData = () => {
    const reset = resetToSampleData();
    setSemesters(reset.semesters);
    setClasses(reset.classes);
    setStudents(reset.students);
    setAssignments(reset.assignments);
    setJournalEntries(reset.journal);
    setSelectedSemesterId(reset.semesters[0]?.id || 'sem_48');
    setSelectedClassId(reset.classes[0]?.id || 'c_mw89');
  };

  // 15. 恢复备份
  const handleRestore = (
    restoredClasses: ClassRoom[],
    restoredStudents: Student[],
    restoredAssignments: Assignment[],
    restoredSemesters?: Semester[]
  ) => {
    if (restoredSemesters && restoredSemesters.length > 0) {
      setSemesters(restoredSemesters);
    }
    setClasses(restoredClasses);
    setStudents(restoredStudents);
    setAssignments(restoredAssignments);
    if (restoredClasses[0]) {
      setSelectedClassId(restoredClasses[0].id);
      if (restoredClasses[0].semesterId) {
        setSelectedSemesterId(restoredClasses[0].semesterId);
      }
    }
  };

  // 16. 教师工作手记管理
  const handleAddJournalEntry = (entry: Omit<TeacherJournalEntry, 'id' | 'createdAt'>) => {
    const newEntry: TeacherJournalEntry = {
      ...entry,
      id: `j_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now()
    };
    setJournalEntries(prev => [newEntry, ...prev]);
  };

  const handleUpdateJournalEntry = (id: string, updates: Partial<TeacherJournalEntry>) => {
    setJournalEntries(prev =>
      prev.map(j => (j.id === id ? { ...j, ...updates } : j))
    );
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries(prev => prev.filter(j => j.id !== id));
  };

  // 17. 身份确认登录 (输入正确教师姓名方可进入台账，输入错误无法进入)
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (authInputName.trim() === '林达妮') {
      setIsAuthenticated(true);
      setAuthError('');
      try {
        sessionStorage.setItem('auth_teacher_verified', 'true');
      } catch (err) {
        console.error(err);
      }
    } else {
      setAuthError('姓名验证失败，输入错误无法进入台账！请重新输入。');
    }
  };

  // 18. 导出JSON备份文件 (带当前日期 backup_YYYYMMDD.json)
  const handleExportJSONBackup = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const fileName = `backup_${yyyy}${mm}${dd}.json`;

    const backupData = {
      version: '2.0',
      exportDate: now.toISOString(),
      systemName: '教学跟踪妮士',
      teacher: '林达妮',
      semesters,
      selectedSemesterId,
      classes,
      students,
      assignments,
      journalEntries,
      selectedClassId
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // 导出成功后弹出特定提示
    setExportNoticeModal({
      isOpen: true,
      title: 'JSON考勤备份导出成功',
      fileName,
      type: 'json',
      pathHint: 'D:\\A课件\\51.备份\\2.考勤备份',
      message: '此JSON为考勤备份文件，无法直接阅读，查看数据请使用导出表格功能；数据改动较多时建议及时备份，可复制保存到 D:\\A课件\\51.备份\\2.考勤备份'
    });
  };

  // 19. 触发选择本地JSON文件
  const handleTriggerImportJSON = () => {
    if (jsonFileInputRef.current) {
      jsonFileInputRef.current.value = '';
      jsonFileInputRef.current.click();
    }
  };

  // 20. 读取选择的JSON文件并弹出确认提示
  const handleJSONFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      const content = ev.target?.result as string;
      // 导入前弹出确认提示：“导入会覆盖当前所有数据，确定继续吗？”
      setImportConfirmModal({
        isOpen: true,
        fileContent: content,
        fileName: file.name
      });
    };
    reader.readAsText(file);
  };

  // 21. 确认覆盖导入JSON并同步至 localStorage
  const handleConfirmImportJSON = () => {
    if (!importConfirmModal?.fileContent) return;
    try {
      const restored = JSON.parse(importConfirmModal.fileContent);
      if (restored && (restored.classes || restored.students)) {
        if (restored.semesters && Array.isArray(restored.semesters)) {
          setSemesters(restored.semesters);
          saveSemesters(restored.semesters);
        }
        if (restored.classes && Array.isArray(restored.classes)) {
          setClasses(restored.classes);
          saveClasses(restored.classes);
        }
        if (restored.students && Array.isArray(restored.students)) {
          setStudents(restored.students);
          saveStudents(restored.students);
        }
        if (restored.assignments && Array.isArray(restored.assignments)) {
          setAssignments(restored.assignments);
          saveAssignments(restored.assignments);
        }
        if (restored.journalEntries && Array.isArray(restored.journalEntries)) {
          setJournalEntries(restored.journalEntries);
          saveJournalEntries(restored.journalEntries);
        }
        if (restored.selectedSemesterId) {
          setSelectedSemesterId(restored.selectedSemesterId);
          saveSelectedSemesterId(restored.selectedSemesterId);
        }
        if (restored.selectedClassId) {
          setSelectedClassId(restored.selectedClassId);
          saveSelectedClassId(restored.selectedClassId);
        }

        setImportConfirmModal(null);
        setSaveToast({
          show: true,
          title: 'JSON备份数据导入恢复成功！',
          desc: '已成功从备份文件中恢复全部学期、班级、考勤、成绩与手记，并已安全同步保存至浏览器本地。'
        });
        setTimeout(() => setSaveToast(null), 5000);
      } else {
        alert('备份文件格式不符合要求，未能找到有效的班级或学生数据。');
        setImportConfirmModal(null);
      }
    } catch (err) {
      console.error('Import JSON parse error:', err);
      alert('解析备份文件失败，请确保选中的是有效的JSON备份文件。');
      setImportConfirmModal(null);
    }
  };

  // 22. 优化标准Excel导出 (1.Excel.xlsx，带彩色底色及对齐排版)
  const handleExportStandardExcel = async () => {
    try {
      await exportStandardStyledExcel(classes, currentClass, students, assignments);
      // 导出成功后弹出特定提示
      setExportNoticeModal({
        isOpen: true,
        title: 'Excel考勤表格导出成功',
        fileName: '1.Excel.xlsx',
        type: 'excel',
        pathHint: 'D:\\A课件\\51.备份\\1.Excel考勤备份',
        message: '此Excel考勤表格用于查看、打印，可复制保存到 D:\\A课件\\51.备份\\1.Excel考勤备份，新文件会覆盖旧表格'
      });
    } catch (err) {
      console.error('Export standard excel error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        classes={classes}
        currentClass={currentClass}
        students={students}
        assignments={assignments}
        onOpenNewClass={() => setIsNewClassModalOpen(true)}
        onOpenNewAssignment={() => setIsNewAssignmentModalOpen(true)}
        onResetData={handleResetData}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onSaveData={handleManualSave}
        lastSavedTime={lastSavedTime}
        isJustSaved={isJustSaved}
        onExportStandardExcel={handleExportStandardExcel}
        onExportJSONBackup={handleExportJSONBackup}
        onImportJSONBackup={handleTriggerImportJSON}
      />

      {/* Class Selector Bar with Semester Switcher */}
      {currentTab !== 'overview' && currentTab !== 'journal' && (
        <ClassSelector
          semesters={semesters}
          selectedSemesterId={selectedSemesterId}
          onSelectSemester={handleSelectSemester}
          onAddSemester={handleAddSemester}
          onDeleteSemester={handleDeleteSemester}
          classes={semesterClasses}
          allClasses={classes}
          selectedClassId={currentClass.id}
          onSelectClass={id => setSelectedClassId(id)}
          onOpenNewClass={() => setIsNewClassModalOpen(true)}
          onOpenEditClass={() => setIsEditClassModalOpen(true)}
          students={students}
          assignments={assignments}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectStudentModal={stu => setSelectedStudentForModal(stu)}
        />
      )}

      {/* Main View Port */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'rollcall' && (
          <DailyRollCallView
            currentClass={currentClass}
            students={currentClassStudents}
            onUpdateStudentAttendance={handleUpdateStudentAttendance}
            onBatchSetAttendance={handleBatchSetAttendance}
            onSelectStudentModal={stu => setSelectedStudentForModal(stu)}
            onSwitchToBrowse={() => setCurrentTab('attendance')}
            onSaveData={handleManualSave}
            isJustSaved={isJustSaved}
            onSortClassStudentsAZ={() => handleSortClassStudentsAZ(currentClass.id)}
          />
        )}

        {currentTab === 'attendance' && (
          <AttendanceView
            currentClass={currentClass}
            students={currentClassStudents}
            onUpdateStudentAttendance={handleUpdateStudentAttendance}
            onBatchSetAttendance={handleBatchSetAttendance}
            onSelectStudentModal={stu => setSelectedStudentForModal(stu)}
            onOpenBatchImport={() => setIsBatchImportModalOpen(true)}
            onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
            onOpenEditClass={() => setIsEditClassModalOpen(true)}
            onOpenTransferStudent={stu => setSelectedStudentForTransfer(stu)}
            onOpenEditStudent={stu => setSelectedStudentForEdit(stu)}
            onSwitchToRollCall={() => setCurrentTab('rollcall')}
            onUpdateSessionConfig={handleUpdateSessionConfig}
            onBatchUpdateSessions={handleBatchUpdateSessions}
            onSaveData={handleManualSave}
            isJustSaved={isJustSaved}
            onSortClassStudentsAZ={() => handleSortClassStudentsAZ(currentClass.id)}
          />
        )}

        {currentTab === 'homework' && (
          <HomeworkView
            currentClass={currentClass}
            students={currentClassStudents}
            assignments={assignments}
            onOpenNewAssignment={() => setIsNewAssignmentModalOpen(true)}
            onUpdateSubmission={handleUpdateSubmission}
            onBatchSubmitToday={handleBatchSubmitToday}
            onSelectStudentModal={stu => setSelectedStudentForModal(stu)}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )}

        {currentTab === 'grades' && (
          <GradesEvaluationView
            currentClass={currentClass}
            students={currentClassStudents}
            assignments={assignments}
            onUpdateStudentScores={handleUpdateStudentScores}
            onUpdateStudentEvaluation={handleUpdateStudentEvaluation}
            onAddBehaviorNote={handleAddBehaviorNote}
            onDeleteBehaviorNote={handleDeleteBehaviorNote}
            onSelectStudentModal={stu => setSelectedStudentForModal(stu)}
            onOpenAddStudent={() => setIsAddStudentModalOpen(true)}
            onOpenTransferStudent={stu => setSelectedStudentForTransfer(stu)}
            onOpenEditStudent={stu => setSelectedStudentForEdit(stu)}
            onSaveData={handleManualSave}
            isJustSaved={isJustSaved}
          />
        )}

        {currentTab === 'journal' && (
          <TeacherJournalView
            classes={classes}
            students={students}
            currentClass={currentClass}
            journalEntries={journalEntries}
            onAddJournalEntry={handleAddJournalEntry}
            onUpdateJournalEntry={handleUpdateJournalEntry}
            onDeleteJournalEntry={handleDeleteJournalEntry}
          />
        )}

        {currentTab === 'overview' && (
          <AllClassesOverview
            classes={classes}
            students={students}
            assignments={assignments}
            onSelectClass={id => {
              setSelectedClassId(id);
              const targetCls = classes.find(c => c.id === id);
              if (targetCls?.semesterId) {
                setSelectedSemesterId(targetCls.semesterId);
              }
              setCurrentTab('rollcall');
            }}
            onOpenNewClass={() => setIsNewClassModalOpen(true)}
          />
        )}
      </main>

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudentForModal}
        onClose={() => setSelectedStudentForModal(null)}
        classes={classes}
        assignments={assignments}
        onOpenTransfer={stu => setSelectedStudentForTransfer(stu)}
        onOpenEdit={stu => setSelectedStudentForEdit(stu)}
      />

      {/* New Class Modal */}
      <NewClassModal
        isOpen={isNewClassModalOpen}
        onClose={() => setIsNewClassModalOpen(false)}
        onCreateClass={handleCreateClass}
        semesters={semesters}
        currentSemesterId={selectedSemesterId}
      />

      {/* Edit Class Modal */}
      <EditClassModal
        isOpen={isEditClassModalOpen}
        onClose={() => setIsEditClassModalOpen(false)}
        currentClass={currentClass}
        semesters={semesters}
        onUpdateClass={handleUpdateClass}
        onDeleteClass={classes.length > 1 ? handleDeleteClass : undefined}
        studentCount={currentClassStudents.length}
      />

      {/* Quick Add Student / Late Enrollment Modal */}
      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        currentClass={currentClass}
        existingCount={currentClassStudents.length}
        onAddStudent={handleAddSingleStudent}
        onBatchAddStudents={handleAddStudents}
      />

      {/* Edit Student Info Modal */}
      <EditStudentModal
        isOpen={!!selectedStudentForEdit}
        onClose={() => setSelectedStudentForEdit(null)}
        student={selectedStudentForEdit}
        currentClass={classes.find(c => c.id === selectedStudentForEdit?.classId)}
        onUpdateStudent={handleUpdateStudent}
        onDeleteStudent={handleDeleteStudent}
      />

      {/* Transfer Student Modal */}
      <TransferStudentModal
        isOpen={!!selectedStudentForTransfer}
        onClose={() => setSelectedStudentForTransfer(null)}
        student={selectedStudentForTransfer}
        classes={classes}
        semesters={semesters}
        onTransferStudent={handleTransferStudent}
      />

      {/* New Assignment Modal */}
      <NewAssignmentModal
        isOpen={isNewAssignmentModalOpen}
        onClose={() => setIsNewAssignmentModalOpen(false)}
        currentClass={currentClass}
        students={students}
        onCreateAssignment={handleCreateAssignment}
      />

      {/* Batch Import Students Modal */}
      <BatchImportStudentsModal
        isOpen={isBatchImportModalOpen}
        onClose={() => setIsBatchImportModalOpen(false)}
        currentClass={currentClass}
        existingCount={currentClassStudents.length}
        onAddStudents={handleAddStudents}
      />

      {/* Backup and Restore Modal */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        classes={classes}
        students={students}
        assignments={assignments}
        semesters={semesters}
        onRestore={handleRestore}
        onReset={handleResetData}
      />

      {/* Reassuring Save Toast Notification */}
      {saveToast?.show && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start gap-3">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400 mt-0.5 shrink-0">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{saveToast.title}</span>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/60">
                    已安全持久化
                  </span>
                </h4>
                <button
                  onClick={() => setSaveToast(null)}
                  className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {saveToast.desc}
              </p>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  确认时间: {lastSavedTime?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <button
                  onClick={() => {
                    setSaveToast(null);
                    setIsBackupModalOpen(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-medium underline underline-offset-2 cursor-pointer"
                >
                  导出电脑备份文件 (.json)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Hidden File Input for JSON restore */}
      <input
        type="file"
        ref={jsonFileInputRef}
        accept=".json"
        onChange={handleJSONFileSelected}
        className="hidden"
      />

      {/* 身份确认弹窗：输入正确姓名才可以进入台账，输入错误无法进入 */}
      {!isAuthenticated && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-2xs">
              <ShieldCheck className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              教学跟踪妮士 · 身份确认
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 mb-5 leading-relaxed">
              重要教学教务管理台账，请输入教师姓名以进入系统
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  教师姓名验证 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={authInputName}
                  onChange={e => {
                    setAuthInputName(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder="请输入教师姓名"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-slate-800 placeholder:text-slate-400"
                />
                {authError && (
                  <div className="p-2.5 mt-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium flex items-center gap-1.5 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{authError}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
              >
                确认进入台账
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 导出成功与存储路径提示弹窗 (JSON & Excel) */}
      {exportNoticeModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  exportNoticeModal.type === 'excel'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-blue-50 text-blue-600 border border-blue-200'
                }`}
              >
                {exportNoticeModal.type === 'excel' ? (
                  <FileSpreadsheet className="w-6 h-6" />
                ) : (
                  <FileDown className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-slate-900">
                  {exportNoticeModal.title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  已生成并下载文件: <span className="font-bold text-slate-800">{exportNoticeModal.fileName}</span>
                </p>
              </div>
              <button
                onClick={() => setExportNoticeModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 leading-relaxed font-medium">
              {exportNoticeModal.message}
            </div>

            {exportNoticeModal.pathHint && (
              <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">建议保存位置：</div>
                  <div className="text-xs font-mono font-bold text-slate-800 truncate select-all mt-0.5">
                    {exportNoticeModal.pathHint}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (exportNoticeModal.pathHint) {
                      navigator.clipboard.writeText(exportNoticeModal.pathHint);
                      setCopiedPath(true);
                      setTimeout(() => setCopiedPath(false), 2000);
                    }
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg shadow-2xs transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  {copiedPath ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">已复制路径</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>复制保存路径</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setExportNoticeModal(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导入JSON覆盖确认弹窗 */}
      {importConfirmModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0 bg-rose-50 text-rose-600 border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-900">
                  导入JSON恢复数据确认
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">
                  准备导入文件: {importConfirmModal.fileName || 'backup.json'}
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-rose-50/80 border border-rose-200 text-sm font-bold text-rose-900 leading-relaxed text-center">
              导入会覆盖当前所有数据，确定继续吗？
            </div>

            <p className="text-[11px] text-slate-400 mt-2 text-center">
              确认后将用选中的备份文件覆盖当前全部班级、学生考勤与成绩，并同步保存到浏览器。
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setImportConfirmModal(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmImportJSON}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                确定覆盖恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
