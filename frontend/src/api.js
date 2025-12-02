import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateLesson = async (topic) => {
  const response = await api.post('/generate-lesson', { topic });
  return response.data;
};

export const generateLessonStream = async (topic, onUpdate) => {
  const response = await fetch(`${API_BASE_URL}/generate-lesson-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate lesson');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Decode and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Split by double newline (SSE message separator)
      const messages = buffer.split('\n\n');
      
      // Keep the last incomplete message in buffer
      buffer = messages.pop() || '';
      
      // Process complete messages
      for (const message of messages) {
        const lines = message.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              console.log('Parsing SSE data:', jsonStr.substring(0, 100));
              const data = JSON.parse(jsonStr);
              onUpdate(data);
            } catch (e) {
              console.error('Failed to parse SSE message:', line.substring(0, 100), e);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

export const generateImages = async (lessonId) => {
  const response = await api.post(`/generate-images/${lessonId}`);
  return response.data;
};

export const getLesson = async (lessonId) => {
  const response = await api.get(`/lesson/${lessonId}`);
  return response.data;
};

export const editLesson = async (lessonId, editRequest) => {
  const response = await api.post(`/edit-lesson/${lessonId}`, { request: editRequest });
  return response.data;
};

export const listLessons = async () => {
  const response = await api.get('/lessons');
  return response.data;
};

// ==================== Presentation API ====================

export const generatePresentationStream = async (topic, onUpdate) => {
  const response = await fetch(`${API_BASE_URL}/generate-presentation-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate presentation');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      // Decode and add to buffer
      buffer += decoder.decode(value, { stream: true });
      
      // Split by double newline (SSE message separator)
      const messages = buffer.split('\n\n');
      
      // Keep the last incomplete message in buffer
      buffer = messages.pop() || '';
      
      // Process complete messages
      for (const message of messages) {
        const lines = message.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              console.log('Parsing presentation SSE data:', jsonStr.substring(0, 100));
              const data = JSON.parse(jsonStr);
              onUpdate(data);
            } catch (e) {
              console.error('Failed to parse SSE message:', line.substring(0, 100), e);
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

export const getPresentation = async (presentationId) => {
  const response = await api.get(`/presentation/${presentationId}`);
  return response.data;
};

export const downloadPresentation = async (presentationId) => {
  const response = await fetch(`${API_BASE_URL}/presentation/${presentationId}/download`, {
    method: 'GET',
  });
  
  if (!response.ok) {
    throw new Error('Failed to download presentation');
  }
  
  const blob = await response.blob();
  return blob;
};

export default api;
