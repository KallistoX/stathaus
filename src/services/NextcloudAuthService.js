/**
 * NextcloudAuthService
 *
 * Implements Nextcloud Login Flow v2 for secure authentication
 * with automatic app password generation and MFA/2FA support.
 *
 * @see https://docs.nextcloud.com/server/latest/developer_manual/client_apis/LoginFlow/index.html
 */
export default class NextcloudAuthService {
  constructor(serverUrl) {
    this.serverUrl = serverUrl.replace(/\/$/, '') // Remove trailing slash
    this.pollToken = null
    this.pollEndpoint = null
    this.pollInterval = null
    this.pollTimeout = null
  }

  /**
   * Initiate the login flow
   * Returns the login URL that should be opened in a browser window
   *
   * @returns {Promise<string>} Login URL to open in browser
   * @throws {Error} If the initiation fails
   */
  async initiateLogin() {
    try {
      const response = await fetch(`${this.serverUrl}/index.php/login/v2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Login flow initiation failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Validate response structure
      if (!data.poll || !data.poll.token || !data.poll.endpoint || !data.login) {
        throw new Error('Invalid response from Nextcloud server')
      }

      this.pollToken = data.poll.token
      this.pollEndpoint = data.poll.endpoint

      return data.login // URL to open in browser
    } catch (error) {
      // Handle CORS errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        const corsError = new Error(
          'CORS-Fehler: Der Nextcloud Server blockiert Anfragen von dieser Domain.\n\n' +
          'Für die Entwicklung mit localhost:\n' +
          '1. Füge in deiner config/config.php hinzu:\n' +
          "   'overwrite.cli.url' => 'https://cloud.your.domain',\n" +
          "   'overwriteprotocol' => 'https',\n\n" +
          '2. Oder verwende stattdessen die manuelle Konfiguration mit Benutzername und App-Passwort.'
        )
        corsError.isCORSError = true
        throw corsError
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Verbindung zum Nextcloud Server fehlgeschlagen. Bitte überprüfe die Server-URL.')
      }
      throw error
    }
  }

  /**
   * Start polling for authentication completion
   *
   * @param {Function} onSuccess - Callback with credentials { server, loginName, appPassword }
   * @param {Function} onError - Callback with error
   */
  async startPolling(onSuccess, onError) {
    if (!this.pollToken || !this.pollEndpoint) {
      onError(new Error('Login flow not initiated. Call initiateLogin() first.'))
      return
    }

    const poll = async () => {
      try {
        const formData = new FormData()
        formData.append('token', this.pollToken)

        const response = await fetch(this.pollEndpoint, {
          method: 'POST',
          body: formData
        })

        if (response.status === 200) {
          // Authentication successful
          const credentials = await response.json()

          // Validate credentials structure
          if (!credentials.server || !credentials.loginName || !credentials.appPassword) {
            throw new Error('Invalid credentials response from server')
          }

          this.stopPolling()
          onSuccess(credentials)
        } else if (response.status === 404) {
          // Still waiting for user to complete authentication
          // Continue polling
        } else {
          // Unexpected status code
          throw new Error(`Unexpected response: ${response.status} ${response.statusText}`)
        }
      } catch (error) {
        this.stopPolling()

        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          onError(new Error('Netzwerkfehler beim Polling. Bitte überprüfe deine Internetverbindung.'))
        } else {
          onError(error)
        }
      }
    }

    // Poll every 2 seconds (recommended by Nextcloud)
    this.pollInterval = setInterval(poll, 2000)

    // Timeout after 20 minutes (token expiration time)
    this.pollTimeout = setTimeout(() => {
      if (this.pollInterval) {
        this.stopPolling()
        onError(new Error('Authentifizierung abgelaufen. Bitte versuche es erneut.'))
      }
    }, 20 * 60 * 1000)

    // Initial poll immediately
    poll()
  }

  /**
   * Stop polling and clean up resources
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    if (this.pollTimeout) {
      clearTimeout(this.pollTimeout)
      this.pollTimeout = null
    }
  }

  /**
   * Clean up all resources
   */
  dispose() {
    this.stopPolling()
    this.pollToken = null
    this.pollEndpoint = null
  }

  /**
   * Check if a URL is a Nextcloud server
   *
   * @param {string} serverUrl - The server URL to check
   * @returns {Promise<boolean>} True if it's a Nextcloud server
   */
  static async isNextcloudServer(serverUrl) {
    try {
      const cleanUrl = serverUrl.replace(/\/$/, '')
      const response = await fetch(`${cleanUrl}/status.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })

      if (!response.ok) {
        return false
      }

      const data = await response.json()

      // Check for Nextcloud-specific response
      return data.installed === true && data.productname === 'Nextcloud'
    } catch {
      // Any error means it's not a Nextcloud server or not reachable
      return false
    }
  }

  /**
   * Get Nextcloud server version information
   *
   * @param {string} serverUrl - The server URL to check
   * @returns {Promise<Object|null>} Server info or null if not available
   */
  static async getServerInfo(serverUrl) {
    try {
      const cleanUrl = serverUrl.replace(/\/$/, '')
      const response = await fetch(`${cleanUrl}/status.php`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()

      return {
        installed: data.installed,
        productname: data.productname,
        version: data.version,
        versionstring: data.versionstring,
        edition: data.edition
      }
    } catch {
      return null
    }
  }
}
