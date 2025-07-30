<script setup>
import { computed, onMounted, ref } from 'vue';
import { useStore, useStoreGetters } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import BaseSettingsHeader from '../../components/BaseSettingsHeader.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Table from 'dashboard/components/table/Table.vue';
import ConfirmationModal from 'dashboard/components/widgets/modal/ConfirmationModal.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';
import EmptyState from 'dashboard/components/widgets/EmptyState.vue';

const store = useStore();
const getters = useStoreGetters();
const router = useRouter();
const { t } = useI18n();

const policies = computed(
  () => getters['assignmentPolicies/getPoliciesByPriority'].value
);
const uiFlags = computed(() => getters['assignmentPolicies/getUIFlags'].value);

const loading = ref({});
const showDeletePopup = ref(false);
const selectedPolicy = ref(null);

const columns = [
  {
    title: t('ASSIGNMENT_SETTINGS.POLICIES.TABLE.NAME'),
    key: 'name',
    width: '25%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.POLICIES.TABLE.DESCRIPTION'),
    key: 'description',
    width: '35%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.POLICIES.TABLE.PRIORITY'),
    key: 'priority',
    width: '10%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.POLICIES.TABLE.STATUS'),
    key: 'status',
    width: '15%',
  },
  {
    title: t('ASSIGNMENT_SETTINGS.POLICIES.TABLE.ACTIONS'),
    key: 'actions',
    width: '15%',
  },
];

onMounted(() => {
  store.dispatch('assignmentPolicies/get');
});

const navigateToNew = () => {
  router.push({ name: 'assignment_policies_new' });
};

const editPolicy = policy => {
  router.push({
    name: 'assignment_policies_edit',
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
    await store.dispatch('assignmentPolicies/delete', selectedPolicy.value.id);
    useAlert(t('ASSIGNMENT_SETTINGS.POLICIES.DELETE.SUCCESS'));
    closeDeletePopup();
  } catch (error) {
    useAlert(t('ASSIGNMENT_SETTINGS.POLICIES.DELETE.ERROR'));
  } finally {
    loading.value[selectedPolicy.value.id] = false;
  }
};

const updatePriority = async (policy, direction) => {
  const newPriority =
    direction === 'up' ? policy.priority - 1 : policy.priority + 1;

  if (newPriority < 1 || newPriority > policies.value.length) return;

  try {
    await store.dispatch('assignmentPolicies/updatePriority', {
      id: policy.id,
      priority: newPriority,
    });
    await store.dispatch('assignmentPolicies/get'); // Refresh list
  } catch (error) {
    useAlert(t('ASSIGNMENT_SETTINGS.POLICIES.PRIORITY.ERROR'));
  }
};
</script>

<template>
  <div>
    <BaseSettingsHeader
      :title="$t('ASSIGNMENT_SETTINGS.POLICIES.HEADER')"
      :description="$t('ASSIGNMENT_SETTINGS.POLICIES.SUBHEADER')"
      :button-text="$t('ASSIGNMENT_SETTINGS.POLICIES.NEW_BUTTON')"
      @click="navigateToNew"
    />

    <div class="p-8">
      <div
        v-if="uiFlags.isFetching"
        class="flex items-center justify-center h-64"
      >
        <Spinner size="large" />
      </div>

      <EmptyState
        v-else-if="!policies.length"
        :title="$t('ASSIGNMENT_SETTINGS.POLICIES.EMPTY.TITLE')"
        :message="$t('ASSIGNMENT_SETTINGS.POLICIES.EMPTY.MESSAGE')"
      >
        <Button
          variant="primary"
          size="medium"
          icon="add"
          @click="navigateToNew"
        >
          {{ $t('ASSIGNMENT_SETTINGS.POLICIES.NEW_BUTTON') }}
        </Button>
      </EmptyState>

      <div v-else>
        <Table :columns="columns" :data="policies">
          <template #name="{ row }">
            <div class="font-medium text-slate-900">{{ row.name }}</div>
          </template>

          <template #description="{ row }">
            <div class="text-sm text-slate-600">{{ row.description }}</div>
          </template>

          <template #priority="{ row, index }">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ row.priority }}</span>
              <div class="flex gap-1">
                <Button
                  v-if="index > 0"
                  variant="clear"
                  size="tiny"
                  icon="arrow-up"
                  @click="updatePriority(row, 'up')"
                />
                <Button
                  v-if="index < policies.length - 1"
                  variant="clear"
                  size="tiny"
                  icon="arrow-down"
                  @click="updatePriority(row, 'down')"
                />
              </div>
            </div>
          </template>

          <template #status="{ row }">
            <div class="flex items-center gap-2">
              <div
                class="w-2 h-2 rounded-full"
                :class="row.active ? 'bg-green-500' : 'bg-slate-400'"
              />
              <span class="text-sm">
                {{ row.active ? $t('COMMON.ACTIVE') : $t('COMMON.INACTIVE') }}
              </span>
            </div>
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
    </div>

    <ConfirmationModal
      v-model:show="showDeletePopup"
      :title="$t('ASSIGNMENT_SETTINGS.POLICIES.DELETE.TITLE')"
      :message="
        $t('ASSIGNMENT_SETTINGS.POLICIES.DELETE.MESSAGE', {
          name: selectedPolicy?.name,
        })
      "
      :confirm-text="$t('COMMON.DELETE')"
      :cancel-text="$t('COMMON.CANCEL')"
      @confirm="confirmDelete"
      @cancel="closeDeletePopup"
    />
  </div>
</template>
