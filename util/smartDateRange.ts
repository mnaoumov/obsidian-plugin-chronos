// /** Simplifies single dates or ranges to the minimum specific granularity, locale dependant */
// /** ex: Feb 2, 2024 */
// export function smartDateRange(
//   startDateStr: string,
//   endDateStr: string | null = null,
//   locale: string
// ) {
//   const startDate = new Date(startDateStr);
//   const endDate = endDateStr ? new Date(endDateStr) : null;

//   const optionsYearOnly = { year: "numeric" };
//   const optionsYearMonth = { year: "numeric", month: "short" };
//   const optionsFullDate = { year: "numeric", month: "short", day: "numeric" };

//   const formatterYearOnly = new Intl.DateTimeFormat(
//     locale,
//     optionsYearOnly as Intl.DateTimeFormatOptions
//   );
//   const formatterYearMonth = new Intl.DateTimeFormat(
//     locale,
//     optionsYearMonth as Intl.DateTimeFormatOptions
//   );
//   const formatterFullDate = new Intl.DateTimeFormat(
//     locale,
//     optionsFullDate as Intl.DateTimeFormatOptions
//   );

//   function formatSpecificDate(date: Date) {
//     if (
//       date.getHours() !== 0 ||
//       date.getMinutes() !== 0 ||
//       date.getSeconds() !== 0
//     ) {
//       return new Intl.DateTimeFormat(locale, {
//         ...optionsFullDate,
//         hour: "numeric",
//         minute: "numeric",
//       } as Intl.DateTimeFormatOptions).format(date);
//     } else if (date.getDate() !== 1) {
//       return formatterFullDate.format(date);
//     } else if (date.getMonth() !== 0) {
//       return formatterYearMonth.format(date);
//     } else {
//       return formatterYearOnly.format(date);
//     }
//   }

//   if (!endDate) {
//     return formatSpecificDate(startDate);
//   }

//   if (startDate.getFullYear() !== endDate.getFullYear()) {
//     return `${formatterFullDate.format(startDate)} - ${formatterFullDate.format(
//       endDate
//     )}`;
//   } else if (startDate.getMonth() !== endDate.getMonth()) {
//     return `${formatterYearMonth.format(
//       startDate
//     )} - ${formatterFullDate.format(endDate)}`;
//   } else {
//     const startDay = startDate.getDate();
//     const endDay = endDate.getDate();
//     const monthYear = formatterYearMonth.format(startDate);
//     return `${monthYear} ${startDay} - ${endDay}${_getDayCharacter(locale)}`;
//   }
// }

// /** add day character for languages like Korean, Japanese and Chinese */
function _getDayCharacter(locale: string) {
  const lang = locale.match(/^[a-z]{2}/i)?.[0];

  switch (lang) {
    // Korean
    case "ko":
      return "일";
    // Chinese & Japanese
    case "ja":
    case "zh":
      return "日";
    default:
      return "";
  }
}

function _getYearCharacter(locale: string) {
  const lang = locale.match(/^[a-z]{2}/i)?.[0];

  switch (lang) {
    // Korean
    case "ko":
      return "년";
    // Chinese & Japanese
    case "ja":
    case "zh":
      return "年";
    default:
      return "";
  }
}

const specialAsianLocales = ["ja", "ko", "zh"];

export function smartDateRange(
  startDate: string,
  endDate: string | null = null,
  locale: string
) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  // Options to format month and day as per locale
  const monthOptions = { month: "short" };
  const fullDateOptions = { month: "short", day: "numeric", year: "numeric" };

  // Check if start and end dates are the same day
  if (
    end &&
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  ) {
    // Format as "Feb 2, 2024" (single date)
    return start.toLocaleDateString(
      locale,
      fullDateOptions as Intl.DateTimeFormatOptions
    );
  }

  // Check if start and end dates are within the same month and year
  if (
    end &&
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    // Format as "Feb 2 - 3, 2024" in the specified locale
    const month = start.toLocaleDateString(
      locale,
      monthOptions as Intl.DateTimeFormatOptions
    );
    if (specialAsianLocales.includes(locale)) {
      return `${start.getFullYear()}${_getYearCharacter(
        locale
      )}${" "}${month}${" "}${start.getDate()}~${end.getDate()}${_getDayCharacter(
        locale
      )}`;
    }
    return `${month} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
  } else if (end) {
    // Different month/year case
    return `${start.toLocaleDateString(
      locale,
      fullDateOptions as Intl.DateTimeFormatOptions
    )} - ${end.toLocaleDateString(
      locale,
      fullDateOptions as Intl.DateTimeFormatOptions
    )}`;
  } else {
    // Single date without an end date
    return start.toLocaleDateString(
      locale,
      fullDateOptions as Intl.DateTimeFormatOptions
    );
  }
}
