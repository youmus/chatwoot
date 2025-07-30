<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore, useStoreGetters } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import { useI18n } from 'vue-i18n';
import { useAdmin } from 'dashboard/composables/useAdmin';
import { useAccount } from 'dashboard/composables/useAccount';
import BaseSettingsHeader from '../../components/BaseSettingsHeader.vue';
import Button from 'dashboard/components-next/button/Button.vue';
// Badge component doesn't exist - will use inline styling instead
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';
import ApprovalModal from './components/ApprovalModal.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();
const getters = useStoreGetters();
const { t } = useI18n();
const { isAdmin } = useAdmin();
const { currentUserId } = useAccount();

const leaveId = computed(() => route.params.id);
const leave = computed(() => getters['leaves/getLeave'].value(leaveId.value));

const loading = ref(true);
const showApprovalModal = ref(false);
const approvalAction = ref('');

onMounted(async () => {
  try {
    await store.dispatch('leaves/show', leaveId.value);
  } catch (error) {
    useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.LOAD.ERROR'));
    router.push({ name: 'assignment_leaves_list' });
  } finally {
    loading.value = false;
  }
});

// Removed getStatusBadgeVariant as we're using inline classes now

const goBack = () => {
  router.push({ name: 'assignment_leaves_list' });
};

const openApprovalModal = action => {
  approvalAction.value = action;
  showApprovalModal.value = true;
};

const closeApprovalModal = () => {
  approvalAction.value = '';
  showApprovalModal.value = false;
};

const handleApproval = async notes => {
  try {
    if (approvalAction.value === 'approve') {
      await store.dispatch('leaves/approve', {
        id: leaveId.value,
        approverNotes: notes,
      });
      useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.APPROVE.SUCCESS'));
    } else {
      await store.dispatch('leaves/reject', {
        id: leaveId.value,
        approverNotes: notes,
      });
      useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.REJECT.SUCCESS'));
    }
    closeApprovalModal();
  } catch (error) {
    const message =
      approvalAction.value === 'approve'
        ? t('ASSIGNMENT_SETTINGS.LEAVES.APPROVE.ERROR')
        : t('ASSIGNMENT_SETTINGS.LEAVES.REJECT.ERROR');
    useAlert(message);
  }
};

const canApproveReject = computed(() => {
  return isAdmin.value && leave.value?.status === 'pending';
});

const canDelete = computed(() => {
  return (
    leave.value?.status === 'pending' &&
    (isAdmin.value || leave.value?.agent_id === currentUserId.value)
  );
});

const deleteLeave = async () => {
  if (!window.confirm(t('ASSIGNMENT_SETTINGS.LEAVES.DELETE.CONFIRM'))) return;

  try {
    await store.dispatch('leaves/delete', leaveId.value);
    useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.DELETE.SUCCESS'));
    router.push({ name: 'assignment_leaves_list' });
  } catch (error) {
    useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.DELETE.ERROR'));
  }
};
</script>

