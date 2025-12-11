import { NextResponse } from "next/server"
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { MAX_MODIFICATIONS_PER_DAY, USAGE_RESET_HOURS } from "@/lib/chat"

export async function GET() {
    if (!isSupabaseConfigured()) {
        return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 })
    }

    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get global usage for user
    const { data: usageData } = await supabase
        .from("chat_usage")
        .select("count, reset_at")
        .eq("user_id", user.id)
        .eq("resume_id", "global")
        .maybeSingle()

    const now = new Date()
    let count = 0
    let resetAt = new Date(now.getTime() + USAGE_RESET_HOURS * 60 * 60 * 1000)

    if (usageData) {
        const usageResetAt = new Date(usageData.reset_at)
        if (usageResetAt > now) {
            count = usageData.count
            resetAt = usageResetAt
        }
    }

    return NextResponse.json({
        usage: {
            count,
            maxCount: MAX_MODIFICATIONS_PER_DAY,
            resetAt: resetAt.getTime()
        }
    })
}
