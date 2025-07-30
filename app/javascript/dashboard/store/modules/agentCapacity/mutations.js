import Vue from 'vue';

export const mutations = {
  setUIFlag(state, data) {
    state.uiFlags = {
      ...state.uiFlags,
      ...data,
    };
  },

  setCapacityPolicies(state, policies) {
    state.policies = {};
    policies.forEach(policy => {
      Vue.set(state.policies, policy.id, policy);
    });
  },

  setCapacityPolicy(state, policy) {
    Vue.set(state.policies, policy.id, policy);
  },

  deleteCapacityPolicy(state, id) {
    Vue.delete(state.policies, id);
  },

  setAgentCapacities(state, capacities) {
    if (Array.isArray(capacities)) {
      capacities.forEach(capacity => {
        Vue.set(state.agentCapacities, capacity.agent_id, capacity);
      });
    } else {
      state.agentCapacities = capacities;
    }
  },

  setAgentCapacity(state, capacity) {
    Vue.set(state.agentCapacities, capacity.agent_id, capacity);
  },

  deleteAgentCapacity(state, agentId) {
    Vue.delete(state.agentCapacities, agentId);
  },
};