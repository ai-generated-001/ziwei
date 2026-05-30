<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
  content: string;
}>();

// Configure marked for clean output
marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderedHtml = computed(() => {
  if (!props.content) return '';
  return marked.parse(props.content) as string;
});
</script>

<template>
  <div class="markdown-body" v-html="renderedHtml"></div>
</template>

<style scoped>
.markdown-body {
  font-size: 0.875rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.92);
  word-wrap: break-word;
}

/* Headings */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  color: #fff;
  font-weight: 600;
  margin-top: 1.2em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

.markdown-body :deep(h1) {
  font-size: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 0.4em;
}

.markdown-body :deep(h2) {
  font-size: 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 0.3em;
}

.markdown-body :deep(h3) {
  font-size: 1rem;
}

.markdown-body :deep(h4) {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
}

/* First child should not have top margin */
.markdown-body :deep(> :first-child) {
  margin-top: 0 !important;
}

/* Last child should not have bottom margin */
.markdown-body :deep(> :last-child) {
  margin-bottom: 0 !important;
}

/* Paragraphs */
.markdown-body :deep(p) {
  margin-top: 0.6em;
  margin-bottom: 0.6em;
}

/* Bold / Strong — use gold accent */
.markdown-body :deep(strong) {
  color: #d4af37;
  font-weight: 600;
}

/* Italic */
.markdown-body :deep(em) {
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

/* Links */
.markdown-body :deep(a) {
  color: #d4af37;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s;
}

.markdown-body :deep(a:hover) {
  color: #e8c94a;
}

/* Unordered & Ordered Lists */
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.markdown-body :deep(ul) {
  list-style-type: disc;
}

.markdown-body :deep(ol) {
  list-style-type: decimal;
}

.markdown-body :deep(li) {
  margin: 0.25em 0;
  line-height: 1.6;
}

.markdown-body :deep(li > ul),
.markdown-body :deep(li > ol) {
  margin: 0.15em 0;
}

/* Blockquotes */
.markdown-body :deep(blockquote) {
  margin: 0.8em 0;
  padding: 0.5em 1em;
  border-left: 3px solid rgba(212, 175, 55, 0.4);
  background: rgba(212, 175, 55, 0.05);
  border-radius: 0 8px 8px 0;
  color: rgba(255, 255, 255, 0.8);
}

.markdown-body :deep(blockquote p) {
  margin: 0.25em 0;
}

/* Inline Code */
.markdown-body :deep(code) {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.15em 0.4em;
  border-radius: 4px;
  font-size: 0.85em;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  color: #e8c94a;
}

/* Code Blocks */
.markdown-body :deep(pre) {
  margin: 0.8em 0;
  padding: 0.9em 1em;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  overflow-x: auto;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 0.82em;
  color: rgba(255, 255, 255, 0.85);
}

/* Horizontal Rule */
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  margin: 1.2em 0;
}

/* Tables */
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 0.8em 0;
  font-size: 0.82rem;
}

.markdown-body :deep(th) {
  background: rgba(212, 175, 55, 0.1);
  color: #d4af37;
  font-weight: 600;
  text-align: left;
  padding: 0.5em 0.75em;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
}

.markdown-body :deep(td) {
  padding: 0.4em 0.75em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.markdown-body :deep(tr:hover td) {
  background: rgba(255, 255, 255, 0.02);
}

/* Images */
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 0.6em 0;
}
</style>
