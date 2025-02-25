/* eslint-disable no-console */
import React, { useRef, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import { useOnboarding } from '@helium/react-native-sdk'
import Box from '../../../components/Box'
import { DebouncedButton } from '../../../components/Button'
import Text from '../../../components/Text'
import { RootNavigationProp } from '../../../navigation/main/tabTypes'
import SafeAreaBox from '../../../components/SafeAreaBox'
import { HotspotSetupStackParamList } from './hotspotSetupTypes'
import ActivityIndicator from '../../../components/ActivityIndicator'

type Route = RouteProp<HotspotSetupStackParamList, 'HotspotTxnsSubmitScreen'>

const HotspotTxnsSubmitScreen = () => {
  const { t } = useTranslation()
  const { params } = useRoute<Route>()
  const navigation = useNavigation<RootNavigationProp>()
  const { submitTransactions } = useOnboarding()
  const submitted = useRef(false)
  const [state, setState] = useState<'init' | 'loading' | 'success' | 'error'>(
    'init',
  )
  const [error, setError] = useState('')

  useAsync(async () => {
    if (submitted.current) return

    if (!params.gatewayAddress) {
      throw new Error('Gateway address not found')
    }

    submitted.current = true

    let solanaTransactions: string[] = []
    if (params.solanaTransactions) {
      solanaTransactions = params.solanaTransactions?.split(',') || []
    }

    setState('loading')

    try {
      await submitTransactions({
        solanaTransactions,
      })
      setState('success')
    } catch (e) {
      setState('error')
      setError(String(e))
      console.error(e)
    }
  }, [])

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="primaryBackground"
      padding="lx"
      paddingTop="xxl"
    >
      {state === 'loading' && (
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </Box>
      )}
      {state === 'success' && (
        <>
          <Box flex={1} alignItems="center" paddingTop="xxl">
            <Text variant="subtitle1" marginBottom="l">
              {t('hotspot_setup.progress.title')}
            </Text>
            <Box paddingHorizontal="l">
              <Text variant="body1" textAlign="center" marginBottom="l">
                {t('hotspot_setup.progress.subtitle')}
              </Text>
            </Box>
          </Box>
        </>
      )}
      {state === 'error' && (
        <>
          <Box flex={1} alignItems="center" paddingTop="xxl">
            <Text variant="subtitle1" marginBottom="l">
              {t('generic.something_went_wrong')}
            </Text>
            <Box paddingHorizontal="l">
              <Text variant="body1" textAlign="center" marginBottom="l">
                {error}
              </Text>
            </Box>
          </Box>
        </>
      )}
      <DebouncedButton
        onPress={() => navigation.navigate('MainTabs')}
        marginTop="lx"
        variant="primary"
        width="100%"
        mode="contained"
        title={
          params.gatewayTxn
            ? t('hotspot_setup.progress.create')
            : t('hotspot_setup.progress.next')
        }
      />
    </SafeAreaBox>
  )
}

export default HotspotTxnsSubmitScreen
