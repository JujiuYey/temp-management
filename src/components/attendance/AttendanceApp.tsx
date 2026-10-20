import React from 'react'
import Dashboard from './Dashboard'
import MySchedule from './MySchedule'
import MyAttendance from './MyAttendance'
import MyLeave from './MyLeave'
import OvertimeRequest from './OvertimeRequest'
import ShiftSwapRequest from './ShiftSwapRequest'
import AttendancePeriod from './AttendancePeriod'
import AttendanceUnit from './AttendanceUnit'
import AttendancePerson from './AttendancePerson'
import AttendanceGroup from './AttendanceGroup'
import AttendanceProject from './AttendanceProject'
import LeaveRules from './LeaveRules'
import LeaveGrant from './LeaveGrant'
import LeaveBalance from './LeaveBalance'
import LeaveRequest from './LeaveRequest'
import ShiftClass from './ShiftClass'
import ShiftGroup from './ShiftGroup'
import ShiftConfig from './ShiftConfig'
import ShiftIntegrated from './ShiftIntegrated'
import ShiftOverview from './ShiftOverview'
import ClockRecord from './ClockRecord'
import CardSupplement from './CardSupplement'
import AttendanceConfirm from './AttendanceConfirm'

/** 考勤管理子系统内容分发 */
const AttendanceApp: React.FC<{ pageKey: string }> = ({ pageKey }) => {
  switch (pageKey) {
    case 'my-schedule':
      return <MySchedule />
    case 'my-attendance':
      return <MyAttendance />
    case 'my-leave':
      return <MyLeave />
    case 'my-overtime':
      return <OvertimeRequest />
    case 'my-shift-exchange':
      return <ShiftSwapRequest />
    case 'attendance-period':
      return <AttendancePeriod />
    case 'attendance-unit':
      return <AttendanceUnit />
    case 'attendance-person':
      return <AttendancePerson />
    case 'attendance-group':
      return <AttendanceGroup />
    case 'attendance-project':
      return <AttendanceProject />
    case 'leave-rules':
      return <LeaveRules />
    case 'leave-grant':
      return <LeaveGrant />
    case 'leave-balance':
      return <LeaveBalance />
    case 'leave-request':
      return <LeaveRequest />
    case 'shift-class':
      return <ShiftClass />
    case 'shift-group':
      return <ShiftGroup />
    case 'shift-config':
      return <ShiftConfig />
    case 'shift-integrated':
      return <ShiftIntegrated />
    case 'shift-overview':
      return <ShiftOverview />
    case 'clock':
      return <ClockRecord />
    case 'card-supplement':
      return <CardSupplement />
    case 'overtime-request':
      return <OvertimeRequest />
    case 'attendance-confirm':
      return <AttendanceConfirm />
    case 'dashboard':
    default:
      return <Dashboard />
  }
}

export default AttendanceApp
