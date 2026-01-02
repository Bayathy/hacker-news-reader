<template>
  <div
    class="py-3"
    :class="levelClass"
  >
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-(--ui-text-muted)">
      <span v-if="node.by">by {{ node.by }}</span>
      <span v-else>by [deleted]</span>
      <span>·</span>
      <span>{{ formatRelativeTimeFromUnixSeconds(node.time) }}</span>
    </div>

    <div class="mt-2 text-sm leading-relaxed">
      <!-- eslint-disable vue/no-v-html -->
      <div
        v-if="node.text"
        class="prose prose-sm max-w-none"
        v-html="node.text"
      />
      <p
        v-else
        class="text-(--ui-text-muted)"
      >
        （このコメントは削除されました）
      </p>
      <!-- eslint-enable vue/no-v-html -->
    </div>

    <div
      v-if="node.kids.length > 0"
      class="mt-3 grid gap-3"
    >
      <CommentNode
        v-for="kid in node.kids"
        :key="kid.id"
        :node="kid"
        :level="level + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommentNode } from '~/types/api'
import { computed } from 'vue'
import { formatRelativeTimeFromUnixSeconds } from '~/utils/format'

defineOptions({ name: 'CommentNode' })

const props = withDefaults(defineProps<{
  node: CommentNode
  level?: number
}>(), {
  level: 1
})

const levelClass = computed(() => {
  if (props.level <= 1) return ''
  return 'pl-4 border-l border-(--ui-border-muted)'
})
</script>
