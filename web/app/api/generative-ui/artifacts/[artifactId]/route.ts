import { type NextRequest, NextResponse } from 'next/server';

const artifacts = {
  'demo-project-status': {
    id: 'demo-project-status',
    title: 'Demo Project Status',
    type: 'project-status',
    content: {
      status: 'ready',
      summary: 'Static, declarative, and open-ended Generative UI surfaces are available.',
    },
  },
} as const;

type ArtifactId = keyof typeof artifacts;

const isArtifactId = (value: string): value is ArtifactId => value in artifacts;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> },
) {
  const { artifactId } = await params;

  if (!isArtifactId(artifactId)) {
    return NextResponse.json({ error: 'Unknown artifact.' }, { status: 404 });
  }

  return NextResponse.json(artifacts[artifactId], {
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
