import { log } from '../custom-ui/logger.mjs'
/**
 * SSEManager - Manages Server-Sent Events (SSE) connections for task progress tracking
 *
 * This class provides a centralized way to subscribe to task progress updates from the server
 * using EventSource (SSE). It handles connection management, message routing, and automatic cleanup.
 */
class SSEManager {
  constructor() {
    // Map of taskId -> { eventSource, callbacks, timeoutTimer, timeoutMs, pendingEvents, flushTimer }
    this.activeConnections = new Map()
    // Cached result from the last fetchActiveTasks() call
    this._activeTasksCache = null
  }

  /**
   * Subscribe to progress updates for a specific task
   * @param {string} taskId - Unique identifier for the task
   * @param {Object} callbacks - Callback functions for different events
   * @param {Function} callbacks.onProgress - Called with progress data
   * @param {Function} callbacks.onComplete - Called with completion data
   * @param {Function} callbacks.onError - Called with error data
   * @param {number} timeoutMs - Optional timeout in milliseconds (default: 2 minutes, 4x server's heartbeat response time)
   * @returns {boolean} - True if subscription was successful, false if already subscribed
   */
  subscribe(taskId, callbacks, timeoutMs = 2 * 60 * 1000) {
    // Don't create duplicate subscriptions
    if (this.activeConnections.has(taskId)) {
      log('sse', 'warn', `subscribe: already subscribed to ${taskId}`)
      return false
    }

    // Validate callbacks
    if (!callbacks || typeof callbacks !== 'object') {
      log('sse', 'error', 'subscribe: callbacks object is required')
      return false
    }

    log('sse', 'info', `subscribe: creating EventSource for ${taskId}`)

    // Create EventSource connection to the server's SSE endpoint
    const eventSource = new EventSource(`/progress/${taskId}`)

    // Store connection info
    this.activeConnections.set(taskId, {
      eventSource,
      callbacks: {
        onProgress: callbacks.onProgress || (() => {}),
        onComplete: callbacks.onComplete || (() => {}),
        onError: callbacks.onError || (() => {}),
        onCancelled: callbacks.onCancelled || (() => {}),
      },
      timeoutTimer: null,
      timeoutMs,
      pendingEvents: [],
      flushTimer: null,
    })

    eventSource.addEventListener('open', () => {
      log(
        'sse',
        'info',
        `EventSource open for ${taskId}, readyState=${eventSource.readyState}`,
      )
    })

    // Server liveness heartbeat (every 30s): resets the inactivity timeout so
    // slow-but-alive tasks (minutes between progress events) aren't killed by
    // the 2-minute timeout. Not dispatched to callbacks — the timeout now only
    // fires on a genuinely dead stream.
    eventSource.addEventListener('heartbeat', () => {
      if (!this.activeConnections.has(taskId)) return
      this._clearTimeout(taskId)
      this._startTimeout(taskId)
    })

    // Set up event listeners
    eventSource.addEventListener('progress', (event) => {
      this._handleMessage(taskId, event, 'progress')
    })

    eventSource.addEventListener('complete', (event) => {
      log(
        'sse',
        'info',
        `'complete' listener fired for ${taskId}, inMap=${this.activeConnections.has(taskId)}, readyState=${eventSource.readyState}`,
      )
      this._handleMessage(taskId, event, 'complete')
    })

    eventSource.addEventListener('error-event', (event) => {
      this._handleMessage(taskId, event, 'error')
    })

    eventSource.addEventListener('cancelled', (event) => {
      this._handleMessage(taskId, event, 'cancelled')
    })

    // Handle connection errors — capture this specific EventSource so a stale
    // onerror from a closed instance can't accidentally kill a new subscription
    // for the same taskId.
    const capturedEventSource = eventSource
    eventSource.onerror = (error) => {
      const current = this.activeConnections.get(taskId)
      const readyState = eventSource.readyState
      log(
        'sse',
        'info',
        `onerror for ${taskId}: readyState=${readyState} (0=CONNECTING,1=OPEN,2=CLOSED), inMap=${!!current}, isCurrentEs=${current && current.eventSource === capturedEventSource}`,
      )
      if (current && current.eventSource === capturedEventSource) {
        this._handleError(taskId, error)
      }
    }

    // Start timeout timer
    this._startTimeout(taskId)

    return true
  }

