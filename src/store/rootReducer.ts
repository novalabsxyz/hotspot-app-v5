import { combineReducers } from '@reduxjs/toolkit'
import accountSlice from './account/accountSlice'
import appSlice from './user/appSlice'
import connectedHotspotSlice from './connectedHotspot/connectedHotspotSlice'
import heliumDataSlice from './helium/heliumDataSlice'
import locationSlice from './location/locationSlice'
import hotspotOnboardingSlice from './hotspots/hotspotOnboardingSlice'

const rootReducer = combineReducers({
  app: appSlice.reducer,
  account: accountSlice.reducer,
  connectedHotspot: connectedHotspotSlice.reducer,
  heliumData: heliumDataSlice.reducer,
  location: locationSlice.reducer,
  hotspotOnboarding: hotspotOnboardingSlice.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

export default rootReducer