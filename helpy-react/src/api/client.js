import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

export function withOrgParams(orgId, extra = {}) {
  return { params: { org_id: orgId, ...extra } };
}

export default apiClient;
