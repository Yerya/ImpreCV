const MIN_CHAR_LENGTH = 90
const MIN_WORD_COUNT = 10
const MIN_LETTER_COUNT = 40
const MAX_DIGIT_RATIO = 0.5

export function sanitizePlainText(text: string): string {
  if (!text || typeof text !== "string") return ""

  let cleaned = text.replace(/\r\n/g, "\n").replace(/\t/g, " ")

  cleaned = cleaned.replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, ""))
  cleaned = cleaned.replace(/^\s*[>\*•-]\s+/gm, "- ")
  cleaned = cleaned.replace(/^\s{0,3}#{1,6}\s*(.*)$/gm, "$1")
  cleaned = cleaned.replace(/`+/g, "")
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, "$1").replace(/__(.*?)__/g, "$1")
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")

  return cleaned.trim()
}

export function isMeaningfulText(rawText: string): boolean {
  const text = sanitizePlainText(rawText)

  if (text.length < MIN_CHAR_LENGTH) return false

  const words = text.split(/\s+/).filter(Boolean)
  if (words.length < MIN_WORD_COUNT) return false

  const letterMatches = text.match(/\p{L}/gu) ?? []
  if (letterMatches.length < MIN_LETTER_COUNT) return false

  const digitCount = text.match(/\d/g)?.length ?? 0
  if (digitCount / text.length > MAX_DIGIT_RATIO) return false

  return true
}
