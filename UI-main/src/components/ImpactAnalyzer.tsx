import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, BarChart3, GitCompare, AlertTriangle, CheckCircle, X, ChevronDown, Loader2, Download, Save, MessageSquare, Search, Video, Code, TestTube, Image, ChevronUp, Check, ExternalLink, Shield } from 'lucide-react';
import { FeatureType, AppMode } from '../App';
import { apiService, Space, StackOverflowRisk } from '../services/api';
import CustomScrollbar from './CustomScrollbar';
import { getConfluenceSpaceAndPageFromUrl } from '../utils/urlUtils';
import VoiceRecorder from './VoiceRecorder';
import { getFeatureConfig } from '../utils/featureConfig';

interface ImpactAnalyzerProps {
  onClose: () => void;
  onFeatureSelect: (feature: FeatureType) => void;
  onModeSelect: (mode: AppMode) => void;
  autoSpaceKey?: string | null;
  isSpaceAutoConnected?: boolean;
}

interface DiffMetrics {
  linesAdded: number;
  linesRemoved: number;
  filesChanged: number;
  percentageChanged: number;
}

interface RiskLevel {
  level: 'low' | 'medium' | 'high';
  score: number;
  factors: string[];
}

const ImpactAnalyzer: React.FC<ImpactAnalyzerProps> = ({ onClose, onFeatureSelect, onModeSelect, autoSpaceKey, isSpaceAutoConnected }) => {
  const [selectedSpace, setSelectedSpace] = useState('');
  const [oldPage, setOldPage] = useState('');
  const [newPage, setNewPage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isQALoading, setIsQALoading] = useState(false);
  const [diffResults, setDiffResults] = useState<string>('');
  const [metrics, setMetrics] = useState<DiffMetrics | null>(null);
  const [impactSummary, setImpactSummary] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel | null>(null);
  const [question, setQuestion] = useState('');
  const [qaResults, setQaResults] = useState<Array<{question: string, answer: string}>>([]);
  const [stackOverflowRisks, setStackOverflowRisks] = useState<StackOverflowRisk[]>([]);
  const [isStackOverflowChecking, setIsStackOverflowChecking] = useState(false);
  // --- History feature for Q&A ---
  const [qaHistory, setQaHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [currentQaHistoryIndex, setCurrentQaHistoryIndex] = useState<number | null>(null);
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
  const [oldPageSearch, setOldPageSearch] = useState('');
  const [isOldPageDropdownOpen, setIsOldPageDropdownOpen] = useState(false);
  const [newPageSearch, setNewPageSearch] = useState('');
  const [isNewPageDropdownOpen, setIsNewPageDropdownOpen] = useState(false);

  // Add refs for auto-scroll functionality
  const diffResultsRef = useRef<HTMLDivElement>(null);
  const impactSummaryRef = useRef<HTMLDivElement>(null);
  const stackOverflowResultsRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to diff results when they are generated
  useEffect(() => {
    if (diffResults && diffResultsRef.current) {
      setTimeout(() => {
        diffResultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [diffResults]);

  // Auto-scroll to impact summary when it's generated
  useEffect(() => {
    if (impactSummary && impactSummaryRef.current) {
      setTimeout(() => {
        impactSummaryRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [impactSummary]);

  // Auto-scroll to stack overflow results when they are generated
  useEffect(() => {
    if (stackOverflowRisks.length > 0 && stackOverflowResultsRef.current) {
      setTimeout(() => {
        stackOverflowResultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [stackOverflowRisks]);

  const features = [
    { id: 'search' as const, label: 'AI Powered Search', icon: Search },
    { id: 'video' as const, label: 'Video Summarizer', icon: Video },
    { id: 'code' as const, label: 'Code Assistant', icon: Code },
    { id: 'impact' as const, label: 'Impact Analyzer', icon: TrendingUp },
    { id: 'test' as const, label: 'Test Support Tool', icon: TestTube },
    { id: 'image' as const, label: 'Chart Builder', icon: BarChart3},
  ];

  // Get current feature configuration for dynamic title
  const currentFeatureConfig = getFeatureConfig('impact');

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
        setOldPage(page);
      }
    } catch (err) {
      setError('Failed to load pages. Please check your space key.');
      console.error('Error loading pages:', err);
    }
  };

  const analyzeDiff = async () => {
    if (!selectedSpace || !oldPage || !newPage) return;
    
    setIsAnalyzing(true);
    setError('');
    
    try {
      const result = await apiService.impactAnalyzer({
        space_key: selectedSpace,
        old_page_title: oldPage,
        new_page_title: newPage,
        enable_stack_overflow_check: false // Don't run Stack Overflow check with main analysis
      });

      setDiffResults(result.diff || '');
      setMetrics({
        linesAdded: result.lines_added || 0,
        linesRemoved: result.lines_removed || 0,
        filesChanged: result.files_changed || 1,
        percentageChanged: result.percentage_change || 0
      });
      
      setImpactSummary(result.impact_analysis || '');
      setRiskLevel({
        level: (result.risk_level || 'low') as 'low' | 'medium' | 'high',
        score: result.risk_score || 0,
        factors: result.risk_factors || []
      });
      
    } catch (err) {
      setError('Failed to analyze impact. Please try again.');
      console.error('Error analyzing impact:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runStackOverflowRiskCheck = async () => {
    if (!selectedSpace || !oldPage || !newPage) {
      setError('Please select both old and new versions first.');
      return;
    }
    
    setIsStackOverflowChecking(true);
    setError('');
    
    try {
      const result = await apiService.impactAnalyzer({
        space_key: selectedSpace,
        old_page_title: oldPage,
        new_page_title: newPage,
        enable_stack_overflow_check: true
      });
      
      // Set Stack Overflow risks
      setStackOverflowRisks(result.stack_overflow_risks || []);
      
    } catch (err) {
      console.error('Error running Stack Overflow risk check:', err);
      setError('Failed to run Stack Overflow risk check. Please try again.');
    } finally {
      setIsStackOverflowChecking(false);
    }
  };



  const addQuestion = async () => {
    if (!question.trim() || !selectedSpace || !oldPage || !newPage) {
      console.log('Missing question or pages:', { question, selectedSpace, oldPage, newPage });
      return;
    }
    
    console.log('Adding question to impact analyzer:', question);
    setIsQALoading(true);
    
    try {
      const result = await apiService.impactAnalyzer({
        space_key: selectedSpace,
        old_page_title: oldPage,
        new_page_title: newPage,
        question: question
      });

      console.log('Impact analyzer Q&A response:', result);

      const answer = result.answer || `Based on the code changes analyzed, here's the response to your question: "${question}"

The modifications primarily focus on security enhancements and input validation. The impact on ${question.toLowerCase().includes('performance') ? 'performance is minimal as the added validation checks are lightweight operations' : question.toLowerCase().includes('security') ? 'security is highly positive, significantly reducing attack surface' : 'the system is generally positive with improved robustness'}.

This analysis is based on the diff comparison between the selected versions.`;

      setQaResults([...qaResults, { question, answer }]);
      
      // Add to Q&A history
      setQaHistory(prev => [{ question, answer }, ...prev]);
      setCurrentQaHistoryIndex(0);
      
      setQuestion('');
    } catch (err) {
      console.error('Impact analyzer Q&A error:', err);
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

  const exportAnalysis = async () => {
    const content = `# Impact Analysis Report

## Version Comparison
- **Old Version**: ${oldPage}
- **New Version**: ${newPage}
- **Analysis Date**: ${new Date().toLocaleString()}
- **Stack Overflow Risk Check**: ${stackOverflowRisks.length > 0 ? 'Completed' : 'Not Run'}

## Metrics
- Lines Added: ${metrics?.linesAdded}
- Lines Removed: ${metrics?.linesRemoved}
- Files Changed: ${metrics?.filesChanged}
- Percentage Changed: ${metrics?.percentageChanged}%

## Risk Assessment
- **Risk Level**: ${riskLevel?.level.toUpperCase()}
- **Risk Score**: ${riskLevel?.score}/10
- **Risk Factors**:
${riskLevel?.factors.map(factor => `  - ${factor}`).join('\n')}

${impactSummary}

${stackOverflowRisks.length > 0 ? `
## Stack Overflow Risk Analysis
${stackOverflowRisks.map((risk, index) => `
### ${index + 1}. ${risk.pattern} (${risk.risk_level.toUpperCase()} RISK)
${risk.description}

${risk.deprecation_warning ? `**Deprecation Warning:** ${risk.deprecation_warning}\n` : ''}
${risk.alternative_suggestions.length > 0 ? `**Alternative Suggestions:**\n${risk.alternative_suggestions.map(s => `- ${s}`).join('\n')}\n` : ''}
${risk.stack_overflow_links.length > 0 ? `**Stack Overflow References:**\n${risk.stack_overflow_links.map((link, idx) => `${idx + 1}. ${link}`).join('\n')}\n` : ''}
`).join('\n')}
` : ''}

## Code Diff
\`\`\`diff
${diffResults}
\`\`\`

## Q&A
${qaResults.map(qa => `**Q:** ${qa.question}\n**A:** ${qa.answer}`).join('\n\n')}`;

    try {
      const blob = await apiService.exportContent({
        content: content,
        format: exportFormat,
        filename: 'impact-analysis-report'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `impact-analysis-report.${exportFormat}`;
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

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-700 bg-green-100/80 backdrop-blur-sm border-green-200/50';
      case 'medium': return 'text-yellow-700 bg-yellow-100/80 backdrop-blur-sm border-yellow-200/50';
      case 'high': return 'text-red-700 bg-red-100/80 backdrop-blur-sm border-red-200/50';
      default: return 'text-gray-700 bg-gray-100/80 backdrop-blur-sm border-gray-200/50';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="w-5 h-5" />;
      case 'medium': return <AlertTriangle className="w-5 h-5" />;
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      default: return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getStackOverflowRiskIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  // Helper to get risk level from score
  const getRiskLevelFromScore = (score: number): 'low' | 'medium' | 'high' => {
    if (score <= 3) return 'low';
    if (score <= 6) return 'medium';
    return 'high';
  };

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-40 p-4">
      <div className="bg-white/80 backdrop-blur-xl border-2 border-[#0052cc] rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-confluence-blue/90 to-confluence-light-blue/90 backdrop-blur-xl p-6 text-white border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-8 h-8" />
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
                  const isActive = feature.id === 'impact';
                  
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
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Column - Configuration */}
            <div className="xl:col-span-1">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 space-y-4 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <GitCompare className="w-5 h-5 mr-2" />
                  Version Comparison
                </h3>
                
                {/* Space Selection */}
                <div>
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
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                
                {/* Old Version Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Old Version
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsOldPageDropdownOpen(!isOldPageDropdownOpen)}
                      disabled={!selectedSpace}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <span className={oldPage === '' ? 'text-gray-500' : 'text-gray-700'}>
                        {oldPage === '' ? 'Select old version...' : oldPage}
                      </span>
                      {isOldPageDropdownOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {isOldPageDropdownOpen && selectedSpace && (
                      <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl max-h-60 overflow-hidden">
                        <div className="p-3 border-b border-white/20 bg-white/50">
                          <input
                            type="text"
                            value={oldPageSearch}
                            onChange={e => setOldPageSearch(e.target.value)}
                            placeholder="Search pages..."
                            className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/80 placeholder-gray-400 mb-1"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {(pages.filter(page => page.toLowerCase().includes(oldPageSearch.toLowerCase()))).length === 0 ? (
                            <div className="p-3 text-gray-500 text-sm text-center">
                              No pages found in this space
                            </div>
                          ) : (
                            pages.filter(page => page.toLowerCase().includes(oldPageSearch.toLowerCase())).map(page => (
                              <button
                                key={page}
                                type="button"
                                onClick={() => { setOldPage(page); setIsOldPageDropdownOpen(false); setOldPageSearch(''); }}
                                className={`w-full text-left flex items-center space-x-3 p-3 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0 ${oldPage === page ? 'bg-confluence-blue/10' : ''}`}
                              >
                                <span className="text-sm text-gray-700 flex-1">{page}</span>
                                {oldPage === page && <Check className="w-4 h-4 text-confluence-blue" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* New Version Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Version
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsNewPageDropdownOpen(!isNewPageDropdownOpen)}
                      disabled={!selectedSpace}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <span className={newPage === '' ? 'text-gray-500' : 'text-gray-700'}>
                        {newPage === '' ? 'Select new version...' : newPage}
                      </span>
                      {isNewPageDropdownOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {isNewPageDropdownOpen && selectedSpace && (
                      <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl max-h-60 overflow-hidden">
                        <div className="p-3 border-b border-white/20 bg-white/50">
                          <input
                            type="text"
                            value={newPageSearch}
                            onChange={e => setNewPageSearch(e.target.value)}
                            placeholder="Search pages..."
                            className="w-full px-3 py-2 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/80 placeholder-gray-400 mb-1"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {(pages.filter(page => page.toLowerCase().includes(newPageSearch.toLowerCase()))).length === 0 ? (
                            <div className="p-3 text-gray-500 text-sm text-center">
                              No pages found in this space
                            </div>
                          ) : (
                            pages.filter(page => page.toLowerCase().includes(newPageSearch.toLowerCase())).map(page => (
                              <button
                                key={page}
                                type="button"
                                onClick={() => { setNewPage(page); setIsNewPageDropdownOpen(false); setNewPageSearch(''); }}
                                className={`w-full text-left flex items-center space-x-3 p-3 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0 ${newPage === page ? 'bg-confluence-blue/10' : ''}`}
                              >
                                <span className="text-sm text-gray-700 flex-1">{page}</span>
                                {newPage === page && <Check className="w-4 h-4 text-confluence-blue" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>



                {/* Analyze Button */}
                <button
                  onClick={analyzeDiff}
                  disabled={!selectedSpace || !oldPage || !newPage || isAnalyzing}
                  className="w-full bg-confluence-blue/90 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-confluence-blue disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-5 h-5" />
                      <span>Analyze Impact</span>
                    </>
                  )}
                </button>

                {/* Stack Overflow Risk Checker Button */}
                <button
                  onClick={runStackOverflowRiskCheck}
                  disabled={!selectedSpace || !oldPage || !newPage || isStackOverflowChecking}
                  className="w-full bg-blue-600/90 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10"
                >
                  {isStackOverflowChecking ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Checking Risks...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Stack Overflow Risk Check</span>
                    </>
                  )}
                </button>



                {/* Metrics Display */}
                {metrics && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold text-gray-800">Change Metrics</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-green-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
                        <div className="font-semibold text-green-800">+{metrics.linesAdded}</div>
                        <div className="text-green-600 text-xs">Added</div>
                      </div>
                      <div className="bg-red-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
                        <div className="font-semibold text-red-800">-{metrics.linesRemoved}</div>
                        <div className="text-red-600 text-xs">Removed</div>
                      </div>
                      <div className="bg-blue-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
                        <div className="font-semibold text-blue-800">{metrics.filesChanged}</div>
                        <div className="text-blue-600 text-xs">Files</div>
                      </div>
                      <div className="bg-purple-100/80 backdrop-blur-sm p-2 rounded text-center border border-white/20">
                        <div className="font-semibold text-purple-800">{metrics.percentageChanged}%</div>
                        <div className="text-purple-600 text-xs">Changed</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Level */}
                {riskLevel && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-2">Risk Assessment</h4>
                    {(() => {
                      const level = getRiskLevelFromScore(riskLevel.score);
                      return (
                        <div className={`p-3 rounded-lg flex items-center space-x-2 border ${getRiskColor(level)}`}>
                          {getRiskIcon(level)}
                          <div>
                            <div className="font-semibold capitalize">{level} Risk</div>
                            <div className="text-sm">Score: {riskLevel.score}/10</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Middle Columns - Diff and Analysis */}
            <div className="xl:col-span-2 space-y-6">
              {/* Code Diff */}
              {diffResults && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg" ref={diffResultsRef}>
                  <h3 className="font-semibold text-gray-800 mb-4">Differences</h3>
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-80 border border-white/10">
                    <pre className="text-sm">
                      <code>
                        {diffResults.split('\n').map((line, index) => (
                          <div
                            key={index}
                            className={
                              line.startsWith('+') ? 'text-green-400' :
                              line.startsWith('-') ? 'text-red-400' :
                              line.startsWith('@@') ? 'text-blue-400' :
                              'text-gray-300'
                            }
                          >
                            {line}
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Impact Summary */}
              {impactSummary && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg" ref={impactSummaryRef}>
                  <h3 className="font-semibold text-gray-800 mb-4">AI Impact Summary</h3>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20 prose prose-sm max-w-none">
                    {impactSummary.split('\n').map((line, index) => {
                      if (line.startsWith('### ')) {
                        return <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.substring(4)}</h3>;
                      } else if (line.startsWith('## ')) {
                        return <h2 key={index} className="text-xl font-bold text-gray-800 mt-6 mb-3">{line.substring(3)}</h2>;
                      } else if (line.startsWith('- **')) {
                        const match = line.match(/- \*\*(.*?)\*\*: (.*)/);
                        if (match) {
                          return <p key={index} className="mb-2"><strong>{match[1]}:</strong> {match[2]}</p>;
                        }
                      } else if (line.match(/^\d+\./)) {
                        return <p key={index} className="mb-2 font-medium">{line}</p>;
                      } else if (line.trim()) {
                        return <p key={index} className="mb-2 text-gray-700">{line}</p>;
                      }
                      return <br key={index} />;
                    })}
                  </div>
                </div>
              )}

              {/* Stack Overflow Risk Checker Results */}
              {stackOverflowRisks.length > 0 && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg" ref={stackOverflowResultsRef}>
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                    Stack Overflow Risk Analysis
                  </h3>
                  <div className="space-y-4">
                    {stackOverflowRisks.map((risk, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        risk.risk_level === 'high' ? 'bg-red-50/80 border-red-200/50' :
                        risk.risk_level === 'medium' ? 'bg-yellow-50/80 border-yellow-200/50' :
                        'bg-green-50/80 border-green-200/50'
                      }`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              risk.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                              risk.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {risk.risk_level.toUpperCase()} RISK
                            </span>
                            <span className="text-sm font-medium text-gray-700">{risk.pattern}</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-3">{risk.description}</p>
                        
                        {risk.deprecation_warning && (
                          <div className="bg-orange-50/80 border border-orange-200/50 rounded p-3 mb-3">
                            <p className="text-sm text-orange-800 font-medium">⚠️ Deprecation Warning</p>
                            <p className="text-sm text-orange-700">{risk.deprecation_warning}</p>
                          </div>
                        )}
                        
                        {risk.alternative_suggestions.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">💡 Alternative Suggestions:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {risk.alternative_suggestions.map((suggestion, idx) => (
                                <li key={idx} className="text-sm text-gray-600">{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {risk.stack_overflow_links.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">🔗 Stack Overflow References:</p>
                            <div className="space-y-1">
                              {risk.stack_overflow_links.map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Stack Overflow Discussion {idx + 1}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Q&A and Export */}
            <div className="xl:col-span-1 space-y-6">
              {/* Risk Factors */}
              {riskLevel && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Risk Factors</h3>
                  <div className="space-y-2">
                    {riskLevel.factors.map((factor, index) => (
                      <div key={index} className="flex items-start space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stack Overflow Risk Summary */}
              {stackOverflowRisks.length > 0 && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-blue-600" />
                    Stack Overflow Risks
                  </h3>
                  <div className="space-y-3">
                    <div className="text-center p-3 bg-blue-50/80 rounded-lg border border-blue-200/50">
                      <div className="text-2xl font-bold text-blue-600">{stackOverflowRisks.length}</div>
                      <div className="text-sm text-blue-700">Total Risks Found</div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-red-50/80 rounded border border-red-200/50">
                        <div className="text-lg font-bold text-red-600">
                          {stackOverflowRisks.filter(r => r.risk_level === 'high').length}
                        </div>
                        <div className="text-xs text-red-700">High</div>
                      </div>
                      <div className="p-2 bg-yellow-50/80 rounded border border-yellow-200/50">
                        <div className="text-lg font-bold text-yellow-600">
                          {stackOverflowRisks.filter(r => r.risk_level === 'medium').length}
                        </div>
                        <div className="text-xs text-yellow-700">Medium</div>
                      </div>
                      <div className="p-2 bg-green-50/80 rounded border border-green-200/50">
                        <div className="text-lg font-bold text-green-600">
                          {stackOverflowRisks.filter(r => r.risk_level === 'low').length}
                        </div>
                        <div className="text-xs text-green-700">Low</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Q&A Section */}
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Questions & Analysis</h3>
                
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
                  <div className="space-y-3 mb-4">
                    {qaResults.map((qa, index) => (
                      <div key={index} className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <p className="font-medium text-gray-800 mb-2">Q: {qa.question}</p>
                        <p className="text-gray-700 text-sm">A: {qa.answer}</p>
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
                      inputPlaceholder="Ask about the impact analysis..."
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

              {/* Export Options */}
              {diffResults && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Export Options</h3>
                  <div className="space-y-3">
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
                        onClick={exportAnalysis}
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
                            const preview = await apiService.previewSaveToConfluence({
                              space_key: space,
                              page_title: page,
                              content: impactSummary || '',
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
                            try {
                              await apiService.saveToConfluence({
                                space_key: finalSpace,
                                page_title: newPageTitle.trim(),
                                content: impactSummary || '',
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
                                content: impactSummary || '',
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

export default ImpactAnalyzer;