const STORAGE_KEY = 'grampulse_offline_surveys_v1';

/**
 * Dispatch an event when queue updates so navbar/hooks can react in real-time
 */
function notifyQueueChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('grampulse:offline_queue_changed', {
      detail: { count: getOfflineCount() }
    }));
  }
}

/**
 * Retrieve all pending surveys from local storage
 */
export function getOfflineQueue() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read offline surveys queue:', err);
    return [];
  }
}

/**
 * Count total pending offline surveys
 */
export function getOfflineCount() {
  return getOfflineQueue().length;
}

/**
 * Enqueue a new survey record locally when offline
 */
export function saveOfflineSurvey(surveyData) {
  if (!surveyData) return null;

  try {
    const queue = getOfflineQueue();
    const tempId = surveyData.id || `OFFLINE-${Date.now().toString().slice(-6)}`;
    
    const record = {
      ...surveyData,
      id: tempId,
      _isOfflineSaved: true,
      _offlineTimestamp: new Date().toISOString()
    };

    // Prevent duplicate entries by ID
    const updated = [record, ...queue.filter(item => item.id !== tempId)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyQueueChanged();
    return record;
  } catch (err) {
    console.error('Failed to save survey to offline queue:', err);
    throw new Error('ऑफ़लाइन मेमोरी में सर्वे सुरक्षित नहीं हो सका');
  }
}

/**
 * Remove an item from the offline queue after successful Firestore sync
 */
export function removeOfflineSurvey(id) {
  if (!id) return;
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    notifyQueueChanged();
  } catch (err) {
    console.warn('Failed to remove synced item from offline queue:', err);
  }
}

/**
 * Clear the entire offline queue
 */
export function clearOfflineQueue() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyQueueChanged();
  } catch (err) {
    console.warn('Failed to clear offline queue:', err);
  }
}
