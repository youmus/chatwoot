<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore, useStoreGetters } from 'dashboard/composables/store';
import { useAlert } from 'dashboard/composables';
import { useI18n } from 'vue-i18n';
import BaseSettingsHeader from '../../components/BaseSettingsHeader.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import Input from 'dashboard/components/widgets/forms/Input.vue';
import TextArea from 'dashboard/components-next/textarea/TextArea.vue';
import Switch from 'dashboard/components-next/switch/Switch.vue';
// Use native select element instead
import MultiSelect from 'dashboard/components-next/filter/inputs/MultiSelect.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();
const getters = useStoreGetters();
const { t } = useI18n();

const isEditMode = computed(() => !!route.params.id);
const policyId = computed(() => route.params.id);

const uiFlags = computed(() => getters['assignmentPolicies/getUIFlags'].value);
const teams = computed(() => getters['teams/getTeams'].value);
const agents = computed(() => getters['agents/getAgents'].value);
const inboxes = computed(() => getters['inboxes/getInboxes'].value);

const loading = ref(false);
const formData = ref({
  name: '',
  description: '',
  active: true,
  policy_type: 'round_robin',
  conditions: {
    inbox_ids: [],
    team_ids: [],
    agent_ids: [],
    business_hours_only: false,
    excluded_agent_ids: [],
  },
  weight: 100,
  max_assignments_per_agent: null,
  reassignment_interval: null,
});

const policyTypes = [
  {
    value: 'round_robin',
    label: t('ASSIGNMENT_SETTINGS.POLICIES.TYPES.ROUND_ROBIN'),
    description: t('ASSIGNMENT_SETTINGS.POLICIES.TYPES.ROUND_ROBIN_DESC'),
  },
  {
    value: 'load_balanced',
    label: t('ASSIGNMENT_SETTINGS.POLICIES.TYPES.LOAD_BALANCED'),
    description: t('ASSIGNMENT_SETTINGS.POLICIES.TYPES.LOAD_BALANCED_DESC'),
  },
  {
    value: 'skill_based',
    label: t('ASSIGNMENT_SETTINGS.POLICIES.TYPES.SKILL_BASED'),
    description: t('ASSIGNMENT_SETTINGS.POLICIES.TYPES.SKILL_BASED_DESC'),
  },
  {
    value: 'custom',
    label: t('ASSIGNMENT_SETTINGS.POLICIES.TYPES.CUSTOM'),
    description: t('ASSIGNMENT_SETTINGS.POLICIES.TYPES.CUSTOM_DESC'),
  },
];

const errors = ref({});

const loadPolicy = async () => {
  try {
    loading.value = true;
    const policy = await store.dispatch(
      'assignmentPolicies/show',
      policyId.value
    );
    formData.value = {
      name: policy.name,
      description: policy.description || '',
      active: policy.active,
      policy_type: policy.policy_type,
      conditions: {
        inbox_ids: policy.conditions?.inbox_ids || [],
        team_ids: policy.conditions?.team_ids || [],
        agent_ids: policy.conditions?.agent_ids || [],
        business_hours_only: policy.conditions?.business_hours_only || false,
        excluded_agent_ids: policy.conditions?.excluded_agent_ids || [],
      },
      weight: policy.weight || 100,
      max_assignments_per_agent: policy.max_assignments_per_agent,
      reassignment_interval: policy.reassignment_interval,
    };
  } catch (error) {
    useAlert(t('ASSIGNMENT_SETTINGS.POLICIES.LOAD.ERROR'));
    router.push({ name: 'assignment_policies_list' });
  } finally {
    loading.value = false;
  }
};

const validateForm = () => {
  errors.value = {};

  if (!formData.value.name) {
    errors.value.name = t('ASSIGNMENT_SETTINGS.POLICIES.FORM.NAME_REQUIRED');
  }

  if (!formData.value.policy_type) {
    errors.value.policy_type = t(
      'ASSIGNMENT_SETTINGS.POLICIES.FORM.TYPE_REQUIRED'
    );
  }

  return Object.keys(errors.value).length === 0;
};

