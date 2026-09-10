/**
 * Theme handling.
 *
 * `theme` is always one of `system` / `dark` / `light`; the resolved theme that
 * actually reaches the DOM is `dark` or `light`. Every function returns the
 * *stored* theme so callers such as <ThemeToggle> can render the matching icon
 * instead of ending up with `data-theme="undefined"`.
 */
export type Theme = 'system' | 'dark' | 'light';

const THEMES: readonly Theme[] = ['system', 'dark', 'light'];
const STORAGE_KEY = 'theme';
const THEME_COLORS: Record<Exclude<Theme, 'system'>, string> = {
    dark: '#0B0B10',
    light: '#FCFCFD',
};

const isTheme = (value: unknown): value is Theme =>
    typeof value === 'string' && (THEMES as readonly string[]).includes(value);

export function getTheme(): Theme | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return isTheme(stored) ? stored : null;
    } catch {
        // localStorage can throw in private mode / blocked-cookie contexts
        return null;
    }
}

/** The system preference, resolved to a concrete theme. */
function systemTheme(): 'dark' | 'light' {
    return typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

let mediaQuery: MediaQueryList | null = null;
let mediaListener: ((event: MediaQueryListEvent) => void) | null = null;

/**
 * Follow the OS colour scheme. Calling this repeatedly is safe: the listener is
 * installed at most once, which used to leak a new listener on every cycle
 * through the `system` theme.
 */
export function listenThemeChange(theme?: string) {
    if (theme && theme !== 'system') return;
    if (typeof window === 'undefined' || !window.matchMedia) return;

    mediaQuery ??= window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaListener) return;

    mediaListener = (event) => {
        setTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', mediaListener);
}

/**
 * Apply a theme.
 *
 * - `setTheme('dark', true)` stores and applies `dark`.
 * - `setTheme(undefined, true)` cycles system -> dark -> light -> system.
 * - `setTheme()` (no save) just re-applies whatever is stored.
 *
 * Returns the stored theme, never `undefined`.
 */
export function setTheme(theme?: string, save = false): Theme {
    let next: Theme;

    if (theme) {
        if (!isTheme(theme)) return getTheme() ?? 'system';
        next = theme;
        if (save) {
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch {
                /* storage unavailable – theme still applies for this page */
            }
        }
    } else {
        const current = getTheme() ?? 'system';
        next = save ? THEMES[(THEMES.indexOf(current) + 1) % THEMES.length] : current;
        if (save) {
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch {
                /* ignore */
            }
        }
    }

    const resolved = next === 'system' ? systemTheme() : next;
    if (next === 'system') listenThemeChange(next);

    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
    document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', THEME_COLORS[resolved]);

    return next;
}
