import { redirect } from 'next/navigation';
import AgentDetail from './AgentDetail';

const AGENT_NAMES = ['finance', 'travel', 'health', 'research', 'job-search'];

export function generateStaticParams() {
  return AGENT_NAMES.map((name) => ({ name }));
}

export default async function AgentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // Finance has a dedicated home (The Brief). Any link to /agent/finance
  // should land on /finance, which itself redirects to /finance/loading when
  // no brief exists yet.
  if (name === 'finance') redirect('/finance');
  return <AgentDetail params={params} />;
}
