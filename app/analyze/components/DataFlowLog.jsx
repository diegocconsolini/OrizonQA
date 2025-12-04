'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal } from 'lucide-react';

/**
 * DataFlowLog
 *
 * Expandable log of all SSE events for debugging:
 * - Event type and timestamp
 * - Expandable data view
 * - Filterable by event type
 */
export default function DataFlowLog({ dataFlow = [] }) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [filter, setFilter] = useState('all');

  const toggleExpanded = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Get unique event types
  const eventTypes = ['all', ...new Set(dataFlow.map(e => e.type))];

  // Filter events
  const filteredEvents = filter === 'all'
    ? dataFlow
    : dataFlow.filter(e => e.type === filter);

  if (dataFlow.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-4">
        No events yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {eventTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-2 py-1 text-xs rounded ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="bg-slate-900/50 rounded border border-slate-700 max-h-64 overflow-y-auto">
        {filteredEvents.map(event => (
          <div key={event.id} className="border-b border-slate-700 last:border-b-0">
            {/* Event header */}
            <button
              onClick={() => toggleExpanded(event.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-800/50"
            >
              {expandedIds.has(event.id) ? (
                <ChevronDown className="w-3 h-3 text-slate-500" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-500" />
              )}

              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${getEventColor(event.type)}`}>
                {event.type}
              </span>

              <span className="text-slate-500 text-xs font-mono flex-1 truncate">
                {getEventSummary(event)}
              </span>

              <span className="text-slate-600 text-xs">
                {formatTime(event.timestamp)}
              </span>
            </button>

            {/* Expanded data */}
            {expandedIds.has(event.id) && (
              <div className="px-3 pb-2 pl-8">
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap bg-slate-800/50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-slate-600 text-xs flex items-center gap-2">
        <Terminal className="w-3 h-3" />
        {dataFlow.length} events total
      </div>
    </div>
  );
}

/**
 * Get color class for event type
 */
function getEventColor(type) {
  switch (type) {
    case 'plan':
      return 'bg-purple-900/50 text-purple-300';
    case 'chunk-start':
      return 'bg-blue-900/50 text-blue-300';
    case 'api-call':
      return 'bg-yellow-900/50 text-yellow-300';
    case 'chunk-done':
      return 'bg-green-900/50 text-green-300';
    case 'chunk-error':
      return 'bg-red-900/50 text-red-300';
    case 'synthesis-start':
    case 'synthesis-done':
      return 'bg-purple-900/50 text-purple-300';
    case 'complete':
      return 'bg-green-900/50 text-green-300';
    case 'error':
      return 'bg-red-900/50 text-red-300';
    default:
      return 'bg-slate-700 text-slate-300';
  }
}

/**
 * Get summary text for event
 */
function getEventSummary(event) {
  const { data } = event;

  switch (event.type) {
    case 'plan':
      return `${data.totalFiles} files, ${data.totalChunks} chunks, ${data.strategy} strategy`;
    case 'chunk-start':
      return `Chunk ${data.index + 1}: ${data.fileCount} files`;
    case 'api-call':
      return `${data.provider} - ${data.promptTokens?.toLocaleString() || '?'} tokens`;
    case 'chunk-done':
      return `Chunk ${data.index + 1}: ${data.inputTokens?.toLocaleString()}/${data.outputTokens?.toLocaleString()} tokens, ${(data.durationMs/1000).toFixed(1)}s`;
    case 'chunk-error':
      return `Chunk ${data.index + 1}: ${data.error?.substring(0, 50)}...`;
    case 'synthesis-start':
      return `Combining ${data.chunkCount} chunks`;
    case 'synthesis-done':
      return `${data.inputTokens?.toLocaleString()}/${data.outputTokens?.toLocaleString()} tokens`;
    case 'complete':
      return `${data.filesAnalyzed} files, ${data.actualCost}`;
    case 'error':
      return data.error?.substring(0, 50);
    default:
      return '';
  }
}

/**
 * Format timestamp
 */
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
