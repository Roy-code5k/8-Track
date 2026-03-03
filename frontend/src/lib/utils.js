import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely (ShadcnUI pattern)
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format a date to readable string
 */
export function formatDate(date) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date));
}

/**
 * Get status label for attendance percentage
 */
export function getStatusLabel(status) {
    switch (status) {
        case 'safe': return 'Safe';
        case 'warning': return 'Warning';
        case 'danger': return 'Danger';
        default: return 'Unknown';
    }
}

/**
 * Priority colors for tasks
 */
export const PRIORITY_COLORS = {
    high: 'text-red-400 bg-red-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    low: 'text-blue-400 bg-blue-400/10',
};
