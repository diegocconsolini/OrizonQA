import { useState, useEffect, useCallback } from 'react';

export default function useGitHubFetch(setUploadedFiles, setInputTab, setError, setSuccess) {
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [loading, setLoading] = useState(false);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [fetchingBranches, setFetchingBranches] = useState(false);

  const acceptedTypes = [
    '.zip', '.txt', '.md', '.json', '.py', '.js', '.ts', '.jsx', '.tsx',
    '.java', '.cs', '.go', '.rb', '.html', '.css', '.sql', '.yml',
    '.yaml', '.xml', '.sh', '.env'
  ];

  const fetchBranches = useCallback(async () => {
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\?]+)/);
    if (!match) {
      return;
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace('.git', '');
    setFetchingBranches(true);

    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/branches`);
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }

      const branches = await response.json();
      setAvailableBranches(branches.map(b => b.name));

      // Set default branch to main or master if available, otherwise first branch
      if (branches.length > 0) {
        const defaultBranch = branches.find(b => b.name === 'main' || b.name === 'master');
        setGithubBranch(defaultBranch ? defaultBranch.name : branches[0].name);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setAvailableBranches([]);
    } finally {
      setFetchingBranches(false);
    }
  }, [githubUrl]);

  // Auto-fetch branches when URL changes
  useEffect(() => {
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\?]+)/);
    if (match) {
      fetchBranches();
    } else {
      setAvailableBranches([]);
    }
  }, [githubUrl]);

  const fetchGitHub = async () => {
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\?]+)/);
    if (!match) {
      setError('Invalid GitHub URL format. Use: https://github.com/owner/repo');
      return;
    }

    const [, owner, repo] = match;
    const cleanRepo = repo.replace('.git', '');
    setLoading(true);
    setError('');

    try {
      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/git/trees/${githubBranch}?recursive=1`);
      if (!treeRes.ok) {
        if (treeRes.status === 404) {
          throw new Error('Repository or branch not found. Make sure it\'s a public repository.');
        }
        throw new Error('Failed to fetch repository');
      }

      const tree = await treeRes.json();
      const files = tree.tree
        .filter(item => item.type === 'blob')
        .filter(item => !item.path.includes('node_modules/') && !item.path.includes('.git/') && !item.path.includes('__pycache__/'))
        .filter(item => acceptedTypes.some(ext => item.path.endsWith(ext)) || item.path.endsWith('Dockerfile') || item.path.endsWith('Makefile'))
        .slice(0, 50);

      const contents = await Promise.all(
        files.map(async (file) => {
          try {
            const res = await fetch(`https://raw.githubusercontent.com/${owner}/${cleanRepo}/${githubBranch}/${file.path}`);
            if (!res.ok) return null;
            const content = await res.text();
            if (content.length > 500000) return null;
            return { name: file.path, content };
          } catch {
            return null;
          }
        })
      );

      const validContents = contents.filter(Boolean);
      setUploadedFiles(validContents);
      setInputTab('upload');
      setSuccess(`Fetched ${validContents.length} files from repository`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    githubUrl,
    setGithubUrl,
    githubBranch,
    setGithubBranch,
    loading,
    fetchGitHub,
    availableBranches,
    fetchingBranches
  };
}
