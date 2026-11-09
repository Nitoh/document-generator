export default defineEventHandler(async (event) => {
  const { backendUrl, letterMailKey } = useRuntimeConfig(event)
  const url = getRequestURL(event)
  const loopback = ['localhost', '127.0.0.1', '[::1]']
  const remote = event.node.req.socket.remoteAddress
  const local = loopback.includes(url.hostname) && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(remote ?? '')
  if (event.method === 'GET') return { enabled: Boolean(letterMailKey && local) }
  if (!letterMailKey || !local) throw createError({ statusCode: 404 })
  if (event.method !== 'POST') throw createError({ statusCode: 405 })
  if (getHeader(event, 'origin') !== url.origin || !getHeader(event, 'content-type')?.startsWith('application/json')) {
    throw createError({ statusCode: 403 })
  }
  if (Number(getHeader(event, 'content-length') ?? 0) > 7_100_000) throw createError({ statusCode: 413 })
  const body = await readBody(event)
  try {
    await $fetch(new URL('/api/letter-mail', backendUrl).toString(), {
      method: 'POST', headers: { 'X-Nitoh-Mail-Key': letterMailKey }, body, retry: 0, timeout: 60_000
    })
    return { sent: true }
  } catch (cause) {
    const response = cause as { statusCode?: number; data?: { detail?: string } }
    throw createError({ statusCode: response.statusCode ?? 502, data: { detail: response.data?.detail ?? 'Der Mailversand ist momentan nicht verfügbar.' } })
  }
})
