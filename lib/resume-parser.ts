import { sanitizePlainText } from "./text-utils"

export type ResumeFileType = "pdf" | "docx" | "txt"

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_TEXT_LENGTH = 25000

const MIME_TYPE_MAP: Record<ResumeFileType, string[]> = {
  pdf: ["application/pdf"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
  ],
  txt: ["text/plain", "text/markdown"],
}

function getExtension(name?: string) {
  if (!name) return ""
  const parts = name.split(".")
  return parts.length > 1 ? parts.pop()!.toLowerCase() : ""
}

export function resolveResumeFileType(mimeType?: string, fileName?: string): ResumeFileType | null {
  const extension = getExtension(fileName)

  if (extension === "pdf") return "pdf"
  if (extension === "docx" || extension === "doc") return "docx"
  if (extension === "txt") return "txt"

  if (mimeType) {
    if (MIME_TYPE_MAP.pdf.includes(mimeType)) return "pdf"
    if (MIME_TYPE_MAP.docx.includes(mimeType)) return "docx"
    if (MIME_TYPE_MAP.txt.includes(mimeType)) return "txt"
  }

  return null
}

async function extractPdf(buffer: Buffer) {
  try {
    const pdfParse = (await import("pdf-parse")).default
    const result = await pdfParse(buffer)
    return result.text || ""
  } catch (error: unknown) {
    const err = error as Error
    throw new Error(`PDF parse failed: ${err.message}`)
  }
}

async function extractDocx(buffer: Buffer) {
  const mammoth = await import("mammoth")
  const result = await mammoth.extractRawText({ buffer })
  return result.value || ""
}

function extractTxt(buffer: Buffer) {
  return buffer.toString("utf-8")
}

export async function extractAndSanitizeResume(buffer: Buffer, opts: { mimeType?: string; fileName?: string }) {
  const type = resolveResumeFileType(opts.mimeType, opts.fileName)

  if (!type) {
    throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.")
  }

  let raw = ""

  try {
    if (type === "pdf") {
      raw = await extractPdf(buffer)
    } else if (type === "docx") {
      raw = await extractDocx(buffer)
    } else {
      raw = extractTxt(buffer)
    }
  } catch (error: unknown) {
    const err = error as Error
    throw new Error(err.message || "Failed to extract text from the uploaded file.")
  }

  const cleaned = sanitizePlainText(raw)
  return cleaned.slice(0, MAX_TEXT_LENGTH).trim()
}
