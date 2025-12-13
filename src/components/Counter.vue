<template>
  <UTooltip :text="props.tooltip" :ui="{content:'z-25'}">
    <div class="flex flex-row items-center gap-1">
      <UIcon :name="props.icon" :class="props.iconClass"/>
      <p>{{ props.visible }}</p>
      <p v-if="props.visible != props.total" class="dark:text-gray-500 light:text-gray-400">of {{ props.total }}</p>
    </div>
  </UTooltip>
</template>

<script setup lang="ts">

const props = defineProps({
  visible: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    default: 0,
  },
  tooltip: {
    type: String,
    default: 0,
  },
  icon: {
    type: String,
    default: 0,
  },
  iconClass: {
    type: String,
    default: '',
  }
})
</script>

