import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { A4_DIMENSIONS } from '@/lib/resume-templates/server-renderer'
import fs from 'fs'
import path from 'path'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    let browser: puppeteer.Browser | null = null
    try {
        const { data, templateId, themeConfig, resumeId, fileName } = await req.json()

        // Read globals.css to extract CSS variables
        const globalsCssPath = path.join(process.cwd(), 'styles', 'globals.css')
        let cssContent = ''
        try {
            cssContent = fs.readFileSync(globalsCssPath, 'utf-8')
            cssContent = cssContent.replace(/@import.*;/g, '')
            cssContent = cssContent.replace(/@theme\s+inline\s+\{[^}]+\}/g, '')
        } catch (e) {
            console.error('Failed to read globals.css', e)
        }

        // Dynamically import react-dom/server to avoid Next.js static analysis
        const ReactDOMServer = await import('react-dom/server')
        const { ServerResumeRenderer } = await import('@/components/resume-templates/server-renderer-component')
        const React = await import('react')

        const componentHtml = ReactDOMServer.renderToStaticMarkup(
            React.createElement(ServerResumeRenderer, {
                data,
                variant: templateId,
            })
        )

        // Construct the full HTML document
        const html = `
            <!DOCTYPE html>
            <html lang="en" class="${themeConfig?.mode === 'dark' ? 'dark' : ''}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Resume</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <script>
                    tailwind.config = {
                        darkMode: 'class',
                        theme: {
                            extend: {
                                colors: {
                                    background: 'var(--background)',
                                    foreground: 'var(--foreground)',
                                    card: 'var(--card)',
                                    'card-foreground': 'var(--card-foreground)',
                                    popover: 'var(--popover)',
                                    'popover-foreground': 'var(--popover-foreground)',
                                    primary: {
                                        DEFAULT: 'var(--primary)',
                                        foreground: 'var(--primary-foreground)'
                                    },
                                    secondary: {
                                        DEFAULT: 'var(--secondary)',
                                        foreground: 'var(--secondary-foreground)'
                                    },
                                    muted: {
                                        DEFAULT: 'var(--muted)',
                                        foreground: 'var(--muted-foreground)'
                                    },
                                    accent: {
                                        DEFAULT: 'var(--accent)',
                                        foreground: 'var(--accent-foreground)'
                                    },
                                    destructive: {
                                        DEFAULT: 'var(--destructive)',
                                        foreground: 'var(--destructive-foreground)'
                                    },
                                    border: 'var(--border)',
                                    input: 'var(--input)',
                                    ring: 'var(--ring)',
                                    sidebar: {
                                        DEFAULT: 'var(--sidebar)',
                                        foreground: 'var(--sidebar-foreground)',
                                        primary: 'var(--sidebar-primary)',
                                        'primary-foreground': 'var(--sidebar-primary-foreground)',
                                        accent: 'var(--sidebar-accent)',
                                        'accent-foreground': 'var(--sidebar-accent-foreground)',
                                        border: 'var(--sidebar-border)',
                                        ring: 'var(--sidebar-ring)',
                                    }
                                },
                                borderRadius: {
                                    lg: 'var(--radius)',
                                    md: 'calc(var(--radius) - 2px)',
                                    sm: 'calc(var(--radius) - 4px)',
                                }
                            }
                        }
                    }
                </script>
                <style>
                    /* Injected globals.css */
                    ${cssContent}

                    /* Font fallbacks to mirror editor */
                    :root {
                        --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
                        --font-display: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif;
                        --font-mono: 'Roboto Mono', 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
                    }

                    /* Print optimizations for single-page output */
                    @media print {
                        @page {
                            margin: 0;
                            size: A4 portrait;
                        }
                        body {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            margin: 0;
                            padding: 0;
                        }
                    }
                    
                    /* General optimizations */
                    html, body {
                        margin: 0;
                        padding: 0;
                        width: 210mm;
                        min-height: 297mm;
                    }

                    /* Keep blocks intact across pages */
                    .resume-print-page {
                        break-after: page;
                        page-break-after: always;
                        overflow: visible;
                        -webkit-box-decoration-break: clone;
                        box-decoration-break: clone;
                    }
                    .resume-print-page:last-child {
                        break-after: auto;
                        page-break-after: auto;
                    }
                    .resume-print-card {
                        display: block;
                    }
                    .resume-print-section { break-inside: auto; page-break-inside: auto; }
                    .resume-print-block { break-inside: auto; page-break-inside: auto; }
                    .resume-print-item { break-inside: auto; page-break-inside: auto; }
                    .resume-print-item-head { break-inside: avoid; page-break-inside: avoid; }
                    .resume-print-item-body { break-inside: auto; page-break-inside: auto; }
                    .resume-print-bullet { break-inside: avoid; page-break-inside: avoid; }
                    .resume-print-columns { align-items: flex-start; }


                    .resume-page {
                        width: 210mm;
                        min-height: 297mm;
                        display: flex;
                        flex-direction: column;
                    }
                    
                    /* Prevent content overflow */
                    * {
                        max-width: 100%;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                        word-break: break-word;
                        hyphens: auto;
                        box-sizing: border-box;
                    }
                    
                    /* Ensure icons are visible */
                    svg {
                        display: inline-block;
                        vertical-align: middle;
                    }
                </style>
                <!-- Fonts -->
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Merriweather:wght@400;700&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
            </head>
            <body>
                <div class="resume-page">
                    ${componentHtml}
                </div>
            </body>
            </html>
        `
        console.log('=== PDF Export: HTML document constructed, total length:', html.length, 'chars ===')

        // Launch Puppeteer
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            })
        } catch (launchError) {
            throw new Error(`Puppeteer launch failed: ${launchError instanceof Error ? launchError.message : String(launchError)}`)
        }

        const page = await browser.newPage()

        await page.setViewport({
            width: Math.ceil(A4_DIMENSIONS.widthPx),
            height: Math.ceil(A4_DIMENSIONS.heightPx),
            deviceScaleFactor: 2
        })

        // Set content and wait for network idle
        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 30000
        })

        await page.evaluate(() => {
            const fonts = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts
            return fonts ? fonts.ready : Promise.resolve()
        })

        // Generate PDF with optimized settings
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            scale: 1,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            }
        })

        await browser.close()
        browser = null
        const safeName = (fileName || 'resume').replace(/[^a-zA-Z0-9._-]/g, '_') || 'resume'
        let exportUrl: string | null = null

        if (isSupabaseConfigured()) {
            try {
                const supabase = await getSupabaseServerClient()
                const {
                    data: { user },
                } = await supabase.auth.getUser()

                if (user) {
                    let previousPath: string | null = null
                    if (resumeId) {
                        const { data: existing } = await supabase
                            .from('rewritten_resumes')
                            .select('pdf_path')
                            .eq('id', resumeId)
                            .eq('user_id', user.id)
                            .maybeSingle()
                        previousPath = existing?.pdf_path || null
                    }

                    const storagePath = `exports/${user.id}/${Date.now()}-${safeName}.pdf`
                    const { error: uploadError } = await supabase.storage
                        .from('resumes')
                        .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: true })

                    if (!uploadError) {
                        const {
                            data: { publicUrl },
                        } = supabase.storage.from('resumes').getPublicUrl(storagePath)
                        exportUrl = publicUrl

                        if (resumeId) {
                            await supabase
                                .from('rewritten_resumes')
                                .update({
                                    pdf_url: publicUrl,
                                    pdf_path: storagePath,
                                    updated_at: new Date().toISOString(),
                                })
                                .eq('id', resumeId)
                                .eq('user_id', user.id)
                        }

                        if (previousPath && previousPath !== storagePath) {
                            await supabase.storage.from('resumes').remove([previousPath])
                        }
                    } else {
                        console.error('Failed to upload generated PDF:', uploadError)
                    }
                }
            } catch (storageError) {
                console.error('Failed to store generated PDF:', storageError)
            }
        }

        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
                ...(exportUrl ? { 'x-export-url': exportUrl, 'x-export-name': `${safeName}.pdf` } : {})
            },
        })

    } catch (error) {
        console.error('PDF export failed:', error)

        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : String(error),
                stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        )
    } finally {
        if (browser) {
            try {
                await browser.close()
            } catch {
                // swallow close errors
            }
        }
    }
}
