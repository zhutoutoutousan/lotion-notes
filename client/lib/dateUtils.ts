export function formatDate(date: Date, format: string = 'MMM d, yyyy h:mm a'): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  const month = months[date.getMonth()];
  const shortMonth = shortMonths[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  
  // Simple format function that returns a formatted date string
  function formatDateString(formatStr: string): string {
    let result = formatStr;
    
    // Replace month formats
    if (result.includes('MMMM')) result = result.replace('MMMM', month);
    if (result.includes('MMM')) result = result.replace('MMM', shortMonth);
    if (result.includes('MM')) result = result.replace('MM', String(date.getMonth() + 1).padStart(2, '0'));
    if (result.includes('M')) result = result.replace('M', String(date.getMonth() + 1));
    
    // Replace day formats
    if (result.includes('dd')) result = result.replace('dd', String(day).padStart(2, '0'));
    if (result.includes('d')) result = result.replace('d', String(day));
    
    // Replace year formats
    if (result.includes('yyyy')) result = result.replace('yyyy', String(year));
    if (result.includes('yy')) result = result.replace('yy', String(year).slice(-2));
    
    // Replace time formats
    if (result.includes('hh')) result = result.replace('hh', String(hours).padStart(2, '0'));
    if (result.includes('h')) result = result.replace('h', String(hours));
    if (result.includes('mm')) result = result.replace('mm', minutesStr);
    if (result.includes('a')) result = result.replace('a', ampm);
    
    return result;
  }
  
  return formatDateString(format);
} 