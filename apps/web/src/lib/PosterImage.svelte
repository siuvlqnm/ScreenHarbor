<script lang="ts">
  export let src: string | undefined;
  export let alt: string;
  export let compact = false;

  let hasError = false;

  $: initials = alt.slice(0, 4);
</script>

<span class:compact class="poster-frame" aria-label={alt}>
  {#if src && !hasError}
    <img {src} {alt} on:error={() => (hasError = true)} />
  {:else}
    <span class="poster-fallback">{initials}</span>
  {/if}
</span>

<style>
  .poster-frame {
    display: block;
    width: 100%;
    min-height: 320px;
    overflow: hidden;
    border-radius: 8px;
    background:
      linear-gradient(145deg, rgba(37, 99, 235, 0.18), rgba(20, 184, 166, 0.18)),
      #e5eaf2;
  }

  .poster-frame.compact {
    width: 58px;
    height: 82px;
    min-height: 82px;
    border-radius: 6px;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .poster-fallback {
    display: grid;
    width: 100%;
    height: 100%;
    min-height: inherit;
    place-items: center;
    padding: 8px;
    color: #334155;
    font-size: 1.35rem;
    font-weight: 800;
    text-align: center;
  }

  .compact .poster-fallback {
    font-size: 0.76rem;
    line-height: 1.2;
  }
</style>
