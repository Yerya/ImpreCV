import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import {
    calculateContentComplexity,
    getBaseScaleForComplexity,
    A4_DIMENSIONS,
    RESUME_SCALE_LIMITS
} from '@/lib/resume-templates/server-renderer'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
    console.log('=== PDF Export: POST request received ===')
    try {
        const { data, templateId, themeConfig } = await req.json()
        console.log('=== PDF Export: Request data parsed ===')
        console.log('Template ID:', templateId)
        console.log('Theme mode:', themeConfig?.mode)
        console.log('Resume data sections:', data?.sections?.length || 0)

        // Read globals.css to extract CSS variables
        console.log('=== PDF Export: Reading globals.css ===')
        const globalsCssPath = path.join(process.cwd(), 'styles', 'globals.css')
        let cssContent = ''
        try {
            cssContent = fs.readFileSync(globalsCssPath, 'utf-8')
            cssContent = cssContent.replace(/@import.*;/g, '')
            cssContent = cssContent.replace(/@theme\s+inline\s+\{[^}]+\}/g, '')
            console.log('=== PDF Export: globals.css read successfully ===')
        } catch (e) {
            console.error('=== PDF Export: Failed to read globals.css ===', e)
        }

        console.log('=== PDF Export: Calculating complexity ===')
        const complexity = calculateContentComplexity(data)
        const baseScale = getBaseScaleForComplexity(complexity)
        console.log('Complexity:', complexity, 'Base scale:', baseScale)

        // Dynamically import react-dom/server to avoid Next.js static analysis
        console.log('=== PDF Export: Dynamically importing react-dom/server ===')
        const ReactDOMServer = await import('react-dom/server')
        const { ServerResumeRenderer } = await import('@/components/resume-templates/server-renderer-component')
        const React = await import('react')

        console.log('=== PDF Export: Rendering component to HTML ===')
        const componentHtml = ReactDOMServer.renderToStaticMarkup(
            React.createElement(ServerResumeRenderer, {
                data,
                variant: templateId,
                themeMode: themeConfig?.mode || 'light'
            })
        )
        console.log('=== PDF Export: Component rendered, HTML length:', componentHtml.length, 'chars ===')

        // Construct the full HTML document
        console.log('=== PDF Export: Constructing full HTML document ===')
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
                        overflow: visible;
                    }

                    .resume-page {
                        width: 210mm;
                        min-height: 297mm;
                        display: flex;
                        flex-direction: column;
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
        console.log('=== PDF Export: Attempting to launch Puppeteer ===')
        console.log('Puppeteer config:', {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        })

        let browser
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
            console.log('=== PDF Export: Puppeteer browser launched successfully ===')
        } catch (launchError) {
            console.error('=== PDF Export: FAILED to launch Puppeteer browser ===')
            console.error('Launch error:', launchError)
            console.error('Error details:', {
                message: launchError instanceof Error ? launchError.message : String(launchError),
                stack: launchError instanceof Error ? launchError.stack : 'No stack trace'
            })
            throw new Error(`Puppeteer launch failed: ${launchError instanceof Error ? launchError.message : String(launchError)}`)
        }

        console.log('=== PDF Export: Creating new page ===')
        const page = await browser.newPage()

        console.log('=== PDF Export: Setting viewport ===')
        await page.setViewport({
            width: Math.ceil(A4_DIMENSIONS.widthPx),
            height: Math.ceil(A4_DIMENSIONS.heightPx),
            deviceScaleFactor: 2
        })
        console.log('Viewport:', A4_DIMENSIONS.widthPx, 'x', A4_DIMENSIONS.heightPx)

        // Set content and wait for network idle
        console.log('=== PDF Export: Setting page content ===')
        await page.setContent(html, {
            waitUntil: 'networkidle0',
            timeout: 30000
        })
        console.log('=== PDF Export: Page content set, waiting for fonts ===')

        await page.evaluate(() => {
            const fonts = (document as any).fonts
            return fonts ? fonts.ready : Promise.resolve()
        })
        console.log('=== PDF Export: Fonts loaded ===')

        // Generate PDF with optimized settings
        console.log('=== PDF Export: Generating PDF ===')
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
        console.log('=== PDF Export: PDF generated, size:', pdfBuffer.length, 'bytes ===')

        console.log('=== PDF Export: Closing browser ===')
        await browser.close()
        console.log('=== PDF Export: Browser closed successfully ===')

        console.log('=== PDF Export: Sending response ===')
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="resume.pdf"`,
            },
        })

    } catch (error) {
        console.error('=== PDF Export: Top-level error caught ===')
        console.error('Error:', error)
        console.error('Error type:', typeof error)
        console.error('Error message:', error instanceof Error ? error.message : String(error))
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace available')

        return NextResponse.json(
            {
                error: 'Failed to generate PDF',
                details: error instanceof Error ? error.message : String(error),
                stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined
            },
            { status: 500 }
        )
    }
}
