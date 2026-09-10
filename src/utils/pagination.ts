/**
 * Shared pagination helpers.
 *
 * Page 1 always lives at the collection root (`/blog/`) so that the listing has
 * one canonical URL; later pages live under `/blog/page/N/`.
 */

export interface PageSlice<T> {
	items: T[];
	page: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
	hasPrev: boolean;
	hasNext: boolean;
	/** 1-based index of the first item on this page (0 when empty). */
	firstItem: number;
	lastItem: number;
}

/** Clamp a page number into `1 … totalPages`. */
export function clampPage(page: number, totalPages: number): number {
	if (!Number.isFinite(page)) return 1;
	return Math.min(Math.max(Math.trunc(page), 1), Math.max(totalPages, 1));
}

export function paginate<T>(items: T[], page: number, perPage: number): PageSlice<T> {
	const totalItems = items.length;
	const totalPages = Math.max(Math.ceil(totalItems / perPage), 1);
	const current = clampPage(page, totalPages);
	const start = (current - 1) * perPage;
	const slice = items.slice(start, start + perPage);

	return {
		items: slice,
		page: current,
		perPage,
		totalItems,
		totalPages,
		hasPrev: current > 1,
		hasNext: current < totalPages,
		firstItem: slice.length ? start + 1 : 0,
		lastItem: start + slice.length,
	};
}

/**
 * `/blog/` for page 1, `/blog/page/2/` afterwards.
 * `basePath` may be given with or without a trailing slash.
 */
export function pageHref(basePath: string, page: number): string {
	const base = basePath.replace(/\/+$/, '') || '';
	if (page <= 1) return `${base}/`;
	return `${base}/page/${page}/`;
}

/**
 * Windowed page list: `1 … 4 5 6 … 12`.
 * `siblings` is the number of pages shown either side of the current one.
 */
export function pageNumbers(
	current: number,
	total: number,
	siblings = 1,
): (number | 'gap')[] {
	const pages: (number | 'gap')[] = [];
	const window = siblings * 2 + 5;

	if (total <= window) {
		for (let i = 1; i <= total; i += 1) pages.push(i);
		return pages;
	}

	const left = Math.max(current - siblings, 2);
	const right = Math.min(current + siblings, total - 1);

	pages.push(1);
	if (left > 2) pages.push('gap');
	for (let i = left; i <= right; i += 1) pages.push(i);
	if (right < total - 1) pages.push('gap');
	pages.push(total);

	return pages;
}

/** `getStaticPaths` params for every page after the first. */
export function laterPageParams(totalItems: number, perPage: number) {
	const totalPages = Math.max(Math.ceil(totalItems / perPage), 1);
	return Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) => ({
		params: { page: String(index + 2) },
		props: { page: index + 2 },
	}));
}
