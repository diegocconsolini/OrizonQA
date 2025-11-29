import { useState } from 'react';

export default function useLMStudio() {
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // 'success', 'error', null
  const [testMessage, setTestMessage] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Test LM Studio connection
  const testConnection = async (lmStudioUrl) => {
    setTesting(true);
    setTestStatus(null);
    setTestMessage('');

    try {
      const response = await fetch(`${lmStudioUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status}`);
      }

      const data = await response.json();
      const models = data.data || [];

      if (models.length === 0) {
        setTestStatus('error');
        setTestMessage('No models loaded in LM Studio');
      } else {
        setTestStatus('success');
        setTestMessage(`Connected! Found ${models.length} model(s)`);
        setAvailableModels(models);
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`Connection failed: ${error.message}`);
      setAvailableModels([]);
    } finally {
      setTesting(false);
    }
  };

  // Fetch available models
  const fetchModels = async (lmStudioUrl) => {
    setLoadingModels(true);
    try {
      const response = await fetch(`${lmStudioUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.status}`);
      }

      const data = await response.json();
      const models = data.data || [];
      setAvailableModels(models);
      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      setAvailableModels([]);
      return [];
    } finally {
      setLoadingModels(false);
    }
  };

  // Test with a simple prompt
  const testPrompt = async (lmStudioUrl, model = null) => {
    setTesting(true);
    setTestStatus(null);
    setTestMessage('');

    try {
      // If no model specified, use the first available model
      let modelToUse = model;
      if (!modelToUse && availableModels.length > 0) {
        modelToUse = availableModels[0].id;
      }

      const response = await fetch(`${lmStudioUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse || 'local-model',
          messages: [
            { role: 'user', content: 'Say "Hello from LM Studio!" in exactly 5 words.' }
          ],
          max_tokens: 50,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      const message = data.choices?.[0]?.message?.content || 'No response';

      setTestStatus('success');
      setTestMessage(`✓ Test successful! Response: "${message.trim()}"`);
    } catch (error) {
      setTestStatus('error');
      setTestMessage(`Test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  return {
    testing,
    testStatus,
    testMessage,
    availableModels,
    loadingModels,
    testConnection,
    fetchModels,
    testPrompt
  };
}
