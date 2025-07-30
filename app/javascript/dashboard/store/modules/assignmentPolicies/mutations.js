import Vue from 'vue';

export const mutations = {
  setUIFlag(state, data) {
    state.uiFlags = {
      ...state.uiFlags,
      ...data,
    };
  },

  setAssignmentPolicies(state, policies) {
    state.records = {};
    policies.forEach(policy => {
      Vue.set(state.records, policy.id, policy);
    });
  },

  setAssignmentPolicy(state, policy) {
    Vue.set(state.records, policy.id, policy);
  },

  deleteAssignmentPolicy(state, id) {
    Vue.delete(state.records, id);
  },
};