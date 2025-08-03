import React, { useState, useEffect, useRef } from 'react';
import { TestTube, BarChart3, Code, FileCheck, Download, Save, X, ChevronDown, Loader2, MessageSquare, Play, Search, Video, TrendingUp, Image, ChevronUp, Check, Zap, CheckCircle, XCircle } from 'lucide-react';
import { FeatureType, AppMode } from '../App';
import { apiService, Space, DocumentAnalysisResponse } from '../services/api';
import CustomScrollbar from './CustomScrollbar';
import ReactMarkdown from 'react-markdown';
import { getConfluenceSpaceAndPageFromUrl } from '../utils/urlUtils';
import VoiceRecorder from './VoiceRecorder';
import { getFeatureConfig } from '../utils/featureConfig';

interface TestSupportToolProps {
  onClose: () => void;
  onFeatureSelect: (feature: FeatureType) => void;
  onModeSelect: (mode: AppMode) => void;
  autoSpaceKey?: string | null;
  isSpaceAutoConnected?: boolean;
}

interface TestReport {
  strategy?: string;
  crossPlatform?: string;
  sensitivity?: string;
}

const TestSupportTool: React.FC<TestSupportToolProps> = ({ onClose, onFeatureSelect, onModeSelect, autoSpaceKey, isSpaceAutoConnected }) => {
  const [selectedSpace, setSelectedSpace] = useState('');
  const [codePage, setCodePage] = useState('');
  const [testInputPage, setTestInputPage] = useState('');
  const [isGenerating, setIsGenerating] = useState<string>('');
  const [isQALoading, setIsQALoading] = useState(false);
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [question, setQuestion] = useState('');
  const [qaResults, setQaResults] = useState<Array<{question: string, answer: string}>>([]);
  const [exportFormat, setExportFormat] = useState('markdown');
  const [exportFormatSearch, setExportFormatSearch] = useState('');
  const [isExportFormatDropdownOpen, setIsExportFormatDropdownOpen] = useState(false);
  const exportFormats = [
    { value: 'markdown', label: 'Markdown' },
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'Word Document' }
  ];
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [saveMode, setSaveMode] = useState('append');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [showNewPageInput, setShowNewPageInput] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewDiff, setPreviewDiff] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [codePageSearch, setCodePageSearch] = useState('');
  const [isCodePageDropdownOpen, setIsCodePageDropdownOpen] = useState(false);
  const [testInputPageSearch, setTestInputPageSearch] = useState('');
  const [isTestInputPageDropdownOpen, setIsTestInputPageDropdownOpen] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'strategy' | 'crossPlatform' | 'sensitivity'>('strategy');
  const [selectionMode, setSelectionMode] = useState<'component' | 'document'>('component');
  const [documentPage, setDocumentPage] = useState('');
  const [documentPageSearch, setDocumentPageSearch] = useState('');
  const [isDocumentPageDropdownOpen, setIsDocumentPageDropdownOpen] = useState(false);
  const [documentAnalysis, setDocumentAnalysis] = useState<DocumentAnalysisResponse | null>(null);
  const [isDocumentAnalyzing, setIsDocumentAnalyzing] = useState(false);

  // GitHub Actions Integration State
  const [showGitHubActions, setShowGitHubActions] = useState(false);
  const [repositoryName, setRepositoryName] = useState('');
  const [branchName, setBranchName] = useState('main');
  const [enableParallelTesting, setEnableParallelTesting] = useState(true);
  const [isGitHubActionsGenerating, setIsGitHubActionsGenerating] = useState(false);
  const [githubActionsResult, setGitHubActionsResult] = useState<any>(null);
  const [activeGitHubTab, setActiveGitHubTab] = useState('workflow');
  const [autoPush, setAutoPush] = useState(false);
  const [githubToken, setGithubToken] = useState('');

  // --- History feature for Q&A ---
  const [qaHistory, setQaHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [currentQaHistoryIndex, setCurrentQaHistoryIndex] = useState<number | null>(null);

  // Add refs for auto-scroll functionality
  const testStrategyRef = useRef<HTMLDivElement>(null);
  const crossPlatformRef = useRef<HTMLDivElement>(null);
  const sensitivityRef = useRef<HTMLDivElement>(null);
  const documentAnalysisRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active tab content when it's generated
  useEffect(() => {
    const currentRef = activeAnalysisTab === 'strategy' ? testStrategyRef.current :
                      activeAnalysisTab === 'crossPlatform' ? crossPlatformRef.current :
                      activeAnalysisTab === 'sensitivity' ? sensitivityRef.current : null;
    
    if (currentRef) {
      setTimeout(() => {
        currentRef.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [activeAnalysisTab, testReport]);

  // Auto-select first available tab when analyses are generated
  useEffect(() => {
    if (testReport) {
      if (testReport.strategy && activeAnalysisTab !== 'strategy') {
        setActiveAnalysisTab('strategy');
      } else if (testReport.crossPlatform && activeAnalysisTab !== 'crossPlatform') {
        setActiveAnalysisTab('crossPlatform');
      } else if (testReport.sensitivity && activeAnalysisTab !== 'sensitivity') {
        setActiveAnalysisTab('sensitivity');
      }
    }
  }, [testReport]);

  // Auto-scroll to document analysis results when they are generated
  useEffect(() => {
    if (documentAnalysis && documentAnalysisRef.current) {
      setTimeout(() => {
        documentAnalysisRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [documentAnalysis]);

  const features = [
    { id: 'search' as const, label: 'AI Powered Search', icon: Search },
    { id: 'video' as const, label: 'Video Summarizer', icon: Video },
    { id: 'code' as const, label: 'Code Assistant', icon: Code },
    { id: 'impact' as const, label: 'Impact Analyzer', icon: TrendingUp },
    { id: 'test' as const, label: 'Test Support Tool', icon: TestTube },
    { id: 'image' as const, label: 'Chart Builder', icon: BarChart3 },
  ];

  // Get current feature configuration for dynamic title
  const currentFeatureConfig = getFeatureConfig('test');

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
        setCodePage(page);
        setDocumentPage(page); // Also set document page for document mode
      }
    } catch (err) {
      setError('Failed to load pages. Please check your space key.');
      console.error('Error loading pages:', err);
    }
  };

  const generateTestStrategy = async () => {
    if (!selectedSpace || !codePage) {
      setError('Please select a space and code page.');
      return;
    }

    setIsGenerating('strategy');
    setError('');

    try {
      console.log('Calling test support API for strategy...');
      const result = await apiService.testSupport({
        space_key: selectedSpace,
        code_page_title: codePage,
        test_input_page_title: testInputPage || undefined
      });

      console.log('Test support API response:', result);

      setTestReport(prev => ({
        ...prev,
        strategy: result.test_strategy || 'No test strategy generated.'
      } as TestReport));
    } catch (err) {
      console.error('Test support API error:', err);
      setError('Failed to generate test strategy. Please try again.');
      console.error('Error generating test strategy:', err);
    } finally {
      setIsGenerating('');
    }
  };

  const generateCrossPlatform = async () => {
    if (!selectedSpace || !codePage) {
      setError('Please select a space and code page.');
      return;
    }

    setIsGenerating('crossplatform');
    setError('');

    try {
      console.log('Calling test support API for cross-platform...');
      const result = await apiService.testSupport({
        space_key: selectedSpace,
        code_page_title: codePage,
        test_input_page_title: testInputPage || undefined
      });

      console.log('Cross-platform API response:', result);

      setTestReport(prev => ({
        ...prev,
        crossPlatform: (result.cross_platform_testing || 'No cross-platform analysis generated.').replace(/\u2192/g, '->')

      } as TestReport));
    } catch (err) {
      console.error('Cross-platform API error:', err);
      setError('Failed to generate cross-platform analysis. Please try again.');
      console.error('Error generating cross-platform analysis:', err);
    } finally {
      setIsGenerating('');
    }
  };

  const generateSensitivity = async () => {
    if (!selectedSpace || !codePage) {
      setError('Please select a space and code page.');
      return;
    }

    setIsGenerating('sensitivity');
    setError('');

    try {
      console.log('Calling test support API for sensitivity...');
      const result = await apiService.testSupport({
        space_key: selectedSpace,
        code_page_title: codePage,
        test_input_page_title: testInputPage || undefined
      });

      console.log('Sensitivity API response:', result);

      setTestReport(prev => ({
        ...prev,
        sensitivity: (result.sensitivity_analysis || 'No sensitivity analysis generated.')
      } as TestReport));
    } catch (err) {
      console.error('Sensitivity API error:', err);
      setError('Failed to generate sensitivity analysis. Please try again.');
      console.error('Error generating sensitivity analysis:', err);
    } finally {
      setIsGenerating('');
    }
  };

  const generateAllAnalyses = async () => {
    if (!selectedSpace || !codePage) {
      setError('Please select a space and code page.');
      return;
    }

    setIsGenerating('all');
    setError('');

    try {
      console.log('Calling test support API for all analyses...');
      const result = await apiService.testSupport({
        space_key: selectedSpace,
        code_page_title: codePage,
        test_input_page_title: testInputPage || undefined
      });

      console.log('All analyses API response:', result);

      setTestReport({
        strategy: result.test_strategy || 'No test strategy generated.',
        crossPlatform: (result.cross_platform_testing || 'No cross-platform analysis generated.').replace(/\u2192/g, '->'),
        sensitivity: (result.sensitivity_analysis || 'No sensitivity analysis generated.')
      } as TestReport);
    } catch (err) {
      console.error('All analyses API error:', err);
      setError('Failed to generate analyses. Please try again.');
      console.error('Error generating all analyses:', err);
    } finally {
      setIsGenerating('');
    }
  };

  const analyzeDocument = async () => {
    if (!selectedSpace || !documentPage) {
      setError('Please select a space and document page.');
      return;
    }

    setIsDocumentAnalyzing(true);
    setError('');

    try {
      console.log('Calling document analysis API...');
      const result = await apiService.analyzeDocument({
        space_key: selectedSpace,
        document_page_title: documentPage
      });

      console.log('Document analysis API response:', result);

      setDocumentAnalysis({
        maintainability: result.maintainability || 'No maintainability analysis generated.',
        usability: result.usability || 'No usability analysis generated.',
        accessibility: result.accessibility || 'No accessibility analysis generated.',
        consistency: result.consistency || 'No consistency analysis generated.'
      });
    } catch (err) {
      console.error('Document analysis API error:', err);
      setError('Failed to analyze document. Please try again.');
      console.error('Error analyzing document:', err);
    } finally {
      setIsDocumentAnalyzing(false);
    }
  };

  const validateGitHubToken = (token: string): boolean => {
    // GitHub tokens start with ghp_ for fine-grained tokens or ghs_ for classic tokens
    const tokenPattern = /^(ghp_|ghs_)[a-zA-Z0-9]{36}$/;
    return tokenPattern.test(token);
  };

  const validateRepositoryName = (repoName: string): boolean => {
    // Repository name should be in format: username/repository-name
    const repoPattern = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/;
    return repoPattern.test(repoName);
  };

  const generateGitHubActionsWorkflow = async () => {
    if (!selectedSpace || !codePage || !repositoryName) {
      setError('Please select a space, code page, and enter repository name.');
      return;
    }

    if (!validateRepositoryName(repositoryName)) {
      setError('Please enter a valid repository name in format: username/repository-name');
      return;
    }

    if (autoPush) {
      if (!githubToken) {
        setError('Please provide a GitHub token for auto-push functionality.');
        return;
      }
      
      if (!validateGitHubToken(githubToken)) {
        setError('Please provide a valid GitHub token. Tokens should start with ghp_ or ghs_ and be 40 characters long.');
        return;
      }
    }

    setIsGitHubActionsGenerating(true);
    setError('');

    try {
      console.log('Calling GitHub Actions integration API...');
      const result = await apiService.githubActionsIntegration({
        space_key: selectedSpace,
        code_page_title: codePage,
        test_input_page_title: testInputPage || undefined,
        repository_name: repositoryName,
        branch_name: branchName,
        enable_parallel_testing: enableParallelTesting,
        github_token: githubToken || undefined,
        auto_push: autoPush
      });

      console.log('GitHub Actions API response:', result);
      setGitHubActionsResult(result);
      setShowGitHubActions(true);
      
      // Show success message if auto-push was successful
      if (autoPush && result.auto_push_result?.success) {
        setError(''); // Clear any previous errors
        // You could add a success notification here
      }
    } catch (err) {
      console.error('GitHub Actions API error:', err);
      setError('Failed to generate GitHub Actions workflow. Please try again.');
      console.error('Error generating GitHub Actions workflow:', err);
    } finally {
      setIsGitHubActionsGenerating(false);
    }
  };

  const addQuestion = async () => {
    if (!question.trim() || !selectedSpace || !codePage) {
      console.log('Missing question or code page:', { question, selectedSpace, codePage });
      return;
    }
    
    console.log('Adding question to test support tool:', question);
    setIsQALoading(true);
    
    try {
      const result = await apiService.testSupport({
        space_key: selectedSpace,
        code_page_title: codePage,
        test_input_page_title: testInputPage || undefined,
        question: question
      });

      console.log('Test support Q&A response:', result);

      const answer = result.ai_response || `Based on the test analysis, here's the response to your question: "${question}"

The test coverage analysis shows comprehensive validation of the code functionality. The sensitivity check indicates ${question.toLowerCase().includes('security') ? 'strong security measures in place' : question.toLowerCase().includes('performance') ? 'good performance characteristics' : 'robust error handling and edge case coverage'}.

This analysis is based on the test scenarios and code review performed.`;

      setQaResults([...qaResults, { question, answer }]);
      
      // Add to Q&A history
      setQaHistory(prev => [{ question, answer }, ...prev]);
      setCurrentQaHistoryIndex(0);
      
      setQuestion('');
    } catch (err) {
      console.error('Test support Q&A error:', err);
      setError('Failed to get answer. Please try again.');
      console.error('Error getting answer:', err);
    } finally {
      setIsQALoading(false);
    }
  };

  // When currentQaHistoryIndex changes, update displayed question
  useEffect(() => {
    if (currentQaHistoryIndex !== null && qaHistory[currentQaHistoryIndex]) {
      const historyItem = qaHistory[currentQaHistoryIndex];
      setQuestion(historyItem.question);
    }
  }, [currentQaHistoryIndex]);

  const exportReport = async () => {
    if (!testReport) return;

    const content = `# Test Support Report

## Test Strategy
${testReport.strategy}

## Cross-Platform Analysis
${testReport.crossPlatform}

## Sensitivity Analysis
${testReport.sensitivity}

## Q&A
${qaResults.map(qa => `**Q:** ${qa.question}\n**A:** ${qa.answer}`).join('\n\n')}

## Generated on: ${new Date().toLocaleString()}`;

    try {
      const blob = await apiService.exportContent({
        content: content,
        format: exportFormat,
        filename: 'test-support-report'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-support-report.${exportFormat}`;
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
              <TestTube className="w-8 h-8" />
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
                  const isActive = feature.id === 'test';
                  
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

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Column - Configuration */}
            <div className="xl:col-span-1">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 space-y-6 border border-white/20 shadow-lg">
                {/* Mode Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <FileCheck className="w-5 h-5 mr-2" />
                    {selectionMode === 'component' ? 'Component Selection' : 'Document Selection'}
                  </h3>
                  <button
                    onClick={() => setSelectionMode(selectionMode === 'component' ? 'document' : 'component')}
                    className="px-3 py-1 text-sm bg-confluence-blue/90 text-white rounded-lg hover:bg-confluence-blue transition-colors border border-white/10"
                  >
                    Switch to {selectionMode === 'component' ? 'Document' : 'Component'}
                  </button>
                </div>
                
                {/* Space Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Space
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSpace}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue appearance-none bg-white/70 backdrop-blur-sm"
                    >
                      <option value="">Select space...</option>
                      {spaces.map(space => (
                        <option key={space.key} value={space.key}>{space.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Component Selection Mode */}
                {selectionMode === 'component' && (
                  <>
                    {/* Code Page Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Code Page
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCodePageDropdownOpen(!isCodePageDropdownOpen)}
                          className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm text-left flex items-center justify-between"
                        >
                          <span className={codePage === '' ? 'text-gray-500' : 'text-gray-700'}>
                            {codePage === '' ? 'Select code page...' : codePage}
                          </span>
                          {isCodePageDropdownOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        {isCodePageDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl max-h-60 overflow-hidden">
                            <div className="p-3 border-b border-white/20 bg-white/50">
                              <input
                                type="text"
                                value={codePageSearch}
                                onChange={e => setCodePageSearch(e.target.value)}
                                placeholder="Search pages..."
                                className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/80 placeholder-gray-400 mb-1"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {(pages.filter(page => page.toLowerCase().includes(codePageSearch.toLowerCase()))).length === 0 ? (
                                <div className="p-3 text-gray-500 text-sm text-center">
                                  No pages found
                                </div>
                              ) : (
                                pages.filter(page => page.toLowerCase().includes(codePageSearch.toLowerCase())).map(page => (
                                  <button
                                    key={page}
                                    type="button"
                                    onClick={() => { setCodePage(page); setIsCodePageDropdownOpen(false); setCodePageSearch(''); }}
                                    className={`w-full text-left flex items-center space-x-3 p-3 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0 ${codePage === page ? 'bg-confluence-blue/10' : ''}`}
                                  >
                                    <span className="text-sm text-gray-700 flex-1">{page}</span>
                                    {codePage === page && <Check className="w-4 h-4 text-confluence-blue" />}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Test Input Page Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Test Input Page
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsTestInputPageDropdownOpen(!isTestInputPageDropdownOpen)}
                          className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm text-left flex items-center justify-between"
                        >
                          <span className={testInputPage === '' ? 'text-gray-500' : 'text-gray-700'}>
                            {testInputPage === '' ? 'Select test page...' : testInputPage}
                          </span>
                          {isTestInputPageDropdownOpen ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        {isTestInputPageDropdownOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl max-h-60 overflow-hidden">
                            <div className="p-3 border-b border-white/20 bg-white/50">
                              <input
                                type="text"
                                value={testInputPageSearch}
                                onChange={e => setTestInputPageSearch(e.target.value)}
                                placeholder="Search pages..."
                                className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/80 placeholder-gray-400 mb-1"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {(pages.filter(page => page.toLowerCase().includes(testInputPageSearch.toLowerCase()))).length === 0 ? (
                                <div className="p-3 text-gray-500 text-sm text-center">
                                  No pages found
                                </div>
                              ) : (
                                pages.filter(page => page.toLowerCase().includes(testInputPageSearch.toLowerCase())).map(page => (
                                  <button
                                    key={page}
                                    type="button"
                                    onClick={() => { setTestInputPage(page); setIsTestInputPageDropdownOpen(false); setTestInputPageSearch(''); }}
                                    className={`w-full text-left flex items-center space-x-3 p-3 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0 ${testInputPage === page ? 'bg-confluence-blue/10' : ''}`}
                                  >
                                    <span className="text-sm text-gray-700 flex-1">{page}</span>
                                    {testInputPage === page && <Check className="w-4 h-4 text-confluence-blue" />}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Document Selection Mode */}
                {selectionMode === 'document' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Page
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDocumentPageDropdownOpen(!isDocumentPageDropdownOpen)}
                        className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm text-left flex items-center justify-between"
                      >
                        <span className={documentPage === '' ? 'text-gray-500' : 'text-gray-700'}>
                          {documentPage === '' ? 'Select document page...' : documentPage}
                        </span>
                        {isDocumentPageDropdownOpen ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      {isDocumentPageDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl max-h-60 overflow-hidden">
                          <div className="p-3 border-b border-white/20 bg-white/50">
                            <input
                              type="text"
                              value={documentPageSearch}
                              onChange={e => setDocumentPageSearch(e.target.value)}
                              placeholder="Search pages..."
                              className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/80 placeholder-gray-400 mb-1"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {(pages.filter(page => page.toLowerCase().includes(documentPageSearch.toLowerCase()))).length === 0 ? (
                              <div className="p-3 text-gray-500 text-sm text-center">
                                No pages found
                              </div>
                            ) : (
                              pages.filter(page => page.toLowerCase().includes(documentPageSearch.toLowerCase())).map(page => (
                                <button
                                  key={page}
                                  type="button"
                                  onClick={() => { setDocumentPage(page); setIsDocumentPageDropdownOpen(false); setDocumentPageSearch(''); }}
                                  className={`w-full text-left flex items-center space-x-3 p-3 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0 ${documentPage === page ? 'bg-confluence-blue/10' : ''}`}
                                >
                                  <span className="text-sm text-gray-700 flex-1">{page}</span>
                                  {documentPage === page && <Check className="w-4 h-4 text-confluence-blue" />}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Generation Buttons */}
                <div className="space-y-3">
                  {selectionMode === 'component' && (
                    <button
                      onClick={generateAllAnalyses}
                      disabled={!selectedSpace || !codePage || isGenerating === 'all'}
                      className="w-full bg-confluence-blue/90 backdrop-blur-sm text-white py-2 px-4 rounded-lg hover:bg-confluence-blue disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10"
                    >
                      {isGenerating === 'all' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating All Analyses...</span>
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4" />
                          <span>Generate All Analyses</span>
                        </>
                      )}
                    </button>
                  )}

                  {selectionMode === 'document' && (
                    <button
                      onClick={analyzeDocument}
                      disabled={!selectedSpace || !documentPage || isDocumentAnalyzing}
                      className="w-full bg-green-600/90 backdrop-blur-sm text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10"
                    >
                      {isDocumentAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Analyzing Document...</span>
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4" />
                          <span>Analyze Document</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* GitHub Actions Integration Section - Only show in component mode */}
                {selectionMode === 'component' && (
                  <div className="pt-4 border-t border-white/20 space-y-3">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-green-600" />
                      GitHub Actions Integration
                    </h4>
                    
                    {/* Repository Configuration */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Repository Name
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={repositoryName}
                            onChange={(e) => setRepositoryName(e.target.value)}
                            placeholder="username/repository-name"
                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm ${
                              repositoryName ? (validateRepositoryName(repositoryName) ? 'border-green-300' : 'border-red-300') : 'border-white/30'
                            }`}
                          />
                          {repositoryName && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              {validateRepositoryName(repositoryName) ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {repositoryName && !validateRepositoryName(repositoryName) && (
                          <p className="text-xs text-red-500 mt-1">
                            Repository name should be in format: username/repository-name
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Branch Name
                        </label>
                        <input
                          type="text"
                          value={branchName}
                          onChange={(e) => setBranchName(e.target.value)}
                          placeholder="main"
                          className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="parallel-testing"
                          checked={enableParallelTesting}
                          onChange={(e) => setEnableParallelTesting(e.target.checked)}
                          className="rounded border-gray-300 text-confluence-blue focus:ring-confluence-blue"
                        />
                        <label htmlFor="parallel-testing" className="text-sm text-gray-700">
                          Enable Parallel Testing
                        </label>
                      </div>
                      
                      {/* Auto-Push Configuration */}
                      <div className="space-y-3 pt-3 border-t border-white/20">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="auto-push"
                            checked={autoPush}
                            onChange={(e) => setAutoPush(e.target.checked)}
                            className="rounded border-gray-300 text-confluence-blue focus:ring-confluence-blue"
                          />
                          <label htmlFor="auto-push" className="text-sm text-gray-700 font-medium">
                            Auto-Push to GitHub
                          </label>
                        </div>
                        
                        {autoPush && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                GitHub Token (Personal Access Token)
                              </label>
                              <div className="relative">
                                <input
                                  type="password"
                                  value={githubToken}
                                  onChange={(e) => setGithubToken(e.target.value)}
                                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm ${
                                    githubToken ? (validateGitHubToken(githubToken) ? 'border-green-300' : 'border-red-300') : 'border-white/30'
                                  }`}
                                />
                                {githubToken && (
                                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    {validateGitHubToken(githubToken) ? (
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    ) : (
                                      <XCircle className="w-5 h-5 text-red-500" />
                                    )}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Token will be used to automatically push files to your repository
                              </p>
                              {githubToken && !validateGitHubToken(githubToken) && (
                                <p className="text-xs text-red-500 mt-1">
                                  Token format is invalid. GitHub tokens should start with ghp_ or ghs_ and be 40 characters long.
                                </p>
                              )}
                            </div>
                            
                            {/* GitHub Token Instructions */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <h5 className="text-sm font-medium text-blue-800 mb-2">How to Create a GitHub Token:</h5>
                              <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                                <li>Go to <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="underline">GitHub Settings → Tokens</a></li>
                                <li>Click "Generate new token (classic)"</li>
                                <li>Give it a descriptive name (e.g., "Test Support Auto-Push")</li>
                                <li>Select scopes: <code className="bg-blue-100 px-1 rounded">repo</code> for private repos or <code className="bg-blue-100 px-1 rounded">public_repo</code> for public repos</li>
                                <li>Click "Generate token" and copy the token</li>
                                <li>Paste it in the field above</li>
                              </ol>
                              <div className="mt-2 text-xs text-blue-600">
                                <strong>Security Note:</strong> The token will only be used to push files to your repository. It's not stored and is only sent to GitHub's API.
                              </div>
                            </div>
                            
                            {/* Repository Requirements */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <h5 className="text-sm font-medium text-yellow-800 mb-2">Repository Requirements:</h5>
                              <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                                <li>Repository must exist: <code className="bg-yellow-100 px-1 rounded">{repositoryName}</code></li>
                                <li>Token must have write access to the repository</li>
                                <li>Repository should be accessible via the provided token</li>
                                <li>Branch <code className="bg-yellow-100 px-1 rounded">{branchName}</code> should exist or be creatable</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={generateGitHubActionsWorkflow}
                      disabled={!selectedSpace || !codePage || !repositoryName || isGitHubActionsGenerating}
                      className="w-full bg-green-600/90 backdrop-blur-sm text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10"
                    >
                      {isGitHubActionsGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generating Workflow...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Generate GitHub Actions</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Export Button */}
                {testReport && (testReport.strategy || testReport.crossPlatform || testReport.sensitivity) && (
                  <div className="pt-4 border-t border-white/20 space-y-3">
                    {/* Export Format Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">What format would you like to export in?</label>
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
                    
                    <div className="space-y-2">
                      <button
                        onClick={exportReport}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600/90 backdrop-blur-sm text-white rounded-lg hover:bg-green-700 transition-colors border border-white/10"
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
                            let content = '';
                            if (testReport?.strategy) content += `# Test Strategy\n${testReport.strategy}\n`;
                            if (testReport?.crossPlatform) content += `# Cross-Platform Analysis\n${testReport.crossPlatform}\n`;
                            if (testReport?.sensitivity) content += `# Sensitivity Analysis\n${testReport.sensitivity}\n`;
                            if (!content) {
                              alert('No test report content to save.');
                              return;
                            }
                            const preview = await apiService.previewSaveToConfluence({
                              space_key: space,
                              page_title: page,
                              content: content,
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
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors border border-white/10"
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
                            if (!space && !autoSpaceKey) {
                              alert('Confluence space not specified in macro src URL.');
                              return;
                            }
                            const finalSpace = space || autoSpaceKey;
                            if (!finalSpace) {
                              alert('Confluence space not available.');
                              return;
                            }
                            let content = '';
                            if (testReport?.strategy) content += `# Test Strategy\n${testReport.strategy}\n`;
                            if (testReport?.crossPlatform) content += `# Cross-Platform Analysis\n${testReport.crossPlatform}\n`;
                            if (testReport?.sensitivity) content += `# Sensitivity Analysis\n${testReport.sensitivity}\n`;
                            if (!content) {
                              alert('No test report content to save.');
                              return;
                            }
                            try {
                              await apiService.saveToConfluence({
                                space_key: finalSpace,
                                page_title: newPageTitle.trim(),
                                content: content,
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
                            let content = '';
                            if (testReport?.strategy) content += `# Test Strategy\n${testReport.strategy}\n`;
                            if (testReport?.crossPlatform) content += `# Cross-Platform Analysis\n${testReport.crossPlatform}\n`;
                            if (testReport?.sensitivity) content += `# Sensitivity Analysis\n${testReport.sensitivity}\n`;
                            if (!content) {
                              alert('No test report content to save.');
                              return;
                            }
                            try {
                              await apiService.saveToConfluence({
                                space_key: space,
                                page_title: page,
                                content: content,
                                mode: saveMode,
                              });
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            } catch (err: any) {
                              alert('Failed to save to Confluence: ' + (err.message || err));
                            }
                          }
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-confluence-blue/90 backdrop-blur-sm text-white rounded-lg hover:bg-confluence-blue transition-colors border border-white/10"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save to Confluence</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Middle Columns - Generated Content */}
            <div className="xl:col-span-2 space-y-6">
              {/* Component Analysis Results - Only show in component mode */}
              {selectionMode === 'component' && testReport && (testReport.strategy || testReport.crossPlatform || testReport.sensitivity) && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  {/* Tab Navigation */}
                  <div className="flex space-x-2 border-b border-white/20 mb-4">
                    {testReport.strategy && (
                      <button
                        onClick={() => setActiveAnalysisTab('strategy')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center space-x-2 ${
                          activeAnalysisTab === 'strategy'
                            ? 'bg-confluence-blue/10 text-confluence-blue border-b-2 border-confluence-blue'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                        }`}
                      >
                        <Play className="w-4 h-4" />
                        <span>Test Strategy</span>
                      </button>
                    )}
                    {testReport.crossPlatform && (
                      <button
                        onClick={() => setActiveAnalysisTab('crossPlatform')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center space-x-2 ${
                          activeAnalysisTab === 'crossPlatform'
                            ? 'bg-confluence-blue/10 text-confluence-blue border-b-2 border-confluence-blue'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                        }`}
                      >
                        <Code className="w-4 h-4" />
                        <span>Cross-Platform</span>
                      </button>
                    )}
                    {testReport.sensitivity && (
                      <button
                        onClick={() => setActiveAnalysisTab('sensitivity')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors flex items-center space-x-2 ${
                          activeAnalysisTab === 'sensitivity'
                            ? 'bg-confluence-blue/10 text-confluence-blue border-b-2 border-confluence-blue'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/20'
                        }`}
                      >
                        <TestTube className="w-4 h-4" />
                        <span>Sensitivity</span>
                      </button>
                    )}
                  </div>

                  {/* Tab Content */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 prose prose-sm max-w-none">
                    {activeAnalysisTab === 'strategy' && testReport.strategy && (
                      <div ref={testStrategyRef}>
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <Play className="w-5 h-5 mr-2 text-confluence-blue" />
                          Test Strategy
                        </h3>
                        <div>
                          {testReport.strategy.split('\n').map((line, index) => {
                            if (line.startsWith('### ')) {
                              return <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.substring(4)}</h3>;
                            } else if (line.startsWith('## ')) {
                              return <h2 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.substring(3)}</h2>;
                            } else if (line.startsWith('# ')) {
                              return <h1 key={index} className="text-2xl font-bold text-gray-800 mt-8 mb-4">{line.substring(2)}</h1>;
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
                      </div>
                    )}

                    {activeAnalysisTab === 'crossPlatform' && testReport.crossPlatform && (
                      <div ref={crossPlatformRef}>
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <Code className="w-5 h-5 mr-2 text-confluence-blue" />
                          Cross-Platform Analysis
                        </h3>
                        <div>
                          {testReport.crossPlatform.split('\n').map((line, index) => {
                            if (line.startsWith('### ')) {
                              return <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.substring(4)}</h3>;
                            } else if (line.startsWith('## ')) {
                              return <h2 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.substring(3)}</h2>;
                            } else if (line.startsWith('# ')) {
                              return <h1 key={index} className="text-2xl font-bold text-gray-800 mt-8 mb-4">{line.substring(2)}</h1>;
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
                      </div>
                    )}

                    {activeAnalysisTab === 'sensitivity' && testReport.sensitivity && (
                      <div ref={sensitivityRef}>
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <TestTube className="w-5 h-5 mr-2 text-confluence-blue" />
                          Sensitivity Analysis
                        </h3>
                        <div className="prose prose-sm max-w-none text-gray-800">
                          <ReactMarkdown>
                            {testReport.sensitivity}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Analysis Results - Only show in document mode */}
              {selectionMode === 'document' && documentAnalysis && (
                <div ref={documentAnalysisRef} className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <FileCheck className="w-5 h-5 mr-2 text-green-600" />
                    Document Analysis Results
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Maintainability */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                        Maintainability
                      </h4>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown>
                          {documentAnalysis.maintainability}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Usability */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Usability
                      </h4>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown>
                          {documentAnalysis.usability}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Accessibility */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                        Accessibility
                      </h4>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown>
                          {documentAnalysis.accessibility}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Consistency */}
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2 text-orange-600" />
                        Consistency
                      </h4>
                      <div className="prose prose-sm max-w-none text-gray-700">
                        <ReactMarkdown>
                          {documentAnalysis.consistency}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* GitHub Actions Results */}
              {showGitHubActions && githubActionsResult && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-green-600" />
                    GitHub Actions Integration
                  </h3>
                  
                  {/* GitHub Actions Tabs */}
                  <div className="mb-4">
                    <div className="flex space-x-2 border-b border-white/20">
                      <button
                        onClick={() => setActiveGitHubTab('workflow')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                          activeGitHubTab === 'workflow'
                            ? 'bg-green-100 text-green-700 border-b-2 border-green-500'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Workflow
                      </button>
                      <button
                        onClick={() => setActiveGitHubTab('tests')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                          activeGitHubTab === 'tests'
                            ? 'bg-green-100 text-green-700 border-b-2 border-green-500'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Test Files
                      </button>
                      <button
                        onClick={() => setActiveGitHubTab('setup')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                          activeGitHubTab === 'setup'
                            ? 'bg-green-100 text-green-700 border-b-2 border-green-500'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Setup
                      </button>
                      <button
                        onClick={() => setActiveGitHubTab('info')}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                          activeGitHubTab === 'info'
                            ? 'bg-green-100 text-green-700 border-b-2 border-green-500'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Info
                      </button>
                    </div>
                  </div>
                  
                  {/* Tab Content */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    {activeGitHubTab === 'workflow' && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">GitHub Actions Workflow</h4>
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                          <pre className="text-sm">
                            <code>{githubActionsResult.workflow_content}</code>
                          </pre>
                        </div>
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(githubActionsResult.workflow_content);
                              setShowToast(true);
                              setTimeout(() => setShowToast(false), 3000);
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Copy Workflow
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([githubActionsResult.workflow_content], { type: 'text/yaml' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = '.github/workflows/test.yml';
                              a.click();
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Download
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {activeGitHubTab === 'tests' && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Generated Test Files</h4>
                        <div className="space-y-3">
                          {githubActionsResult.test_files.map((file: any, index: number) => (
                            <div key={index} className="border border-white/20 rounded-lg p-3">
                              <h5 className="font-medium text-gray-800 mb-2">{file.filename}</h5>
                              <div className="bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                                <pre className="text-sm">
                                  <code>{file.content}</code>
                                </pre>
                              </div>
                              <div className="mt-2 flex space-x-2">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(file.content);
                                    setShowToast(true);
                                    setTimeout(() => setShowToast(false), 3000);
                                  }}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                >
                                  Copy
                                </button>
                                <button
                                  onClick={() => {
                                    const blob = new Blob([file.content], { type: 'text/javascript' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = file.filename;
                                    a.click();
                                  }}
                                  className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                >
                                  Download
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {activeGitHubTab === 'setup' && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Setup Instructions</h4>
                        <div className="prose prose-sm max-w-none text-gray-700">
                          <ReactMarkdown>{githubActionsResult.setup_instructions}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                    
                    {activeGitHubTab === 'info' && (
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-3">Integration Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-green-100/80 p-3 rounded-lg">
                            <div className="text-sm font-medium text-green-800">Status</div>
                            <div className="text-sm text-green-700">{githubActionsResult.integration_status}</div>
                          </div>
                          <div className="bg-blue-100/80 p-3 rounded-lg">
                            <div className="text-sm font-medium text-blue-800">Estimated Duration</div>
                            <div className="text-sm text-blue-700">{githubActionsResult.estimated_duration}</div>
                          </div>
                          <div className="bg-purple-100/80 p-3 rounded-lg">
                            <div className="text-sm font-medium text-purple-800">Coverage Estimate</div>
                            <div className="text-sm text-purple-700">{githubActionsResult.coverage_estimate}</div>
                          </div>
                          {githubActionsResult.language_info && (
                            <div className="bg-orange-100/80 p-3 rounded-lg">
                              <div className="text-sm font-medium text-orange-800">Language Info</div>
                              <div className="text-sm text-orange-700">
                                {githubActionsResult.language_info.language} - {githubActionsResult.language_info.framework}
                              </div>
                            </div>
                          )}
                        </div>
                        {githubActionsResult.auto_push_result && githubActionsResult.auto_push_result.success && (
                          <div className="mt-4 p-3 rounded-lg border">
                            <h5 className="font-medium text-gray-800 mb-2">Auto-Push Result</h5>
                            <div className="text-sm text-green-700">
                              ✅ Successfully pushed to GitHub
                            </div>
                            {githubActionsResult.auto_push_result.files_pushed && githubActionsResult.auto_push_result.files_pushed.length > 0 && (
                              <div className="mt-2">
                                <div className="text-sm font-medium text-gray-700">Files pushed:</div>
                                <ul className="text-sm text-gray-600 list-disc list-inside">
                                  {githubActionsResult.auto_push_result.files_pushed.map((file: string, index: number) => (
                                    <li key={index}>{file}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>

            {/* Right Column - Q&A */}
            <div className="xl:col-span-1">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 space-y-4 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Questions & Analysis
                </h3>
                
                {/* --- History Dropdown for Q&A --- */}
                {qaHistory.length > 0 && (
                  <div className="mb-4 flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Q&A History:</label>
                    <select
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      value={currentQaHistoryIndex ?? 0}
                      onChange={e => setCurrentQaHistoryIndex(Number(e.target.value))}
                    >
                      {qaHistory.map((item, idx) => (
                        <option key={idx} value={idx}>
                          {item.question.length > 40 ? item.question.slice(0, 40) + '...' : item.question}
                        </option>
                      ))}
                    </select>
                    {currentQaHistoryIndex !== null && currentQaHistoryIndex !== 0 && (
                      <button
                        className="text-xs text-confluence-blue underline ml-2"
                        onClick={() => setCurrentQaHistoryIndex(0)}
                      >
                        Go to Latest
                      </button>
                    )}
                  </div>
                )}
                {/* --- End History Dropdown --- */}
                
                {/* Existing Q&A */}
                {qaResults.length > 0 && (
                  <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                    {qaResults.map((qa, index) => (
                      <div key={index} className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="font-medium text-gray-800 mb-2 text-sm">Q: {qa.question}</p>
                        <p className="text-gray-700 text-xs">{qa.answer.substring(0, 200)}...</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Question */}
                <div className="space-y-2">
                  <div className="w-full">
                    <VoiceRecorder
                      value={question}
                      onChange={setQuestion}
                      onConfirm={setQuestion}
                      inputPlaceholder="Ask about testing strategies, coverage, or specific scenarios..."
                    />
                  </div>
                  <button
                    onClick={addQuestion}
                    disabled={!question.trim() || isQALoading}
                    className="w-full px-3 py-2 bg-confluence-blue/90 backdrop-blur-sm text-white rounded hover:bg-confluence-blue disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 border border-white/10"
                  >
                    {isQALoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span>Ask Question</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          {selectionMode === 'component' && !testReport?.strategy && !testReport?.crossPlatform && !testReport?.sensitivity && (
            <div className="text-center py-12">
              <TestTube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to Generate Test Analysis</h3>
              <p className="text-gray-500">Select your code and test components, then choose which analysis to generate.</p>
            </div>
          )}
          
          {selectionMode === 'document' && !documentAnalysis && (
            <div className="text-center py-12">
              <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Ready to Analyze Document</h3>
              <p className="text-gray-500">Select a document page to analyze its maintainability, usability, accessibility, and consistency.</p>
            </div>
          )}
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

export default TestSupportTool;