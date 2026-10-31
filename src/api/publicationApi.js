import { request } from './client';

const publicationPath = (id) => `/api/incidents/${encodeURIComponent(id)}/publication`;
const adminPath = (id) => `/api/admin/publications/${encodeURIComponent(id)}`;
const post = (path, payload) => request(path, {
  method: 'POST',
  ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
});
export const publicationApi = {
  mine: (id) => request(publicationPath(id)),
  submit: (id) => post(publicationPath(id)),
  summary: (id) => post(`${publicationPath(id)}/summary`),
  withdraw: (id) => request(publicationPath(id), { method: 'DELETE' }),
  search: (query, page = 0) => request(`/api/public-cases/search?${new URLSearchParams({ query, page, size: 20 })}`, {}, { auth: false }),
  detail: (id) => request(`/api/public-cases/${encodeURIComponent(id)}`, {}, { auth: false }),
  list: (status, page = 0) => request(`/api/admin/publications?${new URLSearchParams({ status, page, size: 20 })}`),
  adminDetail: (id) => request(adminPath(id)),
  approve: (id, payload) => post(`${adminPath(id)}/approve`, payload),
  reject: (id, reason) => post(`${adminPath(id)}/reject`, { reason }),
};
