import React from 'react'
import MyPermission from './MyPermission'

/** 协同办公子系统内容分发 */
const CoopApp: React.FC<{ pageKey: string }> = ({ pageKey }) => {
  switch (pageKey) {
    case 'coop-my-permission':
    default:
      return <MyPermission />
  }
}

export default CoopApp
