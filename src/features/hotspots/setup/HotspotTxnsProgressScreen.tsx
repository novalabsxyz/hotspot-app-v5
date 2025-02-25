import React, { useCallback, useEffect, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking } from 'react-native'
import { createUpdateHotspotUrl, SignHotspotRequest } from '@helium/wallet-link'
import {
  AddGatewayV1,
  AssertLocationV2,
  CreateHotspotExistsError,
  TransferHotspotV2,
  useOnboarding,
  useSolana,
} from '@helium/react-native-sdk'
import { first, last } from 'lodash'
import { useAsync } from 'react-async-hook'
import { bufferToTransaction, getSolanaKeypair } from '@helium/spl-utils'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import { RootNavigationProp } from '../../../navigation/main/tabTypes'
import SafeAreaBox from '../../../components/SafeAreaBox'
import { HotspotSetupStackParamList } from './hotspotSetupTypes'
import {
  getKeypair,
  getKeypairRaw,
  getSecureItem,
} from '../../../utils/secureAccount'
import { useColors } from '../../../theme/themeHooks'
import { DebouncedButton } from '../../../components/Button'
import { HotspotAssertNavigationProp } from './HotspotAssertTypes'
import { getHotspotTypes } from '../root/hotspotTypes'

type Route = RouteProp<HotspotSetupStackParamList, 'HotspotTxnsProgressScreen'>

