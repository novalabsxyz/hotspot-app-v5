import React, { useCallback } from 'react'
import { uniq } from 'lodash'
import { useAsync } from 'react-async-hook'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import {
  Account,
  BleError,
  useHotspotBle,
  useSolana,
} from '@helium/react-native-sdk'
import useAlert from '../../../utils/useAlert'
import {
  HotspotSetupNavigationProp,
  HotspotSetupStackParamList,
} from './hotspotSetupTypes'
import Text from '../../../components/Text'
import Box from '../../../components/Box'
import SafeAreaBox from '../../../components/SafeAreaBox'
import { getAddress } from '../../../utils/secureAccount'
import { RootNavigationProp } from '../../../navigation/main/tabTypes'
import ActivityIndicator from '../../../components/ActivityIndicator'

type Route = RouteProp<
  HotspotSetupStackParamList,
  'HotspotSetupWifiConnectingScreen'
>

const HotspotSetupWifiConnectingScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<HotspotSetupNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()

  const {
    params: {
      network,
      password,
      hotspotAddress,
      addGatewayTxn,
      hotspotType,
      gatewayAction,
    },
  } = useRoute<Route>()

  const { readWifiNetworks, setWifi, removeConfiguredWifi } = useHotspotBle()
  const { getHotspotDetails } = useSolana()

  const { showOKAlert } = useAlert()

  const handleError = useCallback(
    async (err: unknown) => {
      let msg = ''

      if ((err as BleError).toString !== undefined) {
        msg = (err as BleError).toString()
      } else {
        msg = err as string
      }
      await showOKAlert({ titleKey: 'generic.error', messageKey: msg })
      navigation.goBack()
    },
    [navigation, showOKAlert],
  )

  const goToNextStep = useCallback(async () => {
    if (gatewayAction === 'wifi') {
      rootNav.navigate('MainTabs')
    } else {
      const address = await getAddress()
      const solAddress = Account.heliumAddressToSolAddress(address)

      const hotspot = await getHotspotDetails({
        address: hotspotAddress,
        type: 'IOT', // both freedomfi and helium hotspots support iot
      })

      if (hotspot?.owner) {
        if (hotspot.owner === solAddress) {
          navigation.replace('OwnedHotspotErrorScreen')
        } else {
          navigation.replace('NotHotspotOwnerErrorScreen')
        }
      } else {
        navigation.replace('HotspotSetupLocationInfoScreen', {
          hotspotAddress,
          addGatewayTxn,
          hotspotType,
        })
      }
    }
  }, [
    addGatewayTxn,
    gatewayAction,
    getHotspotDetails,
    hotspotAddress,
    hotspotType,
    navigation,
    rootNav,
  ])

  const connectToWifi = useCallback(async () => {
    const response = await setWifi(network, password)
    if (response === 'not_found') {
      showOKAlert({
        titleKey: 'generic.error',
        messageKey: 'generic.something_went_wrong',
      })
      navigation.goBack()
    } else if (response === 'invalid') {
      showOKAlert({
        titleKey: 'generic.error',
        messageKey: 'generic.invalid_password',
      })
      navigation.goBack()
    } else {
      goToNextStep()
    }
  }, [goToNextStep, navigation, network, password, setWifi, showOKAlert])

  const forgetWifi = async () => {
    try {
      const connectedNetworks = uniq((await readWifiNetworks(true)) || [])
      if (connectedNetworks.length > 0) {
        await removeConfiguredWifi(connectedNetworks[0])
      }
    } catch (e) {
      handleError(e)
    }
  }

  useAsync(async () => {
    await forgetWifi()
    connectToWifi()
  }, [])

  return (
    <SafeAreaBox flex={1} backgroundColor="primaryBackground">
      <Box flex={1} justifyContent="center" paddingBottom="xxl">
        <Box marginTop="xl">
          <Text variant="body1" textAlign="center" marginBottom="l">
            {t('hotspot_setup.wifi_password.connecting').toUpperCase()}
          </Text>
          <ActivityIndicator />
        </Box>
      </Box>
    </SafeAreaBox>
  )
}

export default HotspotSetupWifiConnectingScreen
