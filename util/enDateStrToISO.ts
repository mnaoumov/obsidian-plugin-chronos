export function enDatestrToISO(enDateStr: string) {
  // Remove ordinal suffixes (st, nd, rd, th) from the day of the month
  const cleanedDateString = enDateStr.replace(/(\d+)(st|nd|rd|th)/, "$1");

  const date = new Date(cleanedDateString);

  if (isNaN(date as unknown as number)) {
    console.error("Invalid date string in custom marker title");
  }

  return date.toISOString();
}
