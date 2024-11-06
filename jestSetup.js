import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'

global.window = {}
global.window = global

jest.useFakeTimers()
jest.mock('react-native-device-info', () => mockRNDeviceInfo)
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')
