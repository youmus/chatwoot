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
      state.policies[policy.id] = policy;
    });
  },

  setCapacityPolicy(state, policy) {
    state.policies = {
      ...state.policies,
      [policy.id]: policy,
    };
  },

  deleteCapacityPolicy(state, id) {
    const { [id]: deleted, ...rest } = state.policies;
    state.policies = rest;
  },

  setAgentCapacities(state, capacities) {
    if (Array.isArray(capacities)) {
      const newCapacities = {};
      capacities.forEach(capacity => {
        newCapacities[capacity.agent_id] = capacity;
      });
      state.agentCapacities = {
        ...state.agentCapacities,
        ...newCapacities,
      };
    } else {
      state.agentCapacities = capacities;
    }
  },

  setAgentCapacity(state, capacity) {
    state.agentCapacities = {
      ...state.agentCapacities,
      [capacity.agent_id]: capacity,
    };
  },

  deleteAgentCapacity(state, agentId) {
    const { [agentId]: deleted, ...rest } = state.agentCapacities;
    state.agentCapacities = rest;
  },
};
