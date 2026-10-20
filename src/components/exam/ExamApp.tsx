import React from 'react'
import { Card, Result } from 'antd'
import QuestionBank from './QuestionBank'
import TheoryExam from './TheoryExam'
import ExamBooking from './ExamBooking'
import ExamCenter from './ExamCenter'
import MarkingHall from './MarkingHall'
import LabManage from './LabManage'
import LabBooking from './LabBooking'
import ScoreItem from './ScoreItem'
import PlanTag from './PlanTag'
import ExamOpen from './ExamOpen'
import ExamPlan from './ExamPlan'
import AssistCenter from './AssistCenter'

/** 考试系统各菜单中文名 */
const EXAM_MENU_NAMES: Record<string, string> = {
  'exam-dashboard': '工作台',
  'exam-training': '培训管理',
  'exam-center': '考试中心',
  'exam-assist-center': '辅助中心',
  'exam-booking': '考试预约',
  'exam-my-marking': '我的阅卷',
  'exam-questions': '理论题目',
  'exam-practical-questions': '实操题目',
  'exam-paper': '试卷维护',
  'exam-open': '开启考试',
  'exam-plan': '考试计划',
  'exam-lab-booking': '实训室预约',
  'exam-lab-manage': '实训室管理',
  'exam-score-item': '评分项目',
  'exam-plan-tag': '考试科目',
}

/** 考试系统子系统内容分发 */
const ExamApp: React.FC<{ pageKey: string }> = ({ pageKey }) => {
  switch (pageKey) {
    case 'exam-questions':
      return <QuestionBank scope="theory" />
    case 'exam-practical-questions':
      return <QuestionBank scope="practice" />
    case 'exam-paper':
      return <TheoryExam />
    case 'exam-center':
      return <ExamCenter />
    case 'exam-assist-center':
      return <AssistCenter />
    case 'exam-booking':
      return <ExamBooking />
    case 'exam-my-marking':
      return <MarkingHall scope="mine" />
    case 'exam-lab-manage':
      return <LabManage />
    case 'exam-lab-booking':
      return <LabBooking />
    case 'exam-score-item':
      return <ScoreItem />
    case 'exam-plan-tag':
      return <PlanTag />
    case 'exam-open':
      return <ExamOpen />
    case 'exam-plan':
      return <ExamPlan />
    default: {
      const name = EXAM_MENU_NAMES[pageKey] ?? '工作台'
      return (
        <Card bordered={false}>
          <Result
            status="info"
            title={name}
            subTitle={`${name}功能建设中，敬请期待`}
          />
        </Card>
      )
    }
  }
}

export default ExamApp
