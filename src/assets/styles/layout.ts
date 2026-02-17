// src/assets/styles/layout.ts
export const layoutShortcuts = {
    // ========== Flex Layout ==========
    // Basic flex
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'flex-start': 'flex items-center justify-start',
    'flex-end': 'flex items-center justify-end',

    // Flex with wrap
    'flex-wrap-center': 'flex flex-wrap items-center justify-center',
    'flex-wrap-between': 'flex flex-wrap items-center justify-between',
    'flex-wrap-start': 'flex flex-wrap items-center justify-start',
    'flex-wrap-end': 'flex flex-wrap items-center justify-end',

    // Flex with gap
    'flex-center-gap': 'flex items-center justify-center gap-4',
    'flex-between-gap': 'flex items-center justify-between gap-4',
    'flex-start-gap': 'flex items-center justify-start gap-4',
    'flex-end-gap': 'flex items-center justify-end gap-4',

    // Flex with responsive
    'flex-center-responsive': 'flex flex-col md:flex-row items-center justify-center gap-4',
    'flex-between-responsive': 'flex flex-col md:flex-row items-center justify-between gap-4',
    'flex-start-responsive': 'flex flex-col md:flex-row items-center justify-start gap-4',

    // ========== Stack (Column) Layout ==========
    // Basic stack
    'stack-center': 'flex flex-col items-center justify-center',
    'stack-between': 'flex flex-col items-center justify-between',
    'stack-start': 'flex flex-col items-start justify-start',
    'stack-end': 'flex flex-col items-end justify-end',

    // Stack with gap
    'stack-center-gap': 'flex flex-col items-center justify-center gap-4',
    'stack-between-gap': 'flex flex-col items-center justify-between gap-4',
    'stack-start-gap': 'flex flex-col items-start justify-start gap-4',
    'stack-end-gap': 'flex flex-col items-end justify-end gap-4',

    // ========== Grid Layout ==========
    // Basic grid
    // 'grid-2': 'grid grid-cols-1 sm:grid-cols-2 gap-4',
    // 'grid-3': 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
    // 'grid-4': 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
    // 'grid-5': 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4',
    // 'grid-6': 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4',

    // Auto-fit grid
    // 'grid-auto-fit': 'grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4',
    // 'grid-auto-fit-sm': 'grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4',
    // 'grid-auto-fit-md': 'grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4',
    // 'grid-auto-fit-lg': 'grid grid-cols-[repeat(auto-fit,minmax(350px,1fr))] gap-4',

    // Auto-fill grid
    // 'grid-auto-fill': 'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4',
    // 'grid-auto-fill-sm': 'grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4',
    // 'grid-auto-fill-md': 'grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4',

    // ========== Common Layout Patterns ==========
    // Card layouts
    // 'card-grid': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    // 'card-list': 'flex flex-col gap-4',
    // 'card-row': 'flex flex-wrap items-center gap-4',
    
    // 'content-container': 'max-w-3xl mx-auto',
    // 'footer-container': 'bg-muted border-t border-border',

    // ========== Common Combinations ==========
    'flex-center-spread': 'flex items-center justify-center flex-1 gap-2 p-3',
    'flex-between-spread': 'flex items-center justify-between flex-1 gap-2 p-3',
    'stack-center-spread': 'flex flex-col items-center justify-center flex-1 gap-3 p-3',
    'stack-start-spread': 'flex flex-col items-start justify-start flex-1 gap-3 p-3',
}