<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore, useStoreGetters } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import { useI18n } from 'vue-i18n';
import { useEnterprise } from 'dashboard/composables/useEnterprise';
import BaseSettingsHeader from '../../components/BaseSettingsHeader.vue';
import BasePaywallModal from '../../components/BasePaywallModal.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Input from 'dashboard/components/widgets/forms/Input.vue';
import Textarea from 'dashboard/components/widgets/forms/Textarea.vue';
import MultiSelect from 'dashboard/components/widgets/forms/MultiSelect.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();
const getters = useStoreGetters();
const { t } = useI18n();
const { isOnEnterpriseEdition } = useEnterprise();

const isEditMode = computed(() => !!route.params.id);
const policyId = computed(() => route.params.id);

const uiFlags = computed(() => getters['agentCapacity/getUIFlags'].value);
const agents = computed(() => getters['agents/getAgents'].value);

const loading = ref(false);
const showPaywallModal = ref(false);
const formData = ref({
  name: '',
  description: '',
  max_capacity: 10,
  agent_ids: [],
});

const errors = ref({});

onMounted(async () => {
  if (!isOnEnterpriseEdition.value) {
    showPaywallModal.value = true;
    return;
  }

  await store.dispatch('agents/get');
  
  if (isEditMode.value) {
    await loadPolicy();
  }
});

const loadPolicy = async () => {
  try {
    loading.value = true;
    const policy = await store.dispatch('agentCapacity/show', policyId.value);
    formData.value = {
      name: policy.name,
      description: policy.description || '',
      max_capacity: policy.max_capacity,
      agent_ids: policy.agent_ids || [],
    };
  } catch (error) {
    useAlert(t('ASSIGNMENT_SETTINGS.CAPACITY.LOAD.ERROR'));
    router.push({ name: 'assignment_capacity_list' });
  } finally {
    loading.value = false;
  }
};

const validateForm = () => {
  errors.value = {};
  
  if (!formData.value.name) {
    errors.value.name = t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.NAME_REQUIRED');
  }
  
  if (!formData.value.max_capacity || formData.value.max_capacity < 1) {
    errors.value.max_capacity = t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.CAPACITY_REQUIRED');
  }
  
  if (!formData.value.agent_ids.length) {
    errors.value.agent_ids = t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.AGENTS_REQUIRED');
  }
  
  return Object.keys(errors.value).length === 0;
};

const savePolicy = async () => {
  if (!validateForm()) return;
  
  try {
    const payload = {
      name: formData.value.name,
      description: formData.value.description,
      max_capacity: formData.value.max_capacity,
    };
    
    if (isEditMode.value) {
      // Update policy
      await store.dispatch('agentCapacity/update', {
        id: policyId.value,
        ...payload,
      });
      
      // Update agent assignments if changed
      const currentAgentIds = formData.value.agent_ids;
      const policy = getters['agentCapacity/getCapacityPolicy'].value(policyId.value);
      const existingAgentIds = policy?.agent_ids || [];
      
      const agentsToAdd = currentAgentIds.filter(id => !existingAgentIds.includes(id));
      const agentsToRemove = existingAgentIds.filter(id => !currentAgentIds.includes(id));
      
      if (agentsToAdd.length) {
        await store.dispatch('agentCapacity/assignAgents', {
          id: policyId.value,
          agentIds: agentsToAdd,
        });
      }
      
      if (agentsToRemove.length) {
        await store.dispatch('agentCapacity/removeAgents', {
          id: policyId.value,
          agentIds: agentsToRemove,
        });
      }
      
      useAlert(t('ASSIGNMENT_SETTINGS.CAPACITY.UPDATE.SUCCESS'));
    } else {
      // Create policy
      const newPolicy = await store.dispatch('agentCapacity/create', payload);
      
      // Assign agents
      if (formData.value.agent_ids.length) {
        await store.dispatch('agentCapacity/assignAgents', {
          id: newPolicy.id,
          agentIds: formData.value.agent_ids,
        });
      }
      
      useAlert(t('ASSIGNMENT_SETTINGS.CAPACITY.CREATE.SUCCESS'));
    }
    
    router.push({ name: 'assignment_capacity_list' });
  } catch (error) {
    const message = isEditMode.value
      ? t('ASSIGNMENT_SETTINGS.CAPACITY.UPDATE.ERROR')
      : t('ASSIGNMENT_SETTINGS.CAPACITY.CREATE.ERROR');
    useAlert(message);
  }
};

const cancel = () => {
  router.push({ name: 'assignment_capacity_list' });
};
</script>

<template>
  <div>
    <BaseSettingsHeader
      :title="isEditMode ? $t('ASSIGNMENT_SETTINGS.CAPACITY.EDIT_HEADER') : $t('ASSIGNMENT_SETTINGS.CAPACITY.NEW_HEADER')"
      :description="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM_DESCRIPTION')"
      :back-button-label="$t('ASSIGNMENT_SETTINGS.CAPACITY.BACK_BUTTON')"
      @back="cancel"
    />

    <div v-if="loading" class="flex items-center justify-center h-64">
      <Spinner size="large" />
    </div>

    <div v-else-if="isOnEnterpriseEdition" class="max-w-2xl p-8">
      <form @submit.prevent="savePolicy">
        <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6 space-y-6">
          <Input
            v-model="formData.name"
            :label="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.NAME')"
            :placeholder="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.NAME_PLACEHOLDER')"
            :error="errors.name"
            required
          />
          
          <Textarea
            v-model="formData.description"
            :label="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.DESCRIPTION')"
            :placeholder="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.DESCRIPTION_PLACEHOLDER')"
            rows="3"
          />
          
          <Input
            v-model.number="formData.max_capacity"
            type="number"
            :label="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.MAX_CAPACITY')"
            :placeholder="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.MAX_CAPACITY_PLACEHOLDER')"
            :help-text="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.MAX_CAPACITY_HELP')"
            :error="errors.max_capacity"
            min="1"
            required
          />
          
          <MultiSelect
            v-model="formData.agent_ids"
            :options="agents"
            :label="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.AGENTS')"
            :placeholder="$t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.AGENTS_PLACEHOLDER')"
            :error="errors.agent_ids"
            track-by="id"
            label-key="name"
            required
          >
            <template #option="{ option }">
              <div class="flex items-center gap-2">
                <img
                  :src="option.avatar_url"
                  :alt="option.name"
                  class="w-6 h-6 rounded-full"
                />
                <span>{{ option.name }}</span>
              </div>
            </template>
          </MultiSelect>
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p class="text-sm text-blue-800">
              <strong>{{ $t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.NOTE_TITLE') }}:</strong>
              {{ $t('ASSIGNMENT_SETTINGS.CAPACITY.FORM.NOTE_MESSAGE') }}
            </p>
          </div>
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
            :loading="uiFlags.isCreating || uiFlags.isUpdating"
          >
            {{ isEditMode ? $t('COMMON.UPDATE') : $t('COMMON.CREATE') }}
          </Button>
        </div>
      </form>
    </div>

    <BasePaywallModal
      v-model:show="showPaywallModal"
      feature="agent_capacity"
      @close="router.push({ name: 'assignment_settings' })"
    />
  </div>
</template>