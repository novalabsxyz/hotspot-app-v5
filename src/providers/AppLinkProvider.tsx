import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { Linking } from 'react-native'
import queryString from 'query-string'
import { BarcodeScanningResult } from 'expo-camera'
import { useSelector } from 'react-redux'
import {
  parseWalletLinkToken,
  verifyWalletLinkToken,
} from '@helium/wallet-link'
import useMount from '../utils/useMount'
import { RootState } from '../store/rootReducer'
import navigator from '../navigation/navigator'
import {
  AppLink,
  AppLinkFields,
  AppLinkCategories,
  AppLinkCategoryType,
  WalletLink,
  HotspotLink,
} from './appLinkTypes'
import { useAppDispatch } from '../store/store'
import appSlice from '../store/user/appSlice'

const APP_LINK_PROTOCOL = 'helium://'
const UNIVERSAL_LINK_BASE = 'https://helium.com/'
const UNIVERSAL_LINK_WWW_BASE = 'https://www.helium.com/'

export const createAppLink = (
  resource: AppLinkCategoryType,
  resourceId: string,
) => `${APP_LINK_PROTOCOL}${resource}/${resourceId}`

const useAppLink = () => {
  const [unhandledAppLink, setUnhandledLink] = useState<
    AppLink | WalletLink | null
  >(null)

  const {
    app: { isLocked },
  } = useSelector((state: RootState) => state)

  const dispatch = useAppDispatch()

  useMount(() => {
    Linking.addEventListener('url', ({ url: nextUrl }) => {
      if (!nextUrl) return

      const link = parseUrl(nextUrl)
      if (!link) return
      navToAppLink(link)
    })
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL()
      if (!initialUrl) return

      const link = parseUrl(initialUrl)
      if (!link) return
      navToAppLink(link)
    }

    getUrlAsync()
  })

  const navToAppLink = useCallback(
    async (record: AppLink | WalletLink) => {
      if (isLocked && record.type !== 'link_wallet') {
        setUnhandledLink(record)
        return
      }

      switch (record.type) {
        case 'add_gateway': {
          const { resource: txnStr } = record as AppLink
          if (!txnStr) return

          navigator.confirmAddGateway(txnStr)
          break
        }
        case 'link_wallet': {
          const walletLink = record as WalletLink
          if (typeof record.token !== 'string') {
            throw new Error('Invalid wallet link')
          }

          const parsedToken = parseWalletLinkToken(record.token)
          if (walletLink.status === 'success' && walletLink.token) {
            const verified = await verifyWalletLinkToken(parsedToken, {
              maxAgeInSeconds: 60,
            })

            if (!verified) {
              // TODO: Handle error
              throw new Error('Invalid wallet link')
            }

            dispatch(appSlice.actions.storeWalletLinkToken(walletLink.token))
          } else {
            // TODO: handle error
          }
          break
        }
        case 'sign_hotspot': {
          const hotspotLink = record as HotspotLink
          if (hotspotLink.status === 'success') {
            if (hotspotLink.transferTxn !== undefined) {
              navigator.submitTransferTxn(hotspotLink)
            } else {
              navigator.submitGatewayTxns(hotspotLink)
            }
          } else {
            // TODO: handle failure status codes
            // eslint-disable-next-line no-console
            console.error(`Failed with status ${hotspotLink.status}`)
            navigator.goToMainTabs()
          }
          break
        }
      }
    },
    [isLocked, dispatch],
  )

  useEffect(() => {
    // Links will be handled once the app is unlocked
    if (!unhandledAppLink || isLocked) return

    navToAppLink(unhandledAppLink)
    setUnhandledLink(null)
  }, [isLocked, navToAppLink, unhandledAppLink])

  const parseUrl = useCallback((url: string) => {
    if (!url) return

    const parsed = queryString.parseUrl(url)
    if (
      !parsed.url.includes(APP_LINK_PROTOCOL) &&
      !parsed.url.includes(UNIVERSAL_LINK_BASE) &&
      !parsed.url.includes(UNIVERSAL_LINK_WWW_BASE)
    ) {
      return
    }
    const params = queryString.parse(queryString.extract(url))
    const record = AppLinkFields.reduce(
      (obj, k) => ({ ...obj, [k]: parsed.query[k] }),
      params,
    ) as AppLink

    const path = parsed.url
      .replace(APP_LINK_PROTOCOL, '')
      .replace(UNIVERSAL_LINK_BASE, '')
      .replace(UNIVERSAL_LINK_WWW_BASE, '')
    const [resourceType, ...rest] = path.split('/')
    if (resourceType && AppLinkCategories.find((k) => k === resourceType)) {
      record.type = resourceType as AppLinkCategoryType
    }
    if (rest?.length) {
      record.resource = rest.join('/')
    }

    if (!record.type || !AppLinkCategories.find((k) => k === record.type)) {
      throw new Error(`Unsupported Link: ${JSON.stringify(record)}`)
    }
    return record
  }, [])

  const parseData = useCallback(
    (data: string, _scanType: AppLinkCategoryType): AppLink => {
      const urlParams = parseUrl(data)
      if (!urlParams) {
        throw new Error('Invalid Link')
      }
      return urlParams
    },
    [parseUrl],
  )

  const handleBarCode = useCallback(
    (
      { data }: BarcodeScanningResult,
      scanType: AppLinkCategoryType,
      opts?: Record<string, string>,
    ) => {
      const scanResult = parseData(data, scanType)

      navToAppLink({ ...scanResult, ...opts })
    },
    [navToAppLink, parseData],
  )

  return { handleBarCode }
}

const initialState = {
  handleBarCode: () => new Promise<void>((resolve) => resolve()),
}

const LinkContext = createContext<ReturnType<typeof useAppLink>>(initialState)

const { Provider } = LinkContext

const AppLinkProvider = ({ children }: { children: ReactNode }) => {
  return <Provider value={useAppLink()}>{children}</Provider>
}

export const useAppLinkContext = () => useContext(LinkContext)

export default AppLinkProvider
