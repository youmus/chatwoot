import assignmentPoliciesAPI from '../../../api/assignmentPolicies';

export const actions = {
  get: async ({ commit }) => {
    commit('setUIFlag', { isFetching: true });
    try {
      const response = await assignmentPoliciesAPI.get();
      commit('setAssignmentPolicies', response.data);
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isFetching: false });
    }
  },

  show: async ({ commit }, id) => {
    try {
      const response = await assignmentPoliciesAPI.show(id);
      commit('setAssignmentPolicy', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  },

  create: async ({ commit }, data) => {
    commit('setUIFlag', { isCreating: true });
    try {
      const response = await assignmentPoliciesAPI.create(data);
      commit('setAssignmentPolicy', response.data);
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
      const response = await assignmentPoliciesAPI.update(id, data);
      commit('setAssignmentPolicy', response.data);
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
      await assignmentPoliciesAPI.delete(id);
      commit('deleteAssignmentPolicy', id);
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isDeleting: false });
    }
  },

  updatePriority: async ({ commit }, { id, priority }) => {
    try {
      const response = await assignmentPoliciesAPI.updatePriority(id, priority);
      commit('setAssignmentPolicy', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  },
};