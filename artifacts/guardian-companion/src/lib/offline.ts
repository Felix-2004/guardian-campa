interface QueuedSos {
  lat: number;
  lng: number;
  message?: string;
  timestamp: number;
}

const QUEUE_KEY = "guardian_sos_queue";
const LOCATION_KEY = "guardian_last_location";

export function isOnline() {
  return navigator.onLine;
}

export function saveLastLocation(lat: number, lng: number) {
  localStorage.setItem(LOCATION_KEY, JSON.stringify({ lat, lng }));
}

export function getLastLocation(): { lat: number; lng: number } | null {
  const data = localStorage.getItem(LOCATION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function queueSos(lat: number, lng: number, message?: string) {
  const queue: QueuedSos[] = getQueue();
  queue.push({ lat, lng, message, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function getQueue(): QueuedSos[] {
  const data = localStorage.getItem(QUEUE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

export function hasPendingQueue() {
  return getQueue().length > 0;
}
