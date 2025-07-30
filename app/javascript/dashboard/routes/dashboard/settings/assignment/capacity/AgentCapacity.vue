<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore, useStoreGetters } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useConfig } from 'dashboard/composables/useConfig';
import BaseSettingsHeader from '../../components/BaseSettingsHeader.vue';
import BasePaywallModal from '../../components/BasePaywallModal.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Table from 'dashboard/components/table/Table.vue';
import ConfirmationModal from 'dashboard/components/widgets/modal/ConfirmationModal.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';
import EmptyState from 'dashboard/components/widgets/EmptyState.vue';
// Badge component doesn't exist - will use inline styling instead
// ProgressBar component will be implemented inline

const store = useStore();
const getters = useStoreGetters();
const router = useRouter();
const { t } = useI18n();
const { isEnterprise } = useConfig();

const policies = computed(
  () => getters['agentCapacity/getCapacityPolicies'].value
);
const agentCapacities = computed(
  () => getters['agentCapacity/getAgentCapacities'].value
);
const uiFlags = computed(() => getters['agentCapacity/getUIFlags'].value);

const activeTab = ref('policies');
const loading = ref({});
const showDeletePopup = ref(false);
const showPaywallModal = ref(false);
const selectedPolicy = ref(null);

const tabs = [
  { key: 'policies', label: t('ASSIGNMENT_SETTINGS.CAPACITY.TABS.POLICIES') },
  { key: 'agents', label: t('ASSIGNMENT_SETTINGS.CAPACITY.TABS.AGENTS') },
];

const policyColumns = [
  {
    title: t('ASSIGNMENT_SETTINGS.CAPACITY.TABLE.NAME'),
    key: 'name',
    width: '25%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.CAPACITY.TABLE.DESCRIPTION'),
    key: 'description',
    width: '35%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.CAPACITY.TABLE.MAX_CAPACITY'),
    key: 'max_capacity',
    width: '15%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.CAPACITY.TABLE.AGENTS_COUNT'),
    key: 'agents_count',
    width: '15%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.CAPACITY.TABLE.ACTIONS'),
    key: 'actions',
    width: '10%',
  },
];

const agentColumns = [
  {
    title: t('ASSIGNMENT_SETTINGS.CAPACITY.TABLE.AGENT'),
    key: 'agent',
    width: '30%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.CAPACITY.TABLE.POLICY'),
    key: 'policy',
    width: '25%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.CAPACITY.TABLE.CURRENT_LOAD'),
    key: 'current_load',
    width: '20%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.CAPACITY.TABLE.UTILIZATION'),
    key: 'utilization',
    width: '25%',
  },
];

const fetchData = async () => {
  await Promise.all([
    store.dispatch('agentCapacity/get'),
    store.dispatch('agentCapacity/getAgentCapacities'),
  ]);
};

onMounted(() => {
  if (!isEnterprise) {
    showPaywallModal.value = true;
    return;
  }

  fetchData();
});

const navigateToNew = () => {
  if (!isEnterprise) {
    showPaywallModal.value = true;
    return;
  }

  router.push({ name: 'assignment_capacity_new' });
};

const editPolicy = policy => {
  router.push({
    name: 'assignment_capacity_edit',
    params: { id: policy.id },
  });
};

const openDeletePopup = policy => {
  selectedPolicy.value = policy;
  showDeletePopup.value = true;
};

const closeDeletePopup = () => {
  selectedPolicy.value = null;
  showDeletePopup.value = false;
};

const confirmDelete = async () => {
  if (!selectedPolicy.value) return;

  try {
    loading.value[selectedPolicy.value.id] = true;
    await store.dispatch('agentCapacity/delete', selectedPolicy.value.id);
    useAlert(t('ASSIGNMENT_SETTINGS.CAPACITY.DELETE.SUCCESS'));
    closeDeletePopup();
  } catch (error) {
    useAlert(t('ASSIGNMENT_SETTINGS.CAPACITY.DELETE.ERROR'));
  } finally {
    loading.value[selectedPolicy.value.id] = false;
  }
};

const getUtilizationColor = percentage => {
  if (percentage >= 90) return 'danger';
  if (percentage >= 70) return 'warning';
  return 'success';
};

const getUtilizationPercentage = capacity => {
  if (!capacity.max_capacity) return 0;
  return Math.round((capacity.current_load / capacity.max_capacity) * 100);
};
</script>

