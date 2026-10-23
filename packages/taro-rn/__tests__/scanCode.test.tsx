import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { RootSiblingParent } from 'react-native-root-siblings'

import { scanCode } from '../src/lib/scanCode'

describe('scanCode', () => {
  it('should render scanCode success', async () => {
    // @ts-ignore
    const { getByLabelText, queryByLabelText } = render(<RootSiblingParent />)
    scanCode()
    const close = await waitFor(() => getByLabelText('Close'))
    fireEvent.press(close)
    await waitFor(() => expect(queryByLabelText('Close')).toBeNull())
  })
})
