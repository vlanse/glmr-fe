import {defineStore} from 'pinia'
import {useStorage} from '@vueuse/core'
import type {MergeRequest} from "../model/mr.ts";

class mrUpdate {
    firstSeen: Date = new Date();
    viewed: boolean = false
}

export const useMrUpdate = defineStore('mrUpdate', {
    state: () => {
        const updates = new Map<string, mrUpdate>();
        const v = useStorage(
            'mrUpdateStorage',
            updates,
            localStorage,
            {
                mergeDefaults: true,
                serializer: {
                    read: (v: string) => {
                        return new Map<string, mrUpdate>(JSON.parse(v));
                    },
                    write: (v: any) => {
                        return JSON.stringify(Array.from(v.entries()))
                    }
                }
            },
        )
        return {
            updates: v,
        }
    },
    actions: {
        isMRFresh(mr: MergeRequest): boolean {
            const key = mr.project.id.toString() + '_' + mr.iid.toString()
            return isMRFresh(this.updates, key)
        },
        countFreshMRs(mrs: MergeRequest[]): number {
            let count = 0
            mrs.forEach((mr) => {
                const key = mr.project.id.toString() + '_' + mr.iid.toString()
                if (isMRFresh(this.updates, key)) {
                    count++
                }
            })
            return count
        },
        addMRInfo(mr: MergeRequest): boolean {
            const key = mr.project.id.toString() + '_' + mr.iid.toString()

            let u = this.updates.get(key) as mrUpdate
            if (!u) {
                this.updates.set(key, new mrUpdate())
                return true
            }
            return false
        },
        markMRViewed(mr: MergeRequest) {
            const key = mr.project.id.toString() + '_' + mr.iid.toString()

            let u = this.updates.get(key) as mrUpdate
            if (!u) {
                return
            }
            u.viewed = true
            this.updates.set(key, u)
        },
        cleanupOldMRs() {
            this.updates.forEach((value: mrUpdate, key: string) => {
                const now = new Date();
                const firstSeen = new Date(value.firstSeen)
                // remove items from local storage in 30 days
                if (!value.firstSeen || (now.getTime() - firstSeen.getTime()) / 1000 > 60 * 60 * 24 * 30) {
                    this.updates.delete(key)
                }
            })
        },
    },
})

function isMRFresh(updates: Map<string, mrUpdate>, key: string): boolean {
    let u = updates.get(key)
    if (!u) {
        return false
    }

    if (u.viewed) {
        return false
    }

    if (!u.firstSeen) {
        return false
    }

    const firstSeen = new Date(u.firstSeen)
    const now = new Date();
    const secondsSinceFirstSeen = (now.getTime() - firstSeen.getTime()) / 1000

    return secondsSinceFirstSeen < 60 * 60 * 24 // in 24 hours MR will not be considered fresh
}