<template>
  <div>
    <BaseSettingsHeader
      :title="$t('ASSIGNMENT_SETTINGS.CAPACITY.HEADER')"
      :description="$t('ASSIGNMENT_SETTINGS.CAPACITY.SUBHEADER')"
      :button-text="$t('ASSIGNMENT_SETTINGS.CAPACITY.NEW_BUTTON')"
      @click="navigateToNew"
    />

    <div class="p-8">
      <div v-if="isEnterprise" class="mb-6">
        <div class="flex gap-4 border-b border-slate-200">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="px-4 py-2 text-sm font-medium transition-colors"
            :class="[
              activeTab === tab.key
                ? 'text-woot-600 border-b-2 border-woot-600'
                : 'text-slate-600 hover:text-slate-900',
            ]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div
        v-if="!isEnterprise"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
      >
        <p class="text-yellow-800">
          {{ $t('ASSIGNMENT_SETTINGS.CAPACITY.ENTERPRISE_ONLY') }}
        </p>
      </div>

      <div
        v-else-if="uiFlags.isFetching"
        class="flex items-center justify-center h-64"
      >
        <Spinner size="large" />
      </div>

      <!-- Policies Tab -->
      <div v-else-if="activeTab === 'policies'">
        <EmptyState
          v-if="!policies.length"
          :title="$t('ASSIGNMENT_SETTINGS.CAPACITY.EMPTY.TITLE')"
          :message="$t('ASSIGNMENT_SETTINGS.CAPACITY.EMPTY.MESSAGE')"
        >
          <Button
            variant="primary"
            size="medium"
            icon="add"
            @click="navigateToNew"
          >
            {{ $t('ASSIGNMENT_SETTINGS.CAPACITY.NEW_BUTTON') }}
          </Button>
        </EmptyState>

        <Table v-else :columns="policyColumns" :data="policies">
          <template #name="{ row }">
            <div class="font-medium text-slate-900">{{ row.name }}</div>
          </template>

          <template #description="{ row }">
            <div class="text-sm text-slate-600">{{ row.description }}</div>
          </template>

          <template #max_capacity="{ row }">
            <span class="font-medium">{{ row.max_capacity }}</span>
          </template>

          <template #agents_count="{ row }">
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800"
            >
              {{ row.agents_count }}
              {{ $tc('COMMON.AGENTS', row.agents_count) }}
            </span>
          </template>

          <template #actions="{ row }">
            <div class="flex items-center gap-2">
              <Button
                variant="clear"
                size="small"
                icon="edit"
                @click="editPolicy(row)"
              >
                {{ $t('COMMON.EDIT') }}
              </Button>
              <Button
                variant="clear"
                color-scheme="secondary"
                size="small"
                icon="delete"
                :loading="loading[row.id]"
                @click="openDeletePopup(row)"
              >
                {{ $t('COMMON.DELETE') }}
              </Button>
            </div>
          </template>
        </Table>
      </div>

      <!-- Agents Tab -->
      <div v-else-if="activeTab === 'agents'">
        <EmptyState
          v-if="!agentCapacities.length"
          :title="$t('ASSIGNMENT_SETTINGS.CAPACITY.AGENTS_EMPTY.TITLE')"
          :message="$t('ASSIGNMENT_SETTINGS.CAPACITY.AGENTS_EMPTY.MESSAGE')"
        />

        <Table v-else :columns="agentColumns" :data="agentCapacities">
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

          <template #policy="{ row }">
            <span class="text-sm">{{ row.policy?.name || '-' }}</span>
          </template>

          <template #current_load="{ row }">
            <div class="text-sm">
              <span class="font-medium">{{ row.current_load }}</span>
              <span class="text-slate-600"> / {{ row.max_capacity }}</span>
            </div>
          </template>

          <template #utilization="{ row }">
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span>{{ getUtilizationPercentage(row) }}%</span>
              </div>
              <!-- Progress bar -->
              <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="{
                    'bg-green-500':
                      getUtilizationColor(getUtilizationPercentage(row)) ===
                      'success',
                    'bg-yellow-500':
                      getUtilizationColor(getUtilizationPercentage(row)) ===
                      'warning',
                    'bg-red-500':
                      getUtilizationColor(getUtilizationPercentage(row)) ===
                      'danger',
                  }"
                  :style="`width: ${getUtilizationPercentage(row)}%`"
                />
              </div>
            </div>
          </template>
        </Table>
      </div>
    </div>

    <ConfirmationModal
      v-model:show="showDeletePopup"
      :title="$t('ASSIGNMENT_SETTINGS.CAPACITY.DELETE.TITLE')"
      :message="
        $t('ASSIGNMENT_SETTINGS.CAPACITY.DELETE.MESSAGE', {
          name: selectedPolicy?.name,
        })
      "
      :confirm-text="$t('COMMON.DELETE')"
      :cancel-text="$t('COMMON.CANCEL')"
      @confirm="confirmDelete"
      @cancel="closeDeletePopup"
    />

    <BasePaywallModal
      v-model:show="showPaywallModal"
      feature="agent_capacity"
      @close="router.push({ name: 'assignment_settings' })"
    />
  </div>
</template>
