<template>
  <UContainer class="py-6">
    <div class="flex items-center justify-between gap-4">
      <UButton color="neutral" variant="ghost" to="/">
        ← 一覧へ
      </UButton>

      <UButton
        color="neutral"
        variant="ghost"
        :to="`https://news.ycombinator.com/item?id=${numericId}`"
        target="_blank"
        rel="noopener noreferrer"
      >
        HNで見る
      </UButton>
    </div>

    <div class="mt-6">
      <UAlert
        v-if="error"
        color="error"
        variant="soft"
        title="読み込みに失敗しました"
        :description="errorMessage"
      />

      <div v-else-if="pending" class="grid gap-3">
        <USkeleton class="h-8" />
        <USkeleton class="h-5 w-3/5" />
        <USkeleton class="h-24" />
      </div>

      <UCard v-else-if="data?.item" :ui="{ body: 'p-5' }">
        <h1 class="text-xl font-semibold">
          {{ data.item.title }}
        </h1>

        <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--ui-text-muted)">
          <span>{{ data.item.score }} points</span>
          <span>by {{ data.item.by }}</span>
          <span>{{ formatRelativeTimeFromUnixSeconds(data.item.time) }}</span>
          <span>{{ data.item.descendants }} comments</span>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <UButton
            v-if="data.item.url"
            color="primary"
            :to="data.item.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            読む
          </UButton>
          <UAlert
            v-else
            color="neutral"
            variant="soft"
            title="外部URLがありません"
            description="Ask/Show などの場合はこのページで概要だけ表示します。"
          />
        </div>
      </UCard>

      <UAlert
        v-else
        color="neutral"
        variant="soft"
        title="記事が見つかりませんでした"
      />
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { formatRelativeTimeFromUnixSeconds } from '~/utils/format'

const route = useRoute()
const numericId = computed(() => Number(route.params.id))

const { data, pending, error } = useItem(numericId)

function getErrorMessage(e: unknown): string {
  if (!e) return 'Unknown error'
  if (e instanceof Error && e.message) return e.message

  if (typeof e === 'object' && e !== null) {
    const record = e as Record<string, unknown>
    const data = record.data
    if (typeof data === 'object' && data !== null) {
      const dataRecord = data as Record<string, unknown>
      if (typeof dataRecord.message === 'string' && dataRecord.message) return dataRecord.message
    }
  }

  return 'Unknown error'
}

const errorMessage = computed(() => {
  return error.value ? getErrorMessage(error.value) : ''
})
</script>
