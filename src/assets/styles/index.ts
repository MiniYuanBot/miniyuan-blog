import type { UserShortcuts } from 'unocss'
import { layoutShortcuts } from './layout'
import { sharedShortcuts, iconShortcuts, headerShortcuts } from './ui'

export { typographyConfig } from './prose'

export const shortcuts: UserShortcuts = {
    ...sharedShortcuts,
    ...layoutShortcuts,
    ...iconShortcuts,
    ...headerShortcuts,
}
