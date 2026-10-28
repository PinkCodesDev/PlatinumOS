export class PsnError extends Error {
  constructor(code, message, status = 502) {
    super(message)
    this.code = code
    this.status = status
  }
}

export async function withTimeout(operation, milliseconds = 20000) {
  let timer
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new PsnError('PSN_TIMEOUT', 'PSN did not respond in time.', 504),
            ),
          milliseconds,
        )
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
