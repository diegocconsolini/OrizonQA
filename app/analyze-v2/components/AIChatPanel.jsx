'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Zap, BookOpen, ListChecks, Shield, Code, Send,
  Play, Copy, Download, Check, X, Loader2, ChevronDown, ChevronUp,
  FileText, Clock, DollarSign, Activity, MessageSquare, Bot
} from 'lucide-react';
import { AnalysisStatus } from '@/app/hooks/useAnalysisStream';

/**
 * Model Configuration
 * - CHAT_MODEL: Fast, cheap model for conversational interactions
 * - ANALYSIS_MODEL: Powerful model for actual code analysis
 */
const MODELS = {
  chat: {
    id: 'claude-3-5-haiku-20241022',
    name: 'Haiku',
    costPer1kInput: 0.001,
    costPer1kOutput: 0.005,
    description: 'Fast & cheap for chat'
  },
  analysis: {
    id: 'claude-sonnet-4-20250514',
    name: 'Sonnet 4',
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    description: 'Powerful for analysis'
  }
};

/**
 * AIChatPanel Component
 *
 * Right panel with AI chat interface for analysis.
 * Uses smart model selection:
 * - Haiku for chat/configuration interactions
 * - Sonnet for actual code analysis
 */
export default function AIChatPanel({
  // Source info
  selectedRepo,
  selectedFiles,
  codeInput,
  uploadedFiles,
  // Analysis state
  status,
  isAnalyzing,
  isComplete,
  plan,
  progress,
  chunks,
  currentActivity,
  tokenUsage,
  actualCost,
  results,
  error,
  elapsedFormatted,
  dataFlow,
  // Config
  config,
  setConfig,
  // Actions
  onAnalyze,
  onCancel,
  onReset,
  canAnalyze,
  // AI Provider
  provider,
  claudeModel,
  hasApiKey,
  apiKey
}) {
  const [viewMode, setViewMode] = useState('simple');
  const [selectedAction, setSelectedAction] = useState(null);
  const [copied, setCopied] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatting, setIsChatting] = useState(false);
  const [chatTokens, setChatTokens] = useState({ input: 0, output: 0 });
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentActivity, isComplete, chatMessages]);

  // Get source summary
  const getSourceSummary = () => {
    if (selectedFiles.length > 0 && selectedRepo) {
      return {
        type: 'github',
        name: selectedRepo.name,
        fileCount: selectedFiles.length,
        label: `${selectedRepo.name} (${selectedFiles.length} files)`
      };
    }
    if (codeInput) {
      return {
        type: 'paste',
        name: 'Pasted code',
        charCount: codeInput.length,
        label: `Pasted code (${codeInput.length.toLocaleString()} chars)`
      };
    }
    if (uploadedFiles?.length > 0) {
      return {
        type: 'upload',
        name: 'Uploaded files',
        fileCount: uploadedFiles.length,
        label: `${uploadedFiles.length} uploaded file${uploadedFiles.length > 1 ? 's' : ''}`
      };
    }
    return null;
  };

  const source = getSourceSummary();

  // Quick actions
  const quickActions = [
    {
      id: 'api-tests',
      label: 'API Tests',
      icon: Code,
      color: 'blue',
      config: { testCases: true, userStories: false, acceptanceCriteria: false }
    },
    {
      id: 'user-stories',
      label: 'User Stories',
      icon: BookOpen,
      color: 'purple',
      config: { testCases: false, userStories: true, acceptanceCriteria: false }
    },
    {
      id: 'full-suite',
      label: 'Full QA Suite',
      icon: ListChecks,
      color: 'amber',
      config: { testCases: true, userStories: true, acceptanceCriteria: true }
    },
    {
      id: 'security',
      label: 'Security Tests',
      icon: Shield,
      color: 'red',
      config: { testCases: true, securityTests: true, userStories: false, acceptanceCriteria: false }
    }
  ];

  // Handle chat message (uses Haiku for fast, cheap responses)
  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || isChatting) return;

    const userMessage = chatInput.trim();

    // Check for API key
    if (!apiKey) {
      setChatMessages(prev => [...prev,
        { type: 'user', content: userMessage },
        { type: 'error', content: 'Please add your Claude API key in Settings to use chat.' }
      ]);
      setChatInput('');
      return;
    }
    setChatInput('');
    setChatMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsChatting(true);

    try {
      // Build context for the chat
      const context = {
        hasSource: !!source,
        sourceType: source?.type,
        sourceName: source?.name,
        fileCount: source?.fileCount || 0,
        currentConfig: config,
        selectedAction: selectedAction?.label
      };

      // Call Haiku for chat (cheap & fast)
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          context,
          model: MODELS.chat.id,
          apiKey
        })
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const data = await response.json();

      // Track chat token usage
      if (data.usage) {
        setChatTokens(prev => ({
          input: prev.input + (data.usage.input_tokens || 0),
          output: prev.output + (data.usage.output_tokens || 0)
        }));
      }

      // Add assistant response
      setChatMessages(prev => [...prev, {
        type: 'assistant',
        content: data.response,
        model: MODELS.chat.name,
        tokens: data.usage
      }]);

      // Handle any suggested actions from the chat
      if (data.suggestedAction) {
        const action = quickActions.find(a => a.id === data.suggestedAction);
        if (action) {
          handleSelectAction(action);
        }
      }

      if (data.suggestedConfig) {
        setConfig(prev => ({ ...prev, ...data.suggestedConfig }));
      }

    } catch (err) {
      setChatMessages(prev => [...prev, {
        type: 'error',
        content: 'Failed to get response. Please try again.'
      }]);
    } finally {
      setIsChatting(false);
    }
  }, [chatInput, isChatting, source, config, selectedAction, apiKey, setConfig]);

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  // Handle action selection
  const handleSelectAction = (action) => {
    setSelectedAction(action);
    setConfig(prev => ({ ...prev, ...action.config }));
  };

  // Copy results
  const handleCopy = async () => {
    const content = [
      results?.userStories,
      results?.testCases,
      results?.acceptanceCriteria
    ].filter(Boolean).join('\n\n---\n\n');

    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download results
  const handleDownload = () => {
    const content = [
      results?.userStories,
      results?.testCases,
      results?.acceptanceCriteria
    ].filter(Boolean).join('\n\n---\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-analysis-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Get step indicators
  const getStepStatus = (step) => {
    if (status === AnalysisStatus.IDLE) {
      return step === 1 ? 'current' : 'pending';
    }
    if (isAnalyzing) {
      return step <= 2 ? 'complete' : step === 3 ? 'current' : 'pending';
    }
    if (isComplete) {
      return 'complete';
    }
    return 'pending';
  };

  // Calculate chat cost
  const chatCost = (chatTokens.input * MODELS.chat.costPer1kInput / 1000) +
                   (chatTokens.output * MODELS.chat.costPer1kOutput / 1000);

  return (
    <div className="h-full flex flex-col bg-surface-dark/30">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-2.5 border-b border-white/10 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-white">ORIZON Assistant</h3>
          <p className="text-[10px] text-green-400">
            {hasApiKey ? 'Connected' : 'API key required'}
          </p>
        </div>

        {/* Model Indicator */}
        <div className="flex items-center gap-2 text-[10px]">
          <div className="flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded">
            <MessageSquare className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400">{MODELS.chat.name}</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded">
            <Bot className="w-3 h-3 text-primary" />
            <span className="text-primary">{MODELS.analysis.name}</span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-bg-dark rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('simple')}
            className={`px-3 py-1 text-[10px] font-medium rounded transition-colors
              ${viewMode === 'simple' ? 'bg-primary text-white' : 'text-text-secondary-dark hover:text-white'}`}
          >
            Simple
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`px-3 py-1 text-[10px] font-medium rounded transition-colors
              ${viewMode === 'detailed' ? 'bg-primary text-white' : 'text-text-secondary-dark hover:text-white'}`}
          >
            Detailed
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome Message */}
        <ChatMessage type="assistant" model={MODELS.chat.name}>
          <div className="space-y-3">
            <p className="text-sm text-white leading-relaxed">
              {source ? (
                <>
                  I've detected <span className="text-primary font-medium">{source.label}</span> selected.
                </>
              ) : (
                <>
                  Welcome! Select code from GitHub, paste, or upload files to begin.
                </>
              )}
            </p>

            {source && (
              <p className="text-sm text-white">What would you like to generate?</p>
            )}

            {/* Smart Model Usage Info */}
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <p className="text-[10px] text-text-secondary-dark flex items-center gap-2">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>
                  <strong className="text-cyan-400">{MODELS.chat.name}</strong> for chat (~$0.001/msg) •{' '}
                  <strong className="text-primary">{MODELS.analysis.name}</strong> for analysis
                </span>
              </p>
            </div>

            {/* Step Guide */}
            <div className="space-y-2">
              {[
                { num: 1, title: 'Select source & files', desc: 'Choose what code to analyze' },
                { num: 2, title: 'Choose what to generate', desc: 'Tests, stories, or criteria' },
                { num: 3, title: 'Generate & execute', desc: 'AI generates, you can run tests' }
              ].map(step => {
                const stepStatus = getStepStatus(step.num);
                return (
                  <div
                    key={step.num}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all
                      ${stepStatus === 'current'
                        ? 'bg-primary/10 border-primary/30'
                        : stepStatus === 'complete'
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-white/5 border-white/10'}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                      ${stepStatus === 'current'
                        ? 'bg-gradient-to-br from-primary to-cyan-500 text-white'
                        : stepStatus === 'complete'
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-text-secondary-dark'}`}
                    >
                      {stepStatus === 'complete' ? <Check className="w-3 h-3" /> : step.num}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white">{step.title}</p>
                      <p className="text-[10px] text-text-secondary-dark">{step.desc}</p>
                    </div>
                    {stepStatus === 'current' && (
                      <span className="text-[10px] text-primary">Current</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quick Actions - only show when source is selected */}
            {source && status === AnalysisStatus.IDLE && canAnalyze && (
              <div className="flex flex-wrap gap-2 mt-3">
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleSelectAction(action)}
                    className={`px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all
                      ${selectedAction?.id === action.id
                        ? `bg-${action.color}-500/20 border border-${action.color}-500/40 text-${action.color}-400`
                        : `bg-${action.color}-500/10 border border-${action.color}-500/20 text-${action.color}-400 hover:bg-${action.color}-500/20`}`}
                  >
                    <action.icon className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </ChatMessage>

        {/* Dynamic Chat Messages */}
        {chatMessages.map((msg, i) => (
          <ChatMessage
            key={i}
            type={msg.type}
            model={msg.model}
            tokens={msg.tokens}
          >
            {msg.type === 'error' ? (
              <p className="text-sm text-red-400">{msg.content}</p>
            ) : (
              <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
            )}
          </ChatMessage>
        ))}

        {/* Typing Indicator */}
        {isChatting && (
          <ChatMessage type="assistant" model={MODELS.chat.name}>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </ChatMessage>
        )}

        {/* Action Selected Message - only show when source is selected */}
        {selectedAction && source && status === AnalysisStatus.IDLE && !chatMessages.some(m => m.content?.includes('Generate')) && (
          <>
            <ChatMessage type="user">
              <p className="text-sm">Generate {selectedAction.label}</p>
            </ChatMessage>

            <ChatMessage type="assistant" model={MODELS.analysis.name}>
              <div className="space-y-3">
                {/* Analysis Summary */}
                <div className="bg-bg-dark rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-white">Ready to analyze</span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <Bot className="w-3 h-3 text-primary" />
                      <span className="text-primary">{MODELS.analysis.name}</span>
                    </div>
                  </div>

                  {viewMode === 'simple' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 bg-white/5 rounded text-center">
                        <div className="text-lg font-bold text-white">{selectedFiles.length || 1}</div>
                        <div className="text-[10px] text-text-secondary-dark">Files</div>
                      </div>
                      <div className="p-2 bg-white/5 rounded text-center">
                        <div className="text-lg font-bold text-white">
                          {config.testCases && config.userStories && config.acceptanceCriteria ? 3 :
                           config.testCases && config.userStories ? 2 : 1}
                        </div>
                        <div className="text-[10px] text-text-secondary-dark">Outputs</div>
                      </div>
                      <div className="p-2 bg-white/5 rounded text-center">
                        <div className="text-lg font-bold text-primary">~$0.05</div>
                        <div className="text-[10px] text-text-secondary-dark">Est. Cost</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3 h-3 text-text-secondary-dark" />
                        <span className="text-white">Source: {source?.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-3 h-3 text-text-secondary-dark" />
                        <span className="text-white">
                          Outputs: {[
                            config.testCases && 'Tests',
                            config.userStories && 'Stories',
                            config.acceptanceCriteria && 'Criteria'
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-text-secondary-dark" />
                        <span className="text-white">Model: {MODELS.analysis.name} (~$0.05)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Generate Button */}
                <button
                  onClick={onAnalyze}
                  disabled={!canAnalyze}
                  className="w-full py-3 bg-gradient-to-r from-primary to-cyan-500 text-white font-semibold
                           rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2"
                >
                  <Zap className="w-5 h-5" />
                  Generate with {MODELS.analysis.name}
                </button>

                {!hasApiKey && (
                  <p className="text-[10px] text-center text-amber-400">
                    Add your API key in Settings to analyze code
                  </p>
                )}
              </div>
            </ChatMessage>
          </>
        )}

        {/* Analysis In Progress */}
        {isAnalyzing && (
          <ChatMessage type="assistant" model={MODELS.analysis.name}>
            <div className="space-y-3">
              {/* Progress Header */}
              <div className="bg-bg-dark rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white">
                    {currentActivity?.message || 'Analyzing...'}
                  </span>
                  <span className="text-xs text-primary">
                    {progress.current}/{progress.total}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[10px] text-text-secondary-dark">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {elapsedFormatted}
                  </span>
                  <span>{tokenUsage.input.toLocaleString()} tokens</span>
                  <span>{actualCost}</span>
                </div>
              </div>

              {/* Detailed View: Streaming Logs */}
              {viewMode === 'detailed' && dataFlow.length > 0 && (
                <div className="bg-black/30 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-[10px]">
                  {dataFlow.slice(-20).map((entry, i) => (
                    <div
                      key={entry.id || i}
                      className={`leading-relaxed ${
                        entry.type === 'error' ? 'text-red-400' :
                        entry.type === 'complete' ? 'text-green-400' :
                        entry.type.includes('start') ? 'text-primary' :
                        'text-text-secondary-dark'
                      }`}
                    >
                      [{new Date(entry.timestamp).toLocaleTimeString()}] {entry.type}
                      {entry.data?.message && `: ${entry.data.message}`}
                    </div>
                  ))}
                </div>
              )}

              {/* Simple View: Stage Indicators */}
              {viewMode === 'simple' && (
                <div className="space-y-2">
                  {['Connecting', 'Planning', 'Analyzing', 'Synthesizing'].map((stage, i) => {
                    const stageStatus =
                      status === AnalysisStatus.CONNECTING && i === 0 ? 'active' :
                      status === AnalysisStatus.PLANNING && i <= 1 ? (i === 1 ? 'active' : 'done') :
                      status === AnalysisStatus.ANALYZING && i <= 2 ? (i === 2 ? 'active' : 'done') :
                      status === AnalysisStatus.SYNTHESIZING && i <= 3 ? (i === 3 ? 'active' : 'done') :
                      'pending';

                    return (
                      <div key={stage} className={`flex items-center gap-2 p-2 rounded-lg
                        ${stageStatus === 'active' ? 'bg-primary/10' :
                          stageStatus === 'done' ? 'bg-green-500/10' : 'bg-white/5'}`}
                      >
                        {stageStatus === 'active' ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : stageStatus === 'done' ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-white/20" />
                        )}
                        <span className={`text-xs ${stageStatus !== 'pending' ? 'text-white' : 'text-text-secondary-dark'}`}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cancel Button */}
              <button
                onClick={onCancel}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-text-secondary-dark
                         hover:text-white text-xs rounded-lg transition-colors"
              >
                Cancel Analysis
              </button>
            </div>
          </ChatMessage>
        )}

        {/* Error State */}
        {status === AnalysisStatus.ERROR && (
          <ChatMessage type="assistant" model={MODELS.analysis.name}>
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Analysis Failed</h4>
                  <p className="text-xs text-text-secondary-dark mt-1">{error}</p>
                  <button
                    onClick={onReset}
                    className="mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </ChatMessage>
        )}

        {/* Completion Message */}
        {isComplete && results && (
          <ChatMessage type="assistant" model={MODELS.analysis.name}>
            <div className="space-y-3">
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Analysis Complete!</h4>
                    <p className="text-[10px] text-text-secondary-dark">
                      Generated in {elapsedFormatted} using {MODELS.analysis.name}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="p-2 bg-white/5 rounded text-center">
                    <div className="text-lg font-bold text-white">
                      {tokenUsage.input.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-text-secondary-dark">Input Tokens</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded text-center">
                    <div className="text-lg font-bold text-white">
                      {tokenUsage.output.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-text-secondary-dark">Output Tokens</div>
                  </div>
                  <div className="p-2 bg-white/5 rounded text-center">
                    <div className="text-lg font-bold text-primary">{actualCost}</div>
                    <div className="text-[10px] text-text-secondary-dark">Cost</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <a
                    href="/analyze?tab=results"
                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs
                             font-medium rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    View Full Results
                  </a>
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs
                             font-medium rounded-lg flex items-center justify-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs
                             font-medium rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Results Preview */}
              {viewMode === 'detailed' && (
                <div className="space-y-2">
                  {results.testCases && (
                    <ResultPreview title="Test Cases" content={results.testCases} />
                  )}
                  {results.userStories && (
                    <ResultPreview title="User Stories" content={results.userStories} />
                  )}
                  {results.acceptanceCriteria && (
                    <ResultPreview title="Acceptance Criteria" content={results.acceptanceCriteria} />
                  )}
                </div>
              )}

              {/* What's Next */}
              <div className="bg-bg-dark rounded-xl p-3">
                <p className="text-xs text-text-secondary-dark mb-2">What's next?</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={onReset}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded
                             text-[10px] text-text-secondary-dark hover:text-white hover:bg-white/10"
                  >
                    New analysis
                  </button>
                  <a
                    href="/execute"
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded
                             text-[10px] text-text-secondary-dark hover:text-white hover:bg-white/10"
                  >
                    Execute tests
                  </a>
                  <a
                    href="/projects"
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded
                             text-[10px] text-text-secondary-dark hover:text-white hover:bg-white/10"
                  >
                    Save to project
                  </a>
                </div>
              </div>
            </div>
          </ChatMessage>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Chat Input */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        <div className="relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything or type a command..."
            className="w-full px-3 py-2.5 pr-10 bg-bg-dark border border-white/10 rounded-lg
                     text-sm text-white placeholder-text-secondary-dark
                     focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={handleSendChat}
            disabled={!chatInput.trim() || isChatting}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-primary hover:bg-primary/80
                     rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChatting ? (
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5 text-white" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[10px] text-text-secondary-dark">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3 text-cyan-400" />
              Chat: {MODELS.chat.name}
            </span>
            {chatTokens.input > 0 && (
              <span className="text-cyan-400">
                ({chatTokens.input + chatTokens.output} tokens, ${chatCost.toFixed(4)})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-1 py-0.5 bg-white/5 rounded">Enter</kbd>
            <span>to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Chat Message Wrapper
 */
function ChatMessage({ type, model, tokens, children }) {
  if (type === 'user') {
    return (
      <div className="flex gap-3 justify-end">
        <div className="bg-primary/20 rounded-xl rounded-tr-sm p-3 max-w-[80%]">
          {children}
        </div>
        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-medium text-white">U</span>
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="flex gap-3">
        <div className="w-6 h-6 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
          <X className="w-3 h-3 text-red-400" />
        </div>
        <div className="flex-1">
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl rounded-tl-sm p-3">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3 h-3 text-white" />
      </div>
      <div className="flex-1">
        <div className="bg-bg-dark rounded-xl rounded-tl-sm p-3">
          {children}
        </div>
        {model && (
          <div className="flex items-center gap-2 mt-1 text-[10px] text-text-secondary-dark">
            <span className={model === 'Haiku' ? 'text-cyan-400' : 'text-primary'}>
              {model}
            </span>
            {tokens && (
              <span>
                ({tokens.input_tokens + tokens.output_tokens} tokens)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Result Preview Component
 */
function ResultPreview({ title, content }) {
  const [expanded, setExpanded] = useState(false);
  const preview = content.slice(0, 500);

  return (
    <div className="bg-black/30 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-white">{title}</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] text-primary hover:underline flex items-center gap-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      <pre className="text-[10px] text-text-secondary-dark whitespace-pre-wrap overflow-hidden font-mono">
        {expanded ? content : preview}
        {!expanded && content.length > 500 && '...'}
      </pre>
    </div>
  );
}
