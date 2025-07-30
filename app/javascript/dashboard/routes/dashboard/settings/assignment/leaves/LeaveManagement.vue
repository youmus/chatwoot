<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore, useStoreGetters } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAccount } from 'dashboard/composables/useAccount';
import { useAdmin } from 'dashboard/composables/useAdmin';
import BaseSettingsHeader from '../../components/BaseSettingsHeader.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Table from 'dashboard/components/table/Table.vue';
import ConfirmationModal from 'dashboard/components/widgets/modal/ConfirmationModal.vue';
import ApprovalModal from './components/ApprovalModal.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';
import EmptyState from 'dashboard/components/widgets/EmptyState.vue';
// Tabs components are globally registered as woot-tabs and woot-tabs-item
// Badge component doesn't exist - will use inline styling instead
// Use native select element instead

const store = useStore();
const getters = useStoreGetters();
const router = useRouter();
const { t } = useI18n();
const { currentUserId } = useAccount();
const { isAdmin } = useAdmin();

const leaves = computed(() => getters['leaves/getLeaves'].value);
const uiFlags = computed(() => getters['leaves/getUIFlags'].value);
const pendingLeaves = computed(() => getters['leaves/getPendingLeaves'].value);

const activeTab = ref('all');
const statusFilter = ref('all');
const loading = ref({});
const showDeletePopup = ref(false);
const showApprovalModal = ref(false);
const selectedLeave = ref(null);
const approvalAction = ref('');

const tabs = computed(() => [
  {
    key: 'all',
    label: t('ASSIGNMENT_SETTINGS.LEAVES.TABS.ALL'),
    count: leaves.value.length,
  },
  {
    key: 'my_leaves',
    label: t('ASSIGNMENT_SETTINGS.LEAVES.TABS.MY_LEAVES'),
    count: leaves.value.filter(leave => leave.agent_id === currentUserId.value)
      .length,
  },
  {
    key: 'pending_approvals',
    label: t('ASSIGNMENT_SETTINGS.LEAVES.TABS.PENDING_APPROVALS'),
    count: pendingLeaves.value.length,
  },
]);

const activeTabIndex = computed(() => {
  return tabs.value.findIndex(tab => tab.key === activeTab.value);
});

const statusOptions = [
  { value: 'all', label: t('COMMON.ALL') },
  { value: 'pending', label: t('ASSIGNMENT_SETTINGS.LEAVES.STATUS.PENDING') },
  { value: 'approved', label: t('ASSIGNMENT_SETTINGS.LEAVES.STATUS.APPROVED') },
  { value: 'rejected', label: t('ASSIGNMENT_SETTINGS.LEAVES.STATUS.REJECTED') },
];

const columns = [
  {
    title: t('ASSIGNMENT_SETTINGS.LEAVES.TABLE.AGENT'),
    key: 'agent',
    width: '20%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.LEAVES.TABLE.TYPE'),
    key: 'leave_type',
    width: '15%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.LEAVES.TABLE.DATES'),
    key: 'dates',
    width: '25%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.LEAVES.TABLE.REASON'),
    key: 'reason',
    width: '20%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.LEAVES.TABLE.STATUS'),
    key: 'status',
    width: '10%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.LEAVES.TABLE.ACTIONS'),
    key: 'actions',
    width: '10%',
  },
];

const filteredLeaves = computed(() => {
  let data = leaves.value;

  if (activeTab.value === 'my_leaves') {
    data = data.filter(leave => leave.agent_id === currentUserId.value);
  } else if (activeTab.value === 'pending_approvals') {
    data = pendingLeaves.value;
  }

  if (statusFilter.value !== 'all') {
    data = data.filter(leave => leave.status === statusFilter.value);
  }

  return data;
});

const fetchLeaves = async () => {
  if (activeTab.value === 'all') {
    await store.dispatch('leaves/get');
  } else if (activeTab.value === 'my_leaves') {
    await store.dispatch('leaves/getMyLeaves');
  } else if (activeTab.value === 'pending_approvals') {
    await store.dispatch('leaves/getPendingApprovals');
  }
};