const HotspotTxnsProgressScreen = () => {
  const { t } = useTranslation()
  const { params } = useRoute<Route>()
  const rootNav = useNavigation<RootNavigationProp>()
  const nav = useNavigation<HotspotAssertNavigationProp>()
  const [logs, setLogs] = useState<string[]>()
  const { primaryText } = useColors()
  const [failed, setFailed] = useState(false)
  const { createHotspot, getOnboardTransactions, getOnboardingRecord } =
    useOnboarding()
  const { getHotspotDetails } = useSolana()

  const navToHeliumAppForSigning = useCallback(
    async (updateParams: SignHotspotRequest) => {
      const url = createUpdateHotspotUrl(updateParams)
      if (!url) {
        // eslint-disable-next-line no-console
        console.error('Link could not be created')
        return
      }

      Linking.openURL(url)
    },
    [],
  )

  const signTxn = useCallback(
    async ({
      addGatewayTxn,
      solanaTransactions,
      transferHotspotTxn,
      assertLocationTxn,
    }: SignHotspotRequest) => {
      const keypair = await getKeypair()

      const keypairRaw = await getKeypairRaw()
      if (!keypairRaw || !keypair) {
        throw new Error('keypair not found!')
      }

      let solanaSignedTransactions: string[] = []
      let gatewayTxn: string | undefined
      let assertTxn: string | undefined
      let transferTxn: string | undefined

      if (addGatewayTxn) {
        const unsigned = AddGatewayV1.fromString(addGatewayTxn)
        const signed = await unsigned.sign({ owner: keypair })
        gatewayTxn = signed.toString()
      }

      if (assertLocationTxn) {
        const unsigned = AssertLocationV2.fromString(assertLocationTxn)
        const ownerIsPayer = unsigned.owner?.b58 === unsigned.payer?.b58
        const signed = await unsigned.sign({
          owner: keypair,
          payer: ownerIsPayer ? keypair : undefined,
        })
        assertTxn = signed.toString()
      }

      if (transferHotspotTxn) {
        const unsigned = TransferHotspotV2.fromString(transferHotspotTxn)
        const signed = await unsigned.sign({ owner: keypair })
        transferTxn = signed.toString()
      }

      if (solanaTransactions) {
        const solTxns = solanaTransactions.split(',')
        const solanaKeypair = getSolanaKeypair(keypairRaw.sk)
        solanaSignedTransactions = solTxns.map((txn) => {
          const tx = bufferToTransaction(Buffer.from(txn, 'base64'))
          tx.partialSign(solanaKeypair)
          return tx.serialize().toString('base64')
        })
      }
      nav.navigate('HotspotTxnsSubmitScreen', {
        gatewayTxn,
        assertTxn,
        gatewayAddress: params.hotspotAddress,
        transferTxn,
        solanaTransactions: solanaSignedTransactions.join(','),
        status: 'success',
      })
    },
    [nav, params.hotspotAddress],
  )

  const handleTxns = useCallback(
    ({
      onboardTransactions,
      addGatewayTxn,
      assertLocationTxn,
      token,
    }: {
      onboardTransactions?: string[]
      addGatewayTxn?: string
      assertLocationTxn?: string
      token: string
    }) => {
      const solanaTransactions = [
        ...(onboardTransactions || []),
        ...(params.solanaTransactions || []),
      ].join(',')

      const updateParams = {
        token,
      } as SignHotspotRequest

      if (solanaTransactions.length) {
        updateParams.solanaTransactions = solanaTransactions
      } else {
        updateParams.addGatewayTxn = addGatewayTxn || params.addGatewayTxn
        updateParams.assertLocationTxn =
          assertLocationTxn || params.assertLocationTxn
      }

      if (token) {
        navToHeliumAppForSigning(updateParams)
      } else {
        signTxn(updateParams)
      }
    },
    [params, navToHeliumAppForSigning, signTxn],
  )

  const handleLog = useCallback(
    ({
      catastrophic,
      message,
    }: {
      catastrophic?: boolean
      message: string
    }) => {
      setLogs((l) => {
        const nextLogs = l || []
        return [...nextLogs, message]
      })

      if (catastrophic) {
        setFailed(true)
        throw new Error(message)
      }
    },
    [],
  )

  useEffect(() => {
    if (!failed) return

    nav.navigate('OnboardingErrorScreen', { errorLogs: logs })
  }, [failed, logs, nav])

  const handleAddGateway = useCallback(
    async (token: string) => {
      const { addGatewayTxn, hotspotAddress } = params
      if (!addGatewayTxn || !hotspotAddress) return

      // This creates the hotspot, signing not required
      try {
        handleLog({
          message: `create hotspot ${hotspotAddress}\ntxn - \n${params.addGatewayTxn}`,
        })

        const txIds = await createHotspot(addGatewayTxn)
        if (!txIds?.length) {
          handleLog({
            message: 'create hotspot failed to create transactions',
            catastrophic: true,
          })
        }
        handleLog({
          message: `created hotspot? - txId is ${txIds.join(',')}`,
        })
      } catch (e) {
        handleLog({
          message: `create hotspot failed - ${String(e)}`,
          catastrophic: e !== CreateHotspotExistsError,
        })
      }

      let networkTypes = params.hotspotNetworkTypes
      if (!networkTypes?.length) {
        handleLog({ message: 'Getting onboard record' })
        // onboarding record lookup agressively rate limits, only lookup if absolutely necessary
        const onboardingRecord = await getOnboardingRecord(
          params.hotspotAddress || '',
        )
        if (onboardingRecord) {
          handleLog({ message: 'Got onboard record' })
        } else {
          handleLog({ message: 'Could not get onboard record' })
        }

        networkTypes = getHotspotTypes()

        handleLog({
          message: `Networks to onboard - ${networkTypes?.join(',')}`,
        })
      } else {
        handleLog({
          message: `Networks to onboard from params - ${networkTypes?.join(
            ',',
          )}`,
        })
      }

      const infos = await Promise.all(
        networkTypes?.map((nt) =>
          getHotspotDetails({ address: hotspotAddress, type: nt }),
        ),
      )

      infos.forEach((info, index) => {
        if (info) {
          handleLog({
            message: `Found existing info for network - ${
              networkTypes?.[index] || ''
            }`,
          })
        }
      })

      // Filter out the networks that have already been onboarded
      networkTypes = networkTypes?.filter((_nt, index) => !infos[index])

      if (networkTypes.length === 0) {
        handleLog({ message: 'Hotspot already added', catastrophic: true })
      }

      handleLog({ message: 'Getting onboard transactions' })

      try {
        const networkDetails = networkTypes.map((hotspotType) => ({
          hotspotType,
          // We only need to set location for IOT hotspots.
          // For MOBILE CBRS hotspots, location isn't used.
          // We don't set it to avoid the location assertion fee.
          lat: hotspotType === 'IOT' ? last(params.coords) : undefined,
          lng: hotspotType === 'IOT' ? first(params.coords) : undefined,
          elevation: params.elevation,
          decimalGain: params.gain,
        }))

        const { solanaTransactions } = await getOnboardTransactions({
          hotspotAddress,
          networkDetails,
        })

        handleTxns({
          onboardTransactions: solanaTransactions,
          token,
        })
      } catch (e) {
        handleLog({ message: String(e), catastrophic: true })
      }
    },
    [
      createHotspot,
      getHotspotDetails,
      getOnboardTransactions,
      getOnboardingRecord,
      handleLog,
      handleTxns,
      params,
    ],
  )

  useAsync(async () => {
    const token = (await getSecureItem('walletLinkToken')) || ''
    if (params.addGatewayTxn) {
      handleAddGateway(token)
    } else {
      handleTxns({ token })
    }
  }, [])

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="primaryBackground"
      padding="lx"
      paddingTop="xxl"
    >
      <Box flex={1} alignItems="center" paddingTop="xxl">
        <Text variant="subtitle1" marginBottom="l">
          {t('hotspot_setup.progress.title')}
        </Text>
        <Box flex={1} justifyContent="center">
          <ActivityIndicator color={primaryText} />
        </Box>
      </Box>
      <DebouncedButton
        onPress={() => rootNav.navigate('MainTabs')}
        variant="primary"
        width="100%"
        mode="contained"
        title={t('generic.cancel')}
      />
    </SafeAreaBox>
  )
}

export default HotspotTxnsProgressScreen
