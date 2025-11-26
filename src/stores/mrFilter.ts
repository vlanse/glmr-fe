import {defineStore} from 'pinia'
import {useStorage} from '@vueuse/core'

export const useMrFilter = defineStore('mrFilter', {
    state: () => {
        return useStorage(
            'mrFilterStorage',
            {
                skipApprovedByMe: false,
                butStillShowMine: false,
                showOnlyMine: false,
                doNotShowDrafts: false,
            },
            localStorage,
            {
                mergeDefaults: true,
            },
        )
    },
    getters: {
        isEmpty: (state) => {
            return !state.skipApprovedByMe && !state.showOnlyMine && !state.doNotShowDrafts
        },
    },
    actions: {
        resetFilter() {
            this.skipApprovedByMe = false
            this.butStillShowMine = false
            this.showOnlyMine = false
            this.doNotShowDrafts = false
        },
    },
})