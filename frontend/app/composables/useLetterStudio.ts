import type { DocumentTemplate, LetterDraft, LetterLayout, LetterAttachment } from '~/types/document'
import { createDraft } from '~/utils/letter'
import { renderTemplate, templateFields, validateTemplate, layoutFields, renderLayout, layoutTextKeys, previewText, previewLayout as renderPreviewLayout } from '~/utils/template'

const draftKey = 'nitoh.letter-draft.v1'
const templatesKey = 'nitoh.letter-templates.v1'
export function useLetterStudio() {
  const config = useRuntimeConfig()
  const localMode = config.public.storageMode === 'local'
  const remoteAccess = !localMode && Boolean(config.public.apiBase)
  const accessKey = ref('')
  const accessVerified = ref(false)
  const accessStorage = 'nitoh.studio-access.v1'
  const draft = reactive<LetterDraft>(createDraft())
  const values = reactive<Record<string, string>>(Object.assign(Object.create(null), { Datum: '15.11.2026', Uhrzeit: '10:00 Uhr' }))
  const templates = ref<DocumentTemplate[]>([])
  const selectedId = ref<string | null>(null)
  const busy = ref(false)
  const loading = ref(false)
  const message = ref('')
  const error = ref('')
  const hasDraft = ref(false)
  const draftStatus = ref('Entwurf wird vorbereitet')
  const rendered = ref<string | null>(null)
  const renderedLayout = ref<LetterLayout | null>(null)
  const extraAttachments = ref<LetterAttachment[]>([])
  const effectiveLayout = computed(() => ({
    ...draft.layout,
    attachments: [...(draft.layout.attachments ?? []), ...extraAttachments.value]
      .filter((item, index, all) => all.findIndex(other => other.id === item.id) === index)
  }))
  const previewLayout = computed(() => renderedLayout.value ?? renderPreviewLayout(effectiveLayout.value, values))
  const fields = computed(() => [...new Set([...templateFields(draft.content), ...layoutFields(effectiveLayout.value)])])
  const previewBody = computed(() => rendered.value ?? previewText(draft.content, values))
  let revision = 0
  let ready = false
  let timer: ReturnType<typeof setTimeout> | undefined
  function problem(cause: unknown): string {
    if ((cause as { statusCode?: number })?.statusCode === 401) return 'Der Zugriffsschlüssel fehlt oder ist ungültig.'
    const data = (cause as { data?: { detail?: string; errors?: Record<string, string[]> } })?.data
    return data?.detail || Object.values(data?.errors || {}).flat().join(' ') || (cause instanceof Error && !(cause as { statusCode?: number }).statusCode ? cause.message : '') || 'Die API ist nicht erreichbar. Prüfe, ob das Backend läuft, und versuche es erneut.'
  }
  async function request<T>(path: string, options: Record<string, unknown> = {}) {
    try { return await $fetch<T>(`${config.public.apiBase.replace(/\/+$/, '')}${path}`, { timeout: 90000, retry: 0, ...options,
      headers: remoteAccess && accessKey.value ? { Authorization: `Bearer ${accessKey.value}` } : undefined })
    } catch (cause) {
      if ((cause as { statusCode?: number })?.statusCode === 401) lockAccess()
      throw cause
    }
  }
  function lockAccess() {
    accessKey.value = ''
    accessVerified.value = false
    templates.value = []
    try { sessionStorage.removeItem(accessStorage) } catch { /* Access is locked in memory. */ }
  }
  async function unlockAccess(key: string) {
    accessKey.value = key.trim()
    await loadTemplates()
    if (!error.value && accessKey.value) {
      accessVerified.value = true
      try { sessionStorage.setItem(accessStorage, accessKey.value) } catch { /* Access is limited to the current page. */ }
    }
  }
  function saveDraft() {
    if (!ready) return
    clearTimeout(timer)
    draftStatus.value = 'Speichert Entwurf …'
    timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ draft, values, extraAttachments: extraAttachments.value, selectedId: selectedId.value }))
        draftStatus.value = 'Entwurf auf diesem Gerät gespeichert'
      } catch { draftStatus.value = 'Entwurf kann auf diesem Gerät nicht gespeichert werden' }
    }, 350)
  }
  watch([draft, values, extraAttachments], () => {
    revision++; rendered.value = null; renderedLayout.value = null; message.value = ''; saveDraft()
  }, { deep: true, flush: 'sync' })
  watch(selectedId, saveDraft)
  async function loadTemplates() {
    loading.value = true
    error.value = ''
    try {
      templates.value = localMode
        ? (JSON.parse(localStorage.getItem(templatesKey) || '[]') as DocumentTemplate[]).map(item => ({ ...item, category: item.category || 'Allgemeines' }))
        : (await request<DocumentTemplate[]>('/api/templates')).map(item => ({ ...item, layout: { ...createDraft().layout, ...item.layout } }))
    } catch (cause) { error.value = problem(cause) }
    finally { loading.value = false }
  }
  onMounted(async () => {
    try {
      const stored = JSON.parse(localStorage.getItem(draftKey) || 'null')
      if (stored?.draft && typeof stored.draft.content === 'string' && stored.draft.layout) {
        hasDraft.value = true
        Object.assign(draft, stored.draft, { layout: { ...createDraft().layout, ...stored.draft.layout } })
        if (stored.values && typeof stored.values === 'object') Object.assign(values, stored.values)
        if (Array.isArray(stored.extraAttachments)) extraAttachments.value = stored.extraAttachments
        selectedId.value = typeof stored.selectedId === 'string' ? stored.selectedId : null
      }
    } catch { draftStatus.value = 'Neuer Entwurf' }
    ready = true
    if (remoteAccess) {
      try { accessKey.value = sessionStorage.getItem(accessStorage) ?? '' } catch { /* Prompt for the key. */ }
      if (accessKey.value) await unlockAccess(accessKey.value)
    } else await loadTemplates()
  })
  onBeforeUnmount(() => clearTimeout(timer))
  function choose(item: DocumentTemplate) {
    hasDraft.value = true
    for (const key of Object.keys(values)) delete values[key]
    extraAttachments.value = []
    revision++
    Object.assign(draft, { name: item.name, category: item.category || 'Allgemeines', type: item.type, content: item.content, layout: { ...createDraft().layout, ...JSON.parse(JSON.stringify(item.layout)) } })
    selectedId.value = item.id.startsWith('starter:') ? null : item.id
    rendered.value = null; renderedLayout.value = null; error.value = ''; message.value = 'Vorlage geöffnet. Layout und Bausteine bleiben frei änderbar.'
    saveDraft()
  }
  function fresh() {
    extraAttachments.value = []
    Object.assign(draft, createDraft())
    selectedId.value = null; rendered.value = null; error.value = ''; message.value = ''
  }
  function createTemplate(template: LetterDraft) {
    extraAttachments.value = []
    Object.assign(draft, template)
    selectedId.value = null
    rendered.value = null; renderedLayout.value = null; error.value = ''; message.value = 'Neue Briefvorlage vorbereitet. Text und Platzhalter kannst du jetzt anpassen und speichern.'
    for (const key of Object.keys(values)) delete values[key]
  }
  async function saveTemplate(template: LetterDraft, id: string | null): Promise<DocumentTemplate | undefined> {
    if (busy.value) return
    error.value = ''; message.value = ''
    if (!template.name.trim()) { error.value = 'Bitte gib der Vorlage einen Namen.'; return }
    busy.value = true
    try {
      validateTemplate(template.content)
      for (const item of template.layout.attachments ?? []) {
        validateTemplate(item.title)
        validateTemplate(item.content)
      }
      for (const key of layoutTextKeys) if (template.layout[key].trim()) validateTemplate(template.layout[key])
      if (!template.category.trim() || template.category.trim().length > 80) throw new Error('Bitte wähle eine Kategorie.')
      let saved: DocumentTemplate
      if (localMode) {
        saved = { ...JSON.parse(JSON.stringify(template)), id: id || crypto.randomUUID(), createdAt: templates.value.find(t => t.id === id)?.createdAt || new Date().toISOString() }
        const next = [saved, ...templates.value.filter(t => t.id !== saved.id)]
        localStorage.setItem(templatesKey, JSON.stringify(next)); templates.value = next
      } else {
        saved = await request<DocumentTemplate>(id ? `/api/templates/${id}` : '/api/templates', { method: id ? 'PUT' : 'POST', body: template })
        await loadTemplates()
      }
      return saved
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
      if (effectiveLayout.value.attachments.length > 5) throw new Error('Ein Brief kann bis zu fünf Anlagen enthalten.')
      const layout = renderLayout(effectiveLayout.value, values)
      const result = localMode ? { content: local, layout } : await request<{ content: string; layout: LetterLayout }>('/api/documents/generate', { method: 'POST', body: { template: draft.content, values, layout: effectiveLayout.value } })
      if (result.content.length > 50000) throw new Error('Für die Briefvorschau sind maximal 50.000 Zeichen möglich. Bitte kürze den Text.')
      if (version === revision) { rendered.value = result.content; renderedLayout.value = result.layout; message.value = 'Dein Brief ist bereit für die Druckvorschau.' }
    } catch (cause) { if (version === revision) error.value = problem(cause) }
    finally { busy.value = false }
  }
  return { remoteAccess, accessVerified, unlockAccess, lockAccess, draft, hasDraft, values, templates, selectedId, busy, loading, message, error, draftStatus, fields, previewBody, previewLayout, rendered, localMode, extraAttachments, loadTemplates, choose, fresh, createTemplate, saveTemplate, removeTemplate, generate }
}
