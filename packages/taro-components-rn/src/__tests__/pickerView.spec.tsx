import { render } from '@testing-library/react-native'
import AntPickerView from '@ant-design/react-native/lib/picker-view'
import * as React from 'react'
import { View } from 'react-native'

import PickerView from '../components/PickerView'
import PickerViewColumn from '../components/PickerViewColumn'

describe('PickerView', () => {
  it('PickerView render', () => {
    const years: number[] = []
    const months: number[] = []
    const days: number[] = []
    for (let i = 2010; i <= 2020; i++) {
      years.push(i)
    }
    for (let i = 1; i <= 12; i++) {
      months.push(i)
    }
    for (let i = 1; i <= 30; i++) {
      days.push(i)
    }
    const component = render(
      <PickerView indicatorStyle='height: 50px;' style='width: 100%; height: 300px;'>
        <PickerViewColumn>
          {years.map(item => {
            return (
              <View key={item}>{item}年</View>
            )
          })}
        </PickerViewColumn>
        <PickerViewColumn>
          {months.map(item => {
            return (
              <View key={item}>{item}月</View>
            )
          })}
        </PickerViewColumn>
        <PickerViewColumn>
          {days.map(item => {
            return (
              <View key={item}>{item}日</View>
            )
          })}
        </PickerViewColumn>
      </PickerView>
    )
    const data = component.UNSAFE_getByType(AntPickerView).props.data
    expect(data).toHaveLength(3)
    expect(data[0][0]).toEqual({ label: '2010年', value: 0 })
    expect(data[1][0]).toEqual({ label: '1月', value: 0 })
    expect(data[2][0]).toEqual({ label: '1日', value: 0 })
  })
})
