import React, { useState, useEffect, useRef } from 'react';
import { Search, BarChart3, Download, Save, FileText, X, ChevronDown, Loader2, Settings, Video, Code, TrendingUp, TestTube, Image, CheckCircle, ChevronUp, Check } from 'lucide-react';
import { FeatureType, AppMode } from '../App';
import { apiService, Space } from '../services/api';
import CustomScrollbar from './CustomScrollbar';
import { getConfluenceSpaceAndPageFromUrl } from '../utils/urlUtils';
import VoiceRecorder from './VoiceRecorder';
import { getFeatureConfig } from '../utils/featureConfig';

interface AIPoweredSearchProps {
  onClose: () => void;
  onFeatureSelect: (feature: FeatureType) => void;
  onModeSelect: (mode: AppMode) => void;
  autoSpaceKey?: string | null;
  isSpaceAutoConnected?: boolean;
}

const AIPoweredSearch: React.FC<AIPoweredSearchProps> = ({ 
  onClose, 
  onFeatureSelect, 
  onModeSelect,
  autoSpaceKey, 
  isSpaceAutoConnected 
}) => {
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [responseSource, setResponseSource] = useState('');
  // --- History feature ---
  const [history, setHistory] = useState<Array<{query: string, response: string, responseSource: string}>>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showRawContent, setShowRawContent] = useState(false);
  const [exportFormat, setExportFormat] = useState('markdown');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [pageSearch, setPageSearch] = useState('');
  const [exportFormatSearch, setExportFormatSearch] = useState('');
  const [isExportFormatDropdownOpen, setIsExportFormatDropdownOpen] = useState(false);
  const [saveMode, setSaveMode] = useState('append');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [showNewPageInput, setShowNewPageInput] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewDiff, setPreviewDiff] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGoogleChatLoading, setIsGoogleChatLoading] = useState(false);
  const exportFormats = [
    { value: 'markdown', label: 'Markdown' },
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'Word Document' }
  ];

  // Add ref for auto-scroll functionality
  const aiResponseRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to AI Response when it's generated
  useEffect(() => {
    if (response && aiResponseRef.current) {
      setTimeout(() => {
        aiResponseRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [response]);

  const toggleSelectAllPages = () => {
    if (selectedPages.length === pages.length) {
      setSelectedPages([]);
    } else {
      setSelectedPages([...pages]);
    } 
  };

  const handlePageSelection = (page: string) => {
    setSelectedPages(prev =>
      prev.includes(page)
        ? prev.filter(p => p !== page)
        : [...prev, page]
    );
  };
  const selectAllPages = () => {
    setSelectedPages(pages);
  };
  const clearAllPages = () => {
    setSelectedPages([]);
  };

  const features = [
    { id: 'search' as const, label: 'AI Powered Search', icon: Search },
    { id: 'video' as const, label: 'Video Summarizer', icon: Video },
    { id: 'code' as const, label: 'Code Assistant', icon: Code },
    { id: 'impact' as const, label: 'Impact Analyzer', icon: TrendingUp },
    { id: 'test' as const, label: 'Test Support Tool', icon: TestTube },
    { id: 'image' as const, label: 'Chart Builder', icon: BarChart3},
  ];

  // Get current feature configuration for dynamic title
  const currentFeatureConfig = getFeatureConfig('search');

  // Load spaces on component mount
  useEffect(() => {
    loadSpaces();
  }, []);

  // Auto-select space if provided via URL
  useEffect(() => {
    if (autoSpaceKey && isSpaceAutoConnected) {
      setSelectedSpace(autoSpaceKey);
    }
  }, [autoSpaceKey, isSpaceAutoConnected]);

  // Load pages when space is selected
  useEffect(() => {
    if (selectedSpace) {
      loadPages();
    }
  }, [selectedSpace]);

  // Sync "Select All" checkbox state

  // Only auto-select page from URL if no page is already selected
  useEffect(() => {
    if (pages.length > 0 && selectedPages.length === 0) {
      const { page } = getConfluenceSpaceAndPageFromUrl();
      if (page && pages.includes(page)) {
        setSelectedPages([page]);
      }
    }
  }, [pages, selectedPages]);

  // Handle save mode change
  useEffect(() => {
    if (saveMode === 'new') {
      setShowNewPageInput(true);
    } else {
      setShowNewPageInput(false);
      setNewPageTitle('');
    }
  }, [saveMode]);

  const loadSpaces = async () => {
    try {
      setError('');
      const result = await apiService.getSpaces();
      setSpaces(result.spaces);
    } catch (err) {
      setError('Failed to load spaces. Please check your backend connection.');
      console.error('Error loading spaces:', err);
    }
  };

  const loadPages = async () => {
    try {
      setError('');
      const result = await apiService.getPages(selectedSpace);
      setPages(result.pages);
      // Auto-select page if present in URL
      const { page } = getConfluenceSpaceAndPageFromUrl();
      if (page && result.pages.includes(page)) {
        setSelectedPages([page]);
      }
    } catch (err) {
      setError('Failed to load pages. Please check your space key.');
      console.error('Error loading pages:', err);
    }
  };

  const handleSearch = async () => {
    if (!selectedSpace || selectedPages.length === 0 || !query.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await apiService.search({
        space_key: selectedSpace,
        page_titles: selectedPages,
        query: query
      });

      setResponse(result.response);
      setResponseSource(result.source || '');
      // Add to history
      setHistory(prev => [{ query, response: result.response, responseSource: result.source || '' }, ...prev]);
      setCurrentHistoryIndex(0);
    } catch (err) {
      setError('Failed to generate AI response. Please try again.');
      console.error('Error generating response:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // When currentHistoryIndex changes, update displayed response/query/source
  useEffect(() => {
    if (currentHistoryIndex !== null && history[currentHistoryIndex]) {
      setResponse(history[currentHistoryIndex].response);
      setQuery(history[currentHistoryIndex].query);
      setResponseSource(history[currentHistoryIndex].responseSource);
    }
  }, [currentHistoryIndex]);

  const exportResponse = async (format: string) => {
    if (!response) return;

    try {
      const blob = await apiService.exportContent({
        content: response,
        format: format,
        filename: 'ai-search-response'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-search-response.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export file. Please try again.');
      console.error('Error exporting:', err);
    }
  };

  function cleanPreviewContent(html: string, numBlocks = 2): string {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      // Remove chatbot widget by class or id (adjust selector as needed)
      const chatbot = doc.querySelector('.YOUR_CHATBOT_CLASS, #YOUR_CHATBOT_ID');
      if (chatbot) chatbot.remove();

      // Get all paragraphs and divs (or adjust as needed)
      const blocks = Array.from(doc.body.querySelectorAll('p, div, section, ul, ol, pre, h1, h2, h3, h4, h5, h6'));
      if (blocks.length >= numBlocks) {
        return blocks.slice(-numBlocks).map(el => el.outerHTML).join('');
      }
      // Fallback: return all content
      return doc.body.innerHTML;
    } catch {
      return html;
    }
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-40 p-4">
      <div className="bg-white/80 backdrop-blur-xl border-2 border-[#0052cc] rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-confluence-blue/90 to-confluence-light-blue/90 backdrop-blur-xl p-6 text-white border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Search className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">{currentFeatureConfig.title}</h2>
                <p className="text-blue-100/90">{currentFeatureConfig.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => onModeSelect('agent')}
                className="text-blue-100 hover:text-white hover:bg-white/10 rounded-lg px-3 py-1 text-sm transition-colors"
              >
                Switch to Agent Mode
              </button>
              <button onClick={onClose} className="text-white hover:bg-white/10 rounded-full p-2 backdrop-blur-sm">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Feature Navigation */}
          <div className="mt-6 relative">
            <CustomScrollbar className="pb-2">
              <div className="flex gap-2">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  const isActive = feature.id === 'search';
                  
                  return (
                    <button
                      key={feature.id}
                      onClick={() => onFeatureSelect(feature.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-sm border transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                        isActive
                          ? 'bg-white/90 text-confluence-blue shadow-lg border-white/30'
                          : 'bg-white/10 text-white hover:bg-white/20 border-white/10'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{feature.label}</span>
                    </button>
                  );
                })}
              </div>
            </CustomScrollbar>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Search Configuration */}
            <div className="space-y-6 relative z-50" style={{ overflow: 'visible' }}>
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Search Configuration
                </h3>
                
                {/* Space Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Confluence Space
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSpace}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue appearance-none bg-white/70 backdrop-blur-sm"
                    >
                      <option value="">Choose a space...</option>
                      {spaces.map(space => (
                        <option key={space.key} value={space.key}>{space.name} ({space.key})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>

                {/* Page Selection - Aesthetic Multiselect */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Pages to Analyze ({selectedPages.length} selected)
                  </label>
                  <div className="relative z-50">
                    <button
                      type="button"
                      onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                      disabled={!selectedSpace}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <span className={selectedPages.length === 0 ? 'text-gray-500' : 'text-gray-700'}>
                        {selectedPages.length === 0
                          ? 'Choose pages...'
                          : selectedPages.length === 1
                            ? selectedPages[0]
                            : `${selectedPages.length} pages selected`
                        }
                      </span>
                      {isPageDropdownOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {/* Dropdown */}
                    {isPageDropdownOpen && selectedSpace && (
                      <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl max-h-60 overflow-hidden">
                        {/* Header with Select All/Clear All and Search */}
                        <div className="p-3 border-b border-white/20 bg-white/50">
                          <div className="flex justify-between items-center mb-2">
                            <button
                              onClick={selectAllPages}
                              className="text-sm text-confluence-blue hover:text-confluence-blue/80 font-medium"
                            >
                              Select All
                            </button>
                            <button
                              onClick={clearAllPages}
                              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                            >
                              Clear All
                            </button>
                          </div>
                          <input
                            type="text"
                            value={pageSearch}
                            onChange={e => setPageSearch(e.target.value)}
                            placeholder="Search pages..."
                            className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/80 placeholder-gray-400 mb-1"
                          />
                        </div>
                        {/* Page List */}
                        <div className="max-h-48 overflow-y-auto">
                          {(pages.filter(page => page.toLowerCase().includes(pageSearch.toLowerCase()))).length === 0 ? (
                            <div className="p-3 text-gray-500 text-sm text-center">
                              No pages found in this space
                            </div>
                          ) : (
                            pages.filter(page => page.toLowerCase().includes(pageSearch.toLowerCase())).map(page => (
                              <label
                                key={page}
                                className="flex items-center space-x-3 p-3 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0"
                              >
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={selectedPages.includes(page)}
                                    onChange={() => handlePageSelection(page)}
                                    className="sr-only"
                                  />
                                  <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                                    selectedPages.includes(page)
                                      ? 'bg-confluence-blue border-confluence-blue'
                                      : 'border-gray-300 hover:border-confluence-blue/50'
                                  }`}>
                                    {selectedPages.includes(page) && (
                                      <CheckCircle className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm text-gray-700 flex-1">{page}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
               {/* Removed duplicate Select All Pages checkbox below dropdown */}
                <div className="h-4" />
                {/* Query Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Question
                  </label>
                  <VoiceRecorder
                    value={query}
                    onChange={setQuery}
                    onConfirm={setQuery}
                    inputPlaceholder="What would you like to know about the selected content?"
                  />
                </div>

                {/* Search Button */}
                <button
                  onClick={handleSearch}
                  disabled={!selectedSpace || selectedPages.length === 0 || !query.trim() || isLoading}
                  className="w-full bg-confluence-blue/90 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-confluence-blue disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating AI Response...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Generate AI Response</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-6 z-40">
              {/* --- History Dropdown --- */}
              {history.length > 0 && (
                <div className="mb-2 flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">History:</label>
                  <select
                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                    value={currentHistoryIndex ?? 0}
                    onChange={e => setCurrentHistoryIndex(Number(e.target.value))}
                  >
                    {history.map((item, idx) => (
                      <option key={idx} value={idx}>
                        {item.query.length > 40 ? item.query.slice(0, 40) + '...' : item.query}
                      </option>
                    ))}
                  </select>
                  {currentHistoryIndex !== null && currentHistoryIndex !== 0 && (
                    <button
                      className="text-xs text-confluence-blue underline ml-2"
                      onClick={() => setCurrentHistoryIndex(0)}
                    >
                      Go to Latest
                    </button>
                  )}
                </div>
              )}
              {/* --- End History Dropdown --- */}
              {response && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg" ref={aiResponseRef}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">AI Response</h3>
                    {responseSource && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ml-2 
                        ${responseSource === 'llm' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                      >
                        {responseSource === 'llm' ? 'Source: LLM' : 'Source: Hybrid RAG'}
                      </span>
                    )}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowRawContent(!showRawContent)}
                        className="text-sm text-confluence-blue hover:underline"
                      >
                        {showRawContent ? 'Show Formatted' : 'Show Raw Content'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 max-h-80 overflow-y-auto">
                    {showRawContent ? (
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{response}</pre>
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        {response.split('\n').map((line, index) => {
                          if (line.startsWith('## ')) {
                            return <h2 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.substring(3)}</h2>;
                          } else if (line.startsWith('- **')) {
                            const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
                            if (match) {
                              return <p key={index} className="mb-2"><strong>{match[1]}:</strong> {match[2]}</p>;
                            }
                          } else if (line.startsWith('- ')) {
                            return <p key={index} className="mb-1 ml-4">• {line.substring(2)}</p>;
                          } else if (line.trim()) {
                            return <p key={index} className="mb-2 text-gray-700">{line}</p>;
                          }
                          return <br key={index} />;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Export Options */}
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">What format would you like to export in?</label>
                      <div className="relative w-48">
                        <button
                          type="button"
                          onClick={() => setIsExportFormatDropdownOpen(!isExportFormatDropdownOpen)}
                          className="px-3 py-1 border border-white/30 rounded text-sm focus:ring-2 focus:ring-confluence-blue bg-white/70 backdrop-blur-sm w-full flex items-center justify-between"
                        >
                          <span>{exportFormats.find(f => f.value === exportFormat)?.label || 'Select format'}</span>
                          {isExportFormatDropdownOpen ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                        {isExportFormatDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl max-h-48 overflow-hidden">
                            <div className="p-2 border-b border-white/20 bg-white/50">
                              <input
                                type="text"
                                value={exportFormatSearch}
                                onChange={e => setExportFormatSearch(e.target.value)}
                                placeholder="Search formats..."
                                className="w-full px-2 py-1 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/80 placeholder-gray-400 mb-1"
                              />
                            </div>
                            <div className="max-h-32 overflow-y-auto">
                              {exportFormats.filter(f => f.label.toLowerCase().includes(exportFormatSearch.toLowerCase())).length === 0 ? (
                                <div className="p-2 text-gray-500 text-sm text-center">No formats found</div>
                              ) : (
                                exportFormats.filter(f => f.label.toLowerCase().includes(exportFormatSearch.toLowerCase())).map(f => (
                                  <button
                                    key={f.value}
                                    type="button"
                                    onClick={() => { setExportFormat(f.value); setIsExportFormatDropdownOpen(false); setExportFormatSearch(''); }}
                                    className={`w-full text-left flex items-center space-x-2 p-2 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0 ${exportFormat === f.value ? 'bg-confluence-blue/10' : ''}`}
                                  >
                                    <span className="text-sm text-gray-700 flex-1">{f.label}</span>
                                    {exportFormat === f.value && <Check className="w-4 h-4 text-confluence-blue" />}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <label htmlFor="save-mode" className="text-sm font-medium text-gray-700">Save Mode:</label>
                      <select
                        id="save-mode"
                        value={saveMode}
                        onChange={e => setSaveMode(e.target.value)}
                        className="px-3 py-1 border border-white/30 rounded text-sm focus:ring-2 focus:ring-confluence-blue bg-white/70 backdrop-blur-sm"
                      >
                        <option value="append">Append</option>
                        <option value="overwrite">Overwrite</option>
                        <option value="new">New Page</option>
                      </select>
                    </div>

                    {showNewPageInput && (
                      <div className="flex items-center space-x-2 mb-2">
                        <label htmlFor="new-page-title" className="text-sm font-medium text-gray-700">New Page Title:</label>
                        <input
                          id="new-page-title"
                          type="text"
                          value={newPageTitle}
                          onChange={e => setNewPageTitle(e.target.value)}
                          placeholder="Enter new page title..."
                          className="px-3 py-1 border border-white/30 rounded text-sm focus:ring-2 focus:ring-confluence-blue bg-white/70 backdrop-blur-sm flex-1"
                        />
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => exportResponse(exportFormat)}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600/90 backdrop-blur-sm text-white rounded-lg hover:bg-green-700 transition-colors border border-white/10"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                      <button
                        onClick={async () => {
                          setIsPreviewLoading(true);
                          setShowPreview(false);
                          try {
                            const { space, page } = getConfluenceSpaceAndPageFromUrl();
                            if (!space || !page) {
                              alert('Confluence space or page not specified in macro src URL.');
                              return;
                            }
                            const preview = await apiService.previewSaveToConfluence({
                              space_key: space,
                              page_title: page,
                              content: response || '',
                              mode: saveMode,
                            });
                            setPreviewContent(preview.preview_content);
                            setPreviewDiff(preview.diff);
                            setShowPreview(true);
                          } catch (err: any) {
                            alert('Failed to generate preview: ' + (err.message || err));
                          } finally {
                            setIsPreviewLoading(false);
                          }
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors border border-white/10"
                      >
                        {isPreviewLoading ? "Loading..." : "Preview"}
                      </button>
                      <button
                        onClick={async () => {
                          if (saveMode === 'new') {
                            if (!newPageTitle.trim()) {
                              alert('Please enter a page title for the new page.');
                              return;
                            }
                            const { space } = getConfluenceSpaceAndPageFromUrl();
                            console.log('URL params:', { space, autoSpaceKey, isSpaceAutoConnected });
                            if (!space && !autoSpaceKey) {
                              alert('Confluence space not specified in macro src URL.');
                              return;
                            }
                            const finalSpace = space || autoSpaceKey;
                            if (!finalSpace) {
                              alert('Confluence space not available.');
                              return;
                            }
                            try {
                              console.log('Saving new page:', {
                                space_key: finalSpace,
                                page_title: newPageTitle.trim(),
                                mode: 'new'
                              });
                              await apiService.saveToConfluence({
                                space_key: finalSpace,
                                page_title: newPageTitle.trim(),
                                content: response || '',
                                mode: 'new',
                              });
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                              setNewPageTitle('');
                              setSaveMode('append');
                            } catch (err: any) {
                              alert('Failed to save to Confluence: ' + (err.message || err));
                            }
                          } else {
                            const { space, page } = getConfluenceSpaceAndPageFromUrl();
                            if (!space || !page) {
                              alert('Confluence space or page not specified in macro src URL.');
                              return;
                            }
                            try {
                              await apiService.saveToConfluence({
                                space_key: space,
                                page_title: page,
                                content: response || '',
                                mode: saveMode,
                              });
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            } catch (err: any) {
                              alert('Failed to save to Confluence: ' + (err.message || err));
                            }
                          }
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-confluence-blue/90 backdrop-blur-sm text-white rounded-lg hover:bg-confluence-blue transition-colors border border-white/10"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save to Confluence</span>
                      </button>
                      <button
                        onClick={async () => {
                          if (!response) return;
                          setIsGoogleChatLoading(true);
                          try {
                            await apiService.sendToGoogleChat(response);
                          } catch (err: any) {
                            // Optionally handle error
                          } finally {
                            setIsGoogleChatLoading(false);
                          }
                        }}
                        className="flex items-center justify-center space-x-2 px-3 py-2 bg-[#25A667]/90 backdrop-blur-sm text-white rounded-lg hover:bg-[#0B8043] transition-colors border border-white/10 text-sm"
                        style={{ minHeight: 44, minWidth: 140 }}
                        disabled={!response || isGoogleChatLoading}
                      >
                        {isGoogleChatLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                        ) : (
                          <>
                            {/* Standard chat bubble icon */}
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-3 3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#25A667"/>
                            </svg>
                            <span>Share to Google Chat</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!response && !isLoading && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-8 text-center border border-white/20 shadow-lg">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to Search</h3>
                  <p className="text-gray-500">Configure your search parameters and click "Generate AI Response" to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showToast && (
        <div style={{position: 'fixed', bottom: 40, left: '50%', transform: 'translateX(-50%)', background: '#2684ff', color: 'white', padding: '16px 32px', borderRadius: 8, zIndex: 9999, fontWeight: 600, fontSize: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.15)'}}>
          Saved to Confluence! Please refresh this Confluence page to see your changes.
        </div>
      )}
      {showPreview && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
          <div className="bg-confluence-blue/95 rounded-2xl shadow-2xl p-6 w-full max-w-3xl relative border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-white text-lg">Preview of Updated Content</h4>
              <button onClick={() => setShowPreview(false)} className="text-white hover:text-red-400 font-bold text-base px-3 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-red-400">Close Preview</button>
            </div>
            <div
              className="overflow-y-auto bg-white/90 rounded-xl p-6 border border-white/30 shadow-inner min-h-[120px] max-h-[400px] text-gray-900 text-base font-normal"
              style={{
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap',
                marginBottom: 0,
              }}
              dangerouslySetInnerHTML={{ __html: previewContent || '' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPoweredSearch;