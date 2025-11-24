import { JSDOM } from "jsdom"
import { Readability } from "@mozilla/readability"
import { sanitizePlainText } from "./text-utils"
import { normalizeJobLink } from "./job-posting"

export async function fetchJobPostingFromUrl(url: string): Promise<string> {
  const normalizedLink = normalizeJobLink(url)
  if (!normalizedLink) {
    throw new Error("Invalid job link")
  }

  const response = await fetch(normalizedLink, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }

  const html = await response.text()
  const dom = new JSDOM(html)
  const reader = new Readability(dom.window.document)
  const article = reader.parse()

  const extracted = [article?.title, article?.textContent].filter(Boolean).join("\n\n")
  const fallbackText = dom.window.document.body?.textContent || ""
  const raw = extracted || fallbackText
  const cleaned = sanitizePlainText(raw)

  if (cleaned) {
    return trimmedMeaningfulText(cleaned).substring(0, 12000)
  }

  return trimmedMeaningfulText(sanitizePlainText(fallbackText).substring(0, 10000))
}

function trimmedMeaningfulText(text: string) {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean)
  const cutoffIndex = lines.findIndex((line) => line.split(/\s+/).filter(Boolean).length >= 12)
  const sliced = cutoffIndex >= 0 ? lines.slice(cutoffIndex) : lines
  return sliced.join("\n")
}