onMounted(() => {
  fetchLeaves();
});

const onTabChange = index => {
  if (index >= 0 && index < tabs.value.length) {
    activeTab.value = tabs.value[index].key;
    statusFilter.value = 'all';
    fetchLeaves();
  }
};

const navigateToNew = () => {
  router.push({ name: 'assignment_leaves_new' });
};

const viewLeave = leave => {
  router.push({
    name: 'assignment_leaves_details',
    params: { id: leave.id },
  });
};

const openDeletePopup = leave => {
  selectedLeave.value = leave;
  showDeletePopup.value = true;
};

const closeDeletePopup = () => {
  selectedLeave.value = null;
  showDeletePopup.value = false;
};

const confirmDelete = async () => {
  if (!selectedLeave.value) return;

  try {
    loading.value[selectedLeave.value.id] = true;
    await store.dispatch('leaves/delete', selectedLeave.value.id);
    useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.DELETE.SUCCESS'));
    closeDeletePopup();
  } catch (error) {
    useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.DELETE.ERROR'));
  } finally {
    loading.value[selectedLeave.value.id] = false;
  }
};

const openApprovalModal = (leave, action) => {
  selectedLeave.value = leave;
  approvalAction.value = action;
  showApprovalModal.value = true;
};

const closeApprovalModal = () => {
  selectedLeave.value = null;
  approvalAction.value = '';
  showApprovalModal.value = false;
};

const handleApproval = async notes => {
  if (!selectedLeave.value) return;

  try {
    if (approvalAction.value === 'approve') {
      await store.dispatch('leaves/approve', {
        id: selectedLeave.value.id,
        approverNotes: notes,
      });
      useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.APPROVE.SUCCESS'));
    } else {
      await store.dispatch('leaves/reject', {
        id: selectedLeave.value.id,
        approverNotes: notes,
      });
      useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.REJECT.SUCCESS'));
    }
    closeApprovalModal();
    fetchLeaves();
  } catch (error) {
    const message =
      approvalAction.value === 'approve'
        ? t('ASSIGNMENT_SETTINGS.LEAVES.APPROVE.ERROR')
        : t('ASSIGNMENT_SETTINGS.LEAVES.REJECT.ERROR');
    useAlert(message);
  }
};

// Removed getStatusBadgeVariant as we're using inline classes now

const canManageLeave = leave => {
  return isAdmin.value || leave.agent_id === currentUserId.value;
};
</script>

