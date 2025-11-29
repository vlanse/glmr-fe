<template>
  <UApp>
    <div class="flex flex-row p-2 gap-2 text-sm h-10 sticky top-0 z-20 bg-default">

      <ULink to="https://github.com/vlanse/glmr" target="_blank" external class="flex flex-row">
        <img alt="glmr" src="/logo.png" class="h-6 max-w-6 min-w-6"/>
      </ULink>

      <UPopover :ui="{content:'z-30 p-1'}" v-model:open="filterPopupOpen">
        <UChip :show="!mrFilter.isEmpty">
          <UButton
              color="secondary" variant="ghost" class="m-0"
              :icon="'i-solar:filter-linear'"
          />
        </UChip>
        <template #content>
          <div class="space-y-4 m-5">
            <UFormField>
              <UCheckbox color="secondary" label="skip approved by me" v-model="mrFilter.skipApprovedByMe"/>
            </UFormField>

            <UFormField>
              <UCheckbox color="secondary" label="do not show drafts" v-model="mrFilter.doNotShowDrafts"/>
            </UFormField>

            <div class="ml-5">
              <UFormField>
                <UCheckbox
                    color="secondary"
                    label="but still show mine"
                    :disabled="!mrFilter.skipApprovedByMe && !mrFilter.doNotShowDrafts"
                    v-model="mrFilter.butStillShowMine"
                />
              </UFormField>
            </div>

            <USeparator orientation="horizontal"/>

            <UFormField>
              <UCheckbox color="secondary" label="show only mine" v-model="mrFilter.showOnlyMine"/>
            </UFormField>

            <div class="flex flex-row gap-2">
              <UButton color="secondary" @click="applyFilters()">
                apply
              </UButton>

              <UButton color="error" @click="mrFilter.resetFilter()">
                reset
              </UButton>
            </div>
          </div>
        </template>
      </UPopover>

      <UButton
          color="secondary" variant="ghost"
          :icon="'i-solar:refresh-linear'"
          @click="groupsViewComponent.reload()"
      />
      <div class="w-100 text-neutral">
        <UKbd>r</UKbd>
        to reload
      </div>
      <div class="basis-99/100"/>
      <div class="flex flex-row gap-2" v-if="groupsViewComponent">
        <p class="text-sm text-right w-80">
          updated {{ formatTimeInterval(groupsViewComponent?.secondsSinceUpdate, true) }} ago,
          next update in {{
            groupsViewComponent ? formatTimeInterval(groupsViewComponent.secondsUntilUpdate, true) : '?'
          }}
        </p>

        <UPopover mode="hover" v-if="groupsViewComponent?.error" :ui="{ content: 'p-2 z-25' }">
          <UIcon name="i-iconoir:warning-triangle" class="text-warning h-5"/>
          <template #content>
            <p class="text-sm">error occurred on last update attempt:</p><br/>
            <pre class="text-wrap text-sm truncate w-70">{{ groupsViewComponent.error }}</pre>
          </template>
        </UPopover>
      </div>
      <UColorModeButton variant="ghost" size="lg" color="secondary"/>
      <UBadge color="neutral" variant="outline">{{ version.currentVersion }}</UBadge>
      <UPopover mode="hover" v-if="version.update.version" :ui="{ content: 'p-2 z-25' }">
        <UButton
            color="primary" variant="ghost"
            :icon="'i-solar:gift-line-duotone'"
            to="https://github.com/vlanse/glmr"
            target="_blank"
        />
        <template #content>
          <p class="text-sm flex flex-row gap-2">
            update to version {{ version.update.version }} available
            <UIcon name="i-solar:confetti-line-duotone" class="text-primary h-5"/>
          </p>

          <vue-markdown :source="version.update.releaseNotes"/>

          <div class="flex flex-row gap-2">
            <pre class="text-sm content-center">{{ installNewVersion }}</pre>
            <UButton
                :color="copied ? 'success' : 'neutral'"
                variant="link"
                size="lg"
                icon="i-solar:copy-line-duotone"
                aria-label="Copy to clipboard"
                @click="copy(installNewVersion)"
            />
          </div>
        </template>
      </UPopover>
    </div>
    <KeepAlive>
      <GroupsView ref="groupsViewComponent"/>
    </KeepAlive>
  </UApp>
</template>

<script setup lang="ts">

import {ref, computed, onMounted} from "vue";
import axios from "axios";

import VueMarkdown from 'vue-markdown-render'
import {useClipboard} from '@vueuse/core'

import GroupsView from "./views/GroupsView.vue";
import {useMrFilter} from "./stores/mrFilter.ts";


const groupsViewComponent = ref()

const mrFilter = useMrFilter()

const filterPopupOpen = ref(false)

const installNewVersion = computed(() =>
    'go install github.com/vlanse/glmr/cmd/glmr@' + version.value.update.version
)
const {copy, copied} = useClipboard()

defineShortcuts({
  r: () => {
    groupsViewComponent.value.reload()
  }
})

function applyFilters() {
  filterPopupOpen.value = !filterPopupOpen.value
  if (filterPopupOpen.value) {
    return
  }
  groupsViewComponent.value.reload()
}

function formatTimeInterval(sec: number, truncateSecs: boolean): string {
  if (sec < 0) {
    return truncateSecs ? '0m' : '0s'
  }

  const days: number = Math.round(sec / 24 / 60 / 60)
  if (days > 0) {
    return `${days}d`
  }

  const hours = Math.round(sec / 60 / 60)
  if (hours > 0) {
    return `${hours}h`
  }

  const minutes = Math.round(sec / 60)
  if (minutes > 0) {
    return `${minutes}m`
  }

  if (truncateSecs) {
    return '0m'
  }

  return `${sec}s`
}

class updateInfo {
  version: string = ""
  releaseNotes: string = ""
  error: string = ""
}

class versionInfo {
  currentVersion: string = ""
  update: updateInfo = new updateInfo()
}

const version = ref<versionInfo>(new versionInfo())

onMounted(() => {
  checkVersion()

  setInterval(() => {
    checkVersion()
  }, 4 * 60 * 60 * 1000)
})

function checkVersion() {
  getVersion().then(data => {
    version.value = data
  })
}

async function getVersion(): Promise<versionInfo> {
  let resp = await axios.post(
      'http://localhost:8082/version/v1/GetVersion',
      {},
  )
  return resp.data;
}

</script>


