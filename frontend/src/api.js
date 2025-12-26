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

export const generateLessonStream = async (topic, userId, onUpdate) => {
  const response = await fetch(`${API_BASE_URL}/generate-lesson-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic, user_id: userId }),
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

export const editPresentation = async (presentationId, editRequest) => {
  const response = await api.post(`/edit-presentation/${presentationId}`, { request: editRequest });
  return response.data;
};

export const listLessons = async () => {
  const response = await api.get('/lessons');
  return response.data;
};

export const downloadLesson = async (lessonId, userId) => {
  const response = await api.get(`/lesson/${lessonId}/download`, {
    params: { user_id: userId },
    responseType: 'blob'
  });
  return response.data;
};

// ==================== Presentation API ====================

export const generatePresentationStream = async (topic, userId, onUpdate) => {
  const response = await fetch(`${API_BASE_URL}/generate-presentation-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic, user_id: userId }),
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

export const downloadPresentation = async (presentationId, userId) => {
  const response = await api.get(`/presentation/${presentationId}/download`, {
    params: { user_id: userId },
    responseType: 'blob'
  });
  return response.data;
};

// ==================== Worksheet API ====================

export const generateWorksheetStream = async (topic, userId, onUpdate) => {
  const response = await fetch(`${API_BASE_URL}/generate-worksheet-stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ topic, user_id: userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate worksheet');
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
              console.log('Parsing worksheet SSE data:', jsonStr.substring(0, 100));
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

export const getWorksheet = async (worksheetId) => {
  const response = await api.get(`/worksheet/${worksheetId}`);
  return response.data;
};

export const downloadWorksheet = async (worksheetId, userId) => {
  const response = await api.get(`/worksheet/${worksheetId}/download`, {
    params: { user_id: userId },
    responseType: 'blob'
  });
  return response.data;
};

export default api;
