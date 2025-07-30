import leavesAPI from '../../../api/leaves';

export const actions = {
  get: async ({ commit }, params = {}) => {
    commit('setUIFlag', { isFetching: true });
    try {
      const response = await leavesAPI.get(params);
      commit('setLeaves', response.data.leaves);
      commit('setMeta', response.data.meta);
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isFetching: false });
    }
  },

  show: async ({ commit }, id) => {
    try {
      const response = await leavesAPI.show(id);
      commit('setLeave', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    }
  },

  create: async ({ commit }, data) => {
    commit('setUIFlag', { isCreating: true });
    try {
      const response = await leavesAPI.create(data);
      commit('setLeave', response.data);
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
      const response = await leavesAPI.update(id, data);
      commit('setLeave', response.data);
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
      await leavesAPI.delete(id);
      commit('deleteLeave', id);
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isDeleting: false });
    }
  },

  approve: async ({ commit }, { id, approverNotes }) => {
    commit('setUIFlag', { isApproving: true });
    try {
      const response = await leavesAPI.approve(id, {
        approver_notes: approverNotes,
      });
      commit('setLeave', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isApproving: false });
    }
  },

  reject: async ({ commit }, { id, approverNotes }) => {
    commit('setUIFlag', { isRejecting: true });
    try {
      const response = await leavesAPI.reject(id, {
        approver_notes: approverNotes,
      });
      commit('setLeave', response.data);
      return response.data;
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isRejecting: false });
    }
  },

  getMyLeaves: async ({ commit }, params = {}) => {
    commit('setUIFlag', { isFetching: true });
    try {
      const response = await leavesAPI.getMyLeaves(params);
      commit('setLeaves', response.data.leaves);
      commit('setMeta', response.data.meta);
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isFetching: false });
    }
  },

  getPendingApprovals: async ({ commit }, params = {}) => {
    commit('setUIFlag', { isFetching: true });
    try {
      const response = await leavesAPI.getPendingApprovals(params);
      commit('setLeaves', response.data.leaves);
      commit('setMeta', response.data.meta);
    } catch (error) {
      throw new Error(error);
    } finally {
      commit('setUIFlag', { isFetching: false });
    }
  },
};
