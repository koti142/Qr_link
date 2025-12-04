/**
 * Generate video ID with optional text fields
 * Format varies based on available fields
 * Examples:
 * - Course1_Lesson1_Module1_Activity1
 * - Grade3_Module2_ActivityName
 * - VID_timestamp (fallback if no fields provided)
 */
export function generateVideoId(data) {
  const { course, grade, lesson, module, activity, topic, title } = data;
  const parts = [];
  
  // Helper function to clean and shorten text
  const cleanText = (text, maxLength = 20) => {
    if (!text) return '';
    return text.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '').substring(0, maxLength);
  };
  
  // Build ID from available fields in hierarchy order
  if (course) {
    const courseStr = cleanText(course, 20);
    if (courseStr) parts.push(courseStr);
  }
  if (grade) {
    const gradeStr = cleanText(grade, 20);
    if (gradeStr) parts.push(gradeStr);
  }
  if (lesson) {
    const lessonStr = cleanText(lesson, 20);
    if (lessonStr) parts.push(lessonStr);
  }
  if (module) {
    const moduleStr = cleanText(module, 20);
    if (moduleStr) parts.push(moduleStr);
  }
  if (activity) {
    const activityStr = cleanText(activity, 30);
    if (activityStr) parts.push(activityStr);
  } else if (topic) {
    const topicStr = cleanText(topic, 30);
    if (topicStr) parts.push(topicStr);
  } else if (title) {
    const titleStr = cleanText(title, 30);
    if (titleStr) parts.push(titleStr);
  }
  
  // If we have parts, join them
  if (parts.length > 0) {
    return parts.join('_');
  }
  
  // Fallback: use timestamp
  return `VID_${Date.now()}`;
}

/**
 * Parse video ID to extract components
 */
export function parseVideoId(videoId) {
  const match = videoId.match(/^G(\d+)_U(\d+)_L(\d+)_(.+)$/);
  if (!match) {
    return null;
  }
  
  return {
    grade: parseInt(match[1]),
    unit: parseInt(match[2]),
    lesson: parseInt(match[3]),
    topic: match[4]
  };
}

/**
 * Generate folder path for video storage
 * Uses available text fields to create organized structure
 */
export function generateVideoPath(data) {
  const { course, grade, lesson, module } = data;
  const parts = [];
  
  // Helper function to clean text for folder names
  const cleanFolderName = (text) => {
    if (!text) return '';
    return text.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  };
  
  if (course) {
    const courseStr = cleanFolderName(course);
    if (courseStr) parts.push(courseStr);
  }
  if (grade) {
    const gradeStr = cleanFolderName(grade);
    if (gradeStr) parts.push(gradeStr);
  }
  if (lesson) {
    const lessonStr = cleanFolderName(lesson);
    if (lessonStr) parts.push(lessonStr);
  }
  if (module) {
    const moduleStr = cleanFolderName(module);
    if (moduleStr) parts.push(moduleStr);
  }
  
  // If no structure available, use "misc" folder
  if (parts.length === 0) {
    return 'misc';
  }
  
  return parts.join('/');
}

