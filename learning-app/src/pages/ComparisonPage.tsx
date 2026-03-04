import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useVersionMap, useVersionData } from '../hooks/useContentData';
import type { OwaspVersion, Vulnerability } from '../types';

function VersionTimeline() {
  const versionMap = useVersionMap();
  const v2017 = useVersionData('2017');
  const v2021 = useVersionData('2021');
  const v2025 = useVersionData('2025');

  const getVuln = (slug: string | null, vulns: Vulnerability[]) =>
    slug ? vulns.find(v => v.slug === slug) : null;

  const colors = [
    'border-blue-500 bg-blue-500/10',
    'border-emerald-500 bg-emerald-500/10',
    'border-amber-500 bg-amber-500/10',
    'border-purple-500 bg-purple-500/10',
    'border-red-500 bg-red-500/10',
    'border-cyan-500 bg-cyan-500/10',
    'border-pink-500 bg-pink-500/10',
    'border-orange-500 bg-orange-500/10',
    'border-indigo-500 bg-indigo-500/10',
    'border-teal-500 bg-teal-500/10',
    'border-lime-500 bg-lime-500/10',
    'border-rose-500 bg-rose-500/10',
  ];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Headers */}
        <div className="grid grid-cols-4 gap-4 mb-4 text-sm font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
          <div>Concept</div>
          <div className="text-center">2017</div>
          <div className="text-center">2021</div>
          <div className="text-center">2025</div>
        </div>

        {/* Rows */}
        {versionMap.map((mapping, i) => {
          const vuln2017 = getVuln(mapping['2017'], v2017);
          const vuln2021 = getVuln(mapping['2021'], v2021);
          const vuln2025 = getVuln(mapping['2025'], v2025);
          const color = colors[i % colors.length];

          return (
            <div key={mapping.concept} className="grid grid-cols-4 gap-4 mb-2">
              <div className="text-sm font-medium dark:text-slate-300 text-slate-600 py-2">
                {mapping.concept}
              </div>
              {[
                { vuln: vuln2017, ver: '2017' as OwaspVersion, slug: mapping['2017'] },
                { vuln: vuln2021, ver: '2021' as OwaspVersion, slug: mapping['2021'] },
                { vuln: vuln2025, ver: '2025' as OwaspVersion, slug: mapping['2025'] },
              ].map(({ vuln, ver, slug }) => (
                <div key={ver} className="text-center">
                  {vuln ? (
                    <Link
                      to={`/version/${ver}/${slug}`}
                      className={`inline-block px-3 py-2 rounded-lg border text-xs font-medium transition-all hover:scale-105 ${color}`}
                    >
                      <div className="font-mono">{vuln.code}</div>
                      <div className="mt-0.5 dark:text-slate-400 text-slate-500">#{vuln.rank}</div>
                    </Link>
                  ) : (
                    <span className="inline-block px-3 py-2 text-xs dark:text-slate-600 text-slate-300">N/A</span>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VulnerabilityDiff({ slug2017, slug2021, slug2025 }: {
  slug2017: string | null; slug2021: string | null; slug2025: string | null;
}) {
  const v2017 = useVersionData('2017');
  const v2021 = useVersionData('2021');
  const v2025 = useVersionData('2025');

  const vuln2017 = slug2017 ? v2017.find(v => v.slug === slug2017) : null;
  const vuln2021 = slug2021 ? v2021.find(v => v.slug === slug2021) : null;
  const vuln2025 = slug2025 ? v2025.find(v => v.slug === slug2025) : null;

  const versions = [
    { label: '2017', vuln: vuln2017, ver: '2017' as OwaspVersion },
    { label: '2021', vuln: vuln2021, ver: '2021' as OwaspVersion },
    { label: '2025', vuln: vuln2025, ver: '2025' as OwaspVersion },
  ].filter(v => v.vuln);

  if (versions.length < 2) return null;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {versions.map(({ label, vuln, ver }) => (
        <div key={label} className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-mono text-sm font-bold">{vuln!.code}</h4>
            <Link to={`/version/${ver}/${vuln!.slug}`} className="text-xs text-blue-500 hover:text-blue-400">
              View full &#x2192;
            </Link>
          </div>
          <h5 className="font-medium mb-2">{vuln!.title}</h5>
          <p className="text-xs dark:text-slate-400 text-slate-500 line-clamp-4">{vuln!.description.plainText.slice(0, 200)}...</p>
          <div className="mt-3 text-xs dark:text-slate-500 text-slate-400 space-y-1">
            {vuln!.scoreData && <div>CWEs: {vuln!.scoreData.cwes_mapped}</div>}
            {vuln!.riskRating && <div>Exploitability: {vuln!.riskRating.exploitability}/3</div>}
            <div>Scenarios: {vuln!.attackScenarios.length}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ComparisonPage() {
  const versionMap = useVersionMap();
  const [selectedMapping, setSelectedMapping] = useState(0);
  const current = versionMap[selectedMapping];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Version Comparison</h1>
      <p className="dark:text-slate-400 text-slate-500 mb-8">
        See how OWASP Top 10 vulnerabilities evolved across 2017, 2021, and 2025.
      </p>

      {/* Timeline */}
      <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Category Mapping Across Versions</h2>
        <VersionTimeline />
      </div>

      {/* Detail comparison */}
      <div className="rounded-xl dark:bg-slate-800 bg-white border dark:border-slate-700 border-slate-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Side-by-Side Comparison</h2>
        <div className="flex flex-wrap gap-2 mb-6">
          {versionMap.map((m, i) => (
            <button
              key={i}
              onClick={() => setSelectedMapping(i)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                i === selectedMapping
                  ? 'bg-blue-500 text-white'
                  : 'dark:bg-slate-700 bg-slate-200 dark:text-slate-400 text-slate-500 dark:hover:bg-slate-600 hover:bg-slate-300'
              }`}
            >
              {m.concept}
            </button>
          ))}
        </div>
        {current && (
          <VulnerabilityDiff
            slug2017={current['2017']}
            slug2021={current['2021']}
            slug2025={current['2025']}
          />
        )}
      </div>
    </div>
  );
}
