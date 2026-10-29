/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ClassRoom, Student, Assignment, Semester } from '../types';

export const initialSemesters: Semester[] = [
  { id: 'sem_48', name: '48学期' },
  { id: 'sem_49', name: '49学期' }
];

export const defaultSessionDates: Record<number, string> = {
  1: '08/24', 2: '08/25', 3: '08/26', 4: '08/31', 5: '09/01',
  6: '09/02', 7: '09/07', 8: '09/08', 9: '09/09', 10: '09/14',
  11: '09/15', 12: '09/16', 13: '09/21', 14: '09/22', 15: '09/23',
  16: '09/28', 17: '09/29', 18: '09/30', 19: '10/05', 20: '10/06',
  21: '10/07', 22: '10/12', 23: '10/13', 24: '10/14', 25: '10/19',
  26: '10/20', 27: '10/21', 28: '10/26', 29: '10/27', 30: '10/28'
};

export const defaultSessionModes: Record<number, 'offline' | 'online'> = {
  1: 'offline', 2: 'offline', 3: 'offline', 4: 'offline', 5: 'online',
  6: 'offline', 7: 'offline', 8: 'offline', 9: 'offline', 10: 'online',
  11: 'offline', 12: 'offline', 13: 'offline', 14: 'offline', 15: 'offline',
  16: 'offline', 17: 'offline', 18: 'offline', 19: 'offline', 20: 'online',
  21: 'offline', 22: 'offline', 23: 'offline', 24: 'offline', 25: 'offline',
  26: 'offline', 27: 'offline', 28: 'offline', 29: 'offline', 30: 'offline'
};

export const initialClasses: ClassRoom[] = [
  {
    id: 'c_mw89',
    name: 'MW8-9',
    code: 'CHN-101',
    schedule: '周一/周三 08:00 - 09:30',
    room: '文心楼 A-201',
    semesterId: 'sem_48',
    semester: '48学期',
    totalSessions: 30,
    sessionDates: defaultSessionDates,
    sessionModes: defaultSessionModes,
    colorTheme: 'blue'
  },
  {
    id: 'c_mw1011',
    name: 'MW10-11',
    code: 'CHN-102',
    schedule: '周一/周三 10:00 - 11:30',
    room: '文心楼 A-203',
    semesterId: 'sem_48',
    semester: '48学期',
    totalSessions: 30,
    sessionDates: defaultSessionDates,
    sessionModes: defaultSessionModes,
    colorTheme: 'emerald'
  },
  {
    id: 'c_tf57',
    name: 'TF5-7',
    code: 'CHN-201',
    schedule: '周二/周五 17:00 - 19:00',
    room: '明德楼 B-105',
    semesterId: 'sem_48',
    semester: '48学期',
    totalSessions: 21,
    sessionDates: defaultSessionDates,
    sessionModes: defaultSessionModes,
    colorTheme: 'violet'
  },
  {
    id: 'c_tf78',
    name: 'TF7-8',
    code: 'CHN-202',
    schedule: '周二/周五 19:15 - 20:45',
    room: '明德楼 B-107',
    semesterId: 'sem_48',
    semester: '48学期',
    totalSessions: 24,
    sessionDates: defaultSessionDates,
    sessionModes: defaultSessionModes,
    colorTheme: 'amber'
  },
  {
    id: 'c_sat_am',
    name: '周六上午一班',
    code: 'CHN-SAT-1',
    schedule: '周六 08:30 - 11:30',
    room: '博学楼 C-301',
    semesterId: 'sem_48',
    semester: '48学期',
    totalSessions: 16,
    sessionDates: defaultSessionDates,
    sessionModes: defaultSessionModes,
    colorTheme: 'indigo'
  },
  {
    id: 'c_sat_pm',
    name: '周六下午二班',
    code: 'CHN-SAT-2',
    schedule: '周六 14:00 - 17:00',
    room: '博学楼 C-302',
    semesterId: 'sem_49',
    semester: '49学期',
    totalSessions: 16,
    sessionDates: defaultSessionDates,
    sessionModes: defaultSessionModes,
    colorTheme: 'rose'
  },
  {
    id: 'c_sun_am',
    name: '周日上午班',
    code: 'CHN-SUN-1',
    schedule: '周日 08:30 - 11:30',
    room: '博学楼 C-304',
    semesterId: 'sem_49',
    semester: '49学期',
    totalSessions: 16,
    sessionDates: defaultSessionDates,
    sessionModes: defaultSessionModes,
    colorTheme: 'teal'
  },
  {
    id: 'c_thu_eve',
    name: '周四晚间提高班',
    code: 'CHN-THU-E',
    schedule: '周四 18:30 - 20:30',
    room: '文心楼 A-102',
    semesterId: 'sem_49',
    semester: '49学期',
    totalSessions: 18,
    sessionDates: defaultSessionDates,
    sessionModes: defaultSessionModes,
    colorTheme: 'cyan'
  }
];

