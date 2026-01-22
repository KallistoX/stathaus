/**
 * WebDAV Helpers
 * Utility functions for WebDAV operations and URL construction
 */

/**
 * Construct WebDAV URL for different server types
 * @param {string} serverUrl - Base server URL
 * @param {string} username - Username
 * @param {string} filePath - Path to file
 * @param {string} serverType - 'nextcloud', 'owncloud', or 'generic'
 * @returns {string} Full WebDAV URL
 */
export function constructWebDAVUrl(serverUrl, username, filePath, serverType = 'nextcloud') {
  const cleanUrl = serverUrl.replace(/\/$/, '')
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`

  switch (serverType) {
    case 'nextcloud':
      return `${cleanUrl}/remote.php/dav/files/${username}${cleanPath}`
    case 'owncloud':
      return `${cleanUrl}/remote.php/webdav${cleanPath}`
    case 'generic':
    default:
      return `${cleanUrl}${cleanPath}`
  }
}

/**
 * Detect server type from URL
 * @param {string} serverUrl - Server URL to check
 * @returns {Promise<string>} 'nextcloud', 'owncloud', or 'generic'
 */
export async function detectServerType(serverUrl) {
  try {
    const cleanUrl = serverUrl.replace(/\/$/, '')
    const response = await fetch(`${cleanUrl}/status.php`)

    if (!response.ok) {
      return 'generic'
    }

    const data = await response.json()

    if (data.productname === 'Nextcloud') {
      return 'nextcloud'
    }
    if (data.productname === 'ownCloud') {
      return 'owncloud'
    }

    return 'generic'
  } catch {
    return 'generic'
  }
}

/**
 * Validate server URL format
 * @param {string} url - URL to validate
 * @returns {{valid: boolean, error: string|null, cleanUrl: string|null}}
 */
export function validateServerUrl(url) {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'Server-URL ist erforderlich',
      cleanUrl: null
    }
  }

  let cleanUrl = url.trim()

  // Add https:// if no protocol specified
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl
  }

  // Try to parse URL
  try {
    const parsed = new URL(cleanUrl)

    // Validate protocol
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        valid: false,
        error: 'Nur HTTP und HTTPS URLs sind erlaubt',
        cleanUrl: null
      }
    }

    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, '')

    return {
      valid: true,
      error: null,
      cleanUrl
    }
  } catch {
    return {
      valid: false,
      error: 'Ungültige URL',
      cleanUrl: null
    }
  }
}

/**
 * Validate file path
 * @param {string} path - File path to validate
 * @returns {{valid: boolean, error: string|null, cleanPath: string|null}}
 */
export function validateFilePath(path) {
  if (!path || typeof path !== 'string') {
    return {
      valid: false,
      error: 'Dateipfad ist erforderlich',
      cleanPath: null
    }
  }

  let cleanPath = path.trim()

  // Ensure it starts with /
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath
  }

  // Check for valid characters (alphanumeric, slash, dash, underscore, dot)
  if (!/^[a-zA-Z0-9\/_.-]+$/.test(cleanPath)) {
    return {
      valid: false,
      error: 'Dateipfad enthält ungültige Zeichen',
      cleanPath: null
    }
  }

  // Must end with .json
  if (!cleanPath.endsWith('.json')) {
    return {
      valid: false,
      error: 'Dateipfad muss mit .json enden',
      cleanPath: null
    }
  }

  return {
    valid: true,
    error: null,
    cleanPath
  }
}

/**
 * Get friendly server name from URL
 * @param {string} serverUrl - Server URL
 * @returns {string} Friendly name
 */
export function getServerDisplayName(serverUrl) {
  try {
    const url = new URL(serverUrl)
    return url.hostname
  } catch {
    return serverUrl
  }
}

/**
 * Check if browser is iOS Safari
 * @returns {boolean}
 */
export function isIOSSafari() {
  const ua = navigator.userAgent
  const iOS = /iPad|iPhone|iPod/.test(ua)
  const webkit = /WebKit/.test(ua)
  const notChrome = !/CriOS/.test(ua) && !/Chrome/.test(ua)
  const notFirefox = !/FxiOS/.test(ua)

  return iOS && webkit && notChrome && notFirefox
}

/**
 * Check if browser is iOS (any browser)
 * @returns {boolean}
 */
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Get recommended storage mode for current browser
 * @returns {string} 'filesystem', 'webdav', or 'indexeddb'
 */
export function getRecommendedStorageMode() {
  // Check if File System Access API is available
  if ('showOpenFilePicker' in window) {
    return 'filesystem'
  }

  // On iOS, recommend WebDAV for cloud sync
  if (isIOS()) {
    return 'webdav'
  }

  // Fallback to IndexedDB
  return 'indexeddb'
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format timestamp to relative time
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  const now = new Date()
  const then = new Date(timestamp)
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 10) {
    return 'gerade eben'
  }
  if (diffSec < 60) {
    return 'vor ' + diffSec + ' Sekunden'
  }
  if (diffMin < 60) {
    return 'vor ' + diffMin + ' Minute' + (diffMin === 1 ? '' : 'n')
  }
  if (diffHour < 24) {
    return 'vor ' + diffHour + ' Stunde' + (diffHour === 1 ? '' : 'n')
  }
  if (diffDay < 7) {
    return 'vor ' + diffDay + ' Tag' + (diffDay === 1 ? '' : 'en')
  }

  return then.toLocaleDateString('de-DE')
}

/**
 * Parse error from WebDAV response
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function parseWebDAVError(error) {
  if (!error.response) {
    return 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.'
  }

  const status = error.response.status

  switch (status) {
    case 401:
      return 'Authentifizierung fehlgeschlagen. Bitte überprüfe deine Zugangsdaten.'
    case 403:
      return 'Zugriff verweigert. Du hast keine Berechtigung für diese Operation.'
    case 404:
      return 'Datei nicht gefunden.'
    case 405:
      return 'Operation nicht erlaubt auf diesem Server.'
    case 409:
      return 'Konflikt erkannt. Die Datei wurde auf einem anderen Gerät geändert.'
    case 423:
      return 'Die Datei ist gesperrt.'
    case 500:
      return 'Interner Server-Fehler. Bitte versuche es später erneut.'
    case 502:
      return 'Gateway-Fehler. Der Server ist möglicherweise nicht erreichbar.'
    case 503:
      return 'Service nicht verfügbar. Der Server ist überlastet oder wartet.'
    case 507:
      return 'Nicht genügend Speicherplatz auf dem Server.'
    default:
      return `Server-Fehler (${status}): ${error.message}`
  }
}
