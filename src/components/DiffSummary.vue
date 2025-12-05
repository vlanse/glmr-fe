<template>
  <UBadge color="neutral" variant="subtle" class="max-h-7">
    <div class="flex flex-row gap-1 items-center ">
      <UIcon name="i-solar:documents-linear" class="min-w-3"/>
      <p class="text-warning text-[12px]">{{ props.files }}</p>
      <div class="flex flex-col gap-0 text-[9px]">
        <p class="text-success">+{{ props.added }}</p>
        <p class="text-error">-{{ props.removed }}</p>
      </div>
    </div>
  </UBadge>
</template>
<script setup lang="ts">
const props = defineProps({
  added: {
    type: Number,
    default: 0
  },
  removed: {
    type: Number,
    default: 0,
  },
  files: {
    type: Number,
    default: 0,
  },
})
</script>