  /**
   * Unsubscribe from a task and close the connection
   * @param {string} taskId - Unique identifier for the task
   */
  unsubscribe(taskId, reason = 'manual') {
    const connection = this.activeConnections.get(taskId)
    if (!connection) {
      return
    }

    log('sse', 'info', `unsubscribe: ${taskId} (reason: ${reason})`)

    // Close the EventSource connection
    connection.eventSource.close()

    // Remove from active connections
    this._cleanup(taskId)
  }

  /**
   * Receive an incoming SSE message, manage the timeout, and queue for coalesced dispatch.
   * @private
   */
  _handleMessage(taskId, event, type) {
    const connection = this.activeConnections.get(taskId)
    if (!connection) {
      log(
        'sse',
        'warn',
        `_handleMessage: connection not in map for ${taskId} (type=${type}) — event dropped`,
      )
      return
    }

    // Clear and restart timeout on each message arrival
    this._clearTimeout(taskId)
    if (type !== 'complete' && type !== 'error' && type !== 'cancelled') {
      this._startTimeout(taskId)
    }

    this._queueEvent(taskId, event, type)
  }

  /**
   * Push an event onto the pending queue and schedule a flush.
   * @private
   */
  _queueEvent(taskId, event, type) {
    const connection = this.activeConnections.get(taskId)
    if (!connection) return
    connection.pendingEvents.push({ type, event })
    this._scheduleFlush(taskId)
  }

  /**
   * Schedule a flush for the next macro-task, if one isn't already pending.
   * @private
   */
  _scheduleFlush(taskId) {
    const connection = this.activeConnections.get(taskId)
    if (!connection || connection.flushTimer !== null) return
    connection.flushTimer = setTimeout(() => this._flushEvents(taskId), 0)
  }

  /**
   * Apply the terminal-pruning rule to pendingEvents and dispatch the survivors.
   *
   * Pruning rule:
   *   - If a terminal (complete/error/cancelled) is present: discard all progress events,
   *     dispatch only the terminal.
   *   - If no terminal: discard all progress events except the last, dispatch that one.
   * @private
   */
  _flushEvents(taskId) {
    const connection = this.activeConnections.get(taskId)
    if (!connection) return

    connection.flushTimer = null
    const events = connection.pendingEvents.splice(0)

    const TERMINALS = new Set(['complete', 'error', 'cancelled'])
    const lastTerminalIdx = events.reduce(
      (acc, e, i) => (TERMINALS.has(e.type) ? i : acc),
      -1,
    )

    if (lastTerminalIdx !== -1) {
      // Terminal found: skip all progress, dispatch the terminal only
      const { event, type } = events[lastTerminalIdx]
      this._dispatch(taskId, event, type)
    } else {
      // No terminal: dispatch last progress only
      const lastProgress = [...events]
        .reverse()
        .find((e) => e.type === 'progress')
      if (lastProgress) {
        this._dispatch(taskId, lastProgress.event, lastProgress.type)
      }
    }
  }

  /**
   * Route a single event to its callback and clean up on terminal types.
   * @private
   */
  _dispatch(taskId, event, type) {
    const connection = this.activeConnections.get(taskId)
    if (!connection) return

    try {
      const data = JSON.parse(event.data)

      if (type === 'complete') {
        log(
          'sse',
          'info',
          `_dispatch: routing 'complete' to onComplete callback for ${taskId}`,
        )
      }

      switch (type) {
        case 'progress':
          connection.callbacks.onProgress(data)
          break

        case 'complete':
          connection.callbacks.onComplete(data)
          this.unsubscribe(taskId, 'complete-event')
          break

        case 'error':
          connection.callbacks.onError(data)
          this.unsubscribe(taskId, 'error-event')
          break

        case 'cancelled':
          connection.callbacks.onCancelled(data)
          this.unsubscribe(taskId, 'cancelled-event')
          break

        default:
          log('sse', 'warn', `_dispatch: unknown type '${type}' for ${taskId}`)
      }
    } catch (error) {
      log(
        'sse',
        'error',
        `${`_dispatch: JSON parse error for ${taskId}:`} ${error}`,
      )
      connection.callbacks.onError({
        taskId,
        status: 'error',
        error: {
          message: 'Failed to parse server message',
          details: error.message,
        },
      })
    }
  }

