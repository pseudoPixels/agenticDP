import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

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

export default api;
