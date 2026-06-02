<script lang="ts">
  import { onMount } from "svelte";
  import {
    createReport,
    createResource,
    createReview,
    fetchLatestResources,
    fetchMediaItems,
    fetchMediaResources,
    fetchMediaReviews,
    fetchPendingResources,
    fetchUserMediaStatus,
    moderateResource,
    saveUserMediaStatus
  } from "./lib/api";
  import { featuredMedia, latestResources as sampleLatestResources } from "./lib/sample-data";
  import PosterImage from "./lib/PosterImage.svelte";
  import {
    resourceTypes,
    resourceVisibilities,
    type MediaItem,
    type Report,
    type ResourcePost,
    type ResourceType,
    type ResourceVisibility,
    type UserReview,
    type WatchStatus
  } from "@screenharbor/shared";

  export let telegramInitData = "";

  const filters = ["全部", "电影", "剧集", "动画", "纪录片", "综艺"];
  const watchStatuses: { value: WatchStatus; label: string }[] = [
    { value: "planned", label: "想看" },
    { value: "watching", label: "在看" },
    { value: "completed", label: "看过" },
    { value: "dropped", label: "弃剧" },
    { value: "rewatching", label: "重刷" }
  ];

  let selectedFilter = "全部";
  let selectedMedia: MediaItem = featuredMedia[0];
  let selectedStatus: WatchStatus = "planned";
  let query = "";
  let mediaItems: MediaItem[] = featuredMedia;
  let latestResources: ResourcePost[] = sampleLatestResources;
  let dataSource = "本地样例";
  let isLoading = true;
  let savedStatuses: Record<string, WatchStatus> = {};
  let statusMessage = "未保存";
  let isStatusSaving = false;
  let statusRequestId = 0;
  let selectedMediaId = selectedMedia.id;
  let mediaResources: ResourcePost[] = sampleLatestResources.filter((resource) => resource.mediaItemId === selectedMedia.id);
  let reviews: UserReview[] = [];
  let pendingResources: ResourcePost[] = [];
  let reviewBody = "";
  let reviewRating = 8;
  let reviewContainsSpoiler = false;
  let reviewMessage = "";
  let resourceTitle = "";
  let resourceUrl = "";
  let resourceType: ResourceType = "cloud_drive";
  let resourceVisibility: ResourceVisibility = "login_only";
  let resourcePoints = 0;
  let resourceNote = "";
  let resourceMessage = "";
  let reportReason = "";
  let reportMessage = "";
  let moderationMessage = "";

  onMount(async () => {
    try {
      const [mediaResponse, resourceResponse] = await Promise.all([fetchMediaItems(), fetchLatestResources()]);
      mediaItems = mediaResponse;
      latestResources = resourceResponse;
      selectedMedia = mediaResponse[0] ?? featuredMedia[0];
      selectedMediaId = selectedMedia.id;
      dataSource = "API 数据";
      await loadSelectedStatus(selectedMedia.id);
      await loadSelectedMediaData(selectedMedia.id);
      await loadPendingResources();
    } catch {
      dataSource = "本地样例";
      selectedStatus = savedStatuses[selectedMedia.id] ?? "planned";
    } finally {
      isLoading = false;
    }
  });

  $: filteredMedia = mediaItems.filter((item) => {
    const matchesType = selectedFilter === "全部" || typeLabel(item.type) === selectedFilter;
    const text = `${item.chineseTitle} ${item.originalTitle ?? ""} ${item.englishTitle ?? ""} ${item.tags.join(" ")}`;
    return matchesType && text.toLowerCase().includes(query.toLowerCase());
  });

  $: if (!filteredMedia.some((item) => item.id === selectedMedia.id) && filteredMedia[0]) {
    selectedMedia = filteredMedia[0];
  }

  $: if (selectedMedia.id && selectedMedia.id !== selectedMediaId) {
    selectedMediaId = selectedMedia.id;
    void loadSelectedStatus(selectedMedia.id);
    void loadSelectedMediaData(selectedMedia.id);
  }

  function typeLabel(type: MediaItem["type"]) {
    return {
      movie: "电影",
      series: "剧集",
      anime: "动画",
      documentary: "纪录片",
      variety: "综艺"
    }[type];
  }

  async function loadSelectedStatus(mediaItemId: string) {
    const requestId = ++statusRequestId;
    selectedStatus = savedStatuses[mediaItemId] ?? "planned";
    statusMessage = savedStatuses[mediaItemId] ? "已加载" : "未保存";

    try {
      const remoteStatus = await fetchUserMediaStatus(mediaItemId, telegramInitData);

      if (requestId !== statusRequestId) {
        return;
      }

      if (remoteStatus) {
        savedStatuses = { ...savedStatuses, [mediaItemId]: remoteStatus.status };
        selectedStatus = remoteStatus.status;
        statusMessage = "已同步";
      }
    } catch {
      if (requestId === statusRequestId) {
        statusMessage = "本地状态";
      }
    }
  }

  async function selectStatus(status: WatchStatus) {
    selectedStatus = status;
    savedStatuses = { ...savedStatuses, [selectedMedia.id]: status };
    isStatusSaving = true;
    statusMessage = "保存中";

    try {
      const remoteStatus = await saveUserMediaStatus(selectedMedia.id, status, telegramInitData);
      savedStatuses = { ...savedStatuses, [selectedMedia.id]: remoteStatus.status };
      selectedStatus = remoteStatus.status;
      statusMessage = "已保存";
    } catch {
      statusMessage = "已本地暂存";
    } finally {
      isStatusSaving = false;
    }
  }

  async function loadSelectedMediaData(mediaItemId: string) {
    try {
      const [resourceResponse, reviewResponse] = await Promise.all([
        fetchMediaResources(mediaItemId),
        fetchMediaReviews(mediaItemId)
      ]);
      mediaResources = resourceResponse;
      reviews = reviewResponse;
    } catch {
      mediaResources = latestResources.filter((resource) => resource.mediaItemId === mediaItemId);
      reviews = [];
    }
  }

  async function loadPendingResources() {
    try {
      pendingResources = await fetchPendingResources(telegramInitData);
    } catch {
      pendingResources = latestResources.filter((resource) => resource.status === "pending");
    }
  }

  async function submitReview() {
    if (!reviewBody.trim()) {
      reviewMessage = "请输入短评";
      return;
    }

    try {
      const review = await createReview(
        selectedMedia.id,
        { body: reviewBody, containsSpoiler: reviewContainsSpoiler, rating: reviewRating },
        telegramInitData
      );
      reviews = [review, ...reviews];
      reviewBody = "";
      reviewContainsSpoiler = false;
      reviewMessage = "短评已发布";
    } catch {
      reviewMessage = "API 不可用，短评未保存";
    }
  }

  async function submitResource() {
    if (!resourceTitle.trim() || !resourceUrl.trim()) {
      resourceMessage = "请填写标题和链接";
      return;
    }

    try {
      const resource = await createResource(
        selectedMedia.id,
        {
          requiredPoints: resourcePoints,
          title: resourceTitle,
          type: resourceType,
          url: resourceUrl,
          versionNote: resourceNote,
          visibility: resourceVisibility
        },
        telegramInitData
      );
      mediaResources = [resource, ...mediaResources];
      pendingResources = [resource, ...pendingResources];
      latestResources = [resource, ...latestResources];
      resourceTitle = "";
      resourceUrl = "";
      resourceNote = "";
      resourcePoints = 0;
      resourceMessage = "资源已提交审核";
    } catch {
      resourceMessage = "API 不可用，资源未提交";
    }
  }

  async function submitReport(targetType: Report["targetType"], targetId: string) {
    const reason = reportReason.trim() || "用户标记为失效或违规";

    try {
      await createReport({ reason, targetId, targetType }, telegramInitData);
      reportReason = "";
      reportMessage = "举报已提交";
    } catch {
      reportMessage = "API 不可用，举报未提交";
    }
  }

  async function reviewResource(resource: ResourcePost, action: "publish" | "reject" | "hide") {
    try {
      const updated = await moderateResource(resource.id, action, telegramInitData);
      pendingResources = pendingResources.filter((item) => item.id !== resource.id);

      if (updated && updated.mediaItemId === selectedMedia.id) {
        mediaResources = mediaResources.map((item) => (item.id === updated.id ? updated : item));
      }

      moderationMessage = action === "publish" ? "资源已发布" : "资源已处理";
    } catch {
      moderationMessage = "API 不可用，审核未保存";
    }
  }

  function resourceTypeLabel(type: ResourceType) {
    return {
      cloud_drive: "网盘",
      ed2k: "ed2k",
      other: "其他",
      subtitle: "字幕",
      torrent: "torrent"
    }[type];
  }

  function visibilityLabel(visibility: ResourceVisibility) {
    return {
      author_only: "仅作者",
      login_only: "登录可见",
      points_only: "积分可见",
      public: "公开",
      review_only: "审核可见"
    }[visibility];
  }