  /**
   * Handle EventSource connection errors
   * @private
   * @param {string} taskId - Task identifier
   * @param {Event} error - Error event
   */
  _handleError(taskId, error) {
    const connection = this.activeConnections.get(taskId)
    if (!connection) {
      return
    }

    // Check if the connection is closed (normal completion) or actually errored
    if (connection.eventSource.readyState === EventSource.CLOSED) {
      log(
        'sse',
        'info',
        `_handleError: CLOSED for ${taskId} — deferring cleanup by one tick`,
      )
      // Defer cleanup by one tick so any already-queued events (e.g. 'complete')
      // that arrived in the same TCP payload can be dispatched and processed first.
      const capturedConnection = connection
      setTimeout(() => {
        const current = this.activeConnections.get(taskId)
        log(
          'sse',
          'info',
          `deferred cleanup for ${taskId}: stillSameConnection=${current === capturedConnection}`,
        )
        if (current === capturedConnection) {
          this._cleanup(taskId)
        }
      }, 0)
    } else if (connection.eventSource.readyState === EventSource.CONNECTING) {
      // Transient drop — the browser auto-reconnects this EventSource, and the
      // server replays the task's full message buffer (including terminal
      // events) on reconnect, so the subscription must stay alive. Killing it
      // here permanently loses the completion for callbacks with no onError
      // handler. The inactivity timeout remains the backstop if the reconnect
      // never succeeds.
      log(
        'sse',
        'warn',
        `_handleError: transient error for ${taskId} — browser reconnecting, keeping subscription`,
      )
    } else {
      log(
        'sse',
        'error',
        `_handleError: connection error for ${taskId} (readyState=${connection.eventSource.readyState})`,
      )
      connection.callbacks.onError({
        taskId,
        status: 'error',
        error: {
          message: 'Connection error',
          details: 'Lost connection to server',
        },
      })
      this.unsubscribe(taskId, 'onerror')
    }
  }

  /**
   * Start timeout timer for a task
   * @private
   * @param {string} taskId - Task identifier
   */
  _startTimeout(taskId) {
    const connection = this.activeConnections.get(taskId)
    if (!connection) {
      return
    }

    connection.timeoutTimer = setTimeout(() => {
      log('sse', 'warn', `timeout for ${taskId}`)
      connection.callbacks.onError({
        taskId,
        status: 'error',
        error: {
          message: 'Request timeout',
          details: 'No response from server within the expected time',
        },
      })
      this.unsubscribe(taskId, 'timeout')
    }, connection.timeoutMs)
  }

  /**
   * Clear timeout timer for a task
   * @private
   * @param {string} taskId - Task identifier
   */
  _clearTimeout(taskId) {
    const connection = this.activeConnections.get(taskId)
    if (!connection || !connection.timeoutTimer) {
      return
    }

    clearTimeout(connection.timeoutTimer)
    connection.timeoutTimer = null
  }

  /**
   * Clean up connection data for a task
   * @private
   * @param {string} taskId - Task identifier
   */
  _cleanup(taskId) {
    log('sse', 'info', `_cleanup: removing ${taskId} from map`)
    this._clearTimeout(taskId)
    const connection = this.activeConnections.get(taskId)
    if (connection && connection.flushTimer !== null) {
      clearTimeout(connection.flushTimer)
    }
    this.activeConnections.delete(taskId)
  }

  /**
   * Fetch the list of in-progress server tasks and cache the result.
   * @returns {Promise<Array>}
   */
  async fetchActiveTasks() {
    const res = await fetch('/generation/tasks/active')
    if (!res.ok) throw new Error(`fetchActiveTasks: HTTP ${res.status}`)
    this._activeTasksCache = await res.json()
    return this._activeTasksCache
  }

  /**
   * Return cached active tasks, optionally filtered by entityType.
   * Returns an empty array if fetchActiveTasks() has not been called yet.
   * @param {string} [entityType]
   * @returns {Array}
   */
  getActiveTasks(entityType) {
    const cache = this._activeTasksCache || []
    if (!entityType) return cache
    return cache.filter((t) => t.entityType === entityType)
  }

  /**
   * Get the current number of active subscriptions
   * @returns {number} - Number of active connections
   */
  getActiveConnectionCount() {
    return this.activeConnections.size
  }

  /**
   * Unsubscribe from all active tasks
   */
  unsubscribeAll() {
    const taskIds = Array.from(this.activeConnections.keys())
    taskIds.forEach((taskId) => this.unsubscribe(taskId, 'unsubscribeAll'))
  }
}

// Export a singleton instance
export const sseManager = new SSEManager()
