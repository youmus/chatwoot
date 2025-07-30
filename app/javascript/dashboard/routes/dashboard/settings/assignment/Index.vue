<script setup>
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useEnterprise } from 'dashboard/composables/useEnterprise';
import BaseSettingsHeader from '../components/BaseSettingsHeader.vue';
import BaseSettingsListItem from '../components/BaseSettingsListItem.vue';

const router = useRouter();
const { t } = useI18n();
const { isOnEnterpriseEdition } = useEnterprise();

const settingItems = [
  {
    name: 'assignment_policies',
    title: 'ASSIGNMENT_SETTINGS.POLICIES.TITLE',
    description: 'ASSIGNMENT_SETTINGS.POLICIES.DESCRIPTION',
    icon: 'settings',
    route: 'assignment_policies_list',
    color: 'text-violet-800',
    bgColor: 'bg-violet-100',
  },
  {
    name: 'leave_management',
    title: 'ASSIGNMENT_SETTINGS.LEAVES.TITLE',
    description: 'ASSIGNMENT_SETTINGS.LEAVES.DESCRIPTION',
    icon: 'calendar-off',
    route: 'assignment_leaves_list',
    color: 'text-orange-800',
    bgColor: 'bg-orange-100',
  },
  {
    name: 'agent_capacity',
    title: 'ASSIGNMENT_SETTINGS.CAPACITY.TITLE',
    description: 'ASSIGNMENT_SETTINGS.CAPACITY.DESCRIPTION',
    icon: 'people-team',
    route: 'assignment_capacity_list',
    color: 'text-cyan-800',
    bgColor: 'bg-cyan-100',
    enterprise: true,
  },
  {
    name: 'assignment_metrics',
    title: 'ASSIGNMENT_SETTINGS.METRICS.TITLE',
    description: 'ASSIGNMENT_SETTINGS.METRICS.DESCRIPTION',
    icon: 'bar-chart',
    route: 'assignment_metrics',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
];

const visibleSettings = settingItems.filter(
  item => !item.enterprise || isOnEnterpriseEdition.value
);

const navigateTo = route => {
  router.push({ name: route });
};
</script>

<template>
  <div>
    <BaseSettingsHeader
      :title="$t('ASSIGNMENT_SETTINGS.HEADER')"
      :description="$t('ASSIGNMENT_SETTINGS.DESCRIPTION')"
    />
    
    <div class="grid grid-cols-1 gap-4 p-8 md:grid-cols-2">
      <BaseSettingsListItem
        v-for="item in visibleSettings"
        :key="item.name"
        :title="$t(item.title)"
        :description="$t(item.description)"
        :icon="item.icon"
        :icon-color="item.color"
        :icon-bg="item.bgColor"
        @click="navigateTo(item.route)"
      />
    </div>
  </div>
</template>