export const initialStudents: Student[] = [
  // MW8-9 学生
  {
    id: 's_mw89_1',
    classId: 'c_mw89',
    no: 1,
    name: 'Sok Niza 苏妮莎',
    gender: '女',
    attendance: { 11: 'A', 12: '1', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: 'P', 20: '1', 21: '1', 22: 'A', 23: 'P', 24: '1', 25: '1', 28: '1', 29: '1' },
    attendanceNotes: { 11: '9.15 旷课未请假', 19: '10.05 事假：家中有事', 23: '10.13 事假：办理证件' },
    scores: { hwCount: 2, hwWeighted: 1.0, quiz1: undefined, quiz1Weighted: 0, quiz2: 99, quiz2Weighted: 9.9, quizTotal: 9.9, midterm: 70.5, midtermWeighted: 14.10, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 25.0 },
    evaluation: {
      grade: '良好',
      remarks: '上课态度较为端正，发音标准，但部分作业存在拖延现象，建议加强课后复习。',
      tags: ['发音良好', '偶尔拖延', '需跟进作业'],
      behaviorNotes: [
        { id: 'b_1', date: '2026-09-02', content: '朗读第二课课文声音洪亮清晰，语音语调很标准。', type: 'positive' },
        { id: 'b_2', date: '2026-09-22', content: '上课专注度有所提升，主动回答了一道语法问题。', type: 'positive' }
      ]
    }
  },
  {
    id: 's_mw89_2',
    classId: 'c_mw89',
    no: 2,
    name: 'Chhin Khema 陈该玛',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: '1', 20: '1', 21: '1', 22: '1', 23: '1', 24: '1', 25: '1', 28: '1', 29: '1' },
    attendanceNotes: {},
    scores: { hwCount: 19, hwWeighted: 9.5, quiz1: 87, quiz1Weighted: 8.7, quiz2: 86.5, quiz2Weighted: 8.65, quizTotal: 17.35, midterm: 70.5, midtermWeighted: 14.10, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 40.95 },
    evaluation: {
      grade: '优秀',
      remarks: '全勤标兵，学习主动自觉，作业工整规范，课堂互动极其积极，是全班的表率。',
      tags: ['全勤标兵', '作业规范', '优秀学生'],
      behaviorNotes: [
        { id: 'b_3', date: '2026-08-25', content: '主动帮助同桌纠正汉字笔顺，有互助精神。', type: 'positive' },
        { id: 'b_4', date: '2026-09-14', content: '生词听写满分，书写非常工整。', type: 'positive' }
      ]
    }
  },
  {
    id: 's_mw89_3',
    classId: 'c_mw89',
    no: 3,
    name: 'Leng Socheanich 龙晴儿',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: '1', 20: '1', 21: '1', 22: '1', 23: 'P', 24: '1', 25: '1', 28: '1', 29: '1' },
    attendanceNotes: { 23: '10.13 病假：感冒就医' },
    scores: { hwCount: 19, hwWeighted: 9.5, quiz1: 100, quiz1Weighted: 10.0, quiz2: 98, quiz2Weighted: 9.8, quizTotal: 19.8, midterm: 85.0, midtermWeighted: 17.00, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 46.30 },
    evaluation: {
      grade: '优秀',
      remarks: '出勤情况良好，课堂参与度高，作业按时完成，听力理解能力较强。',
      tags: ['参与度高', '听力优秀', '自律'],
      behaviorNotes: [
        { id: 'b_5', date: '2026-09-09', content: '课堂分组角色扮演表现出色，汉语表达流畅自然。', type: 'positive' }
      ]
    }
  },
  {
    id: 's_mw89_4',
    classId: 'c_mw89',
    no: 4,
    name: 'Neang Vanda 诚樱',
    gender: '女',
    attendance: { 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: 'P', 8: 'P', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 16: 'P', 17: '1', 18: '1', 19: 'P', 20: '1', 21: '1', 22: '1', 23: 'P', 24: 'A', 25: 'A', 28: 'A', 29: 'A' },
    attendanceNotes: { 7: '9.07 身体不适请假', 8: '9.08 生病', 16: '9.28 事假回乡', 19: '10.05 交通耽搁请假', 24: '10.14 未到校缺勤' },
    scores: { hwCount: 11, hwWeighted: 5.5, quiz1: 97, quiz1Weighted: 9.7, quiz2: 0, quiz2Weighted: 0, quizTotal: 9.7, midterm: 79.0, midtermWeighted: 15.80, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 31.00 },
    evaluation: {
      grade: '合格',
      remarks: '后半学期请假和缺勤偏多，影响了教学连贯性。期末建议主动补上缺漏课业。',
      tags: ['请假较多', '需重点关照', '课后补习'],
      behaviorNotes: [
        { id: 'b_6', date: '2026-09-28', content: '多次缺交生词作业，找学生谈话后表示会补交。', type: 'concern' }
      ]
    }
  },
  {
    id: 's_mw89_5',
    classId: 'c_mw89',
    no: 5,
    name: 'Pal Ratha 潘柔君',
    gender: '女',
    attendance: { 3: 'A', 4: 'A', 5: '1', 6: '1', 7: 'A', 8: '1', 9: '1', 10: '1', 11: '1', 12: 'P', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: 'P', 20: 'A', 21: '1', 22: 'A', 23: 'P', 24: 'A', 25: 'P', 28: '1', 29: '1' },
    attendanceNotes: { 12: '9.16 家中急事', 19: '10.05 事假' },
    scores: { hwCount: 11, hwWeighted: 5.5, quiz1: 86, quiz1Weighted: 8.6, quiz2: 94, quiz2Weighted: 9.4, quizTotal: 18.0, midterm: 79.5, midtermWeighted: 15.90, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 39.40 },
    evaluation: {
      grade: '良好',
      remarks: '头脑灵活，课堂接受新知识快，但偶尔旷课，希望新学期保证出勤率。',
      tags: ['悟性高', '需提升出勤'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw89_6',
    classId: 'c_mw89',
    no: 6,
    name: 'Peung Pimenrachehny 方丽凤',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: 'P', 8: '1', 9: '1', 10: '1', 11: '1', 12: 'P', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: '1', 20: '1', 21: '1', 22: '1', 23: 'P', 24: 'P', 25: 'A' },
    attendanceNotes: { 7: '9.07 兼职忙', 12: '9.16 兼职忙' },
    scores: { hwCount: 11, hwWeighted: 5.5, quiz1: 96, quiz1Weighted: 9.6, quiz2: 0, quiz2Weighted: 0, quizTotal: 9.6, midterm: 85.5, midtermWeighted: 17.10, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 32.20 },
    evaluation: {
      grade: '良好',
      remarks: '性格开朗，平时作业质量尚可，但在综合测验中需更加细心。',
      tags: ['性格开朗', '作业良好'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw89_7',
    classId: 'c_mw89',
    no: 7,
    name: 'Phun Sokpisey 彭碧玉',
    gender: '女',
    attendance: { 2: 'A', 3: 'A', 4: 'A', 5: '1', 6: 'L', 7: 'A', 8: 'A', 9: 'A', 10: 'A', 11: 'A', 12: 'A', 13: 'A', 14: 'A', 16: 'A', 17: 'A', 18: 'A', 19: 'A', 20: 'A', 21: 'A', 22: 'A', 23: 'A', 24: 'A', 25: 'A', 28: 'A', 29: 'A' },
    attendanceNotes: { 6: '9.02 迟到20分钟', 7: '长期未到校' },
    scores: { hwCount: 4, hwWeighted: 2.0, quiz1: 0, quiz1Weighted: 0, quiz2: 0, quiz2Weighted: 0, quizTotal: 0, midterm: 0, midtermWeighted: 0, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 2.00 },
    evaluation: {
      grade: '待提高',
      remarks: '本学期旷课过多，出勤率严重不足，需联系家长了解情况并跟进复读或补考。',
      tags: ['严重缺勤', '预警学生', '需联系家长'],
      behaviorNotes: [
        { id: 'b_7', date: '2026-09-14', content: '连续旷课两周，已电话联系其本人未接听。', type: 'concern' }
      ]
    }
  },
  {
    id: 's_mw89_8',
    classId: 'c_mw89',
    no: 8,
    name: 'Puthy Panhavan 李胜利',
    gender: '男',
    attendance: { 10: '1', 11: '1', 12: '1', 13: 'P', 14: 'L', 16: '1', 17: '1', 18: 'A', 19: 'P', 20: '1', 21: 'A', 22: 'A', 23: 'A', 24: 'A', 25: '1', 28: 'A', 29: 'A' },
    attendanceNotes: { 13: '9.21 病假就医', 14: '9.22 堵车迟到' },
    scores: { hwCount: 2, hwWeighted: 1.0, quiz1: 0, quiz1Weighted: 0, quiz2: 0, quiz2Weighted: 0, quizTotal: 0, midterm: 85.0, midtermWeighted: 17.00, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 18.00 },
    evaluation: {
      grade: '合格',
      remarks: '中途插班加入，学习基础尚可，但后半期出勤有所松懈，缺交了第3课生词作业。',
      tags: ['插班生', '缺交作业', '需督促'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw89_9',
    classId: 'c_mw89',
    no: 9,
    name: 'Roath Erik 幸英利',
    gender: '男',
    attendance: { 5: '1', 6: '1', 7: '1', 8: 'A', 9: '1', 10: 'A', 11: 'A', 12: 'A', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 22: 'A' },
    attendanceNotes: { 8: '9.08 旷课未假' },
    scores: { hwCount: 3, hwWeighted: 1.5, quiz1: 79, quiz1Weighted: 7.9, quiz2: 0, quiz2Weighted: 0, quizTotal: 7.9, midterm: 60.5, midtermWeighted: 12.10, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 21.50 },
    evaluation: {
      grade: '良好',
      remarks: '听写表现优秀，汉语拼音掌握扎实，如能保持全勤，成绩将有更大突破。',
      tags: ['拼音扎实', '听写优秀'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw89_10',
    classId: 'c_mw89',
    no: 10,
    name: 'Seang Sokdanita 林诗怡',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: '1', 20: '1', 21: '1', 22: '1', 23: '1', 24: '1', 25: '1', 28: '1', 29: '1' },
    attendanceNotes: {},
    scores: { hwCount: 16, hwWeighted: 8.0, quiz1: 100, quiz1Weighted: 10.0, quiz2: 97.5, quiz2Weighted: 9.75, quizTotal: 19.75, midterm: 79.5, midtermWeighted: 15.90, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 43.65 },
    evaluation: {
      grade: '优秀',
      remarks: '全勤优秀生，书写极为工整规范，平时热心帮助同班同学，综合素质全面。',
      tags: ['全勤标兵', '书写极佳', '热心助人'],
      behaviorNotes: [
        { id: 'b_8', date: '2026-09-16', content: '期中模拟测验获得全班最高分99分。', type: 'positive' }
      ]
    }
  },
  {
    id: 's_mw89_11',
    classId: 'c_mw89',
    no: 11,
    name: 'Toek Sokheng 大明明',
    gender: '男',
    attendance: { 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: '1', 20: '1', 21: '1', 22: 'P', 23: '1', 24: '1', 25: '1', 28: '1', 29: '1' },
    attendanceNotes: { 22: '10.12 事假兼职' },
    scores: { hwCount: 8, hwWeighted: 4.0, quiz1: 0, quiz1Weighted: 0, quiz2: 94, quiz2Weighted: 9.4, quizTotal: 9.4, midterm: 70.5, midtermWeighted: 14.10, oral: 0, oralWeighted: 0, finalExam: 0, finalExamWeighted: 0, manualTotal: 27.50 },
    evaluation: {
      grade: '良好',
      remarks: '出勤稳定，积极回答问题，作业完成速度快，期末表现令人满意。',
      tags: ['出勤稳定', '回答积极'],
      behaviorNotes: []
    }
  },

  // MW10-11 学生
  {
    id: 's_mw1011_1',
    classId: 'c_mw1011',
    no: 1,
    name: 'Chum Fong 吴贵方',
    gender: '男',
    attendance: { 10: 'A', 11: '1', 12: 'A', 13: 'A', 14: '1', 16: 'A', 17: '1', 18: '1', 19: 'A', 20: '1', 21: 'A', 22: 'A', 23: '1', 24: 'A', 25: 'A', 28: 'A', 29: '1' },
    attendanceNotes: { 10: '8.31 事假：家里有事' },
    scores: { daily: 65, homework: 60, midterm: 68, finalExam: 65, manualTotal: 65 },
    evaluation: {
      grade: '合格',
      remarks: '出勤不稳定，缺交多次作业，需加强自我约束与督促。',
      tags: ['缺交频繁', '需多关注'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw1011_2',
    classId: 'c_mw1011',
    no: 2,
    name: 'Each Kimsreypich 庄金萱',
    gender: '女',
    attendance: { 7: '1', 8: '1', 9: '1', 10: 'P', 11: '1', 12: '1', 13: '1', 14: '1', 16: '1', 17: 'L', 18: '1', 19: '1', 20: '1', 21: '1', 22: '1', 23: '1', 24: '1', 25: '1', 28: '1', 29: '1' },
    attendanceNotes: { 10: '9.14 生病请假', 17: '9.29 迟到10分钟' },
    scores: { daily: 93, homework: 95, midterm: 92, finalExam: 94, manualTotal: 94 },
    evaluation: {
      grade: '优秀',
      remarks: '出勤优异，听写优秀，学习认真专注，期末总评优良。',
      tags: ['优秀学生', '听写出色'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw1011_3',
    classId: 'c_mw1011',
    no: 3,
    name: 'Ke nesay 王丽仙',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: 'P', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: 'A', 14: 'A', 16: 'A', 17: 'A', 18: 'A', 19: 'A', 20: 'A', 21: 'A', 22: 'A', 23: 'A', 24: 'A', 25: 'A', 28: 'A', 29: 'A' },
    attendanceNotes: { 4: '8.31 生病请假' },
    scores: { daily: 50, homework: 55, midterm: 50, finalExam: 52, manualTotal: 52 },
    evaluation: {
      grade: '待提高',
      remarks: '前半学期表现积极，后半程未到校，需要重点跟进其学业状态。',
      tags: ['中途脱落', '需关照'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw1011_4',
    classId: 'c_mw1011',
    no: 4,
    name: 'Peng Sereivattanac 张天龙',
    gender: '男',
    attendance: { 1: '1', 2: 'P', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: '1', 20: '1', 21: '1', 22: 'A', 23: 'A', 24: '1', 25: '1', 28: '1', 29: '1' },
    attendanceNotes: { 2: '8.25 生病请假' },
    scores: { daily: 86, homework: 84, midterm: 88, finalExam: 87, manualTotal: 86 },
    evaluation: {
      grade: '良好',
      remarks: '思维敏捷，课堂互动频繁，建议作业提交更加及时。',
      tags: ['活跃', '表达力好'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw1011_5',
    classId: 'c_mw1011',
    no: 5,
    name: 'Son Ranika 孙丽娜',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: '1', 20: 'P', 21: 'P', 22: '1', 23: 'P', 24: '1', 25: 'A', 28: '1', 29: '1' },
    attendanceNotes: {},
    scores: { daily: 89, homework: 91, midterm: 90, finalExam: 92, manualTotal: 91 },
    evaluation: {
      grade: '良好',
      remarks: '学习态度认真，各门功课均衡，考勤总体稳定。',
      tags: ['认真踏实'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw1011_6',
    classId: 'c_mw1011',
    no: 6,
    name: 'Sreng Samnag Neath 孙运凝',
    gender: '女',
    attendance: { 1: 'A', 2: '1', 3: '1', 4: 'P', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 16: '1', 17: '1', 18: 'P', 19: 'P', 20: '1', 21: '1', 22: '1', 23: 'P', 24: '1', 25: '1', 28: 'P', 29: 'A' },
    attendanceNotes: { 4: '9.03 学校活动请假' },
    scores: { daily: 85, homework: 88, midterm: 86, finalExam: 87, manualTotal: 86 },
    evaluation: {
      grade: '良好',
      remarks: '课堂表现积极，因校内社团活动请假偶有发生，但课后补交作业很自觉。',
      tags: ['活动骨干', '自觉补交'],
      behaviorNotes: []
    }
  },
  {
    id: 's_mw1011_7',
    classId: 'c_mw1011',
    no: 7,
    name: 'Tab Sophat 苏柏豪',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 16: '1', 17: '1', 18: '1', 19: '1', 20: '1', 21: '1', 22: '1', 23: 'A', 24: '1', 25: '1', 28: '1', 29: '1' },
    attendanceNotes: {},
    scores: { daily: 95, homework: 94, midterm: 96, finalExam: 97, manualTotal: 96 },
    evaluation: {
      grade: '优秀',
      remarks: '出勤极佳，仅旷课一次，课堂思维严谨，期末评语优秀。',
      tags: ['学霸', '严谨认真'],
      behaviorNotes: []
    }
  },

  // TF5-7 学生
  {
    id: 's_tf57_1',
    classId: 'c_tf57',
    no: 1,
    name: 'Heng Meymey',
    gender: '女',
    attendance: { 1: 'A', 2: 'A', 3: 'A', 4: 'A', 5: 'A', 6: 'A', 7: 'A', 8: 'A', 9: 'A', 10: 'A', 11: 'A', 12: 'A', 13: 'A', 14: 'A', 15: 'A', 16: 'A', 17: 'A', 18: 'A' },
    attendanceNotes: { 1: '长期未来上课' },
    scores: { daily: 40, homework: 50, midterm: 45, finalExam: 42, manualTotal: 44 },
    evaluation: { grade: '待提高', remarks: '出勤率极低，需核实退课情况。', tags: ['待退课核实'], behaviorNotes: [] }
  },
  {
    id: 's_tf57_2',
    classId: 'c_tf57',
    no: 2,
    name: 'Heng Monyneath 莫妮丽',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: 'P', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: 'P', 14: '1', 15: '1', 16: '1', 17: '1', 18: '1' },
    attendanceNotes: { 7: '9.10 事假' },
    scores: { daily: 94, homework: 95, midterm: 93, finalExam: 96, manualTotal: 95 },
    evaluation: { grade: '优秀', remarks: '课堂领悟力极强，中柬双语互译流畅，深受老师赞赏。', tags: ['翻译好', '优秀'], behaviorNotes: [] }
  },
  {
    id: 's_tf57_3',
    classId: 'c_tf57',
    no: 3,
    name: 'Keo Makara 柯明轩',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 15: '1', 16: '1', 17: '1', 18: '1' },
    attendanceNotes: {},
    scores: { daily: 96, homework: 94, midterm: 97, finalExam: 98, manualTotal: 96 },
    evaluation: { grade: '优秀', remarks: '全勤学生，课堂回答富有创意，作业按时足量完成。', tags: ['全勤', '勤奋'], behaviorNotes: [] }
  },
  {
    id: 's_tf57_4',
    classId: 'c_tf57',
    no: 4,
    name: 'khorn Sovannet 孔金宁',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: 'P', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1', 13: '1', 14: '1', 15: '1', 16: '1', 17: '1', 18: '1' },
    attendanceNotes: { 5: '9.01 工作加班忙' },
    scores: { daily: 90, homework: 92, midterm: 89, finalExam: 91, manualTotal: 91 },
    evaluation: { grade: '良好', remarks: '出勤很好，平时表现积极，希望继续加强汉字书写。', tags: ['踏实'], behaviorNotes: [] }
  },
  {
    id: 's_tf57_5',
    classId: 'c_tf57',
    no: 5,
    name: 'Nou Khiengmey 努强美',
    gender: '女',
    attendance: { 1: 'P', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: 'P', 9: '1', 10: '1', 11: '1', 12: 'P', 13: '1', 14: '1', 15: '1', 16: '1', 17: '1', 18: '1' },
    attendanceNotes: { 1: '8.27 兼职忙', 8: '9.18 大雨交通受阻' },
    scores: { daily: 88, homework: 89, midterm: 87, finalExam: 90, manualTotal: 89 },
    evaluation: { grade: '良好', remarks: '积极参与朗读，表现稳步提升。', tags: ['朗读好'], behaviorNotes: [] }
  },
  {
    id: 's_tf57_6',
    classId: 'c_tf57',
    no: 6,
    name: 'Phon Lynin 彭丽宁',
    gender: '女',
    attendance: { 4: '1', 5: '1', 6: '1', 7: '1', 8: 'P', 9: '1', 10: '1', 11: '1', 12: 'P', 13: '1', 14: '1', 15: 'A', 16: 'P', 17: '1', 18: '1' },
    attendanceNotes: { 8: '9.18 身体不舒服' },
    scores: { daily: 82, homework: 85, midterm: 83, finalExam: 84, manualTotal: 84 },
    evaluation: { grade: '良好', remarks: '插班后跟进速度快，作业认真。', tags: ['进步快'], behaviorNotes: [] }
  },
  {
    id: 's_tf57_7',
    classId: 'c_tf57',
    no: 7,
    name: 'Sin kimsear 周金城',
    gender: '男',
    attendance: { 1: '1', 2: 'P', 3: '1', 4: '1', 5: 'L', 6: '1', 7: '1', 8: 'P', 9: '1', 10: 'P', 11: '1', 12: '1', 13: '1', 14: '1', 15: '1', 16: 'P', 17: '1' },
    attendanceNotes: { 2: '8.28 忙', 5: '9.01 迟到', 8: '9.18 下大雨' },
    scores: { daily: 85, homework: 86, midterm: 84, finalExam: 87, manualTotal: 86 },
    evaluation: { grade: '良好', remarks: '性格开朗随和，积极回答，期末评语良好。', tags: ['性格开朗'], behaviorNotes: [] }
  },

  // TF7-8 学生
  {
    id: 's_tf78_1',
    classId: 'c_tf78',
    no: 1,
    name: 'Chan Sophea 陈素菲',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1' },
    attendanceNotes: {},
    scores: { daily: 95, homework: 96, midterm: 94, finalExam: 95, manualTotal: 95 },
    evaluation: { grade: '优秀', remarks: '全勤学生，上课非常投入，听写几乎全对。', tags: ['全勤', '听写出色'], behaviorNotes: [] }
  },
  {
    id: 's_tf78_2',
    classId: 'c_tf78',
    no: 2,
    name: 'Lim Sovann 林金宝',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: 'P', 4: '1', 5: '1', 6: '1', 7: '1', 8: 'L', 9: '1', 10: '1', 11: '1', 12: '1' },
    attendanceNotes: { 3: '事假', 8: '加班迟到' },
    scores: { daily: 88, homework: 90, midterm: 87, finalExam: 89, manualTotal: 89 },
    evaluation: { grade: '良好', remarks: '口语表达流畅，课下善于总结。', tags: ['口语优秀'], behaviorNotes: [] }
  },
  {
    id: 's_tf78_3',
    classId: 'c_tf78',
    no: 3,
    name: 'Teng Visal 邓威萨',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: 'A', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1', 11: '1', 12: '1' },
    attendanceNotes: { 5: '旷课' },
    scores: { daily: 85, homework: 84, midterm: 86, finalExam: 88, manualTotal: 86 },
    evaluation: { grade: '良好', remarks: '课堂表现稳定，作业完成情况好。', tags: ['表现稳定'], behaviorNotes: [] }
  },

  // 周六上午一班 学生
  {
    id: 's_satam_1',
    classId: 'c_sat_am',
    no: 1,
    name: '陈伟伦',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1' },
    attendanceNotes: {},
    scores: { daily: 96, homework: 98, midterm: 95, finalExam: 97, manualTotal: 97 },
    evaluation: { grade: '优秀', remarks: '学习极为自觉，逻辑清晰，书写优美。', tags: ['模范生', '书写优美'], behaviorNotes: [] }
  },
  {
    id: 's_satam_2',
    classId: 'c_sat_am',
    no: 2,
    name: '黄美玲',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: 'P', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1', 9: '1', 10: '1' },
    attendanceNotes: { 3: '家中有事请假' },
    scores: { daily: 92, homework: 90, midterm: 93, finalExam: 94, manualTotal: 92 },
    evaluation: { grade: '优秀', remarks: '热心助人，积极参与班级对话演练。', tags: ['互动积极'], behaviorNotes: [] }
  },
  {
    id: 's_satam_3',
    classId: 'c_sat_am',
    no: 3,
    name: '林俊杰',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: 'L', 6: '1', 7: '1', 8: '1', 9: 'A', 10: '1' },
    attendanceNotes: { 5: '迟到15分钟', 9: '生病未请假' },
    scores: { daily: 84, homework: 80, midterm: 82, finalExam: 85, manualTotal: 83 },
    evaluation: { grade: '良好', remarks: '基础较好，但有时作业有拖拉，多加督促。', tags: ['偶有拖拉'], behaviorNotes: [] }
  },

  // 周六下午二班 学生
  {
    id: 's_satpm_1',
    classId: 'c_sat_pm',
    no: 1,
    name: '蔡明辉',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1' },
    attendanceNotes: {},
    scores: { daily: 94, homework: 92, midterm: 90, finalExam: 95, manualTotal: 93 },
    evaluation: { grade: '优秀', remarks: '下午课程全勤无迟到，精神面貌饱满。', tags: ['全勤'], behaviorNotes: [] }
  },
  {
    id: 's_satpm_2',
    classId: 'c_sat_pm',
    no: 2,
    name: '潘佩琪',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: 'P', 5: '1', 6: '1', 7: '1', 8: '1' },
    attendanceNotes: { 4: '病假' },
    scores: { daily: 90, homework: 94, midterm: 91, finalExam: 93, manualTotal: 92 },
    evaluation: { grade: '优秀', remarks: '作业工整，复习到位。', tags: ['作业认真'], behaviorNotes: [] }
  },

  // 周日上午班 学生
  {
    id: 's_sunam_1',
    classId: 'c_sun_am',
    no: 1,
    name: '孙皓轩',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1' },
    attendanceNotes: {},
    scores: { daily: 95, homework: 96, midterm: 94, finalExam: 95, manualTotal: 95 },
    evaluation: { grade: '优秀', remarks: '学习踏实，领会迅速，表达准确。', tags: ['优秀标兵'], behaviorNotes: [] }
  },
  {
    id: 's_sunam_2',
    classId: 'c_sun_am',
    no: 2,
    name: '赵晨曦',
    gender: '女',
    attendance: { 1: '1', 2: 'P', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1' },
    attendanceNotes: { 2: '事假' },
    scores: { daily: 91, homework: 92, midterm: 90, finalExam: 93, manualTotal: 92 },
    evaluation: { grade: '优秀', remarks: '书写规范，认真仔细。', tags: ['细致'], behaviorNotes: [] }
  },

  // 周四晚间提高班 学生
  {
    id: 's_thueve_1',
    classId: 'c_thu_eve',
    no: 1,
    name: '王子墨',
    gender: '男',
    attendance: { 1: '1', 2: '1', 3: '1', 4: '1', 5: '1', 6: '1', 7: '1', 8: '1' },
    attendanceNotes: {},
    scores: { daily: 97, homework: 98, midterm: 96, finalExam: 98, manualTotal: 97 },
    evaluation: { grade: '优秀', remarks: '晚间课程学习动力充沛，语法进阶题全对。', tags: ['拔尖生'], behaviorNotes: [] }
  },
  {
    id: 's_thueve_2',
    classId: 'c_thu_eve',
    no: 2,
    name: '陆以安',
    gender: '女',
    attendance: { 1: '1', 2: '1', 3: '1', 4: 'L', 5: '1', 6: '1', 7: '1', 8: '1' },
    attendanceNotes: { 4: '晚高峰堵车' },
    scores: { daily: 90, homework: 89, midterm: 92, finalExam: 91, manualTotal: 91 },
    evaluation: { grade: '良好', remarks: '坚持晚修，进步明显。', tags: ['进步快'], behaviorNotes: [] }
  }
];

export const initialAssignments: Assignment[] = [
  // MW8-9 班级作业
  {
    id: 'a_mw89_1',
    classId: 'c_mw89',
    title: '第一课：抄写生词3遍并注音',
    content: '抄写第一课所有生词每个3遍，标注拼音与声调，书写保持整洁。',
    assignedDate: '2026-08-25',
    dueDate: '2026-08-28',
    maxScore: 100,
    submissions: {
      's_mw89_1': { status: 'missing' }, // Sok Niza 苏妮莎 缺交
      's_mw89_2': { status: 'submitted', submittedDate: '2026-08-26', score: 98, feedback: '书写规范整洁' },
      's_mw89_3': { status: 'submitted', submittedDate: '2026-08-27', score: 95, feedback: '拼音标注准确' },
      's_mw89_4': { status: 'missing' }, // 诚樱 缺交
      's_mw89_5': { status: 'submitted', submittedDate: '2026-08-28', score: 90 },
      's_mw89_6': { status: 'submitted', submittedDate: '2026-08-28', score: 92 },
      's_mw89_7': { status: 'submitted', submittedDate: '2026-08-29', score: 85 },
      's_mw89_8': { status: 'missing' }, // 李胜利 缺交
      's_mw89_9': { status: 'submitted', submittedDate: '2026-08-27', score: 91 },
      's_mw89_10': { status: 'submitted', submittedDate: '2026-08-26', score: 100, feedback: '字迹极其工整！' },
      's_mw89_11': { status: 'missing' } // 大明明 缺交
    }
  },
  {
    id: 'a_mw89_2',
    classId: 'c_mw89',
    title: '第二课：同步练习册 P12-P15',
    content: '完成练习册第12页至第15页的填空与连线题，注意形近字辨析。',
    assignedDate: '2026-08-26',
    dueDate: '2026-08-31',
    maxScore: 100,
    submissions: {
      's_mw89_1': { status: 'missing' }, // 苏妮莎 缺交
      's_mw89_2': { status: 'submitted', submittedDate: '2026-08-29', score: 96 },
      's_mw89_3': { status: 'submitted', submittedDate: '2026-08-30', score: 94 },
      's_mw89_4': { status: 'submitted', submittedDate: '2026-08-31', score: 80 },
      's_mw89_5': { status: 'submitted', submittedDate: '2026-08-31', score: 88 },
      's_mw89_6': { status: 'missing' }, // 方丽凤 缺交
      's_mw89_7': { status: 'missing' }, // 彭碧玉 缺交
      's_mw89_8': { status: 'missing' }, // 李胜利 缺交
      's_mw89_9': { status: 'submitted', submittedDate: '2026-08-30', score: 88 },
      's_mw89_10': { status: 'submitted', submittedDate: '2026-08-29', score: 99 },
      's_mw89_11': { status: 'submitted', submittedDate: '2026-09-01', score: 86 }
    }
  },
  {
    id: 'a_mw89_3',
    classId: 'c_mw89',
    title: '第三课：抄写生词三遍与造句',
    content: '抄写第三课生词3遍，挑选其中5个词语分别造一个完整的句子。',
    assignedDate: '2026-09-07',
    dueDate: '2026-09-11',
    maxScore: 100,
    submissions: {
      's_mw89_1': { status: 'submitted', submittedDate: '2026-09-09', score: 85 },
      's_mw89_2': { status: 'submitted', submittedDate: '2026-09-08', score: 98 },
      's_mw89_3': { status: 'submitted', submittedDate: '2026-09-08', score: 92 },
      's_mw89_4': { status: 'missing' }, // 诚樱 缺交
      's_mw89_5': { status: 'submitted', submittedDate: '2026-09-10', score: 88 },
      's_mw89_6': { status: 'submitted', submittedDate: '2026-09-10', score: 85 },
      's_mw89_7': { status: 'missing' }, // 彭碧玉 缺交
      's_mw89_8': { status: 'missing' }, // 李胜利 缺交
      's_mw89_9': { status: 'submitted', submittedDate: '2026-09-10', score: 89 },
      's_mw89_10': { status: 'submitted', submittedDate: '2026-09-08', score: 98 },
      's_mw89_11': { status: 'missing' } // 大明明 缺交
    }
  },

  // MW10-11 班级作业
  {
    id: 'a_mw1011_1',
    classId: 'c_mw1011',
    title: '第一课：生词抄写与注音',
    content: '全员抄写第一课生词3遍。',
    assignedDate: '2026-08-25',
    dueDate: '2026-08-28',
    maxScore: 100,
    submissions: {
      's_mw1011_1': { status: 'missing' }, // 吴贵方 缺交
      's_mw1011_2': { status: 'submitted', submittedDate: '2026-08-26', score: 96 },
      's_mw1011_3': { status: 'submitted', submittedDate: '2026-08-27', score: 88 },
      's_mw1011_4': { status: 'submitted', submittedDate: '2026-08-27', score: 92 },
      's_mw1011_5': { status: 'submitted', submittedDate: '2026-08-26', score: 90 },
      's_mw1011_6': { status: 'submitted', submittedDate: '2026-08-28', score: 89 },
      's_mw1011_7': { status: 'submitted', submittedDate: '2026-08-26', score: 98 }
    }
  },
  {
    id: 'a_mw1011_2',
    classId: 'c_mw1011',
    title: '第三课生词抄写与练习册',
    content: '抄写生词第三课三遍，并完成练习册单选题。',
    assignedDate: '2026-09-07',
    dueDate: '2026-09-11',
    maxScore: 100,
    submissions: {
      's_mw1011_1': { status: 'missing' }, // 吴贵方 缺交
      's_mw1011_2': { status: 'submitted', submittedDate: '2026-09-08', score: 95 },
      's_mw1011_3': { status: 'missing' }, // 王丽仙 缺交
      's_mw1011_4': { status: 'missing' }, // 张天龙 缺交
      's_mw1011_5': { status: 'submitted', submittedDate: '2026-09-09', score: 91 },
      's_mw1011_6': { status: 'submitted', submittedDate: '2026-09-10', score: 88 },
      's_mw1011_7': { status: 'submitted', submittedDate: '2026-09-08', score: 96 }
    }
  },

  // TF5-7 班级作业
  {
    id: 'a_tf57_1',
    classId: 'c_tf57',
    title: '第一课：抄写生词3遍',
    content: '抄写生词3遍，标注拼音。',
    assignedDate: '2026-08-27',
    dueDate: '2026-08-30',
    maxScore: 100,
    submissions: {
      's_tf57_1': { status: 'missing' },
      's_tf57_2': { status: 'submitted', submittedDate: '2026-08-28', score: 98 },
      's_tf57_3': { status: 'submitted', submittedDate: '2026-08-28', score: 95 },
      's_tf57_4': { status: 'submitted', submittedDate: '2026-08-29', score: 92 },
      's_tf57_5': { status: 'submitted', submittedDate: '2026-08-28', score: 90 },
      's_tf57_6': { status: 'submitted', submittedDate: '2026-08-30', score: 88 },
      's_tf57_7': { status: 'submitted', submittedDate: '2026-08-29', score: 90 }
    }
  }
];
