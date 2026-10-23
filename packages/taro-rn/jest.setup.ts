import '@testing-library/jest-native/extend-expect'

import mockRNCAsyncStorage from '@react-native-async-storage/async-storage/jest'
import mockRNCClipboard from '@react-native-clipboard/clipboard/jest/clipboard-mock'
import { NetInfoStateType } from '@react-native-community/netinfo'
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock'
import mockRNCDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'

import mockRNCameraRoll from './__tests__/__mock__/mockRNCCameraRoll'
import mockRNCGeolocation from './__tests__/__mock__/mockRNCGeolocation'

jest.mock('react-native-mmkv', () => {
  const stores = new Map<string, Map<string, string>>()
  return {
    createMMKV: ({ id }: { id: string }) => {
      let values = stores.get(id)
      if (!values) {
        values = new Map()
        stores.set(id, values)
      }
      return {
        set: (key: string, value: string) => values!.set(key, value),
        getString: (key: string) => values!.get(key),
        delete: (key: string) => values!.delete(key),
        remove: (key: string) => values!.delete(key),
        clearAll: () => values!.clear(),
        getAllKeys: () => [...values!.keys()],
      }
    },
  }
})

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter')
jest.doMock('@react-native-community/netinfo', () => ({ ...mockRNCNetInfo, NetInfoStateType }))
jest.doMock('@react-native-async-storage/async-storage', () => mockRNCAsyncStorage)
jest.doMock('react-native-nitro-geolocation', () => mockRNCGeolocation)
jest.doMock('@react-native-clipboard/clipboard', () => mockRNCClipboard)
jest.doMock('react-native-device-info', () => mockRNCDeviceInfo)
jest.mock('@react-native-camera-roll/camera-roll', () => mockRNCameraRoll)

jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native') as any
  ReactNative.Image.getSize = jest.fn((_uri, success: any) => {
    setTimeout(() => success && success(320, 240))
    return Promise.resolve([320, 240])
  })
  return ReactNative
})

jest.doMock('expo-modules-core', () => {
  const unimodules = jest.requireActual('expo-modules-core') as any
  const { NativeModulesProxy } = unimodules

  NativeModulesProxy.ExpoLocation = {
    getCurrentPositionAsync: jest.fn(() => Promise.resolve({
      coords: {
        latitude: 0,
        longitude: 0,
        speed: 0,
        accuracy: 0,
        altitude: 0
      }
    }))
  }
  return unimodules
})

const grantedPromise = jest.fn(() => Promise.resolve({
  granted: true
}))

jest.doMock('expo-image-picker', () => {
  return {
    MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
    requestMediaLibraryPermissionsAsync: grantedPromise,
    launchCameraAsync: jest.fn(),
    launchImageLibraryAsync: jest.fn(),
  }
})

jest.doMock('expo-location', () => {
  const expoLocation = jest.requireActual('expo-location') as any
  expoLocation.requestForegroundPermissionsAsync = grantedPromise
  return expoLocation
})

jest.doMock('expo-camera', () => {
  return {
    Camera: {
    requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({
      status: 'granted',
      granted: true,
      expires: 'never',
      canAskAgain: true,
    })),
    },
    CameraView: 'CameraView',
    PermissionStatus: { GRANTED: 'granted' },
    scanFromURLAsync: jest.fn(),
  }
})
