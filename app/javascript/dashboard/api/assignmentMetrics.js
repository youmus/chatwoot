/* global axios */
import ApiClient from './ApiClient';

export class AssignmentMetricsAPI extends ApiClient {
  constructor() {
    super('reports/assignment_metrics', { accountScoped: true });
  }

  // GET /api/v1/accounts/:accountId/reports/assignment_metrics
  get(params = {}) {
    return axios.get(this.url, { params });
  }

  // GET /api/v1/accounts/:accountId/reports/assignment_metrics/agent_history
  getAgentHistory(params = {}) {
    return axios.get(`${this.url}/agent_history`, { params });
  }

  // GET /api/v1/accounts/:accountId/reports/assignment_metrics/policy_performance
  getPolicyPerformance(params = {}) {
    return axios.get(`${this.url}/policy_performance`, { params });
  }

  // GET /api/v1/accounts/:accountId/reports/assignment_metrics/agent_utilization
  getAgentUtilization(params = {}) {
    return axios.get(`${this.url}/agent_utilization`, { params });
  }

  // GET /api/v1/accounts/:accountId/reports/assignment_metrics/assignment_distribution
  getAssignmentDistribution(params = {}) {
    return axios.get(`${this.url}/assignment_distribution`, { params });
  }

  // Export report data
  exportReport(type, params = {}) {
    return axios.get(`${this.url}/export`, {
      params: { type, ...params },
      responseType: 'blob',
    });
  }
}

export default new AssignmentMetricsAPI();