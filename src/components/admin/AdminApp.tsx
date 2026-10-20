import React from 'react'
import InfoSetConfig from '../settings/InfoSetConfig'
import AlertRule from '../settings/AlertRule'
import AlertCenter from '../settings/AlertCenter'

/** 后台管理子系统内容分发 */
const AdminApp: React.FC<{ pageKey: string }> = ({ pageKey }) => {
  switch (pageKey) {
    case 'settings-alert-rule':
      return <AlertRule />
    case 'settings-alert-center':
      return <AlertCenter />
    case 'settings-info-set':
    default:
      return <InfoSetConfig />
  }
}

export default AdminApp
