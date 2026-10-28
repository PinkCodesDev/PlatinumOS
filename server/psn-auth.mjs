import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  exchangeRefreshTokenForAuthTokens,
} from 'psn-api'
import { PsnError, withTimeout } from './psn-errors.mjs'

export function createPsnAuth({
  npsso,
  now = Date.now,
  exchangeCode = exchangeNpssoForAccessCode,
  exchangeTokens = exchangeAccessCodeForAuthTokens,
  refreshTokens = exchangeRefreshTokenForAuthTokens,
}) {
  let tokens = null
  let pending = null
  let lastError = null
  let retryAfter = 0

  function storeTokens(result) {
    if (
      !result?.accessToken ||
      !result.refreshToken ||
      !Number.isFinite(result.expiresIn) ||
      result.expiresIn <= 0 ||
      !Number.isFinite(result.refreshTokenExpiresIn) ||
      result.refreshTokenExpiresIn <= 0
    ) {
      throw new PsnError(
        'PSN_AUTH_FAILED',
        'PSN returned an invalid authentication response.',
        401,
      )
    }
    tokens = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      accessExpiresAt: now() + result.expiresIn * 1000,
      refreshExpiresAt: now() + result.refreshTokenExpiresIn * 1000,
    }
    lastError = null
  }

  async function authenticate() {
    try {
      if (tokens && tokens.refreshExpiresAt > now() + 30000) {
        storeTokens(await withTimeout(refreshTokens(tokens.refreshToken)))
      } else {
        const code = await withTimeout(exchangeCode(npsso))
        storeTokens(await withTimeout(exchangeTokens(code)))
      }
      return { accessToken: tokens.accessToken }
    } catch {
      // Never propagate provider errors: they may contain authentication data.
      tokens = null
      lastError = new PsnError(
        'PSN_AUTH_FAILED',
        'PSN authentication failed. Check connection and local PSN_NPSSO; restart after changes.',
        401,
      )
      retryAfter = now() + 30000
      throw lastError
    }
  }

  return {
    status() {
      return {
        configured: Boolean(npsso),
        authenticated: Boolean(tokens && tokens.accessExpiresAt > now()),
        state: !npsso
          ? 'not_configured'
          : pending
            ? 'authenticating'
            : lastError
              ? 'authentication_failed'
              : tokens && tokens.accessExpiresAt > now()
                ? 'authenticated'
                : 'not_authenticated',
      }
    },
    async getAuthorization() {
      if (!npsso) {
        throw new PsnError(
          'PSN_NOT_CONFIGURED',
          'Set PSN_NPSSO in the local .env and restart the backend.',
          503,
        )
      }
      if (tokens && tokens.accessExpiresAt > now() + 30000) {
        return { accessToken: tokens.accessToken }
      }
      if (lastError && now() < retryAfter) throw lastError
      if (!pending)
        pending = authenticate().finally(() => {
          pending = null
        })
      return pending
    },
  }
}
