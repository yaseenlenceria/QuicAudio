export function getUserId(): string {
  const storageKey = 'voicelink_user_id';
  let userId = localStorage.getItem(storageKey);
  
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(storageKey, userId);
  }
  
  return userId;
}

export function clearUserId(): void {
  localStorage.removeItem('voicelink_user_id');
}
