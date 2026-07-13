import type { CourseData } from '$lib/types/course';

const EDIT_COPY_KEY = 'editCopyCourse';
const FIT_COURSE_KEY = 'fitCourseOnLoad';
const SKIP_BANNER_KEY = 'skipBanner';

export function setEditCopyHandoff(course: CourseData): void {
	sessionStorage.setItem(EDIT_COPY_KEY, JSON.stringify(course));
}

export function consumeEditCopyHandoff(): unknown {
	const raw = sessionStorage.getItem(EDIT_COPY_KEY);
	if (!raw) return null;
	sessionStorage.removeItem(EDIT_COPY_KEY);
	return JSON.parse(raw);
}

export function setFitCourseOnLoad(): void {
	sessionStorage.setItem(FIT_COURSE_KEY, 'true');
}

export function consumeFitCourseOnLoad(): boolean {
	if (!sessionStorage.getItem(FIT_COURSE_KEY)) return false;
	sessionStorage.removeItem(FIT_COURSE_KEY);
	return true;
}

export function setSkipBanner(): void {
	sessionStorage.setItem(SKIP_BANNER_KEY, 'true');
}

export function hasSkipBanner(): boolean {
	return !!sessionStorage.getItem(SKIP_BANNER_KEY);
}

export function consumeSkipBanner(): boolean {
	if (!sessionStorage.getItem(SKIP_BANNER_KEY)) return false;
	sessionStorage.removeItem(SKIP_BANNER_KEY);
	return true;
}
