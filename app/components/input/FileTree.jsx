import { useState } from 'react';
import { File, Folder, ChevronDown, ChevronRight } from 'lucide-react';

export default function FileTree({ files }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (path) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const buildTree = (files) => {
    const tree = {};
    files.forEach(file => {
      const parts = file.name.split('/');
      let current = tree;
      parts.forEach((part, i) => {
        if (!current[part]) {
          current[part] = i === parts.length - 1 ? { _isFile: true, content: file.content } : {};
        }
        current = current[part];
      });
    });
    return tree;
  };

  const renderTree = (node, path = '', level = 0) => {
    return Object.entries(node).filter(([key]) => key !== '_isFile' && key !== 'content').map(([key, value]) => {
      const fullPath = path ? `${path}/${key}` : key;
      const isFile = value._isFile;
      const isExpanded = expanded[fullPath];

      return (
        <div key={fullPath} style={{ marginLeft: level * 16 }}>
          <div
            className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-700/50 cursor-pointer text-sm transition-colors ${isFile ? 'text-slate-300' : 'text-slate-200'}`}
            onClick={() => !isFile && toggleExpand(fullPath)}
          >
            {isFile ? (
              <File size={14} className="text-indigo-400" />
            ) : (
              <>
                {isExpanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
                <Folder size={14} className="text-amber-400" />
              </>
            )}
            <span className="truncate">{key}</span>
          </div>
          {!isFile && isExpanded && renderTree(value, fullPath, level + 1)}
        </div>
      );
    });
  };

  const tree = buildTree(files);
  return <div className="mt-3 max-h-48 overflow-y-auto rounded-lg bg-slate-900/50 p-2">{renderTree(tree)}</div>;
}
