import { useState, useCallback } from 'react';

export default function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [results, setResults] = useState({
    userStories: '',
    testCases: '',
    acceptanceCriteria: '',
    raw: null
  });
  const [tokenUsage, setTokenUsage] = useState(null);

  // Progress state for multi-pass analysis
  const [progress, setProgress] = useState(null);
  const [analysisStartTime, setAnalysisStartTime] = useState(null);

  /**
   * Multi-pass analysis for files (100% coverage)
   * Uses /api/analyze-multipass for chunked analysis
   */
  const analyzeFiles = useCallback(async (files, apiKey, config, model, provider = 'claude', lmStudioUrl = '') => {
    if (provider === 'claude' && !apiKey) {
      setError('Please enter your Claude API key');
      return;
    }

    if (!files || files.length === 0) {
      setError('Please select files to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResults({ userStories: '', testCases: '', acceptanceCriteria: '', raw: null });
    setProgress({ phase: 'preparing', current: 0, total: 0, message: 'Preparing files...' });
    setAnalysisStartTime(Date.now());

    try {
      const response = await fetch('/api/analyze-multipass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files,
          config: { ...config, model },
          apiKey,
          provider,
          lmStudioUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults({
        userStories: data.userStories || '',
        testCases: data.testCases || '',
        acceptanceCriteria: data.acceptanceCriteria || '',
        raw: data.raw
      });

      setTokenUsage({
        input: data.usage?.input_tokens || 0,
        output: data.usage?.output_tokens || 0
      });

      setProgress({
        phase: 'complete',
        current: data.totalChunks || 1,
        total: data.totalChunks || 1,
        message: 'Analysis complete!'
      });

      setSuccess(`Analysis complete! ${data.filesAnalyzed || files.length} files analyzed (${data.coverage || '100%'} coverage)`);
      return 'stories';
    } catch (err) {
      setError(err.message);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Single-pass analysis for content string (legacy)
   * Uses /api/analyze for simple single-chunk analysis
   */
  const analyzeCodebase = async (content, apiKey, config, model, provider = 'claude', lmStudioUrl = '') => {
    // Validate API key only for Claude
    if (provider === 'claude' && !apiKey) {
      setError('Please enter your Claude API key');
      return;
    }

    if (!content.trim()) {
      setError('Please provide code to analyze');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setResults({ userStories: '', testCases: '', acceptanceCriteria: '', raw: null });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          content,
          config: { ...config, model },
          provider,
          lmStudioUrl
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analysis failed');
      }

      setResults({
        userStories: data.userStories || '',
        testCases: data.testCases || '',
        acceptanceCriteria: data.acceptanceCriteria || '',
        raw: data.raw
      });

      setTokenUsage({
        input: data.usage?.input_tokens || 0,
        output: data.usage?.output_tokens || 0
      });

      setSuccess('Analysis complete!');
      return 'stories'; // Return initial output tab
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults({ userStories: '', testCases: '', acceptanceCriteria: '', raw: null });
    setError('');
    setSuccess('');
    setTokenUsage(null);
    setProgress(null);
    setAnalysisStartTime(null);
  };

  return {
    loading,
    error,
    success,
    results,
    tokenUsage,
    analyzeCodebase,
    analyzeFiles,
    clearResults,
    setError,
    setSuccess,
    // Multi-pass progress state
    progress,
    analysisStartTime
  };
}