const savePolicy = async () => {
  if (!validateForm()) return;

  try {
    const payload = {
      name: formData.value.name,
      description: formData.value.description,
      active: formData.value.active,
      policy_type: formData.value.policy_type,
      conditions: formData.value.conditions,
      weight: formData.value.weight,
      max_assignments_per_agent: formData.value.max_assignments_per_agent,
      reassignment_interval: formData.value.reassignment_interval,
    };

    if (isEditMode.value) {
      await store.dispatch('assignmentPolicies/update', {
        id: policyId.value,
        ...payload,
      });
      useAlert(t('ASSIGNMENT_SETTINGS.POLICIES.UPDATE.SUCCESS'));
    } else {
      await store.dispatch('assignmentPolicies/create', payload);
      useAlert(t('ASSIGNMENT_SETTINGS.POLICIES.CREATE.SUCCESS'));
    }

    router.push({ name: 'assignment_policies_list' });
  } catch (error) {
    const message = isEditMode.value
      ? t('ASSIGNMENT_SETTINGS.POLICIES.UPDATE.ERROR')
      : t('ASSIGNMENT_SETTINGS.POLICIES.CREATE.ERROR');
    useAlert(message);
  }
};

const cancel = () => {
  router.push({ name: 'assignment_policies_list' });
};

onMounted(async () => {
  // Load required data
  await Promise.all([
    store.dispatch('teams/get'),
    store.dispatch('agents/get'),
    store.dispatch('inboxes/get'),
  ]);

  if (isEditMode.value) {
    await loadPolicy();
  }
});
</script>

