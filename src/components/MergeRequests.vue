<template>
  <UTable
      :data="props.mrs"
      :columns="columns"
      class="flex-1"
      empty="nothing to review"
      :ui="{
        td: 'empty:p-0 p-1 group-has-[td:not(:empty)]:border-b border-default',
        thead: 'hidden',
        th: 'hidden',
      }"
  />
</template>


<script setup lang="ts">
import {h, resolveComponent} from 'vue'
import type {TableColumn} from '@nuxt/ui'
import {MergeRequest, User, Issue} from '../model/mr.ts'
import {useMrUpdate} from "../stores/mrUpdate.ts";
import axios from "axios";

const AvatarComponent = resolveComponent('UAvatar')
const AvatarGroupComponent = resolveComponent('UAvatarGroup')
const TooltipComponent = resolveComponent('UTooltip')
const IconComponent = resolveComponent('UIcon')
const BadgeComponent = resolveComponent('UBadge')
const ButtonComponent = resolveComponent('UButton')

const props = defineProps({
  mrs: {
    type: Array<MergeRequest>,
  },
})

const mrUpdate = useMrUpdate()

const columns: TableColumn<MergeRequest>[] = [
  {
    accessorKey: 'author',
    header: '',
    meta: {
      class: {td: 'w-9'},
    },
    cell: ({row}: any) => {
      let cellChildren: any[] = []
      const mr = row.original as MergeRequest
      cellChildren.push(
          h(
              TooltipComponent, {text: mr.author.username, ui: {content: 'z-25'}},
              () => [
                h('a', {href: mr.author.url, target: "_blank",}, h(AvatarComponent, {
                  class: 'h-8 w-8', 'src': mr.author.avatarUrl,
                })),
              ],
          ),
      )

      if (mr.approvedBefore) {
        cellChildren.push(
            h(BadgeComponent, {
              size: 'xs',
              class: 'rounded-full absolute inset-x-5 inset-y-4 h-4 w-4',
              color: 'error',
              icon: 'i-solar:heart-broken-linear',
            }),
        )
      }
      return h(
          'div',
          {
            style: {
              paddingLeft: `${row.depth}rem`,
            },
            class: 'flex items-center relative',
            colspan: 2,
          },
          cellChildren
      )
    }
  },
  {
    accessorKey: 'project',
    header: '',
    meta: {
      class: {td: 'w-15'},
    },
    cell: ({row}: any) => {
      const mr = row.original as MergeRequest
      if (!mr.project) {
        return ''
      }
      return h('a', {href: mr.project.url, target: "_blank",}, mr.project.name,
      )
    }
  },
  {
    accessorKey: 'age',
    header: '',
    meta: {
      class: {td: 'min-w-20 w-20'},
    },
    cell: ({row}: any) => {
      const mr = row.original as MergeRequest
      if (!mr) {
        return ''
      }

      let color
      if (mr.status.outdated) {
        color = 'error'
      } else if (mr.age == '9d' || mr.age == '8d' || mr.age == '7d') {
        color = 'warning'
      } else {
        color = 'success'
      }

      let children = [h(BadgeComponent, {
        variant: 'subtle',
        color: color,
      }, () => mr.age)]
      if (mr.status?.outdated) {
        children.push(
            h(TooltipComponent, {text: 'overdue', ui: {content: 'z-25'}},
                () => [h(
                    IconComponent,
                    {name: 'i-solar:flame-line-duotone', class: 'size-5 text-error'},
                )],
            ),
        )
      }
      if (mrUpdate.isMRFresh(mr)) {
        children.push(
            h(TooltipComponent, {text: 'new', ui: {content: 'z-25'}},
                () => [h(
                    IconComponent,
                    {name: 'i-solar:star-shine-linear', class: 'size-5 text-warning'},
                )],
            ),
        )
      }
      return h('div', {class: 'flex flex-row gap-2'}, children)
    }
  },
  {
    accessorKey: 'description',
    header: '',
    meta: {
      class: {td: 'max-w-50 min-w-50 truncate'},
    },
    cell: ({row}: any) => {
      const mr = row.original as MergeRequest
      if (!mr.url) {
        return ''
      }

      let children: any[] = []

      mr.issues?.forEach((issue: Issue) => {
        children.push(
            h(
                TooltipComponent,
                {text: 'open ticket ' + issue.key, ui: {content: 'z-25'}},
                [h(ButtonComponent, {
                  class: 'size-5 m-0 p-0',
                  color: 'text-neutral',
                  variant: 'ghost',
                  icon: "i-solar:ticket-line-duotone",
                  to: issue.url,
                  target: "_blank",
                })],
            )
        )
      })

      if (mr.status.editorAvailable) {
        children.push(h(
            TooltipComponent,
            {text: 'open project in editor', ui: {content: 'z-25'}},
            () => [h(ButtonComponent, {
              class: 'h-5 m-0 p-0',
              color: 'text-neutral',
              variant: 'ghost',
              icon: "i-solar:meditation-round-line-duotone",
              to: '',
              onClick: () => {
                mrUpdate.markMRViewed(mr)
                openInEditor(mr.project.id)
              },
            })],
        ))
      }

      children.push(
          h('a', {
                href: mr.url, target: "_blank", onClick: () => mrUpdate.markMRViewed(mr),
              }, mr.description,
          )
      )

      return h('div', {class: 'group flex flex-row gap-2'}, children)
    }
  },
  {
    accessorKey: 'status',
    header: '',
    meta: {
      class: {td: 'min-w-10 w-20'},
    },
    cell: ({row}: any) => {
      const mr = row.original as MergeRequest
      if (!mr.status) {
        return ''
      }
      let children: any[] = []

      if (mr.status.conflict) {
        children.push(
            h(TooltipComponent, {text: 'conflict detected', ui: {content: 'z-25'}},
                () => [h(IconComponent, {name: 'i-solar:stop-circle-line-duotone', class: 'size-5 text-error'})],
            )
        )
      }
      if (mr.status.pipelineFailed) {
        children.push(
            h(TooltipComponent, {text: 'pipeline failed', ui: {content: 'z-25'}},
                () => [h(IconComponent, {
                  name: 'solar:cloud-bolt-minimalistic-line-duotone',
                  class: 'size-5 text-error'
                })],
            ),
        )
      }
      if (mr.status.ready) {
        children.push(
            h(TooltipComponent, {text: 'ready', ui: {content: 'z-25'}},
                () => [h(IconComponent, {name: 'i-solar:confetti-line-duotone', class: 'size-5 text-primary'})],
            )
        )
      }
      if (mr.status.pending) {
        children.push(
            h(TooltipComponent, {text: 'waiting for action', ui: {content: 'z-25'}},
                () => [h(IconComponent, {name: 'i-solar:hourglass-line-duotone', class: 'size-5 text-neutral'})],
            )
        )
      }

      if (mr.comments && mr.comments.unresolvedCount > 0) {
        children.push(
            h('div', {class: 'flex flex-row gap-x-1'},
                [
                  h('div', {}, mr.comments.unresolvedCount),
                  h(TooltipComponent, {text: 'has unresolved discussions', ui: {content: 'z-25'}},
                      () => [h(IconComponent, {name: 'i-solar:chat-line-line-duotone', class: 'size-5 text-neutral'},)],
                  )
                ],
            )
        )
      }

      return h('div', {class: 'flex flex-row gap-2'}, children)
    }
  },
  {
    accessorKey: 'approvedBy',
    header: '',
    meta: {
      class: {td: 'min-w-20 w-20'},
    },
    cell: ({row}: any) => {
      const mr = row.original as MergeRequest

      if (!mr.approvedBy || mr.approvedBy.length === 0) {
        return h(
            AvatarGroupComponent,
            {
              class: 'flex items-center gap-2',
            },
        )
      }

      let cellChildren: any[] = []

      mr.approvedBy.forEach((v: User) => {
        let iconChildren: any[] = [
          h(
              TooltipComponent, {text: v.username, ui: {content: 'z-25'}},
              () => [
                h('a', {href: v.url, target: "_blank",}, h(AvatarComponent, {
                  color: 'neutral',
                  variant: 'outline',
                  class: 'h-8 w-8',
                  src: v.avatarUrl,
                })),
              ]
          )
        ]
        if (v.trusted) {
          iconChildren.push(h(BadgeComponent, {
            size: 'xs',
            class: 'rounded-full absolute inset-x-5 inset-y-4 h-4 w-4',
            color: 'warning',
            icon: 'i-solar:crown-linear',
          }))
        }
        const icon = h('div', {class: 'relative'}, iconChildren)

        cellChildren.push(icon)
      })

      return h(
          'div',
          {
            class: 'flex items-center gap-2',
          },
          cellChildren
      )
    }
  }
]

async function openInEditor(projectID: number): Promise<boolean> {
  return await axios.post(
      'http://localhost:8082/editor/v1/OpenProject',
      {
        "projectId": projectID,
      },
  )
}

</script>
