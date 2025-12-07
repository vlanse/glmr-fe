<template>
  <div class="flex flex-col">
    <UProgress v-model="progress" class="mb-1 sticky top-10 z-11" size="xs"/>
    <UAccordion
        :items="groups"
        type="multiple"
        v-model="activeGroups"
        :ui="{
          content:'overflow-clip',
          header:'sticky top-10 bg-default z-10 h-10 flex border-b border-default',
          item: 'border-0',
        }"
    >

      <template #default="{ item }">
        <div class="flex flex-row justify-center ml-2 gap-5">
          <div class="justify-self-center text-left p-1">{{ item.name }}</div>

          <USeparator orientation="vertical" class="h-7 max-w-2"/>


          <div class="flex flex-row justify-center items-center mt-1 gap-2">
            <UTooltip text="total MRs" :ui="{content:'z-25'}">
              <div class="flex flex-row">
                <UIcon name="i-solar:layers-line-duotone" class="h-5"/>
                <p v-if="item.summary.total !== item.summary.visible" class="h-7 ml-0.5">
                  {{ item.summary.visible }} of {{ item.summary.total }}</p>
                <p v-else class="h-7 ml-0.5">{{ item.summary.total }}</p>
              </div>
            </UTooltip>
            <UTooltip text="overdue MRs" :ui="{content:'z-25'}" v-if="item.summary.overdue>0">
              <div class="flex flex-row">
                <UIcon name="i-solar:flame-line-duotone" class="text-error h-5"/>
                <p v-if="item.summary.overdue !== item.summary.overdueVisible" class="h-7 ml-0.5">
                  {{ item.summary.overdueVisible }} of {{ item.summary.overdue }}</p>
                <p v-else class="h-7 ml-0.5">{{ item.summary.overdue }}</p>
              </div>
            </UTooltip>
            <UTooltip
                text="new MRs" :ui="{content:'z-25'}"
                v-if="useMrUpdate().countFreshMRs(item.mergeRequests)>0"
            >
              <div class="flex flex-row">
                <UIcon name="i-solar:bolt-linear" class="text-warning h-5"/>
                <p class="h-7 ml-0.5">{{ useMrUpdate().countFreshMRs(item.mergeRequests) }}</p>
              </div>
            </UTooltip>
          </div>
        </div>
      </template>

      <template #body="{ item }">
        <div class="mr-2 ml-2">
          <MergeRequests :mrs="item.mergeRequests"/>
        </div>
      </template>

    </UAccordion>
  </div>

</template>

<script setup lang="ts">

import {onMounted, ref, computed} from 'vue'
import {useFavicon, useIntervalFn, useNow} from '@vueuse/core'
import {Group, MergeRequest} from '../model/mr.ts'
import axios from "axios";
import {useWebNotification, useStorage} from '@vueuse/core'
import {useMrFilter} from "../stores/mrFilter.ts";
import {useMrUpdate} from "../stores/mrUpdate.ts";
import {useLogger} from "../composables/useLogger.ts";

const activeGroups = useStorage('activeGroups', [])
const groups = ref<Group[]>([])

const mrFilter = useMrFilter()

const progress = ref<number | null>(0)

const error = ref<string>("")

const updateIntervalSeconds: number = 600

const now = computed<number>(() =>
    useNow({interval: 1000}).value.getTime() / 1000
)

const currentMRs = ref<MergeRequest[]>([])

const favicon = computed(() => useMrUpdate().countFreshMRs(currentMRs.value) == 0 ? 'logo.png' : 'logo-chip.png')
useFavicon(favicon)


const secondsSinceUpdate = computed<number>(() => {
  return Math.floor(now.value - lastSuccessUpdateAt.value.getTime() / 1000)
})

const secondsUntilUpdate = computed<number>(() => {
  return Math.floor(updateIntervalSeconds - (now.value - lastUpdateAttemptAt.value.getTime() / 1000))
})

const lastSuccessUpdateAt = ref<Date>(new Date())
const lastUpdateAttemptAt = ref<Date>(new Date())

defineExpose({
  reload,
  secondsSinceUpdate,
  secondsUntilUpdate,
  error,
})


async function getMergeRequests(): Promise<Group[]> {
  let resp = await axios.post(
      'http://localhost:8082/mr/v1/GetMergeRequests',
      {
        'filter': {
          showOnlyMine: mrFilter.showOnlyMine,
          skipApprovedByMe: mrFilter.skipApprovedByMe,
          butStillShowMine: mrFilter.butStillShowMine,
          doNotShowDrafts: mrFilter.doNotShowDrafts,
        },
      },
  )
  return resp.data.groups;
}

const reloadActivityRunning = ref(false)

useIntervalFn(
    () => {
      const secondsUntilUpdate = Math.floor(updateIntervalSeconds - (new Date().getTime() - lastUpdateAttemptAt.value.getTime()) / 1000)
      useLogger().debug('trigger interval, seconds until update ' + secondsUntilUpdate)
      if (secondsUntilUpdate > 0 || reloadActivityRunning.value) {
        return
      }
      reload()
    },
    1000,
)

onMounted(() => {
  reload()
})

function reload() {
  if (reloadActivityRunning.value) {
    return
  }
  reloadActivityRunning.value = true

  progress.value = null

  useLogger().debug('start loading MRs')

  getMergeRequests().then((res) => {
    groups.value = res

    currentMRs.value = []
    const mrUpdate = useMrUpdate()
    let hasFirstSeen: boolean = false
    res.forEach((group: Group) => {
      group.mergeRequests.forEach((mr: MergeRequest) => {
        hasFirstSeen = mrUpdate.addMRInfo(mr)
        currentMRs.value.push(mr)
      })
    })
    mrUpdate.cleanupOldMRs()

    if (hasFirstSeen) {
      const notification = useWebNotification({
        title: 'New MRs for review appeared',
        dir: 'auto', lang: 'en', renotify: false, tag: 'new mr',
      })
      if (notification.isSupported && notification.permissionGranted) {
        notification.show()
      }
    }

    useLogger().debug('updated MRs successfully')

    updateActivity('')
  }).catch((err: any) => {
    let msg = err.message
    if (err.response) {
      msg = err.response.data.message
    }
    const toast = useToast()
    toast.add({
      title: 'Error',
      description: msg,
    })

    useLogger().debug('error updating MRs: ' + msg)

    updateActivity(msg)
  })
}

function updateActivity(errMsg: string) {
  progress.value = 0
  error.value = errMsg

  lastUpdateAttemptAt.value = new Date()
  if (!errMsg) {
    lastSuccessUpdateAt.value = lastUpdateAttemptAt.value
  }
  reloadActivityRunning.value = false
}

</script>
