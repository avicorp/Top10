import { Link, useParams } from 'react-router-dom';
import { useVersionData } from '../hooks/useContentData';
import { useProgress } from '../context/ProgressContext';
import type { OwaspVersion } from '../types';

function VulnerabilityCard({ vuln, version }: { vuln: any; version: OwaspVersion }) {
  const { isRead, getVulnProgress } = useProgress();
  const read = isRead(vuln.slug, version);
  const vp = getVulnProgress(vuln.slug, version);
  const bookmarked = vp?.bookmarked ?? false;
  const briefDesc = vuln.description.plainText.slice(0, 150).trim();

  return (
    <Link
      to={`/owasp/version/${version}/${vuln.slug}`}
      className="group block rounded-xl border dark:border-slate-700 border-slate-200 dark:bg-slate-800 bg-white p-5 transition-all hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {vuln.iconPath && (
            <img src={vuln.iconPath} alt="" className="w-10 h-10 rounded-lg" />
          )}
          <div>
            <span className="text-xs font-mono dark:text-slate-500 text-slate-400">{vuln.code}</span>
            <h3 className="font-semibold dark:group-hover:text-blue-400 group-hover:text-blue-600 transition-colors">
              {vuln.title}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {bookmarked && <span className="text-amber-400 text-sm" aria-label="Bookmarked">&#9733;</span>}
          <span className={`w-2.5 h-2.5 rounded-full ${read ? 'bg-green-500' : 'dark:bg-slate-600 bg-slate-300'}`}
            aria-label={read ? 'Read' : 'Unread'} />
        </div>
      </div>
      <p className="text-sm dark:text-slate-400 text-slate-500 line-clamp-2">{briefDesc}...</p>
      <div className="flex gap-3 mt-3 text-xs dark:text-slate-500 text-slate-400">
        <span>Rank #{vuln.rank}</span>
        {vuln.scoreData && <span>{vuln.scoreData.cwes_mapped} CWEs</span>}
        {vuln.riskRating && <span>Exploitability: {vuln.riskRating.exploitability}/3</span>}
        <span>{vuln.attackScenarios.length} scenarios</span>
      </div>
    </Link>
  );
}

export default function VersionOverviewPage() {
  const { version } = useParams<{ version: string }>();
  const v = (version as OwaspVersion) || '2025';
  const vulns = useVersionData(v);
  const { isRead } = useProgress();

  const readCount = vulns.filter(vuln => isRead(vuln.slug, v)).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">OWASP Top 10 — {v}</h1>
        <div className="flex items-center gap-4 text-sm dark:text-slate-400 text-slate-500">
          <span>{vulns.length} vulnerabilities</span>
          <span>{readCount}/{vulns.length} studied</span>
          <Link to={`/owasp/quiz/${v}`} className="text-amber-500 hover:text-amber-400 transition-colors">
            Take a quiz &#x2192;
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {vulns.map(vuln => (
          <VulnerabilityCard key={vuln.slug} vuln={vuln} version={v} />
        ))}
      </div>
    </div>
  );
}
