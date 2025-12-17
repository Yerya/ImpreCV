"use client"

import { memo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalHeader } from "@/components/global-header"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { RefreshCw, Loader2 } from "lucide-react"
import { CoverLetterPanel } from "@/components/resume-templates/cover-letter-panel"
import { SkillMapPanel } from "@/components/resume-templates/skill-map-panel"
import { WebResumeRenderer } from "@/components/resume-templates/web-renderer"
import { ResumeChatPanel } from "@/components/chat/resume-chat-panel"
import { ResumeActionBar } from "./resume-action-bar"
import { RecentResumesList } from "./recent-resumes-list"
import { StylePicker } from "./style-picker"
import type { UseResumeEditorReturn } from "./types"

interface DesktopResumeEditorProps {
    editor: UseResumeEditorReturn
    backHref: string
}

export const DesktopResumeEditor = memo(function DesktopResumeEditor({
    editor,
    backHref
}: DesktopResumeEditorProps) {
    const {
        resumeData,
        setResumeData,
        selectedVariant,
        setSelectedVariant,
        themeMode,
        setThemeMode,
        activeResumeId,
        activeResumeLabel,
        availableResumes,
        saving,
        exporting,
        deletingId,
        activeCoverLetters,
        coverLetterLoading,
        coverLetterError,
        generatingCoverLetter,
        deletingCoverLetterId,
        waitingForCoverLetter,
        activeSkillMaps,
        skillMapLoading,
        skillMapError,
        generatingSkillMap,
        deletingSkillMapId,
        waitingForSkillMap,
        activeTab,
        setActiveTab,
        handleReset,
        handleSave,
        handleExport,
        handleSelectSaved,
        handleDeleteSaved,
        handleGenerateCoverLetter,
        handleDeleteCoverLetter,
        handleReloadCoverLetters,
        handleGenerateSkillMap,
        handleDeleteSkillMap,
        handleReloadSkillMaps,
    } = editor

    return (
        <div className="min-h-screen relative pb-20">
            <GlobalHeader variant="back" backHref={backHref} backLabel="Back" />

            <div className="container mx-auto px-4 py-8 relative z-10 max-w-7xl">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 gradient-text">Tailor Your Resume</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Click directly on the resume to edit. What you see is exactly what you export.
                        </p>
                    </div>
                    <ResumeActionBar
                        saving={saving}
                        exporting={exporting}
                        onReset={handleReset}
                        onSave={handleSave}
                        onExport={handleExport}
                        variant="desktop"
                    />
                </div>

                <div className="grid xl:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start justify-items-center xl:justify-items-start">
                    <div className="w-full max-w-full overflow-x-auto">
                        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'resume' | 'cover' | 'skills')}>
                            <div className="flex items-center justify-between mb-4">
                                <TabsList>
                                    <TabsTrigger value="resume">Resume</TabsTrigger>
                                    <TabsTrigger value="cover">Cover Letter</TabsTrigger>
                                    <TabsTrigger value="skills">Skill Map</TabsTrigger>
                                </TabsList>
                                {activeTab === 'cover' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleReloadCoverLetters}
                                        disabled={!activeResumeId || coverLetterLoading || waitingForCoverLetter}
                                    >
                                        {coverLetterLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        Refresh
                                    </Button>
                                )}
                                {activeTab === 'skills' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleReloadSkillMaps}
                                        disabled={!activeResumeId || skillMapLoading || waitingForSkillMap}
                                    >
                                        {skillMapLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        Refresh
                                    </Button>
                                )}
                            </div>

                            <TabsContent value="resume">
                                <Card
                                    className="glass-card p-4 md:p-6 overflow-auto"
                                    style={{ maxWidth: 'calc(210mm + 3rem)', minWidth: 'min(100%, calc(210mm + 3rem))' }}
                                >
                                    <div className="w-full flex justify-center">
                                        <WebResumeRenderer
                                            data={resumeData}
                                            variant={selectedVariant}
                                            onUpdate={setResumeData}
                                            themeMode={themeMode}
                                            onThemeModeChange={setThemeMode}
                                        />
                                    </div>
                                </Card>
                            </TabsContent>

                            <TabsContent value="cover">
                                <CoverLetterPanel
                                    activeResumeId={activeResumeId}
                                    resumeName={activeResumeLabel}
                                    coverLetters={activeCoverLetters}
                                    loading={coverLetterLoading}
                                    forceLoading={waitingForCoverLetter}
                                    error={coverLetterError}
                                    onReload={handleReloadCoverLetters}
                                    onDelete={handleDeleteCoverLetter}
                                    deletingId={deletingCoverLetterId}
                                    generating={generatingCoverLetter}
                                    onGenerate={handleGenerateCoverLetter}
                                />
                            </TabsContent>

                            <TabsContent value="skills">
                                <SkillMapPanel
                                    activeResumeId={activeResumeId}
                                    resumeName={activeResumeLabel}
                                    skillMaps={activeSkillMaps}
                                    loading={skillMapLoading}
                                    forceLoading={waitingForSkillMap}
                                    error={skillMapError}
                                    onReload={handleReloadSkillMaps}
                                    onDelete={handleDeleteSkillMap}
                                    deletingId={deletingSkillMapId}
                                    generating={generatingSkillMap}
                                    onGenerate={handleGenerateSkillMap}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-6 hidden xl:block">
                        <RecentResumesList
                            resumes={availableResumes}
                            activeResumeId={activeResumeId}
                            deletingId={deletingId}
                            onSelect={handleSelectSaved}
                            onDelete={handleDeleteSaved}
                            variant="desktop"
                        />
                        <StylePicker
                            selectedVariant={selectedVariant}
                            onSelect={setSelectedVariant}
                            variant="desktop"
                        />
                    </div>
                </div>
            </div>

            <ResumeChatPanel
                resumeData={resumeData}
                resumeId={activeResumeId}
                onApplyModifications={setResumeData}
                onResetToBaseline={handleReset}
            />

            <MobileBottomNav />
        </div>
    )
})
