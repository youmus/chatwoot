<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import { useI18n } from 'vue-i18n';
import { useAccount } from 'dashboard/composables/useAccount';
import BaseSettingsHeader from '../../components/BaseSettingsHeader.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Input from 'dashboard/components/widgets/forms/Input.vue';
import Select from 'dashboard/components/widgets/forms/Select.vue';
import Textarea from 'dashboard/components/widgets/forms/Textarea.vue';
import DatePicker from 'dashboard/components/widgets/forms/DatePicker.vue';

const router = useRouter();
const store = useStore();
const { t } = useI18n();
const { currentUserId } = useAccount();

const formData = ref({
  agent_id: currentUserId.value,
  leave_type: '',
  start_date: '',
  end_date: '',
  reason: '',
  is_half_day: false,
  half_day_period: 'morning', // morning or afternoon
});

const errors = ref({});
const loading = ref(false);

const leaveTypes = [
  { value: 'annual', label: t('ASSIGNMENT_SETTINGS.LEAVES.TYPES.ANNUAL') },
  { value: 'sick', label: t('ASSIGNMENT_SETTINGS.LEAVES.TYPES.SICK') },
  { value: 'personal', label: t('ASSIGNMENT_SETTINGS.LEAVES.TYPES.PERSONAL') },
  { value: 'maternity', label: t('ASSIGNMENT_SETTINGS.LEAVES.TYPES.MATERNITY') },
  { value: 'paternity', label: t('ASSIGNMENT_SETTINGS.LEAVES.TYPES.PATERNITY') },
  { value: 'unpaid', label: t('ASSIGNMENT_SETTINGS.LEAVES.TYPES.UNPAID') },
  { value: 'other', label: t('ASSIGNMENT_SETTINGS.LEAVES.TYPES.OTHER') },
];

const halfDayOptions = [
  { value: 'morning', label: t('ASSIGNMENT_SETTINGS.LEAVES.HALF_DAY.MORNING') },
  { value: 'afternoon', label: t('ASSIGNMENT_SETTINGS.LEAVES.HALF_DAY.AFTERNOON') },
];

const totalDays = computed(() => {
  if (!formData.value.start_date || !formData.value.end_date) return 0;
  
  const start = new Date(formData.value.start_date);
  const end = new Date(formData.value.end_date);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return formData.value.is_half_day ? 0.5 : diffDays;
});

const validateForm = () => {
  errors.value = {};
  
  if (!formData.value.leave_type) {
    errors.value.leave_type = t('ASSIGNMENT_SETTINGS.LEAVES.FORM.TYPE_REQUIRED');
  }
  
  if (!formData.value.start_date) {
    errors.value.start_date = t('ASSIGNMENT_SETTINGS.LEAVES.FORM.START_DATE_REQUIRED');
  }
  
  if (!formData.value.end_date) {
    errors.value.end_date = t('ASSIGNMENT_SETTINGS.LEAVES.FORM.END_DATE_REQUIRED');
  }
  
  if (formData.value.start_date && formData.value.end_date) {
    const start = new Date(formData.value.start_date);
    const end = new Date(formData.value.end_date);
    
    if (start > end) {
      errors.value.end_date = t('ASSIGNMENT_SETTINGS.LEAVES.FORM.END_DATE_INVALID');
    }
    
    if (formData.value.is_half_day && start.getTime() !== end.getTime()) {
      errors.value.is_half_day = t('ASSIGNMENT_SETTINGS.LEAVES.FORM.HALF_DAY_INVALID');
    }
  }
  
  if (!formData.value.reason) {
    errors.value.reason = t('ASSIGNMENT_SETTINGS.LEAVES.FORM.REASON_REQUIRED');
  }
  
  return Object.keys(errors.value).length === 0;
};

const handleHalfDayChange = () => {
  if (formData.value.is_half_day && formData.value.start_date) {
    formData.value.end_date = formData.value.start_date;
  }
};

