import { createContext, useContext } from 'react'
export type DataSource = 'demo' | 'psn'
export const DataSourceContext = createContext<DataSource>('psn')
export const useDataSource = () => useContext(DataSourceContext)
export function storageKey(source: DataSource, key: string) {
  return source === 'demo' ? `platinumos.demo.${key}` : `platinumos.${key}`
}
