import Vue from 'vue';

export const mutations = {
  setUIFlag(state, data) {
    state.uiFlags = {
      ...state.uiFlags,
      ...data,
    };
  },

  setMeta(state, meta) {
    state.meta = meta;
  },

  setLeaves(state, leaves) {
    state.records = {};
    leaves.forEach(leave => {
      Vue.set(state.records, leave.id, leave);
    });
  },

  setLeave(state, leave) {
    Vue.set(state.records, leave.id, leave);
  },

  deleteLeave(state, id) {
    Vue.delete(state.records, id);
  },
};