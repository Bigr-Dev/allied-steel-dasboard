// lib/realtime.js
// Reusable helpers for Supabase Realtime subscriptions (JS, no TS)

import supabase from '@/config/supabase'

// your existing client

/**
 * Subscribe to Postgres changes on a table.
 *
 * @param {Object} opts
 * @param {string} opts.schema - e.g. 'public'
 * @param {string} opts.table - e.g. 'branches'
 * @param {('INSERT'|'UPDATE'|'DELETE'|'*'|string|string[])} [opts.events='*'] - single or array
 * @param {string} [opts.filter] - Realtime filter, e.g. "branch_id=eq.123"
 * @param {(payload:Object)=>void} opts.onPayload - callback for each change
 * @param {string} [opts.channelName] - optional stable channel name
 * @returns {Promise<{channel:any, unsubscribe:()=>Promise<void>}>}
 */
export async function subscribeToTable(opts = {}) {
  const {
    schema = 'public',
    table,
    events = '*',
    filter,
    onPayload,
    channelName,
  } = opts

  if (!table) throw new Error('subscribeToTable: "table" is required')
  if (typeof onPayload !== 'function')
    throw new Error('subscribeToTable: "onPayload" callback is required')

  const evs = Array.isArray(events) ? events : [events]

  // Use a stable channel name to avoid duplicate subs if you want
  const name =
    channelName ||
    `realtime:${schema}.${table}:${evs.sort().join(',')}:${
      filter || 'nofilter'
    }`

  const channel = supabase.channel(name)

  evs.forEach((event) => {
    channel.on(
      'postgres_changes',
      { event, schema, table, filter }, // filter is optional
      (payload) => onPayload({ event, schema, table, filter, payload })
    )
  })

  const { error } = await channel.subscribe()
  if (error) throw error

  // Return the channel + a clean unsubscriber
  const unsubscribe = async () => {
    await supabase.removeChannel(channel)
  }

  return { channel, unsubscribe }
}

/**
 * Subscribe to MANY tables at once (convenience).
 *
 * @param {Array} configs - array of subscribeToTable option objects
 * @param {(item:{event:string,schema:string,table:string,filter?:string,payload:Object})=>void} onAnyPayload
 * @returns {Promise<{channels:any[], unsubscribeAll:()=>Promise<void>}>}
 */
export async function subscribeMany(configs = [], onAnyPayload) {
  const channels = []
  for (const cfg of configs) {
    const { channel } = await subscribeToTable({
      ...cfg,
      onPayload: (info) => {
        if (typeof cfg.onPayload === 'function') cfg.onPayload(info)
        if (typeof onAnyPayload === 'function') onAnyPayload(info)
      },
    })
    channels.push(channel)
  }

  const unsubscribeAll = async () => {
    await Promise.all(channels.map((ch) => supabase.removeChannel(ch)))
  }

  return { channels, unsubscribeAll }
}
