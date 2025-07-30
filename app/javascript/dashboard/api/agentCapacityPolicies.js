/* global axios */
import ApiClient from './ApiClient';

export class AgentCapacityPoliciesAPI extends ApiClient {
  constructor() {
    super('agent_capacity_policies', { accountScoped: true });
  }

  // GET /api/v1/accounts/:accountId/agent_capacity_policies
  get(params = {}) {
    return axios.get(this.url, { params });
  }

  // GET /api/v1/accounts/:accountId/agent_capacity_policies/:id
  show(id) {
    return axios.get(`${this.url}/${id}`);
  }

  // POST /api/v1/accounts/:accountId/agent_capacity_policies
  create(data) {
    return axios.post(this.url, data);
  }

  // PUT /api/v1/accounts/:accountId/agent_capacity_policies/:id
  update(id, data) {
    return axios.put(`${this.url}/${id}`, data);
  }

  // DELETE /api/v1/accounts/:accountId/agent_capacity_policies/:id
  delete(id) {
    return axios.delete(`${this.url}/${id}`);
  }

  // POST /api/v1/accounts/:accountId/agent_capacity_policies/:id/assign_agents
  assignAgents(id, agentIds) {
    return axios.post(`${this.url}/${id}/assign_agents`, {
      agent_ids: agentIds,
    });
  }

  // POST /api/v1/accounts/:accountId/agent_capacity_policies/:id/remove_agents
  removeAgents(id, agentIds) {
    return axios.post(`${this.url}/${id}/remove_agents`, {
      agent_ids: agentIds,
    });
  }

  // GET /api/v1/accounts/:accountId/agent_capacity_policies/agent_capacities
  getAgentCapacities(params = {}) {
    return axios.get(`${this.url}/agent_capacities`, { params });
  }
}

export default new AgentCapacityPoliciesAPI();
