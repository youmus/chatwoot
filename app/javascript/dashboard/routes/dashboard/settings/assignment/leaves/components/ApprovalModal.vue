<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Modal from 'dashboard/components/Modal.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Textarea from 'dashboard/components/widgets/forms/Textarea.vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  action: {
    type: String,
    required: true,
    validator: value => ['approve', 'reject'].includes(value),
  },
  leave: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:show', 'confirm', 'cancel']);

const { t } = useI18n();
const notes = ref('');

const title = computed(() => {
  return props.action === 'approve'
    ? t('ASSIGNMENT_SETTINGS.LEAVES.APPROVE.MODAL_TITLE')
    : t('ASSIGNMENT_SETTINGS.LEAVES.REJECT.MODAL_TITLE');
});

const message = computed(() => {
  if (!props.leave) return '';
  
  const agentName = props.leave.agent?.name || '';
  const dates = `${new Date(props.leave.start_date).toLocaleDateString()} - ${new Date(props.leave.end_date).toLocaleDateString()}`;
  
  return props.action === 'approve'
    ? t('ASSIGNMENT_SETTINGS.LEAVES.APPROVE.MODAL_MESSAGE', { name: agentName, dates })
    : t('ASSIGNMENT_SETTINGS.LEAVES.REJECT.MODAL_MESSAGE', { name: agentName, dates });
});

const confirmText = computed(() => {
  return props.action === 'approve'
    ? t('ASSIGNMENT_SETTINGS.LEAVES.APPROVE.CONFIRM')
    : t('ASSIGNMENT_SETTINGS.LEAVES.REJECT.CONFIRM');
});

const handleConfirm = () => {
  emit('confirm', notes.value);
  notes.value = '';
};

const handleCancel = () => {
  emit('cancel');
  notes.value = '';
};

const handleClose = () => {
  emit('update:show', false);
  notes.value = '';
};
</script>

<template>
  <Modal
    :show="show"
    :on-close="handleClose"
  >
    <div class="p-6">
      <h2 class="text-xl font-semibold mb-4">{{ title }}</h2>
      
      <p class="text-slate-700 mb-6">{{ message }}</p>
      
      <Textarea
        v-model="notes"
        :label="$t('ASSIGNMENT_SETTINGS.LEAVES.APPROVAL_NOTES')"
        :placeholder="$t('ASSIGNMENT_SETTINGS.LEAVES.APPROVAL_NOTES_PLACEHOLDER')"
        rows="4"
        class="mb-6"
      />
      
      <div class="flex justify-end gap-3">
        <Button
          variant="clear"
          @click="handleCancel"
        >
          {{ $t('COMMON.CANCEL') }}
        </Button>
        <Button
          :variant="action === 'approve' ? 'primary' : 'danger'"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </Button>
      </div>
    </div>
  </Modal>
</template>