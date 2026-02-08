
export function parseRelativeDate(dateStr: string): Date {
    if (!dateStr) return new Date();

    const now = new Date();
    const cleanStr = dateStr.toLowerCase().trim();

    if (cleanStr.includes("ago")) {
        const num = parseInt(cleanStr.match(/\d+/)?.[0] || "0");
        if (cleanStr.includes("second") || cleanStr.includes("sec")) {
            return new Date(now.getTime() - num * 1000);
        } else if (cleanStr.includes("minute") || cleanStr.includes("min")) {
            return new Date(now.getTime() - num * 60 * 1000);
        } else if (cleanStr.includes("hour")) {
            return new Date(now.getTime() - num * 60 * 60 * 1000);
        } else if (cleanStr.includes("day")) {
            return new Date(now.getTime() - num * 24 * 60 * 60 * 1000);
        } else if (cleanStr.includes("week")) {
            return new Date(now.getTime() - num * 7 * 24 * 60 * 60 * 1000);
        } else if (cleanStr.includes("month")) {
            return new Date(now.getTime() - num * 30 * 24 * 60 * 60 * 1000);
        } else if (cleanStr.includes("year")) {
            return new Date(now.getTime() - num * 365 * 24 * 60 * 60 * 1000);
        }
    }

    // Try standard parsing
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
        return new Date(parsed);
    }

    // If snippet had a date like "Feb 5, 2024" at start
    // Already handled by regex in adapter, but let's be safe
    return new Date();
}
