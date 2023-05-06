// https://stackoverflow.com/a/69122877
const timeDeltaFormatter = new Intl.RelativeTimeFormat("es-cl", { numeric: "auto" });

/** @type {Partial<Record<Intl.RelativeTimeFormatUnit, number>>} */
const timeDeltaRanges = {
  weeks: 3600 * 24 * 7,
  days: 3600 * 24,
  hours: 3600,
  minutes: 60,
  seconds: 1,
};

/** @param {Date | number} date */
export function getTimeAgo(date) {
  const d = new Date(+date);

  const seconds = (d.getTime() - Date.now()) / 1000;
  const unitRanges = /** @type {[Intl.RelativeTimeFormatUnit, number][]} */ (Object.entries(timeDeltaRanges));
  for (const [unit, range] of unitRanges) {
    if (Math.abs(seconds) > range || unit === "seconds") {
      const value = Math.round(seconds / range);
      return timeDeltaFormatter.format(value, unit);
    }
  }
  return "ahora";
}

/** @param {string} username */
export const getLinkGitHubUser = (username) =>
  `<a target="_blank" rel="noopener noreferrer" href="https://github.com/${username}">${username}</a>`;
