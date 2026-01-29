import { handleClaudeHook, type ClaudeHookInput } from "../claude"

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    const onData = (chunk: Buffer) => chunks.push(chunk)
    const onEnd = () => {
      cleanup()
      resolve(Buffer.concat(chunks).toString("utf-8"))
    }
    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }

    const cleanup = () => {
      process.stdin.removeListener("data", onData)
      process.stdin.removeListener("end", onEnd)
      process.stdin.removeListener("error", onError)
    }

    process.stdin.on("data", onData)
    process.stdin.on("end", onEnd)
    process.stdin.on("error", onError)
  })
}

async function main(): Promise<void> {
  try {
    const stdin = await readStdin()
    const input = JSON.parse(stdin) as ClaudeHookInput
    await handleClaudeHook(input)
  } catch {
    process.exit(0)
  }
}

main().catch(() => process.exit(1))
