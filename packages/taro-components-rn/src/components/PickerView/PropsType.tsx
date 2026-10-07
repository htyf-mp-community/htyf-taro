// @ts-ignore
import { PickerData } from '@ant-design/react-native/lib/picker/PropsType'
// @ts-ignore
import { PickerViewProps as __PickerViewProps } from '@ant-design/react-native/lib/picker-view/PickerView'
import { PickerViewProps as _PickerViewProps } from '@tarojs/components/types/PickerView'

// React handles the class component's ref; it is not forwarded to AntPickerView.
export interface PickerViewProps extends Omit<_PickerViewProps, 'ref'>, __PickerViewProps {
  data: PickerData[] | PickerData[][]
  style: any
  indicatorStyle?: any
  onChange?: () => void
  value: any[]
}
