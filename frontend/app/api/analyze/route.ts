import { runAnalysis, AnalyzeRequestBody } from '../../../src/lib/analyze';

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as AnalyzeRequestBody;
    const result = await runAnalysis(body);
    return Response.json(result, { status: 200 });
  } catch (err) {
    const { mockAnalysis } = await import('../../../src/lib/demo');
    const randomRunId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID().slice(0, 6)
        : Math.random().toString(36).substring(2, 8);

    return Response.json(
      {
        ...mockAnalysis,
        run_id: randomRunId,
        timestamp: Date.now(),
        source: 'mock',
      },
      { status: 200 }
    );
  }
}

