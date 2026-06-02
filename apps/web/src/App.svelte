<script lang="ts">
  import { onMount } from "svelte";
  import { fetchLatestResources, fetchMediaItems, fetchUserMediaStatus, saveUserMediaStatus } from "./lib/api";
  import { featuredMedia, latestResources as sampleLatestResources } from "./lib/sample-data";
  import PosterImage from "./lib/PosterImage.svelte";
  import type { MediaItem, ResourcePost, WatchStatus } from "@screenharbor/shared";

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

  onMount(async () => {
    try {
      const [mediaResponse, resourceResponse] = await Promise.all([fetchMediaItems(), fetchLatestResources()]);
      mediaItems = mediaResponse;
      latestResources = resourceResponse;
      selectedMedia = mediaResponse[0] ?? featuredMedia[0];
      dataSource = "API 数据";
      await loadSelectedStatus(selectedMedia.id);
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

  $: if (selectedMedia.id) {
    void loadSelectedStatus(selectedMedia.id);
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
        <h2>新增资源</h2>
        <span>待审核优先</span>
      </div>
      {#each latestResources as resource}
        <div class="resource-row">
          <strong>{resource.title}</strong>
          <span>{resource.type} · {resource.visibility} · {resource.status}</span>
        </div>
      {/each}
    </div>

    <form class="submit-form">
      <h2>发布资源</h2>
      <input placeholder="资源标题" />
      <select>
        <option>torrent</option>
        <option>ed2k</option>
        <option>网盘</option>
        <option>字幕</option>
        <option>其他</option>
      </select>
      <textarea placeholder="版本、清晰度、字幕、大小等说明"></textarea>
      <button type="button">提交审核</button>
    </form>
  </section>
</main>
