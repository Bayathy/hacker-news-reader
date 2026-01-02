<template>
  <UContainer class="py-6">
    <div class="flex items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          Hacker News
        </h1>
        <p class="text-sm text-(--ui-text-muted)">
          {{ typeLabel }} stories（30件ずつ）
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="page <= 1"
          @click="setPage(page - 1)"
        >
          前へ
        </UButton>
        <span class="text-sm text-(--ui-text-muted)">Page {{ page }}</span>
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="!canGoNext"
          @click="setPage(page + 1)"
        >
          次へ
        </UButton>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-2">
      <UButton
        v-for="option in typeOptions"
        :key="option.value"
        color="neutral"
        :variant="type === option.value ? 'solid' : 'ghost'"
        :aria-pressed="type === option.value"
        @click="setType(option.value)"
      >
        {{ option.label }}
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

      <div
        v-else-if="pending"
        class="grid gap-3"
      >
        <USkeleton
          v-for="i in 8"
          :key="i"
          class="h-20"
        />
      </div>

      <UAlert
        v-else-if="!data?.items?.length"
        color="neutral"
        variant="soft"
        title="表示できる記事がありません"
      />

      <div
        v-else
        class="grid gap-3"
      >
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
import type { StoriesType } from '~/types/api'
import { formatRelativeTimeFromUnixSeconds } from '~/utils/format'

const pageSize = 30

function firstQueryValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return typeof value[0] === 'string' ? value[0] : undefined
  return typeof value === 'string' ? value : undefined
}

function normalizeStoriesType(value: unknown): StoriesType {
  const v = firstQueryValue(value)
  if (v === 'top' || v === 'new' || v === 'best') return v
  return 'top'
}

function normalizePage(value: unknown): number {
  const v = firstQueryValue(value)
  const parsed = v ? Number.parseInt(v, 10) : Number.NaN
  if (!Number.isFinite(parsed) || parsed < 1) return 1
  return parsed
}

const route = useRoute()
const router = useRouter()

const type = computed<StoriesType>(() => normalizeStoriesType(route.query.type))
const page = computed<number>(() => normalizePage(route.query.page))

function setType(next: StoriesType) {
  void router.push({
    query: {
      ...route.query,
      type: next,
      page: '1'
    }
  })
}

function setPage(next: number) {
  const n = Math.max(1, Math.floor(next))
  void router.push({
    query: {
      ...route.query,
      page: String(n)
    }
  })
}

const typeOptions: Array<{ label: string, value: StoriesType }> = [
  { label: 'Top', value: 'top' },
  { label: 'New', value: 'new' },
  { label: 'Best', value: 'best' }
]

const typeLabel = computed(() => {
  if (type.value === 'new') return 'New'
  if (type.value === 'best') return 'Best'
  return 'Top'
})

const { data, pending, error } = useStories({ type, page, pageSize })

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
