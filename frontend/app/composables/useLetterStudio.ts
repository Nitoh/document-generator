import type { DocumentTemplate, LetterDraft, LetterLayout } from '~/types/document'
import { createDraft } from '~/utils/letter'
import { renderTemplate, templateFields, validateTemplate, layoutFields, renderLayout, layoutTextKeys } from '~/utils/template'

const draftKey = 'nitoh.letter-draft.v1'
const templatesKey = 'nitoh.letter-templates.v1'
export function useLetterStudio() {
  const config = useRuntimeConfig()
  const localMode = config.public.storageMode === 'local'
  const draft = reactive<LetterDraft>(createDraft())
  const values = reactive<Record<string, string>>(Object.assign(Object.create(null), { Datum: '15.11.2026', Uhrzeit: '10:00 Uhr' }))
  const templates = ref<DocumentTemplate[]>([])
  const selectedId = ref<string | null>(null)
  const busy = ref(false)
  const loading = ref(false)
  const message = ref('')
  const error = ref('')
  const draftStatus = ref('Entwurf wird vorbereitet')
  const rendered = ref<string | null>(null)
  const renderedLayout = ref<LetterLayout | null>(null)
  const previewLayout = computed(() => renderedLayout.value ?? draft.layout)
  const fields = computed(() => [...new Set([...templateFields(draft.content), ...layoutFields(draft.layout)])])
  const previewBody = computed(() => rendered.value ?? draft.content)
  let revision = 0
  let ready = false
  let timer: ReturnType<typeof setTimeout> | undefined
  function problem(cause: unknown): string {
    const data = (cause as { data?: { detail?: string; errors?: Record<string, string[]> } })?.data
    return data?.detail || Object.values(data?.errors || {}).flat().join(' ') || (cause instanceof Error && !(cause as { statusCode?: number }).statusCode ? cause.message : '') || 'Die API ist nicht erreichbar. Prüfe, ob das Backend läuft, und versuche es erneut.'
  }
  function request<T>(path: string, options: Record<string, unknown> = {}) {
    return $fetch<T>(`${config.public.apiBase.replace(/\/+$/, '')}${path}`, { timeout: 90000, retry: 0, ...options })
  }
  function saveDraft() {
    if (!ready) return
    clearTimeout(timer)
    draftStatus.value = 'Speichert Entwurf …'
    timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ draft, values, selectedId: selectedId.value }))
        draftStatus.value = 'Entwurf auf diesem Gerät gespeichert'
      } catch { draftStatus.value = 'Entwurf kann auf diesem Gerät nicht gespeichert werden' }
    }, 350)
  }
  watch([draft, values], () => {
    revision++; rendered.value = null; renderedLayout.value = null; message.value = ''; saveDraft()
  }, { deep: true, flush: 'sync' })
  watch(selectedId, saveDraft)
  async function loadTemplates() {
    loading.value = true
    error.value = ''
    try {
      templates.value = localMode
        ? (JSON.parse(localStorage.getItem(templatesKey) || '[]') as DocumentTemplate[]).map(item => ({ ...item, category: item.category || 'Allgemeines' }))
        : await request<DocumentTemplate[]>('/api/templates')
    } catch (cause) { error.value = problem(cause) }
    finally { loading.value = false }
  }
  onMounted(async () => {
    try {
      const stored = JSON.parse(localStorage.getItem(draftKey) || 'null')
      if (stored?.draft && typeof stored.draft.content === 'string' && stored.draft.layout) {
        Object.assign(draft, stored.draft, { layout: { ...createDraft().layout, ...stored.draft.layout } })
        if (stored.values && typeof stored.values === 'object') Object.assign(values, stored.values)
        selectedId.value = typeof stored.selectedId === 'string' ? stored.selectedId : null
      }
    } catch { draftStatus.value = 'Neuer Entwurf' }
    ready = true; saveDraft()
    await loadTemplates()
  })
  onBeforeUnmount(() => clearTimeout(timer))
  function choose(item: DocumentTemplate) {
    revision++
    Object.assign(draft, { name: item.name, category: item.category || 'Allgemeines', type: item.type, content: item.content, layout: { ...createDraft().layout, ...item.layout } })
    selectedId.value = item.id.startsWith('starter:') ? null : item.id
    rendered.value = null; renderedLayout.value = null; error.value = ''; message.value = 'Vorlage geöffnet. Layout und Bausteine bleiben frei änderbar.'
  }
  function fresh() {
    Object.assign(draft, createDraft())
    selectedId.value = null; rendered.value = null; error.value = ''; message.value = ''
  }
  function createTemplate(template: LetterDraft) {
    Object.assign(draft, template)
    selectedId.value = null
    rendered.value = null; renderedLayout.value = null; error.value = ''; message.value = 'Neue Briefvorlage vorbereitet. Text und Platzhalter kannst du jetzt anpassen und speichern.'
    for (const key of Object.keys(values)) delete values[key]
  }
  async function saveTemplate() {
    if (busy.value) return
    error.value = ''; message.value = ''
    if (!draft.name.trim()) { error.value = 'Bitte gib der Vorlage einen Namen.'; return }
    busy.value = true
    try {
      validateTemplate(draft.content)
      for (const key of layoutTextKeys) if (draft.layout[key].trim()) validateTemplate(draft.layout[key])
      if (!draft.category.trim() || draft.category.trim().length > 80) throw new Error('Bitte wähle eine Kategorie.')
      let saved: DocumentTemplate
      if (localMode) {
        saved = { ...JSON.parse(JSON.stringify(draft)), id: selectedId.value || crypto.randomUUID(), createdAt: templates.value.find(t => t.id === selectedId.value)?.createdAt || new Date().toISOString() }
        const next = [saved, ...templates.value.filter(t => t.id !== saved.id)]
        localStorage.setItem(templatesKey, JSON.stringify(next)); templates.value = next
      } else {
        saved = await request<DocumentTemplate>(selectedId.value ? `/api/templates/${selectedId.value}` : '/api/templates', { method: selectedId.value ? 'PUT' : 'POST', body: draft })
        await loadTemplates()
      }
      selectedId.value = saved.id; message.value = 'Vorlage gespeichert.'
    } catch (cause) { error.value = problem(cause) }
    finally { busy.value = false }
  }
  async function removeTemplate(item: DocumentTemplate) {
    if (busy.value || !window.confirm(`Vorlage „${item.name}“ dauerhaft löschen?`)) return
    busy.value = true; error.value = ''
    try {
      if (localMode) {
        const next = templates.value.filter(t => t.id !== item.id)
        localStorage.setItem(templatesKey, JSON.stringify(next)); templates.value = next
      } else { await request(`/api/templates/${item.id}`, { method: 'DELETE' }); await loadTemplates() }
      if (selectedId.value === item.id) selectedId.value = null
      message.value = 'Vorlage gelöscht.'
    } catch (cause) { error.value = problem(cause) }
    finally { busy.value = false }
  }
  async function generate() {
    if (busy.value) return
    error.value = ''; message.value = ''; busy.value = true
    const version = revision
    try {
      // Validate locally for immediate feedback; API mode still uses the C# service.
      const local = renderTemplate(draft.content, values)
      const layout = renderLayout(draft.layout, values)
      const result = localMode ? { content: local, layout } : await request<{ content: string; layout: LetterLayout }>('/api/documents/generate', { method: 'POST', body: { template: draft.content, values, layout: draft.layout } })
      if (result.content.length > 50000) throw new Error('Für die Briefvorschau sind maximal 50.000 Zeichen möglich. Bitte kürze den Text.')
      if (version === revision) { rendered.value = result.content; renderedLayout.value = result.layout; message.value = 'Dein Brief ist bereit für die Druckvorschau.' }
    } catch (cause) { if (version === revision) error.value = problem(cause) }
    finally { busy.value = false }
  }
  return { draft, values, templates, selectedId, busy, loading, message, error, draftStatus, fields, previewBody, previewLayout, rendered, localMode, loadTemplates, choose, fresh, createTemplate, saveTemplate, removeTemplate, generate }
}
