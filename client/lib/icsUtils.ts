/**
 * Utility functions for generating ICS (iCalendar) files
 */

/**
 * Formats a date to the ICS format (YYYYMMDDTHHMMSSZ)
 */
export function formatDateToICS(date: Date): string {
  // Use UTC methods to ensure consistent time zone handling
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters in ICS content
 */
export function escapeICSContent(content: string): string {
  return content
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an ICS file content from an array of calendar events
 */
export function generateICSContent(events: Array<{
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
}>): string {
  const now = new Date();
  const icsEvents = events.map(event => {
    const startDate = formatDateToICS(event.start);
    const endDate = formatDateToICS(event.end);
    const created = formatDateToICS(now);
    const uid = `uid-${Math.random().toString(36).substring(2, 15)}-${Date.now()}@lotion-notes`;
    
    return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${created}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${escapeICSContent(event.title)}
${event.description ? `DESCRIPTION:${escapeICSContent(event.description)}\n` : ''}${event.location ? `LOCATION:${escapeICSContent(event.location)}\n` : ''}END:VEVENT`;
  }).join('\n');
  
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lotion Notes//Calendar//EN
CALSCALE:GREGORIAN
X-WR-TIMEZONE:Asia/Shanghai
${icsEvents}
END:VCALENDAR`;
}

/**
 * Creates a downloadable ICS file from calendar events
 */
export function downloadICSFile(events: Array<{
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
}>, filename: string = 'calendar-events.ics'): void {
  const icsContent = generateICSContent(events);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} 