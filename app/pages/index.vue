<template>
  <UContainer class="py-6">
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          Hacker News
        </h1>
        <p class="text-sm text-(--ui-text-muted)">
          Top stories（30件ずつ）
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="page <= 1"
          @click="page--"
        >
          前へ
        </UButton>
        <span class="text-sm text-(--ui-text-muted)">Page {{ page }}</span>
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="!canGoNext"
          @click="page++"
        >
          次へ
        </UButton>
      </div>
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
        <USkeleton v-for="i in 8" :key="i" class="h-20" />
      </div>

      <UAlert
        v-else-if="!data?.items?.length"
        color="neutral"
        variant="soft"
        title="表示できる記事がありません"
      />

      <div v-else class="grid gap-3">
        <UCard
          v-for="item in data.items"
          :key="item.id"
          :ui="{ body: 'p-4 sm:p-5' }"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <NuxtLink
                class="text-base font-medium underline-offset-4 hover:underline"
                :to="`/item/${item.id}`"
              >
                {{ item.title }}
              </NuxtLink>
              <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--ui-text-muted)">
                <span>{{ item.score }} points</span>
                <span>by {{ item.by }}</span>
                <span>{{ formatRelativeTimeFromUnixSeconds(item.time) }}</span>
                <span>{{ item.descendants }} comments</span>
                <span v-if="item.domain">({{ item.domain }})</span>
              </div>
            </div>

            <UButton
              v-if="item.url"
              color="primary"
              variant="soft"
              :to="item.url"
              target="_blank"
              rel="noopener noreferrer"
            >
              読む
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>

<script setup lang="ts">
import { formatRelativeTimeFromUnixSeconds } from '~/utils/format'

const page = ref(1)
const pageSize = 30

const { data, pending, error } = useStories({ type: 'top', page, pageSize })

const canGoNext = computed(() => {
  const total = data.value?.total ?? 0
  return page.value * pageSize < total
})

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