const submitForm = async () => {
  if (!validateForm()) return;
  
  loading.value = true;
  try {
    await store.dispatch('leaves/create', {
      agent_id: formData.value.agent_id,
      leave_type: formData.value.leave_type,
      start_date: formData.value.start_date,
      end_date: formData.value.end_date,
      reason: formData.value.reason,
      is_half_day: formData.value.is_half_day,
      half_day_period: formData.value.is_half_day ? formData.value.half_day_period : null,
    });
    
    useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.CREATE.SUCCESS'));
    router.push({ name: 'assignment_leaves_list' });
  } catch (error) {
    useAlert(t('ASSIGNMENT_SETTINGS.LEAVES.CREATE.ERROR'));
  } finally {
    loading.value = false;
  }
};

const cancel = () => {
  router.push({ name: 'assignment_leaves_list' });
};
</script>

<template>
  <div>
    <BaseSettingsHeader
      :title="$t('ASSIGNMENT_SETTINGS.LEAVES.NEW_HEADER')"
      :description="$t('ASSIGNMENT_SETTINGS.LEAVES.NEW_DESCRIPTION')"
      :back-button-label="$t('ASSIGNMENT_SETTINGS.LEAVES.BACK_BUTTON')"
      @back="cancel"
    />

    <div class="max-w-2xl p-8">
      <form @submit.prevent="submitForm">
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
          <Select
            v-model="formData.leave_type"
            :options="leaveTypes"
            :label="$t('ASSIGNMENT_SETTINGS.LEAVES.FORM.TYPE')"
            :placeholder="$t('ASSIGNMENT_SETTINGS.LEAVES.FORM.TYPE_PLACEHOLDER')"
            :error="errors.leave_type"
            required
          />
          
          <div class="grid grid-cols-2 gap-4">
            <DatePicker
              v-model="formData.start_date"
              :label="$t('ASSIGNMENT_SETTINGS.LEAVES.FORM.START_DATE')"
              :placeholder="$t('ASSIGNMENT_SETTINGS.LEAVES.FORM.START_DATE_PLACEHOLDER')"
              :error="errors.start_date"
              :min-date="new Date().toISOString().split('T')[0]"
              required
            />
            
            <DatePicker
              v-model="formData.end_date"
              :label="$t('ASSIGNMENT_SETTINGS.LEAVES.FORM.END_DATE')"
              :placeholder="$t('ASSIGNMENT_SETTINGS.LEAVES.FORM.END_DATE_PLACEHOLDER')"
              :error="errors.end_date"
              :min-date="formData.start_date || new Date().toISOString().split('T')[0]"
              :disabled="formData.is_half_day"
              required
            />
          </div>
          
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <input
                v-model="formData.is_half_day"
                type="checkbox"
                id="is_half_day"
                class="rounded border-slate-300"
                @change="handleHalfDayChange"
              />
              <label for="is_half_day" class="text-sm font-medium">
                {{ $t('ASSIGNMENT_SETTINGS.LEAVES.FORM.IS_HALF_DAY') }}
              </label>
            </div>
            
            <Select
              v-if="formData.is_half_day"
              v-model="formData.half_day_period"
              :options="halfDayOptions"
              :label="$t('ASSIGNMENT_SETTINGS.LEAVES.FORM.HALF_DAY_PERIOD')"
            />
            
            <div v-if="errors.is_half_day" class="text-red-500 text-sm">
              {{ errors.is_half_day }}
            </div>
          </div>
          
          <div>
            <div class="text-sm text-slate-600 mb-2">
              {{ $t('ASSIGNMENT_SETTINGS.LEAVES.FORM.TOTAL_DAYS') }}: 
              <span class="font-medium text-slate-900">{{ totalDays }}</span>
            </div>
          </div>
          
          <Textarea
            v-model="formData.reason"
            :label="$t('ASSIGNMENT_SETTINGS.LEAVES.FORM.REASON')"
            :placeholder="$t('ASSIGNMENT_SETTINGS.LEAVES.FORM.REASON_PLACEHOLDER')"
            :error="errors.reason"
            rows="4"
            required
          />
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <Button
            variant="clear"
            @click="cancel"
          >
            {{ $t('COMMON.CANCEL') }}
          </Button>
          <Button
            type="submit"
            variant="primary"
            :loading="loading"
          >
            {{ $t('ASSIGNMENT_SETTINGS.LEAVES.FORM.SUBMIT') }}
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>