<template>
  <div>
    <BaseSettingsHeader
      :title="
        isEditMode
          ? $t('ASSIGNMENT_SETTINGS.POLICIES.EDIT_HEADER')
          : $t('ASSIGNMENT_SETTINGS.POLICIES.NEW_HEADER')
      "
      :description="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM_DESCRIPTION')"
      :back-button-label="$t('ASSIGNMENT_SETTINGS.POLICIES.BACK_BUTTON')"
      @back="cancel"
    />

    <div v-if="loading" class="flex items-center justify-center h-64">
      <Spinner size="large" />
    </div>

    <div v-else class="max-w-4xl p-8">
      <form @submit.prevent="savePolicy">
        <div class="space-y-6">
          <!-- Basic Information -->
          <div
            class="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
          >
            <h3 class="text-lg font-medium mb-4">
              {{ $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.BASIC_INFO') }}
            </h3>

            <div class="space-y-4">
              <Input
                v-model="formData.name"
                :label="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM.NAME')"
                :placeholder="
                  $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.NAME_PLACEHOLDER')
                "
                :error="errors.name"
                required
              />

              <TextArea
                v-model="formData.description"
                :label="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM.DESCRIPTION')"
                :placeholder="
                  $t(
                    'ASSIGNMENT_SETTINGS.POLICIES.FORM.DESCRIPTION_PLACEHOLDER'
                  )
                "
                rows="3"
              />

              <div class="flex items-center gap-3">
                <Switch v-model="formData.active" />
                <label class="text-sm font-medium">
                  {{ $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.ACTIVE') }}
                </label>
              </div>
            </div>
          </div>

          <!-- Policy Type -->
          <div
            class="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
          >
            <h3 class="text-lg font-medium mb-4">
              {{ $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.POLICY_TYPE') }}
            </h3>

            <div class="space-y-3">
              <div
                v-for="type in policyTypes"
                :key="type.value"
                class="p-4 border rounded-lg cursor-pointer transition-colors"
                :class="[
                  formData.policy_type === type.value
                    ? 'border-woot-500 bg-woot-50'
                    : 'border-slate-200 hover:border-slate-300',
                ]"
                @click="formData.policy_type = type.value"
              >
                <div class="flex items-start gap-3">
                  <input
                    type="radio"
                    :checked="formData.policy_type === type.value"
                    class="mt-1"
                  />
                  <div>
                    <h4 class="font-medium">{{ type.label }}</h4>
                    <p class="text-sm text-slate-600 mt-1">
                      {{ type.description }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="errors.policy_type" class="text-red-500 text-sm mt-2">
              {{ errors.policy_type }}
            </div>
          </div>

          <!-- Conditions -->
          <div
            class="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
          >
            <h3 class="text-lg font-medium mb-4">
              {{ $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.CONDITIONS') }}
            </h3>

            <div class="space-y-4">
              <MultiSelect
                v-model="formData.conditions.inbox_ids"
                :options="inboxes"
                :label="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM.INBOXES')"
                :placeholder="
                  $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.INBOXES_PLACEHOLDER')
                "
                track-by="id"
                label-key="name"
              />

              <MultiSelect
                v-model="formData.conditions.team_ids"
                :options="teams"
                :label="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM.TEAMS')"
                :placeholder="
                  $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.TEAMS_PLACEHOLDER')
                "
                track-by="id"
                label-key="name"
              />

              <MultiSelect
                v-model="formData.conditions.agent_ids"
                :options="agents"
                :label="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM.AGENTS')"
                :placeholder="
                  $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.AGENTS_PLACEHOLDER')
                "
                track-by="id"
                label-key="name"
              />

              <div class="flex items-center gap-3">
                <Switch v-model="formData.conditions.business_hours_only" />
                <label class="text-sm font-medium">
                  {{
                    $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.BUSINESS_HOURS_ONLY')
                  }}
                </label>
              </div>

              <MultiSelect
                v-model="formData.conditions.excluded_agent_ids"
                :options="agents"
                :label="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM.EXCLUDED_AGENTS')"
                :placeholder="
                  $t(
                    'ASSIGNMENT_SETTINGS.POLICIES.FORM.EXCLUDED_AGENTS_PLACEHOLDER'
                  )
                "
                track-by="id"
                label-key="name"
              />
            </div>
          </div>

          <!-- Advanced Settings -->
          <div
            class="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
          >
            <h3 class="text-lg font-medium mb-4">
              {{ $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.ADVANCED') }}
            </h3>

            <div class="space-y-4">
              <Input
                v-model.number="formData.weight"
                type="number"
                :label="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM.WEIGHT')"
                :placeholder="
                  $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.WEIGHT_PLACEHOLDER')
                "
                :help-text="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM.WEIGHT_HELP')"
                min="1"
                max="100"
              />

              <Input
                v-model.number="formData.max_assignments_per_agent"
                type="number"
                :label="$t('ASSIGNMENT_SETTINGS.POLICIES.FORM.MAX_ASSIGNMENTS')"
                :placeholder="
                  $t(
                    'ASSIGNMENT_SETTINGS.POLICIES.FORM.MAX_ASSIGNMENTS_PLACEHOLDER'
                  )
                "
                :help-text="
                  $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.MAX_ASSIGNMENTS_HELP')
                "
                min="1"
              />

              <Input
                v-model.number="formData.reassignment_interval"
                type="number"
                :label="
                  $t('ASSIGNMENT_SETTINGS.POLICIES.FORM.REASSIGNMENT_INTERVAL')
                "
                :placeholder="
                  $t(
                    'ASSIGNMENT_SETTINGS.POLICIES.FORM.REASSIGNMENT_INTERVAL_PLACEHOLDER'
                  )
                "
                :help-text="
                  $t(
                    'ASSIGNMENT_SETTINGS.POLICIES.FORM.REASSIGNMENT_INTERVAL_HELP'
                  )
                "
                min="0"
              />
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 mt-8">
          <Button variant="clear" @click="cancel">
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
  </div>
</template>
