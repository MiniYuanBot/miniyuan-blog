import { sharedShortcuts } from './shared'
import { layoutShortcuts } from './layout'
import { transitionShortcuts } from './transitions'
import { iconShortcuts } from './icons'
import { headerShortcuts } from './header'
import type { UserShortcuts } from 'unocss'

export const shortcuts: UserShortcuts = {
    ...sharedShortcuts,
    ...layoutShortcuts,
    ...transitionShortcuts,
    ...iconShortcuts,
    ...headerShortcuts,
}