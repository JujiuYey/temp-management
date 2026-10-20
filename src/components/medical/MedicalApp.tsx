import React from 'react'
import TechCatalog from '../technology/TechCatalog'
import TechApplication from '../technology/TechApplication'
import TechOverview from '../technology/TechOverview'
import TechMonitor from '../technology/TechMonitor'
import FieldConfig from '../field-config/FieldConfig'
import PermissionCatalog from '../permission/PermissionCatalog'
import PermissionGroup from '../permission/PermissionGroup'
import PermissionApply from '../permission/PermissionApply'
import BatchAuth from '../permission/BatchAuth'
import BatchRevoke from '../permission/BatchRevoke'
import BatchAdjust from '../permission/BatchAdjust'
import PermissionExtend from '../permission/PermissionExtend'
import PermissionAnalysis from '../permission/PermissionAnalysis'
import PermissionMonitor from '../permission/PermissionMonitor'
import RotationStaff from '../rotation/RotationStaff'
import RotationBase from '../rotation/RotationBase'
import RotationPlan from '../rotation/RotationPlan'
import RotationRegulation from '../rotation/RotationRegulation'
import RotationCheckInOut from '../rotation/RotationCheckInOut'
import RotationExtend from '../rotation/RotationExtend'
import RotationFinalize from '../rotation/RotationFinalize'
import RotationAssessment from '../rotation/RotationAssessment'
import SurgeryApply from '../surgery/SurgeryApply'
import ConsultationApply from '../consultation/ConsultationApply'
import ConsultationSchedule from '../consultation/ConsultationSchedule'
import ConsultationCheckIn from '../consultation/ConsultationCheckIn'
import ConsultationFollowup from '../consultation/ConsultationFollowup'
import ConsultationOutgoing from '../consultation/ConsultationOutgoing'
import ConsultationOutgoingRegister from '../consultation/ConsultationOutgoingRegister'
import ConsultationRoom from '../consultation/ConsultationRoom'
import ExpertTeam from '../consultation/ExpertTeam'

interface MedicalAppProps {
  pageKey: string
  /** 内部页面跳转（如权限查询 → 集中调整） */
  onNavigate: (key: string) => void
}

/** 智慧医务子系统内容分发：技术管理 / 资质权限 / 轮转安排 / 手术管理 / 会诊管理 */
const MedicalApp: React.FC<MedicalAppProps> = ({ pageKey, onNavigate }) => {
  switch (pageKey) {
    case 'tech-catalog':
      return <TechCatalog />
    case 'tech-application':
      return <TechApplication />
    case 'field-config':
      return <FieldConfig />
    case 'tech-overview':
      return <TechOverview />
    case 'tech-monitor':
      return <TechMonitor />
    case 'permission-catalog':
      return <PermissionCatalog />
    case 'permission-group':
      return <PermissionGroup />
    case 'permission-apply':
      return <PermissionApply />
    case 'batch-auth':
      return <BatchAuth />
    case 'batch-revoke':
      return <BatchRevoke />
    case 'batch-adjust':
      return <BatchAdjust />
    case 'permission-extend':
      return <PermissionExtend onNavigate={onNavigate} />
    case 'permission-analysis':
      return <PermissionAnalysis />
    case 'permission-monitor':
      return <PermissionMonitor />
    case 'rotation-regulation':
      return <RotationRegulation />
    case 'rotation-base':
      return <RotationBase />
    case 'rotation-plan':
      return <RotationPlan />
    case 'rotation-staff':
      return <RotationStaff />
    case 'rotation-checkinout':
      return <RotationCheckInOut />
    case 'rotation-extend':
      return <RotationExtend />
    case 'rotation-finalize':
      return <RotationFinalize />
    case 'rotation-assessment':
      return <RotationAssessment />
    case 'surgery-apply':
      return <SurgeryApply />
    case 'consult-room':
      return <ConsultationRoom />
    case 'consult-expert':
      return <ExpertTeam />
    case 'consult-apply':
      return <ConsultationApply />
    case 'consult-schedule':
      return <ConsultationSchedule />
    case 'consult-checkin':
      return <ConsultationCheckIn />
    case 'consult-followup':
      return <ConsultationFollowup />
    case 'consult-outgoing':
      return <ConsultationOutgoing />
    case 'consult-outgoing-register':
      return <ConsultationOutgoingRegister />
    default:
      return <TechCatalog />
  }
}

export default MedicalApp
