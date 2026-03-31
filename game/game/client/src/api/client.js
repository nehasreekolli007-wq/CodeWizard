import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Player API
export const createPlayer = (data) => api.post('/player', data);
export const getPlayer    = (id)   => api.get(`/player/${id}`);
export const updateProgress = (id, data) => api.put(`/player/${id}/progress`, data);
export const getLeaderboard  = ()  => api.get('/player/leaderboard/top');

// Session API
export const createSession = (playerId)         => api.post('/session', { playerId });
export const logEvent      = (sessionId, data)  => api.post(`/session/${sessionId}/event`, data);

export default api;
