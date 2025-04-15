import { NextRequest, NextResponse } from 'next/server';
import { identifyAtRiskStudents, identifyTopPerformers, generatePerformanceSummary, detectScoreAnomalies } from '@/lib/aiInsightsService';

/**
 * API route for retrieving AI insights
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const type = searchParams.get('type'); // at-risk, top-performers, summary, anomalies

    if (!teacherId) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 });
    }

    let data;
    switch (type) {
      case 'at-risk':
        data = await identifyAtRiskStudents(teacherId);
        break;
      case 'top-performers':
        data = await identifyTopPerformers(teacherId);
        break;
      case 'summary':
        data = await generatePerformanceSummary(teacherId);
        break;
      case 'anomalies':
        data = await detectScoreAnomalies(teacherId);
        break;
      case 'all':
        // Get all insights in parallel for dashboard display
        const [atRiskStudents, topPerformers, summary, anomalies] = await Promise.all([
          identifyAtRiskStudents(teacherId),
          identifyTopPerformers(teacherId),
          generatePerformanceSummary(teacherId),
          detectScoreAnomalies(teacherId)
        ]);
        data = { atRiskStudents, topPerformers, summary, anomalies };
        break;
      default:
        return NextResponse.json({ error: 'Invalid insight type' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in AI insights API:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}