import { render, waitFor } from '@testing-library/react-native'
import * as React from 'react'

import { _Camera } from '../components/Camera'

jest.mock('expo-camera', () => ({
  Camera: { requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ granted: false }) },
  CameraView: 'CameraView',
}))

describe('Camera', () => {
  it('shows permission denial', async () => {
    const screen = render(<_Camera id='id' ratio='' />)
    await waitFor(() => expect(screen.getByText('No access to camera')).toBeTruthy())
  })
})
