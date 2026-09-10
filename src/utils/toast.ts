export interface ToastDetail {
    message: string;
    /** milliseconds; defaults to 2500 */
    time?: number;
}

export function showToast(detail: ToastDetail) {
    document.dispatchEvent(new CustomEvent<ToastDetail>('toast', { detail }));
}
