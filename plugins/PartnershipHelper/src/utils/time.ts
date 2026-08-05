export function formatRelative(ms: number): string {
    const diff = Date.now() - ms;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "przed chwilą";

    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} ${plural(min, "minutę", "minuty", "minut")} temu`;

    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs} ${plural(hrs, "godzinę", "godziny", "godzin")} temu`;

    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} ${plural(days, "dzień", "dni", "dni")} temu`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ${plural(months, "miesiąc", "miesiące", "miesięcy")} temu`;

    const years = Math.floor(months / 12);
    return `${years} ${plural(years, "rok", "lata", "lat")} temu`;
}

function plural(n: number, one: string, few: string, many: string): string {
    if (n === 1) return one;
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
    return many;
}
