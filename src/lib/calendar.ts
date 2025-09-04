export function generateICSFile(booking: {
  client_name: string;
  client_email: string;
  client_phone?: string;
  scheduled_date: string;
  scheduled_time: string;
  project_details?: string;
  services?: {
    title: string;
    vendor?: {
      name: string;
    };
  };
}) {
  const startDate = new Date(`${booking.scheduled_date}T${convertTimeToISOTime(booking.scheduled_time)}`);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[:-]/g, '').replace(/\.\d{3}/, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Circle Marketplace//Consultation Booking//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@circlemarketplace.io`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:Consultation: ${booking.services?.title || 'Service Consultation'}`,
    `DESCRIPTION:Consultation with ${booking.client_name}\\n` +
    `Email: ${booking.client_email}\\n` +
    `Phone: ${booking.client_phone || 'Not provided'}\\n` +
    `Vendor: ${booking.services?.vendor?.name || 'TBD'}\\n\\n` +
    `Project Details:\\n${booking.project_details || 'No details provided'}`,
    `ATTENDEE;CN=${booking.client_name}:mailto:${booking.client_email}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return icsContent;
}

export function downloadICSFile(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

function convertTimeToISOTime(timeString: string): string {
  // Convert "11:00 AM CST" to "11:00:00"
  const time = timeString.replace(/\s*(AM|PM|CST|EST|PST|MST)\s*/gi, '');
  const [hours, minutes] = time.split(':');
  let hour24 = parseInt(hours);
  
  if (timeString.toLowerCase().includes('pm') && hour24 !== 12) {
    hour24 += 12;
  } else if (timeString.toLowerCase().includes('am') && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes || '00'}:00`;
}