<template>
  <div>
    <BaseSettingsHeader
      :title="$t('ASSIGNMENT_SETTINGS.LEAVES.HEADER')"
      :description="$t('ASSIGNMENT_SETTINGS.LEAVES.SUBHEADER')"
      :button-text="$t('ASSIGNMENT_SETTINGS.LEAVES.NEW_BUTTON')"
      @click="navigateToNew"
    />

    <div class="p-8">
      <div class="mb-6">
        <woot-tabs :index="activeTabIndex" @change="onTabChange">
          <woot-tabs-item
            v-for="(tab, index) in tabs"
            :key="tab.key"
            :index="index"
            :name="tab.label"
            :count="tab.count"
          />
        </woot-tabs>
      </div>

      <div class="flex justify-between items-center mb-4">
        <div class="w-48">
          <label class="block text-sm font-medium text-slate-700 mb-1">
            {{ $t('ASSIGNMENT_SETTINGS.LEAVES.FILTER.STATUS') }}
          </label>
          <select
            v-model="statusFilter"
            class="w-full text-sm rounded-md border-slate-300"
          >
            <option
              v-for="option in statusOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>

      <div
        v-if="uiFlags.isFetching"
        class="flex items-center justify-center h-64"
      >
        <Spinner size="large" />
      </div>

      <EmptyState
        v-else-if="!filteredLeaves.length"
        :title="$t('ASSIGNMENT_SETTINGS.LEAVES.EMPTY.TITLE')"
        :message="$t('ASSIGNMENT_SETTINGS.LEAVES.EMPTY.MESSAGE')"
      >
        <Button
          variant="primary"
          size="medium"
          icon="add"
          @click="navigateToNew"
        >
          {{ $t('ASSIGNMENT_SETTINGS.LEAVES.NEW_BUTTON') }}
        </Button>
      </EmptyState>

      <div v-else>
        <Table :columns="columns" :data="filteredLeaves">
          <template #agent="{ row }">
            <div class="flex items-center gap-2">
              <img
                :src="row.agent.avatar_url"
                :alt="row.agent.name"
                class="w-8 h-8 rounded-full"
              />
              <div>
                <div class="font-medium text-slate-900">
                  {{ row.agent.name }}
                </div>
                <div class="text-xs text-slate-600">{{ row.agent.email }}</div>
              </div>
            </div>
          </template>

          <template #leave_type="{ row }">
            <span class="font-medium">{{ row.leave_type }}</span>
          </template>

          <template #dates="{ row }">
            <div class="text-sm">
              <div>
                {{ $d(new Date(row.start_date), 'short') }} -
                {{ $d(new Date(row.end_date), 'short') }}
              </div>
              <div class="text-slate-600">
                {{ row.total_days }} {{ $tc('COMMON.DAYS', row.total_days) }}
              </div>
            </div>
          </template>

          <template #reason="{ row }">
            <div class="text-sm text-slate-700 truncate" :title="row.reason">
              {{ row.reason }}
            </div>
          </template>

          <template #status="{ row }">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="[
                row.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : row.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : row.status === 'cancelled'
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-yellow-100 text-yellow-800',
              ]"
            >
              {{
                $t(
                  `ASSIGNMENT_SETTINGS.LEAVES.STATUS.${row.status.toUpperCase()}`
                )
              }}
            </span>
          </template>

          <template #actions="{ row }">
            <div class="flex items-center gap-1">
              <Button
                variant="clear"
                size="tiny"
                icon="eye"
                :title="$t('COMMON.VIEW')"
                @click="viewLeave(row)"
              />

              <template v-if="row.status === 'pending' && isAdmin">
                <Button
                  variant="clear"
                  size="tiny"
                  icon="checkmark"
                  color-scheme="success"
                  :title="$t('ASSIGNMENT_SETTINGS.LEAVES.APPROVE.BUTTON')"
                  @click="openApprovalModal(row, 'approve')"
                />
                <Button
                  variant="clear"
                  size="tiny"
                  icon="dismiss"
                  color-scheme="danger"
                  :title="$t('ASSIGNMENT_SETTINGS.LEAVES.REJECT.BUTTON')"
                  @click="openApprovalModal(row, 'reject')"
                />
              </template>

              <Button
                v-if="canManageLeave(row) && row.status === 'pending'"
                variant="clear"
                size="tiny"
                icon="delete"
                color-scheme="secondary"
                :loading="loading[row.id]"
                :title="$t('COMMON.DELETE')"
                @click="openDeletePopup(row)"
              />
            </div>
          </template>
        </Table>
      </div>
    </div>

    <ConfirmationModal
      v-model:show="showDeletePopup"
      :title="$t('ASSIGNMENT_SETTINGS.LEAVES.DELETE.TITLE')"
      :message="$t('ASSIGNMENT_SETTINGS.LEAVES.DELETE.MESSAGE')"
      :confirm-text="$t('COMMON.DELETE')"
      :cancel-text="$t('COMMON.CANCEL')"
      @confirm="confirmDelete"
      @cancel="closeDeletePopup"
    />

    <ApprovalModal
      v-model:show="showApprovalModal"
      :action="approvalAction"
      :leave="selectedLeave"
      @confirm="handleApproval"
      @cancel="closeApprovalModal"
    />
  </div>
</template>
