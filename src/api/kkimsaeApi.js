import {
  request,
  getTokens,
  establishSession,
  clearSession,
} from './client';

export const kkimsaeApi = {
  signup: ({ email, password, nickname }) =>
    request(
      '/api/members/signup',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          nickname,
        }),
      },
      { auth: false }
    ),

  login: async ({ email, password }) => {
    const tokens = await request(
      '/api/members/login',
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      },
      { auth: false }
    );

    establishSession(tokens);

    return tokens;
  },

  me: () => request('/api/members/me'),

  logout: async () => {
    const refreshToken = getTokens()?.refreshToken;

    // 먼저 현재 브라우저의 로그인 상태 제거
    clearSession();

    if (!refreshToken) return;

    return request(
      '/api/members/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
      { auth: false }
    );
  },

  getIncidents: () => request('/api/incidents'),

  getIncident: (incidentId) =>
    request(`/api/incidents/${incidentId}`),

  createIncident: (payload) =>
    request('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateIncident: (incidentId, payload) =>
    request(`/api/incidents/${incidentId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteIncident: (incidentId) =>
    request(`/api/incidents/${incidentId}`, {
      method: 'DELETE',
    }),

  getTimeline: (incidentId) =>
    request(`/api/incidents/${incidentId}/timeline`),

  createTimelineEvent: (incidentId, payload) =>
    request(`/api/incidents/${incidentId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateTimelineEvent: (incidentId, eventId, payload) =>
    request(
      `/api/incidents/${incidentId}/timeline/${eventId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      }
    ),

  deleteTimelineEvent: (incidentId, eventId) =>
    request(
      `/api/incidents/${incidentId}/timeline/${eventId}`,
      {
        method: 'DELETE',
      }
    ),

  // 기존 AI 분석 요청 형식 유지
  analyze: ({ text, situation }) =>
    request(
      '/api/analysis',
      {
        method: 'POST',
        body: JSON.stringify({ text, situation }),
      },
      { auth: false }
    ),
};