import { kebabCase } from 'lodash'
import animalHash from 'angry-purple-tiger'
import { getDeviceId } from 'react-native-device-info'
import { Platform } from 'react-native'
import sendMail from '../../../utils/sendMail'

export default ({
  eth,
  wifi,
  fw,
  ip,
  disk,
  gateway,
  hotspotMaker,
  appVersion,
  supportEmail,
  descriptionInfo,
  diagnosticsError,
}: {
  eth: string
  wifi: string
  fw: string
  ip: string
  disk: string
  gateway: string
  hotspotMaker: string
  appVersion: string
  supportEmail: string
  descriptionInfo: string
  diagnosticsError: string
}) => {
  const deviceNameAndOS = () => {
    const deviceName = getDeviceId()
    const osVersion = Platform.Version
    const osName = Platform.OS
    return `${deviceName} | ${osName} ${osVersion}`
  }

  const items = [
    `**${descriptionInfo}**\n\n`,
    `Hotspot: ${kebabCase(animalHash(gateway))}`,
    `Hotspot Maker: ${hotspotMaker}`,
    `Address: ${gateway}`,
    `Firmware: ${fw}`,
    `App Version: ${appVersion}`,
    `Wi-Fi MAC: ${wifi}`,
    `Eth MAC: ${eth}`,
    `IP Address: ${ip}`,
    `Disk status: ${disk}`,
    `Device Info: ${deviceNameAndOS()}`,
  ]

  if (diagnosticsError) {
    items.push(`Diagnostic Error: ${diagnosticsError}`)
  }

  const body = items.join('\n')

  sendMail({
    subject: 'Diagnostic Report',
    body,
    isHTML: false,
    recipients: [supportEmail],
  })
}
