'use client';

import { useState } from 'react';

interface Paper {
  paper_id: string;
  title: string;
  abstract?: string;
  tldr?: string;
  year?: number;
  citation_count?: number;
  authors: string[];
  url?: string;
}

interface CritiqueResult {
  paper_title: string;
  overall_quality_score: number;
  methodological_flaws: string[];
  potential_biases: string[];
  student_takeaway: string;
}

interface OutcomeExtraction {
  outcome_domain: string;
  outcome_metric: string;
  outcome_value: number;
  outcome_unit: string;
  response_direction: string;
}

interface ConditionExtraction {
  condition_id: string;
  experimental_setup: string;
  intervention_or_parameter: string;
  outcomes: OutcomeExtraction[];
}

interface EvidenceExtractionResult {
  study_id: string;
  year: number;
  primary_objective: string;
  conditions: ConditionExtraction[];
  key_limitations_or_gaps: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ResearchDashboard() {
  const [query, setQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Critique state mapping paper_id -> CritiqueResult or loading state
  const [critiques, setCritiques] = useState<{ [key: string]: CritiqueResult | null }>({});
  const [critiqueLoading, setCritiqueLoading] = useState<{ [key: string]: boolean }>({});

  // Evidence Map state mapping paper_id -> EvidenceExtractionResult or loading state
  const [evidenceMaps, setEvidenceMaps] = useState<{ [key: string]: EvidenceExtractionResult | null }>({});
  const [evidenceLoading, setEvidenceLoading] = useState<{ [key: string]: boolean }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setPapers([]);

    // 10-second timeout controller so it never hangs indefinitely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${API_URL}/api/search?query=${encodeURIComponent(query)}&limit=4`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Failed to fetch papers from backend.');
      
      const data = await res.json();
      setPapers(data.papers || []);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Search request timed out. The Semantic Scholar API took too long to respond.');
      } else {
        setError(err.message || 'An error occurred during search.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunCritique = async (paper: Paper) => {
    setCritiqueLoading((prev) => ({ ...prev, [paper.paper_id]: true }));

    try {
      const res = await fetch(`${API_URL}/api/critique`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstract || paper.tldr || 'No abstract available.'
        }),
      });

      if (!res.ok) throw new Error('Failed to generate critique.');

      const critiqueData: CritiqueResult = await res.json();
      setCritiques((prev) => ({ ...prev, [paper.paper_id]: critiqueData }));
    } catch (err) {
      alert('Error running AI critique agent.');
    } finally {
      setCritiqueLoading((prev) => ({ ...prev, [paper.paper_id]: false }));
    }
  };

  const handleMapEvidence = async (paper: Paper) => {
    setEvidenceLoading((prev) => ({ ...prev, [paper.paper_id]: true }));

    try {
      const res = await fetch(`${API_URL}/api/map-evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          abstract: paper.abstract || paper.tldr || 'No abstract provided.',
          paper_text: `Title: ${paper.title}\n\nAbstract: ${paper.abstract || paper.tldr || 'No abstract.'}`
        }),
      });

      if (!res.ok) throw new Error('Failed to extract evidence map.');
      const data: EvidenceExtractionResult = await res.json();
      setEvidenceMaps((prev) => ({ ...prev, [paper.paper_id]: data }));
    } catch (err) {
      alert('Error running Evidence Mapper agent.');
    } finally {
      setEvidenceLoading((prev) => ({ ...prev, [paper.paper_id]: false }));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-600">Student Research Assistant</h1>
          <p className="text-slate-600 mt-2">Discover literature, analyze methodologies, and synthesize research across any discipline with AI agents.</p>
        </div>

        {/* Search Bar Form */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search research topic (e.g., agentic workflows, quantum computing, clinical trials)..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search Papers'}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Results Section */}
        <div className="space-y-6">
          {papers.map((paper) => {
            const critique = critiques[paper.paper_id];
            const isCritiqueLoading = critiqueLoading[paper.paper_id];
            const evidenceMap = evidenceMaps[paper.paper_id];
            const isEvidenceLoading = evidenceLoading[paper.paper_id];

            return (
              <div key={paper.paper_id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <div>
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-xl font-bold text-slate-800 leading-snug">
                      {paper.url ? (
                        <a href={paper.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition">
                          {paper.title}
                        </a>
                      ) : (
                        paper.title
                      )}
                    </h2>
                    {paper.year && (
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full shrink-0">
                        {paper.year}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Authors: {paper.authors.length > 0 ? paper.authors.join(', ') : 'Unknown'} | Citations: {paper.citation_count ?? 0}
                  </p>
                </div>

                {paper.tldr && (
                  <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-sm text-indigo-900">
                    <span className="font-semibold">TLDR:</span> {paper.tldr}
                  </div>
                )}

                <p className="text-slate-600 text-sm leading-relaxed">
                  {paper.abstract || 'No abstract provided.'}
                </p>

                {/* AI Critique Section */}
                <div className="pt-2 border-t border-slate-100 flex flex-col gap-4">
                  {!critique ? (
                    <button
                      onClick={() => handleRunCritique(paper)}
                      disabled={isCritiqueLoading}
                      className="self-start px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      {isCritiqueLoading ? 'Running AI Critique Agent...' : '🔍 Run AI Critique & Analysis'}
                    </button>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          <span>🤖 AI Methodological Critique</span>
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          critique.overall_quality_score >= 7 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          Quality Score: {critique.overall_quality_score}/10
                        </span>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Methodological Flaws:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 mt-1 space-y-1">
                          {critique.methodological_flaws.map((flaw, idx) => (
                            <li key={idx}>{flaw}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Potential Biases:</p>
                        <ul className="list-disc list-inside text-sm text-slate-600 mt-1 space-y-1">
                          {critique.potential_biases.map((bias, idx) => (
                            <li key={idx}>{bias}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 text-sm text-slate-700">
                        <span className="font-semibold text-indigo-600">Student Takeaway:</span> {critique.student_takeaway}
                      </div>
                    </div>
                  )}
                </div>

                {/* Evidence Mapping Matrix Section */}
                <div className="pt-3 border-t border-slate-100">
                  {!evidenceMap ? (
                    <button
                      onClick={() => handleMapEvidence(paper)}
                      disabled={isEvidenceLoading}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition disabled:opacity-50"
                    >
                      {isEvidenceLoading ? 'Extracting Evidence Map...' : '📊 Generate Structured Evidence Matrix'}
                    </button>
                  ) : (
                    <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-sm">📋 Extracted Evidence Matrix</h3>
                        <span className="text-xs text-indigo-700 font-semibold">
                          Study ID: {evidenceMap.study_id || 'N/A'} ({evidenceMap.year || 'N/A'})
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 font-medium">
                        Primary Objective: <span className="text-slate-800">{evidenceMap.primary_objective || 'General study evaluation'}</span>
                      </p>

                      {evidenceMap.conditions && evidenceMap.conditions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs bg-white rounded-lg border border-slate-200 overflow-hidden">
                            <thead className="bg-slate-100 text-slate-700 uppercase">
                              <tr>
                                <th className="p-2">Condition ID</th>
                                <th className="p-2">Setup / Environment</th>
                                <th className="p-2">Intervention / Parameter</th>
                                <th className="p-2">Outcomes & Metrics</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {evidenceMap.conditions.map((cond, idx) => (
                                <tr key={idx}>
                                  <td className="p-2 font-mono text-indigo-600">{cond.condition_id}</td>
                                  <td className="p-2">{cond.experimental_setup}</td>
                                  <td className="p-2">{cond.intervention_or_parameter}</td>
                                  <td className="p-2">
                                    {cond.outcomes && cond.outcomes.length > 0 ? (
                                      cond.outcomes.map((o, oIdx) => (
                                        <div key={oIdx}>
                                          <span className="font-semibold">{o.outcome_metric}:</span> {o.outcome_value} {o.outcome_unit} ({o.response_direction})
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 italic">No numeric outcomes extracted</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 italic">
                          No quantitative experimental conditions or explicit numeric metrics were reported in this abstract.
                        </div>
                      )}

                      {/* Safe check with fallback array to prevent undefined length crash */}
                      {(evidenceMap.key_limitations_or_gaps || []).length > 0 && (
                        <div className="text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                          <span className="font-bold text-amber-700">Key Limitations & Gaps:</span> {evidenceMap.key_limitations_or_gaps.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}