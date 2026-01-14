import { ResumeEditorSkeleton } from "@/components/resume-editor/resume-editor-skeleton"

export default function ResumeEditorLoading() {
    // Note: loading.tsx must be a server component, so we can't use hooks here
    // We default to desktop skeleton as it degrades more gracefully on mobile than vice versa
    return <ResumeEditorSkeleton variant="desktop" />
}
