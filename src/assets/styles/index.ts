import type { UserShortcuts } from 'unocss'
import { sharedShortcuts } from './shared'
import { layoutShortcuts } from './layout'
import { transitionShortcuts } from './transitions'
import { iconShortcuts, cardShortcuts } from './ui'
import { headerShortcuts } from './header'
import { educationShortcuts } from './education'
import { skillShortcuts } from './skill'
import { heroShortcuts } from './hero'
import { blogShortcuts, blogPostShortcuts } from './blog'

export { typographyConfig } from './prose'

export const shortcuts: UserShortcuts = {
    ...sharedShortcuts,
    ...layoutShortcuts,
    ...transitionShortcuts,
    ...iconShortcuts,
    ...cardShortcuts,
    ...headerShortcuts,
    ...educationShortcuts,
    ...skillShortcuts,
    ...heroShortcuts,
    ...blogShortcuts,
    ...blogPostShortcuts,
}
