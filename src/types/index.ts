/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AttendanceStatus = '1' | 'L' | 'P' | 'A' | '-' | '';
// '1': 正常出勤 (Present) - 0扣分
// 'L': 迟到 (Late) - 每满3次扣0.5分
// 'P': 请假 (Leave/Excused) - 每次扣0.25分
// 'A': 旷课 (Absent/Unexcused) - 每次扣0.5分
// '-': 换班生/免修/停课 - 0扣分
// '': 暂无记录/半学期报名插班 - 0扣分

export interface BehaviorNote {
  id: string;
  date: string;
  content: string;
  type: 'positive' | 'concern' | 'neutral'; // 积极表现 / 需关注 / 日常纪要
}

export interface StudentScores {
  // 学校官方打分标准 (考勤10% + 作业10% + Quiz 20% + 期中20% + 口语10% + 期末30% = 100%)
  // 1. 考勤 10% (满分10分，请假每次-0.25，旷课每次-0.5，每3次迟到-0.5，空和-不扣分)
  attDays?: number; // 实际正常出勤天数
  attTarget?: number; // 满学期天数 (30天 或 20天)
  attWeighted?: number; // 考勤得分/折算分 (占10%, 满分10分)
  attDeductions?: {
    leaveCount: number;
    absentCount: number;
    lateCount: number;
    totalDeductions: number;
  };

  // 2. 作业 10% (15-20次不定，根据完成次数/目标次数自动折算或手动微调)
  hwCount?: number; // 作业完成次数 (15-20次不定)
  hwTarget?: number; // 计划作业总次数 (默认20，支持15-20次之间自由设置)
  hwWeighted?: number; // 作业折算分 (占10%, 满分10分)

  // 3. 小测试 Quiz (两次共20%)
  quiz1?: number; // Quiz 1 小测试1 (满分100分)
  quiz1Weighted?: number; // Q1折算 (占10%, quiz1 * 0.1)

  quiz2?: number; // Quiz 2 小测试2 (满分100分)
  quiz2Weighted?: number; // Q2折算 (占10%, quiz2 * 0.1)

  quizTotal?: number; // 小测试总折算 (占20%, Q1 + Q2)

  // 4. 期中考试 Mid (20%)
  midterm?: number; // Mid 期中考试 (满分100分)
  midtermWeighted?: number; // 期中折算 (占20%, midterm * 0.2)

  // 5. 口语考试 Sp (10%)
  oral?: number; // 口语考试 (满分100分)
  oralWeighted?: number; // 口语折算 (占10%, oral * 0.1)

  // 6. 期末考试 Final (30%)
  finalExam?: number; // Final 期末考试 (满分100分)
  finalExamWeighted?: number; // 期末折算 (占30%, finalExam * 0.3)

  // 7. 学期综合总评分 (满分100%, 自动累加上述各分项折算分，支持教师直接修改)
  manualTotal?: number;

  daily?: number;
  homework?: number;
}

export interface StudentEvaluation {
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | '优秀' | '良好' | '合格' | '待提高' | '';
  remarks: string; // 期末综合评语 (支持教师手写与 AI 一键生成)
  tags: string[]; // 特征标签，如 ['全勤标兵', '发音标准', '作业工整', '需跟进作业']
  behaviorNotes: BehaviorNote[]; // 课堂具体表现记录
  aiGeneratedAt?: string; // AI生成时间
}

export interface Student {
  id: string;
  classId: string;
  no: number; // 学号 / 序号
  name: string; // 学生姓名 (中文/外文)
  phone?: string;
  gender?: '男' | '女';
  attendance: Record<number, AttendanceStatus>; // 对应第几天 (1..30)
  attendanceNotes: Record<number, string>; // 对应第几天的请假理由或旷课情况
  scores: StudentScores;
  evaluation: StudentEvaluation;
}

export type SubmissionStatus = 'submitted' | 'missing' | 'late' | 'excused';

export interface StudentSubmission {
  status: SubmissionStatus;
  submittedDate?: string; // 哪一天交给我了，例如 "08/28" 或 "2026-09-02"
  score?: number; // 作业得分 (0-100)
  feedback?: string; // 教师批语
}

export interface AssignmentAttachment {
  id: string;
  name: string;
  dataUrl: string; // Base64 data URL for offline storage
  type: 'image' | 'file';
  size?: string;
}

export interface Assignment {
  id: string;
  classId: string;
  title: string; // 作业标题，例如 "抄写第三课生词3遍"
  content: string; // 作业具体内容与要求
  assignedDate: string; // 布置日期，例如 "2026-08-25"
  dueDate: string; // 截止日期，例如 "2026-08-28"
  maxScore: number;
  submissions: Record<string, StudentSubmission>; // studentId -> StudentSubmission
  attachments?: AssignmentAttachment[]; // 布置作业时上传的照片或课件文件
}

export type SessionMode = 'offline' | 'online'; // 线下上课 | 线上上课

export interface Semester {
  id: string; // e.g. "sem_48", "sem_49"
  name: string; // e.g. "48学期", "49学期"
  startDate?: string;
  endDate?: string;
  createdAt?: number;
}

export interface ClassRoom {
  id: string;
  name: string; // 班级名称，如 "MW8-9", "MW10-11", "TF5-7", "TF7-8", "周末上午一班"
  code: string; // 班级代码
  schedule: string; // 上课时间安排，如 "周一/周三 08:00 - 09:30"
  classScheduleType?: 'mw_30' | 'tf_20' | 'other'; // 周一到周三班(30天/10周) | 周四周五班(20天/10周) | 其他
  room: string; // 教室
  semesterId: string; // 归属学期ID，例如 "sem_48", "sem_49"
  semester: string; // 学期名称，如 "48学期" 或 "2026年秋季学期"
  totalSessions: number; // 满学期天数/课时总数，如 30 或 20
  totalHwTarget?: number; // 本学期作业计划总次数 (15-20次之间自由设定，默认20次)
  sessionDates: Record<number, string>; // 第几天对应的公历日期，如 {1: "08/24", 2: "08/25"}
  sessionModes?: Record<number, SessionMode>; // 第几天上课形式：'offline' 线下 | 'online' 线上
  colorTheme?: string;
}

export interface MissingHomeworkRecord {
  studentId: string;
  studentNo: number;
  studentName: string;
  assignmentId: string;
  assignmentTitle: string;
  assignedDate: string;
  dueDate: string;
  status: SubmissionStatus;
}

// 教师教学工作记录 / 反思手记
export type JournalCategory = 'reflection' | 'student' | 'curriculum' | 'highlight' | 'general';

export interface TeacherJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  category: JournalCategory; // 教学反思·误导检视 / 学情关注·学习困难 / 备课进度·教案微调 / 教学亮点 / 日常随笔
  content: string; // 记录正文
  classId?: string; // 关联班级 (可空代表通用)
  studentNames?: string[]; // 涉及的学生姓名
  actionPlan?: string; // 改进措施 / 下节课跟进
  createdAt: number;
}
