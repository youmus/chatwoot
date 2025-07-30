import agentCapacityPoliciesAPI from '../../../api/agentCapacityPolicies';

export const actions = {
  get: async ({ commit }, params = {}) => {
    commit('setUIFlag', { isFetching: true });
    try {
      const response = await agentCapacityPoliciesAPI.get(params);
      commit('setCapacityPolicies', response.data);
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isFetching: false });
    }
  },

  show: async ({ commit }, id) => {
    try {
      const response = await agentCapacityPoliciesAPI.show(id);
      commit('setCapacityPolicy', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  },

  create: async ({ commit }, data) => {
    commit('setUIFlag', { isCreating: true });
    try {
      const response = await agentCapacityPoliciesAPI.create(data);
      commit('setCapacityPolicy', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isCreating: false });
    }
  },

  update: async ({ commit }, { id, ...data }) => {
    commit('setUIFlag', { isUpdating: true });
    try {
      const response = await agentCapacityPoliciesAPI.update(id, data);
      commit('setCapacityPolicy', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isUpdating: false });
    }
  },

  delete: async ({ commit }, id) => {
    commit('setUIFlag', { isDeleting: true });
    try {
      await agentCapacityPoliciesAPI.delete(id);
      commit('deleteCapacityPolicy', id);
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isDeleting: false });
    }
  },

  assignAgents: async ({ commit }, { id, agentIds }) => {
    commit('setUIFlag', { isAssigningAgents: true });
    try {
      const response = await agentCapacityPoliciesAPI.assignAgents(
        id,
        agentIds
      );
      // Update agent capacities based on response
      if (response.data.agent_capacities) {
        commit('setAgentCapacities', response.data.agent_capacities);
      }
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isAssigningAgents: false });
    }
  },

  removeAgents: async ({ commit }, { id, agentIds }) => {
    commit('setUIFlag', { isAssigningAgents: true });
    try {
      const response = await agentCapacityPoliciesAPI.removeAgents(
        id,
        agentIds
      );
      // Remove agent capacities
      agentIds.forEach(agentId => {
        commit('deleteAgentCapacity', agentId);
      });
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isAssigningAgents: false });
    }
  },

  getAgentCapacities: async ({ commit }, params = {}) => {
    commit('setUIFlag', { isFetching: true });
    try {
      const response =
        await agentCapacityPoliciesAPI.getAgentCapacities(params);
      commit('setAgentCapacities', response.data);
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isFetching: false });
    }
  },
};
