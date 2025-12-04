export function generateVideoId(data) {
  const parts = [
    data.course || 'misc',
    data.grade || '',
    data.lesson || '',
    data.module || '',
    data.activity || ''
  ].filter(Boolean);
  
  return parts.join('_') || `VID_${Date.now()}`;
}

export function generateVideoPath(data) {
  const parts = [
    data.course || 'misc',
    data.grade || '',
    data.lesson || '',
    data.module || '',
    data.activity || ''
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join('/') : 'misc';
}

