<template>
  <UContainer class="py-6">
    <div class="flex items-center justify-between gap-4">
      <UButton
        color="neutral"
        variant="ghost"
        to="/"
      >
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

      <div
        v-else-if="pending"
        class="grid gap-3"
      >
        <USkeleton class="h-8" />
        <USkeleton class="h-5 w-3/5" />
        <USkeleton class="h-24" />
      </div>

      <UCard
        v-else-if="itemData?.item"
        :ui="{ body: 'p-5' }"
      >
        <h1 class="text-xl font-semibold">
          {{ itemData.item.title }}
        </h1>

        <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--ui-text-muted)">
          <span>{{ itemData.item.score }} points</span>
          <span>by {{ itemData.item.by }}</span>
          <span>{{ formatRelativeTimeFromUnixSeconds(itemData.item.time) }}</span>
          <span>{{ itemData.item.descendants }} comments</span>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <UButton
            v-if="itemData.item.url"
            color="primary"
            :to="itemData.item.url"
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

        <div class="mt-8">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-base font-semibold">
              コメント
            </h2>
            <UButton
              color="neutral"
              variant="soft"
              @click="toggleComments"
            >
              {{ showComments ? 'コメントを隠す' : `コメントを表示 (${itemData.item.descendants})` }}
            </UButton>
          </div>

          <p class="mt-2 text-xs text-(--ui-text-muted)">
            最大{{ maxComments }}件 / 深さ{{ maxDepth }}まで（遅延ロード）
          </p>

          <UAlert
            v-if="showComments && commentsError"
            class="mt-4"
            color="error"
            variant="soft"
            title="コメントの読み込みに失敗しました"
            :description="commentsErrorMessage"
          />

          <div
            v-else-if="showComments && commentsPending"
            class="mt-4 grid gap-3"
          >
            <USkeleton class="h-5 w-2/5" />
            <USkeleton class="h-16" />
            <USkeleton class="h-16" />
          </div>

          <div
            v-else-if="showComments"
            class="mt-4"
          >
            <div class="text-xs text-(--ui-text-muted)">
              loaded {{ commentsData?.comments?.loaded ?? 0 }} / total {{ commentsData?.comments?.total ?? itemData.item.descendants }}
            </div>

            <UAlert
              v-if="!commentsData?.comments || commentsData.comments.items.length === 0"
              class="mt-3"
              color="neutral"
              variant="soft"
              title="コメントはありません"
            />

            <div
              v-else
              class="mt-3 divide-y divide-(--ui-border-muted)"
            >
              <CommentNode
                v-for="node in commentsData.comments.items"
                :key="node.id"
                :node="node"
              />
            </div>
          </div>
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

const { data: itemData, pending, error } = useItem(numericId)

const maxComments = 50
const maxDepth = 4
const showComments = ref(false)
const {
  data: commentsData,
  pending: commentsPending,
  error: commentsError,
  refresh: fetchComments
} = useItemComments(numericId, { maxComments, maxDepth })

async function toggleComments() {
  showComments.value = !showComments.value
  if (showComments.value && !commentsData.value) {
    await fetchComments()
  }
}

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

const commentsErrorMessage = computed(() => {
  return commentsError.value ? getErrorMessage(commentsError.value) : ''
})
</script>
