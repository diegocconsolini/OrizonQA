'use client';

/**
 * Repository Selector Component
 *
 * Visual repository browser for selecting GitHub repos to analyze.
 * Integrates with useRepositories hook and IndexedDB caching.
 *
 * Features:
 * - Search/filter repositories
 * - Private/public icons (Lock/Globe)
 * - Star favorites (stored in localStorage)
 * - Cache status indicators
 * - Last updated time
 * - Language indicator
 *
 * PRIVACY: All repository content is cached locally in IndexedDB.
 * NO code is ever uploaded to ORIZON servers.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Lock,
  Globe,
  Star,
  RefreshCw,
  GitBranch,
  Clock,
  Database,
  Check,
  ChevronRight,
  Folder,
  AlertCircle
} from 'lucide-react';

export default function RepositorySelector({
  repositories = [],
  selectedRepo = null,
  onSelect,
  onRefresh,
  loading = false,
  isConnected = false,
  cachedRepos = [],
  error = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [filter, setFilter] = useState('all'); // all, favorites, cached

  // Load favorites from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orizon_favorite_repos');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          setFavorites([]);
        }
      }
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (newFavorites) => {
    setFavorites(newFavorites);
    if (typeof window !== 'undefined') {
      localStorage.setItem('orizon_favorite_repos', JSON.stringify(newFavorites));
    }
  };

  // Toggle favorite status
  const toggleFavorite = (repoFullName, e) => {
    e.stopPropagation();
    if (favorites.includes(repoFullName)) {
      saveFavorites(favorites.filter(f => f !== repoFullName));
    } else {
      saveFavorites([...favorites, repoFullName]);
    }
  };

  // Check if repo is cached
  const isRepoCached = (repo) => {
    return cachedRepos.some(
      cached => cached.fullName === repo.full_name ||
                cached.fullName === `${repo.owner}/${repo.name}`
    );
  };

  // Filter and search repositories
  const filteredRepos = useMemo(() => {
    let result = [...repositories];

    // Apply filter
    if (filter === 'favorites') {
      result = result.filter(repo => favorites.includes(repo.full_name));
    } else if (filter === 'cached') {
      result = result.filter(repo => isRepoCached(repo));
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(repo =>
        repo.full_name?.toLowerCase().includes(query) ||
        repo.name?.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query)
      );
    }

    // Sort: favorites first, then by updated date
    result.sort((a, b) => {
      const aFav = favorites.includes(a.full_name);
      const bFav = favorites.includes(b.full_name);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
    });

    return result;
  }, [repositories, searchQuery, filter, favorites, cachedRepos]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Language color mapping
  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: '#f7df1e',
      TypeScript: '#3178c6',
      Python: '#3572A5',
      Java: '#b07219',
      Go: '#00ADD8',
      Rust: '#dea584',
      Ruby: '#701516',
      PHP: '#4F5D95',
      'C#': '#178600',
      'C++': '#f34b7d',
      C: '#555555',
      Swift: '#F05138',
      Kotlin: '#A97BFF',
      Scala: '#c22d40',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Shell: '#89e051',
      default: '#6e7681'
    };
    return colors[language] || colors.default;
  };

  if (!isConnected) {
    return (
      <div className="bg-surface-dark rounded-xl p-6">
        <div className="text-center py-8">
          <Folder className="w-12 h-12 text-text-secondary-dark mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            Connect GitHub to Browse Repositories
          </h3>
          <p className="text-sm text-text-secondary-dark max-w-sm mx-auto">
            Connect your GitHub account in Settings to browse and select repositories for analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-dark rounded-xl overflow-hidden">
      {/* Header with Search */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary-dark" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full pl-10 pr-4 py-2.5 bg-bg-dark border border-white/10 rounded-lg
                       text-white text-sm placeholder-text-secondary-dark
                       focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
                       transition-all duration-200"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 bg-bg-dark border border-white/10 rounded-lg
                     hover:bg-white/5 hover:border-white/20 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh repositories"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary-dark ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mt-3">
          {[
            { id: 'all', label: 'All', count: repositories.length },
            { id: 'favorites', label: 'Favorites', count: repositories.filter(r => favorites.includes(r.full_name)).length },
            { id: 'cached', label: 'Cached', count: repositories.filter(r => isRepoCached(r)).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                filter === tab.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-white/5 text-text-secondary-dark border border-transparent hover:bg-white/10'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Repository List */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading && repositories.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="w-8 h-8 text-text-secondary-dark mx-auto mb-3" />
            <p className="text-sm text-text-secondary-dark">
              {searchQuery ? 'No repositories match your search' : 'No repositories found'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredRepos.map(repo => {
              const isSelected = selectedRepo?.full_name === repo.full_name;
              const isFavorite = favorites.includes(repo.full_name);
              const isCached = isRepoCached(repo);

              return (
                <button
                  key={repo.id || repo.full_name}
                  onClick={() => onSelect(repo)}
                  className={`w-full text-left p-4 transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary/10 border-l-2 border-l-primary'
                      : 'hover:bg-white/5 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Repository Icon */}
                    <div className={`mt-0.5 ${repo.private ? 'text-amber-500' : 'text-text-secondary-dark'}`}>
                      {repo.private ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                    </div>

                    {/* Repository Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {repo.full_name || `${repo.owner}/${repo.name}`}
                        </span>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isCached && (
                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              Cached
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {repo.description && (
                        <p className="text-xs text-text-secondary-dark mt-1 line-clamp-1">
                          {repo.description}
                        </p>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-3 mt-2">
                        {/* Language */}
                        {repo.language && (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: getLanguageColor(repo.language) }}
                            />
                            <span className="text-xs text-text-secondary-dark">{repo.language}</span>
                          </div>
                        )}

                        {/* Default Branch */}
                        {repo.default_branch && (
                          <div className="flex items-center gap-1 text-xs text-text-secondary-dark">
                            <GitBranch className="w-3 h-3" />
                            {repo.default_branch}
                          </div>
                        )}

                        {/* Last Updated */}
                        {repo.updated_at && (
                          <div className="flex items-center gap-1 text-xs text-text-secondary-dark">
                            <Clock className="w-3 h-3" />
                            {formatDate(repo.updated_at)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Favorite Toggle */}
                      <button
                        onClick={(e) => toggleFavorite(repo.full_name, e)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          isFavorite
                            ? 'text-amber-500 hover:bg-amber-500/10'
                            : 'text-text-secondary-dark hover:bg-white/10 hover:text-white'
                        }`}
                        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {/* Selection indicator */}
                      <div className={`transition-all duration-200 ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="px-4 py-3 border-t border-white/10 bg-bg-dark/50">
        <p className="text-xs text-text-secondary-dark">
          {filteredRepos.length} of {repositories.length} repositories
          {selectedRepo && (
            <span className="ml-2 text-primary">
              • Selected: {selectedRepo.name}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
