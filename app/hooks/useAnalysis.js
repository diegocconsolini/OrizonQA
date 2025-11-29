import { useState } from 'react';

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

  const analyzeCodebase = async (content, apiKey, config, model) => {
    if (!apiKey) {
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
          config: { ...config, model }
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
  };

  return {
    loading,
    error,
    success,
    results,
    tokenUsage,
    analyzeCodebase,
    clearResults,
    setError,
    setSuccess
  };
}
