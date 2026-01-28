import { handleClaudeHook, type ClaudeHookInput } from "../claude"

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = []

  return new Promise((resolve, reject) => {
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk))
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")))
    process.stdin.on("error", reject)
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

main()
