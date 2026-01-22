<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="bg-blue-50 border-b border-blue-200 p-4">
        <h2 class="text-xl font-bold text-gray-900">☁️ WebDAV Cloud-Sync einrichten</h2>
        <p class="text-sm text-gray-600 mt-1">
          Verbinde deine Daten mit Nextcloud, ownCloud oder einem anderen WebDAV-Server
        </p>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Step 1: Server URL -->
        <div v-if="step === 1">
          <h3 class="text-lg font-semibold mb-4">Server-URL eingeben</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Server-URL
              </label>
              <input
                v-model="serverUrl"
                type="url"
                placeholder="https://cloud.example.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                @keyup.enter="detectServer"
              >
              <p class="text-xs text-gray-500 mt-1">
                Beispiele: https://nextcloud.example.com oder https://cloud.example.com
              </p>
            </div>

            <!-- Server Detection Status -->
            <div v-if="detecting" class="p-4 bg-blue-50 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span class="text-sm text-blue-800">Server wird erkannt...</span>
              </div>
            </div>

            <!-- Nextcloud Detected -->
            <div v-if="isNextcloud && !detecting" class="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center gap-3">
                <span class="text-2xl">✅</span>
                <div>
                  <p class="font-medium text-green-900">Nextcloud Server erkannt!</p>
                  <p class="text-sm text-green-700">
                    Du kannst dich mit "Mit Nextcloud anmelden" verbinden (empfohlen)
                  </p>
                </div>
              </div>
            </div>

            <!-- Error Display -->
            <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-800 whitespace-pre-line">
                <strong>Fehler:</strong> {{ error }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex gap-3">
            <button
              @click="detectServer"
              :disabled="!serverUrl || detecting"
              class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ detecting ? 'Erkenne...' : 'Weiter' }}
            </button>
            <button
              @click="close"
              class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Abbrechen
            </button>
          </div>
        </div>

        <!-- Step 2: Authentication Method -->
        <div v-if="step === 2">
          <h3 class="text-lg font-semibold mb-4">Anmeldung wählen</h3>

          <div class="space-y-3">
            <!-- Nextcloud Sign-In (if Nextcloud detected) -->
            <button
              v-if="isNextcloud"
              @click="startNextcloudAuth"
              class="w-full text-left p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div class="flex items-start gap-3">
                <div class="text-2xl">🔐</div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900">Mit Nextcloud anmelden (Empfohlen)</h4>
                  <p class="text-sm text-gray-600 mt-1">
                    Sichere Anmeldung mit deinem Nextcloud-Account
                  </p>
                  <ul class="text-xs text-gray-500 mt-2 space-y-1">
                    <li>✓ Unterstützt MFA/2FA</li>
                    <li>✓ Automatische App-Passwort-Generierung</li>
                    <li>✓ Keine Passwort-Eingabe nötig</li>
                  </ul>
                </div>
              </div>
            </button>

            <!-- Manual Credentials -->
            <button
              @click="showManualAuth = true"
              class="w-full text-left p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div class="flex items-start gap-3">
                <div class="text-2xl">🔑</div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900">Manuell konfigurieren</h4>
                  <p class="text-sm text-gray-600 mt-1">
                    Gib Benutzername und Passwort manuell ein
                  </p>
                </div>
              </div>
            </button>
          </div>

          <!-- Manual Auth Form -->
          <div v-if="showManualAuth" class="mt-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <h4 class="font-medium text-gray-900 mb-4">Zugangsdaten eingeben</h4>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Benutzername
                </label>
                <input
                  v-model="username"
                  type="text"
                  placeholder="dein-benutzername"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Passwort / App-Passwort
                </label>
                <div class="relative">
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="••••••••"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                  <button
                    @click="showPassword = !showPassword"
                    type="button"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
                <p class="text-xs text-gray-500 mt-1">
                  Empfohlen: Verwende ein App-spezifisches Passwort
                </p>
              </div>

              <button
                @click="testManualConnection"
                :disabled="!username || !password || testing"
                class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ testing ? 'Teste Verbindung...' : 'Verbindung testen' }}
              </button>
            </div>
          </div>

          <!-- Back Button -->
          <div class="mt-6">
            <button
              @click="step = 1; showManualAuth = false"
              class="text-gray-600 hover:text-gray-900 text-sm"
            >
              ← Zurück
            </button>
          </div>
        </div>

        <!-- Step 3: Nextcloud Authentication (Polling) -->
        <div v-if="step === 3">
          <div class="text-center py-8">
            <div class="text-6xl mb-4">🔐</div>
            <h3 class="text-lg font-semibold mb-2">Warte auf Anmeldung...</h3>
            <p class="text-gray-600 mb-6">
              Bitte melde dich im geöffneten Fenster bei Nextcloud an und erlaube den Zugriff auf StatHaus.
            </p>

            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-6"></div>

            <div class="text-sm text-gray-500 space-y-2">
              <p>Das Fenster öffnet sich nicht?</p>
              <a
                :href="loginUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-600 hover:text-blue-700 font-medium"
              >
                Anmeldeseite manuell öffnen
              </a>
            </div>

            <button
              @click="cancelNextcloudAuth"
              class="mt-6 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Abbrechen
            </button>
          </div>
        </div>

        <!-- Step 4: File Path Configuration -->
        <div v-if="step === 4">
          <h3 class="text-lg font-semibold mb-4">Dateipfad konfigurieren</h3>

          <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center gap-3">
              <span class="text-2xl">✅</span>
              <div>
                <p class="font-medium text-green-900">Verbindung erfolgreich!</p>
                <p class="text-sm text-green-700">Angemeldet als: <strong>{{ username }}</strong></p>
              </div>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Dateipfad
              </label>
              <input
                v-model="filePath"
                type="text"
                placeholder="/StatHaus/stathaus-data.json"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
              <p class="text-xs text-gray-500 mt-1">
                Der Pfad auf dem Server, wo deine Daten gespeichert werden
              </p>
            </div>

            <!-- Preview -->
            <div class="p-4 bg-gray-50 rounded-lg">
              <p class="text-xs text-gray-600 mb-2">Vollständiger Pfad:</p>
              <p class="text-sm font-mono text-gray-800 break-all">
                {{ getFullWebDAVUrl() }}
              </p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-6 flex gap-3">
            <button
              @click="completeSetup"
              :disabled="!filePath || completing"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ completing ? 'Einrichtung abschließen...' : 'Einrichtung abschließen' }}
            </button>
            <button
              @click="step = 2"
              :disabled="completing"
              class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Zurück
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import NextcloudAuthService from '../services/NextcloudAuthService.js'
import { validateServerUrl, validateFilePath, constructWebDAVUrl } from '../utils/webdavHelpers.js'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['complete', 'cancel'])

