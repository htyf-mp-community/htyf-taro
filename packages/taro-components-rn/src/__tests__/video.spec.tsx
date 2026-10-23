import { render } from '@testing-library/react-native'
import { createVideoPlayer } from 'expo-video'
import * as React from 'react'

import Video from '../components/Video'

jest.mock('expo-video', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    createVideoPlayer: jest.fn(() => ({
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      play: jest.fn(),
      pause: jest.fn(),
      release: jest.fn(),
      playing: false,
      status: 'readyToPlay',
    })),
    VideoView: (props) => React.createElement(View, { ...props, testID: 'video-view' }),
  }
})

describe('Video', () => {
  const videoOpts = {
    src: 'http://wxsnsdy.tc.qq.com/105/20210/snsdyvideodownload?filekey=30280201010421301f0201690402534804102ca905ce620b1241b726bc41dcff44e00204012882540400&bizid=1023&hy=SH&fileparam=302c020101042530230204136ffd93020457e3c4ff02024ef202031e8d7f02030f42400204045a320a0201000400',
    controls: true,
    autoplay: false,
    poster: 'http://misc.aotu.io/booxood/mobile-video/cover_900x500.jpg',
    initialTime: 30,
    id: 'video',
    loop: false,
    muted: false
  }

  it('render Video', () => {
    const { getByTestId } = render(<Video {...videoOpts} />)
    expect(getByTestId('video-view')).toBeTruthy()
    expect(createVideoPlayer).toHaveBeenCalledWith({ uri: videoOpts.src })
  })
})