<template>
  <div>
    <BaseSettingsHeader
      :title="$t('ASSIGNMENT_SETTINGS.LEAVES.DETAILS_HEADER')"
      :description="$t('ASSIGNMENT_SETTINGS.LEAVES.DETAILS_DESCRIPTION')"
      :back-button-label="$t('ASSIGNMENT_SETTINGS.LEAVES.BACK_BUTTON')"
      @back="goBack"
    />

    <div v-if="loading" class="flex items-center justify-center h-64">
      <Spinner size="large" />
    </div>

    <div v-else-if="leave" class="max-w-4xl p-8">
      <div class="bg-white rounded-lg shadow-sm border border-slate-200">
        <!-- Header -->
        <div class="p-6 border-b border-slate-200">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <img
                :src="leave.agent?.avatar_url"
                :alt="leave.agent?.name"
                class="w-12 h-12 rounded-full"
              />
              <div>
                <h2 class="text-xl font-semibold">{{ leave.agent?.name }}</h2>
                <p class="text-sm text-slate-600">{{ leave.agent?.email }}</p>
              </div>
            </div>
            <span
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="[
                leave.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : leave.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : leave.status === 'cancelled'
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-yellow-100 text-yellow-800',
              ]"
            >
              {{
                $t(
                  `ASSIGNMENT_SETTINGS.LEAVES.STATUS.${leave.status.toUpperCase()}`
                )
              }}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Leave Type -->
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">
              {{ $t('ASSIGNMENT_SETTINGS.LEAVES.DETAILS.TYPE') }}
            </h3>
            <p class="text-lg font-medium">
              {{
                $t(
                  `ASSIGNMENT_SETTINGS.LEAVES.TYPES.${leave.leave_type.toUpperCase()}`
                )
              }}
            </p>
          </div>

          <!-- Dates -->
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">
              {{ $t('ASSIGNMENT_SETTINGS.LEAVES.DETAILS.DATES') }}
            </h3>
            <p class="text-lg">
              {{ $d(new Date(leave.start_date), 'long') }} -
              {{ $d(new Date(leave.end_date), 'long') }}
            </p>
            <p class="text-sm text-slate-600 mt-1">
              {{ leave.total_days }} {{ $tc('COMMON.DAYS', leave.total_days) }}
              <span v-if="leave.is_half_day">
                ({{
                  $t(
                    `ASSIGNMENT_SETTINGS.LEAVES.HALF_DAY.${leave.half_day_period.toUpperCase()}`
                  )
                }})
              </span>
            </p>
          </div>

          <!-- Reason -->
          <div>
            <h3 class="text-sm font-medium text-slate-500 mb-1">
              {{ $t('ASSIGNMENT_SETTINGS.LEAVES.DETAILS.REASON') }}
            </h3>
            <p class="text-base whitespace-pre-wrap">{{ leave.reason }}</p>
          </div>

          <!-- Request Info -->
          <div class="grid grid-cols-2 gap-6">
            <div>
              <h3 class="text-sm font-medium text-slate-500 mb-1">
                {{ $t('ASSIGNMENT_SETTINGS.LEAVES.DETAILS.REQUESTED_ON') }}
              </h3>
              <p class="text-base">
                {{ $d(new Date(leave.created_at), 'long') }}
              </p>
            </div>

            <div v-if="leave.status !== 'pending'">
              <h3 class="text-sm font-medium text-slate-500 mb-1">
                {{
                  leave.status === 'approved'
                    ? $t('ASSIGNMENT_SETTINGS.LEAVES.DETAILS.APPROVED_BY')
                    : $t('ASSIGNMENT_SETTINGS.LEAVES.DETAILS.REJECTED_BY')
                }}
              </h3>
              <p class="text-base">
                {{ leave.approver?.name }}
                <span class="text-sm text-slate-600">
                  ({{ $d(new Date(leave.updated_at), 'short') }})
                </span>
              </p>
            </div>
          </div>

          <!-- Approver Notes -->
          <div v-if="leave.approver_notes">
            <h3 class="text-sm font-medium text-slate-500 mb-1">
              {{ $t('ASSIGNMENT_SETTINGS.LEAVES.DETAILS.APPROVER_NOTES') }}
            </h3>
            <p class="text-base whitespace-pre-wrap">
              {{ leave.approver_notes }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-6 border-t border-slate-200">
          <div class="flex justify-between">
            <Button
              v-if="canDelete"
              variant="danger"
              color-scheme="secondary"
              icon="delete"
              @click="deleteLeave"
            >
              {{ $t('COMMON.DELETE') }}
            </Button>

            <div v-if="canApproveReject" class="flex gap-3 ml-auto">
              <Button
                variant="clear"
                color-scheme="secondary"
                @click="openApprovalModal('reject')"
              >
                {{ $t('ASSIGNMENT_SETTINGS.LEAVES.REJECT.BUTTON') }}
              </Button>
              <Button variant="primary" @click="openApprovalModal('approve')">
                {{ $t('ASSIGNMENT_SETTINGS.LEAVES.APPROVE.BUTTON') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <ApprovalModal
      v-model:show="showApprovalModal"
      :action="approvalAction"
      :leave="leave"
      @confirm="handleApproval"
      @cancel="closeApprovalModal"
    />
  </div>
</template>