// State
const step = ref(1)
const serverUrl = ref('')
const username = ref('')
const password = ref('')
const filePath = ref('/StatHaus/stathaus-data.json')
const isNextcloud = ref(false)
const detecting = ref(false)
const testing = ref(false)
const completing = ref(false)
const error = ref(null)
const showPassword = ref(false)
const showManualAuth = ref(false)

// Nextcloud auth
const nextcloudAuthService = ref(null)
const loginUrl = ref(null)
const authWindow = ref(null)

// Detect server type
async function detectServer() {
  const validation = validateServerUrl(serverUrl.value)

  if (!validation.valid) {
    error.value = validation.error
    return
  }

  serverUrl.value = validation.cleanUrl
  detecting.value = true
  error.value = null

  try {
    isNextcloud.value = await NextcloudAuthService.isNextcloudServer(serverUrl.value)
    step.value = 2
  } catch (err) {
    error.value = 'Server konnte nicht erreicht werden. Bitte überprüfe die URL.'
  } finally {
    detecting.value = false
  }
}

// Start Nextcloud authentication flow
async function startNextcloudAuth() {
  error.value = null

  try {
    nextcloudAuthService.value = new NextcloudAuthService(serverUrl.value)

    // Initiate login flow
    loginUrl.value = await nextcloudAuthService.value.initiateLogin()

    // Open login window
    authWindow.value = window.open(loginUrl.value, '_blank', 'noopener,noreferrer')

    if (!authWindow.value) {
      error.value = 'Pop-up wurde blockiert. Bitte erlaube Pop-ups für diese Seite.'
      return
    }

    // Start polling
    step.value = 3

    nextcloudAuthService.value.startPolling(
      (credentials) => {
        // Success
        username.value = credentials.loginName
        password.value = credentials.appPassword
        serverUrl.value = credentials.server

        // Close auth window if still open
        if (authWindow.value && !authWindow.value.closed) {
          authWindow.value.close()
        }

        // Move to file path configuration
        step.value = 4
      },
      (err) => {
        // Error
        error.value = err.message || 'Anmeldung fehlgeschlagen'
        step.value = 2

        // Close auth window if still open
        if (authWindow.value && !authWindow.value.closed) {
          authWindow.value.close()
        }
      }
    )
  } catch (err) {
    error.value = err.message || 'Fehler beim Starten der Anmeldung'

    // If CORS error, stay on step 2 to show manual option
    if (err.isCORSError) {
      showManualAuth.value = true
    }
  }
}

// Cancel Nextcloud authentication
function cancelNextcloudAuth() {
  if (nextcloudAuthService.value) {
    nextcloudAuthService.value.stopPolling()
  }

  if (authWindow.value && !authWindow.value.closed) {
    authWindow.value.close()
  }

  step.value = 2
}

// Test manual connection
async function testManualConnection() {
  testing.value = true
  error.value = null

  try {
    // Just validate inputs for now
    // Actual connection test will happen in completeSetup
    if (!username.value || !password.value) {
      throw new Error('Bitte gib Benutzername und Passwort ein')
    }

    step.value = 4
  } catch (err) {
    error.value = err.message
  } finally {
    testing.value = false
  }
}

// Get full WebDAV URL for preview
function getFullWebDAVUrl() {
  if (!serverUrl.value || !username.value || !filePath.value) {
    return 'Unvollständig'
  }

  const serverType = isNextcloud.value ? 'nextcloud' : 'generic'
  return constructWebDAVUrl(serverUrl.value, username.value, filePath.value, serverType)
}

// Complete setup
async function completeSetup() {
  const pathValidation = validateFilePath(filePath.value)

  if (!pathValidation.valid) {
    error.value = pathValidation.error
    return
  }

  completing.value = true
  error.value = null

  try {
    // Emit configuration
    emit('complete', {
      serverUrl: serverUrl.value,
      username: username.value,
      password: password.value,
      filePath: pathValidation.cleanPath
    })
  } catch (err) {
    error.value = err.message
    completing.value = false
  }
}

// Close modal
function close() {
  // Cleanup
  if (nextcloudAuthService.value) {
    nextcloudAuthService.value.dispose()
  }

  if (authWindow.value && !authWindow.value.closed) {
    authWindow.value.close()
  }

  emit('cancel')
}
</script>

<style scoped>
/* Additional styles if needed */
</style>
