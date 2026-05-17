import { NextResponse } from "next/server";

import { getAssignmentPcfSummary } from "@/features/pcf/summary-service";

export const dynamic = "force-static";

export const GET = () => NextResponse.json(getAssignmentPcfSummary());
