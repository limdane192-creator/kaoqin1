/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClassRoom, Student, Assignment, TeacherJournalEntry, Semester } from '../types';
import { initialClasses, initialStudents, initialAssignments, initialSemesters, defaultSessionModes } from '../data/initialData';

const STORAGE_KEYS = {
  SEMESTERS: 'tea_semesters_v6',
  SELECTED_SEMESTER: 'tea_selected_semester_v6',
  CLASSES: 'tea_classes_v6',
  STUDENTS: 'tea_students_v6',
  ASSIGNMENTS: 'tea_assignments_v6',
  SELECTED_CLASS: 'tea_selected_class_v6',
  JOURNAL: 'tea_journal_v2'
};

const initialJournalEntries: TeacherJournalEntry[] = [
  {
    id: 'j_1',
    date: '2026-09-18',
    title: '生词跟读与心理辅导',
    category: 'student',
    classId: 'c_mw89',
    studentNames: ['Sok Niza 苏妮莎', 'Puthy Panhavan 李胜利'],
    content: '今天发现苏妮莎同学发音时声音很小，害怕读错被同学笑。李胜利前两节课缺席，今天跟不上第三课的新句型。课间单独找他们俩温故了拼音和声调，苏妮莎能读准但缺少自信，后面要多给她正面表扬。',
    actionPlan: '下节课提问苏妮莎基础词汇建立信心；李胜利课后补交生词抄写。',
    createdAt: Date.now() - 86400000 * 20
  },
  {
    id: 'j_2',
    date: '2026-09-23',
    title: '教学反思·“把字句”讲授抽象导致造句误导',
    category: 'reflection',
    classId: 'c_mw89',
    studentNames: [],
    content: '批改今天的作业时发现有4位学生写出了“我把作业没有做完”这种错误句子。反思课堂上我在讲解“把”字句否定词位置时只口头带过，没有板书对比“没/不”必须放在“把”字前面的例句，误导了学生。教学必须注意语法负迁移。',
    actionPlan: '明天下课前专门花10分钟在黑板上做否定词位置对比板书练习。',
    createdAt: Date.now() - 86400000 * 15
  },
  {
    id: 'j_3',
    date: '2026-10-06',
    title: '期中复习节奏与口语互动调整',
    category: 'curriculum',
    classId: 'c_mw1011',
    studentNames: ['Chum Fong 吴贵方'],
    content: 'MW10-11班整体进度稍慢两课时，期中考试即将到来，今天讲练结合节奏偏快，吴贵方等同学略显吃力。口语测试准备阶段需要多安排二人结对对话练习，避免老师一言堂。',
    actionPlan: '制作期中高频词汇卡片供结对抽背。',
    createdAt: Date.now() - 86400000 * 8
  }
];

export function loadSemesters(): Semester[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SEMESTERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return initialSemesters;
}

export function saveSemesters(semesters: Semester[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SEMESTERS, JSON.stringify(semesters));
  } catch {}
}

export function loadSelectedSemesterId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_SEMESTER);
    if (saved) return saved;
  } catch {}
  return initialSemesters[0]?.id || 'sem_48';
}

export function saveSelectedSemesterId(semesterId: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_SEMESTER, semesterId);
  } catch {}
}

export function loadClasses(): ClassRoom[] {
  try {
    // Try v6 first, fallback to v5
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES) || localStorage.getItem('tea_classes_v5');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure migration: every class has semesterId and sessionModes
        return parsed.map((cls: ClassRoom) => ({
          ...cls,
          semesterId: cls.semesterId || 'sem_48',
          semester: cls.semester || (cls.semesterId === 'sem_49' ? '49学期' : '48学期'),
          sessionModes: cls.sessionModes || defaultSessionModes
        }));
      }
    }
  } catch {}
  return initialClasses;
}

export function saveClasses(classes: ClassRoom[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  } catch {}
}

export function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return initialStudents;
}

export function saveStudents(students: Student[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch {}
}

export function loadAssignments(): Assignment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return initialAssignments;
}

export function saveAssignments(assignments: Assignment[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  } catch {}
}

export function loadJournalEntries(): TeacherJournalEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return initialJournalEntries;
}

export function saveJournalEntries(entries: TeacherJournalEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(entries));
  } catch {}
}

export function loadSelectedClassId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_CLASS);
    if (saved) return saved;
  } catch {}
  return initialClasses[0]?.id || 'c_mw89';
}

export function saveSelectedClassId(classId: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CLASS, classId);
  } catch {}
}

export function resetToSampleData() {
  localStorage.removeItem(STORAGE_KEYS.SEMESTERS);
  localStorage.removeItem(STORAGE_KEYS.SELECTED_SEMESTER);
  localStorage.removeItem(STORAGE_KEYS.CLASSES);
  localStorage.removeItem(STORAGE_KEYS.STUDENTS);
  localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
  localStorage.removeItem(STORAGE_KEYS.SELECTED_CLASS);
  localStorage.removeItem(STORAGE_KEYS.JOURNAL);
  return {
    semesters: initialSemesters,
    classes: initialClasses,
    students: initialStudents,
    assignments: initialAssignments,
    journal: initialJournalEntries
  };
}

export function exportBackupJSON(
  classes: ClassRoom[],
  students: Student[],
  assignments: Assignment[],
  journal?: TeacherJournalEntry[],
  semesters?: Semester[]
): string {
  return JSON.stringify(
    { version: '4.0', exportDate: new Date().toISOString(), semesters: semesters || initialSemesters, classes, students, assignments, journal },
    null,
    2
  );
}

export function importBackupJSON(jsonStr: string) {
  try {
    const data = JSON.parse(jsonStr);
    if (data.classes && Array.isArray(data.classes) && data.students && Array.isArray(data.students)) {
      if (data.semesters && Array.isArray(data.semesters)) {
        saveSemesters(data.semesters);
      }
      saveClasses(data.classes);
      saveStudents(data.students);
      saveAssignments(data.assignments || []);
      if (data.journal && Array.isArray(data.journal)) {
        saveJournalEntries(data.journal);
      }
      return {
        semesters: data.semesters || initialSemesters,
        classes: data.classes,
        students: data.students,
        assignments: data.assignments || [],
        journal: data.journal || []
      };
    }
  } catch (e) {
    console.error('Import failed', e);
  }
  return null;
}
