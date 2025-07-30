export const getters = {
  getAssignmentPolicies: state => Object.values(state.records),
  getAssignmentPolicy: state => id => state.records[id],
  getUIFlags: state => state.uiFlags,
  getActiveAssignmentPolicies: state => {
    return Object.values(state.records).filter(policy => policy.active);
  },
  getPoliciesByPriority: state => {
    return Object.values(state.records).sort((a, b) => a.priority - b.priority);
  },
};