</script>

<main class="app-shell">
  <header class="topbar">
    <div>
      <p class="eyebrow">ScreenHarbor</p>
      <h1>幕屿</h1>
    </div>
    <div class="telegram-state" class:active={telegramInitData}>
      {telegramInitData ? "Telegram 已识别" : dataSource}
    </div>
  </header>

  <section class="search-panel">
    <label for="search">搜索影视</label>
    <input id="search" bind:value={query} placeholder="片名、标签、英文名" />
    <nav aria-label="类型筛选">
      {#each filters as filter}
        <button class:active={selectedFilter === filter} on:click={() => (selectedFilter = filter)}>
          {filter}
        </button>
      {/each}
    </nav>
  </section>

  <section class="content-grid">
    <div class="media-list" aria-label="影视条目">
      <div class="section-heading">
        <h2>最近更新</h2>
        <span>{isLoading ? "加载中" : `${filteredMedia.length} 个条目`}</span>
      </div>

      {#each filteredMedia as item}
        <button class:selected={selectedMedia.id === item.id} class="media-row" on:click={() => (selectedMedia = item)}>
          <PosterImage src={item.posterUrl} alt={item.chineseTitle} compact />
          <span>
            <strong>{item.chineseTitle}</strong>
            <small>{typeLabel(item.type)} · {item.year} · {item.tags.join(" / ")}</small>
          </span>
          <b>{item.averageRating?.toFixed(1)}</b>
        </button>
      {:else}
        <p class="empty">没有匹配的条目。</p>
      {/each}
    </div>

    <article class="detail-panel">
      <PosterImage src={selectedMedia.posterUrl} alt={selectedMedia.chineseTitle} />
      <div class="detail-copy">
        <p class="eyebrow">{typeLabel(selectedMedia.type)} · {selectedMedia.year}</p>
        <h2>{selectedMedia.chineseTitle}</h2>
        <p class="original-title">{selectedMedia.originalTitle}</p>
        <p>{selectedMedia.overview}</p>
        <div class="meta-line">
          <span>评分 {selectedMedia.averageRating?.toFixed(1)}</span>
          <span>{selectedMedia.reviewCount} 短评</span>
          <span>{selectedMedia.resourceCount} 资源</span>
        </div>
        <div class="status-group" aria-label="观影状态">
          {#each watchStatuses as status}
            <button
              class:active={selectedStatus === status.value}
              disabled={isStatusSaving}
              on:click={() => selectStatus(status.value)}
            >
              {status.label}
            </button>
          {/each}
        </div>
        <p class="status-message">{statusMessage}</p>
        <a href={selectedMedia.telegraphUrl} target="_blank" rel="noreferrer">Telegraph 长文</a>
      </div>
    </article>
  </section>

  <section class="resource-section">
    <div>
      <div class="section-heading">
        <h2>条目资源</h2>
        <span>{mediaResources.length} 条</span>
      </div>
      {#each mediaResources as resource}
        <div class="resource-row">
          <strong>{resource.title}</strong>
          <span>
            {resourceTypeLabel(resource.type)} · {visibilityLabel(resource.visibility)} · {resource.status}
            {#if resource.requiredPoints > 0}
              · {resource.requiredPoints} 积分
            {/if}
          </span>
          {#if resource.versionNote}
            <p>{resource.versionNote}</p>
          {/if}
          <button type="button" on:click={() => submitReport("resource", resource.id)}>标记失效</button>
        </div>
      {:else}
        <p class="empty">这个条目还没有资源。</p>
      {/each}
    </div>

    <form class="submit-form">
      <h2>发布资源</h2>
      <input bind:value={resourceTitle} placeholder="资源标题" />
      <input bind:value={resourceUrl} placeholder="链接地址" />
      <select bind:value={resourceType}>
        {#each resourceTypes as type}
          <option value={type}>{resourceTypeLabel(type)}</option>
        {/each}
      </select>
      <select bind:value={resourceVisibility}>
        {#each resourceVisibilities as visibility}
          <option value={visibility}>{visibilityLabel(visibility)}</option>
        {/each}
      </select>
      <input bind:value={resourcePoints} min="0" type="number" placeholder="所需积分" />
      <textarea bind:value={resourceNote} placeholder="版本、清晰度、字幕、大小等说明"></textarea>
      <button type="button" on:click={submitResource}>提交审核</button>
      {#if resourceMessage}
        <p class="form-message">{resourceMessage}</p>
      {/if}
    </form>
  </section>

  <section class="review-section">
    <div>
      <div class="section-heading">
        <h2>短评</h2>
        <span>{reviews.length} 条</span>
      </div>
      {#each reviews as review}
        <article class="review-row">
          <strong>{review.displayName}</strong>
          <span>
            {review.rating ? `${review.rating} 分` : "未评分"}
            {#if review.containsSpoiler}
              · 剧透
            {/if}
          </span>
          <p>{review.body}</p>
          <button type="button" on:click={() => submitReport("review", review.id)}>举报短评</button>
        </article>
      {:else}
        <p class="empty">还没有短评。</p>
      {/each}
    </div>

    <form class="submit-form">
      <h2>发布短评</h2>
      <input bind:value={reviewRating} min="1" max="10" type="number" placeholder="评分 1-10" />
      <textarea bind:value={reviewBody} placeholder="写一条短评"></textarea>
      <label class="inline-check">
        <input bind:checked={reviewContainsSpoiler} type="checkbox" />
        <span>包含剧透</span>
      </label>
      <button type="button" on:click={submitReview}>发布短评</button>
      {#if reviewMessage}
        <p class="form-message">{reviewMessage}</p>
      {/if}
    </form>
  </section>

  <section class="admin-section">
    <div>
      <div class="section-heading">
        <h2>资源审核</h2>
        <span>{pendingResources.length} 待处理</span>
      </div>
      {#each pendingResources as resource}
        <div class="resource-row">
          <strong>{resource.title}</strong>
          <span>{resource.mediaItemId} · {resourceTypeLabel(resource.type)} · {visibilityLabel(resource.visibility)}</span>
          <div class="action-row">
            <button type="button" on:click={() => reviewResource(resource, "publish")}>通过</button>
            <button type="button" on:click={() => reviewResource(resource, "reject")}>拒绝</button>
          </div>
        </div>
      {:else}
        <p class="empty">没有待审核资源。</p>
      {/each}
      {#if moderationMessage}
        <p class="form-message">{moderationMessage}</p>
      {/if}
    </div>

    <form class="submit-form">
      <h2>举报说明</h2>
      <textarea bind:value={reportReason} placeholder="失效、违规或纠错说明"></textarea>
      <button type="button" on:click={() => submitReport("media_item", selectedMedia.id)}>举报条目</button>
      {#if reportMessage}
        <p class="form-message">{reportMessage}</p>
      {/if}
    </form>
  </section>
</main>
