import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://p.fifty.chat/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const surveyApi = {
  // Получить все опросы
  getAllSurveys: async () => {
    const { data } = await client.get('/surveys');
    return data;
  },

  // Получить опросы пользователя
  getMysSurveys: async (creatorId) => {
    const { data } = await client.get('/surveys', {
      params: { creator_id: creatorId }
    });
    return data;
  },

  // Получить активные опросы
  getActiveSurveys: async () => {
    const { data } = await client.get('/surveys/active');
    return data;
  },

  // Получить опрос по ID
  getSurvey: async (id) => {
    const { data } = await client.get(`/surveys/${id}`);
    return data;
  },

  // Создать опрос
  createSurvey: async (surveyData) => {
    const { data } = await client.post('/surveys', surveyData);
    return data;
  },

  // Обновить опрос
  updateSurvey: async (id, surveyData) => {
    const { data } = await client.put(`/surveys/${id}`, surveyData);
    return data;
  },

  // Удалить опрос
  deleteSurvey: async (id) => {
    const { data } = await client.delete(`/surveys/${id}`);
    return data;
  },

  // Отправить ответы
  submitAnswers: async (id, answers) => {
    const { data } = await client.post(`/surveys/${id}/answers`, answers);
    return data;
  },

  // Получить статистику
  getStats: async (id) => {
    const { data } = await client.get(`/surveys/${id}/stats`);
    return data;
  },

  // Получить все ответы опроса
  getAllAnswers: async (id) => {
    const { data } = await client.get(`/surveys/${id}/answers`);
    return data;
  },
};

export default client;
