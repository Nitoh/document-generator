export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  const target = new URL(event.path, config.backendUrl)
  return proxyRequest(event, target.toString())
})
