
// src/utils/formatTime.js - Missing utility function
export function formatTime(date) {
  if (!date) return ''
  
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(new Date(date))
}