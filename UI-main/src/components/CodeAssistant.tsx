import React, { useState, useEffect, useRef } from 'react';
import { Code, BarChart3, FileText, Download, Save, X, ChevronDown, Loader2, Zap, Search, Video, TrendingUp, TestTube, Image, ChevronUp, Check } from 'lucide-react';
import { FeatureType, AppMode } from '../App';
import { apiService, Space } from '../services/api';
import CustomScrollbar from './CustomScrollbar';
import { getConfluenceSpaceAndPageFromUrl } from '../utils/urlUtils';
import VoiceRecorder from './VoiceRecorder';
import { getFeatureConfig } from '../utils/featureConfig';

interface CodeAssistantProps {
  onClose: () => void;
  onFeatureSelect: (feature: FeatureType) => void;
  onModeSelect: (mode: AppMode) => void;
  autoSpaceKey?: string | null;
  isSpaceAutoConnected?: boolean;
}

const CodeAssistant: React.FC<CodeAssistantProps> = ({ onClose, onFeatureSelect, onModeSelect, autoSpaceKey, isSpaceAutoConnected }) => {
  const [selectedSpace, setSelectedSpace] = useState('');
  const [selectedPage, setSelectedPage] = useState('');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<string[]>([]);
  const [detectedCode, setDetectedCode] = useState('');
  const [instruction, setInstruction] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [fileName, setFileName] = useState('');
  const [processedCode, setProcessedCode] = useState('');
  const [summary, setSummary] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [exportFormat, setExportFormat] = useState('markdown');
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [saveMode, setSaveMode] = useState('append');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [showNewPageInput, setShowNewPageInput] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewDiff, setPreviewDiff] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Add new state for AI Action and outputs
  const [aiAction, setAiAction] = useState('');
  const [aiActionOutput, setAiActionOutput] = useState('');
  const [modificationOutput, setModificationOutput] = useState('');
  const [conversionOutput, setConversionOutput] = useState('');

  // Add new state for Impact Analysis
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);
  const [isAnalyzingImpact, setIsAnalyzingImpact] = useState(false);

  // Add new state for page search and dropdown
  const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
  const [pageSearch, setPageSearch] = useState('');

  // Add new state for AI Actions dropdown
  const [aiActionSearch, setAiActionSearch] = useState('');
  const [isAiActionDropdownOpen, setIsAiActionDropdownOpen] = useState(false);
  // Add new state for Target Language dropdown
  const [targetLanguageSearch, setTargetLanguageSearch] = useState('');
  const [isTargetLanguageDropdownOpen, setIsTargetLanguageDropdownOpen] = useState(false);

  // --- History feature for modification instructions ---
  const [instructionHistory, setInstructionHistory] = useState<Array<{instruction: string, output: string}>>([]);
  const [currentInstructionHistoryIndex, setCurrentInstructionHistoryIndex] = useState<number | null>(null);

  // Add refs for auto-scroll functionality
  const aiResultRef = useRef<HTMLDivElement>(null);
  const impactAnalysisRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to AI Result when output is generated
  useEffect(() => {
    if ((aiActionOutput || conversionOutput || modificationOutput || processedCode) && aiResultRef.current) {
      setTimeout(() => {
        aiResultRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [aiActionOutput, conversionOutput, modificationOutput, processedCode]);

  // Auto-scroll to Impact Analysis when it's generated
  useEffect(() => {
    if (impactAnalysis && impactAnalysisRef.current) {
      setTimeout(() => {
        impactAnalysisRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100);
    }
  }, [impactAnalysis]);

  const features = [
    { id: 'search' as const, label: 'AI Powered Search', icon: Search },
    { id: 'video' as const, label: 'Video Summarizer', icon: Video },
    { id: 'code' as const, label: 'Code Assistant', icon: Code },
    { id: 'impact' as const, label: 'Impact Analyzer', icon: TrendingUp },
    { id: 'test' as const, label: 'Test Support Tool', icon: TestTube },
    { id: 'image' as const, label: 'Chart Builder', icon: BarChart3 },
  ];

  // Get current feature configuration for dynamic title
  const currentFeatureConfig = getFeatureConfig('code');

  // Update outputFormats to include all from dhiva
  const outputFormats = [
    'javascript', 'typescript', 'python', 'java', 'csharp', 'go', 'rust', 'php', 'yang', 'cpp', 'c', 'swift', 'kotlin', 'scala', 'ruby', 'perl', 'bash', 'powershell', 'sql', 'html', 'css', 'xml', 'json', 'yaml', 'toml'
  ];

  // Add AI Actions catalog
  const aiActions = [
    'Optimize Performance',
    'Generate Documentation',
    'Refactor Structure',
    'Identify dead code',
    'Add Logging Statements'
  ];

  // Add languages for target language dropdown
  const languages = [
    'JavaScript',
    'TypeScript',
    'Python',
    'Java',
    'C#',
    'Go',
    'Rust',
    'PHP',
    'Yang',
    'C++',
    'C',
    'Swift',
    'Kotlin',
    'Scala',
    'Ruby',
    'Perl',
    'Bash',
    'PowerShell',
    'SQL',
    'HTML',
    'CSS',
    'XML',
    'JSON',
    'YAML',
    'TOML'
  ];

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
        setSelectedPage(page);
        handlePageSelect(page); // Immediately load code for the auto-selected page
      }
    } catch (err) {
      setError('Failed to load pages. Please check your space key.');
      console.error('Error loading pages:', err);
    }
  };

  const handlePageSelect = async (pageTitle: string) => {
    setSelectedPage(pageTitle);
    setIsProcessing(true);
    setError('');

    try {
      const result = await apiService.codeAssistant({
        space_key: selectedSpace,
        page_title: pageTitle,
        instruction: ''
      });

      setDetectedCode(result.original_code);
      setSummary(result.summary);
      setProcessedCode('');
    } catch (err) {
      setError('Failed to load page content. Please try again.');
      console.error('Error loading page:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update processCode to handle AI actions and outputs
  const processCode = async () => {
    if (!selectedSpace || !selectedPage) {
      setError('Please select a space and page.');
      return;
    }

    // Clear previous outputs before running a new process
    setAiActionOutput('');
    setConversionOutput('');
    setModificationOutput('');

    // Check if any option is selected
    const hasModificationInstruction = instruction.trim() !== '';
    const hasTargetLanguage = targetLanguage !== '';
    const hasAiAction = aiAction !== '' && aiAction !== 'Select action...';

    if (!hasModificationInstruction && !hasTargetLanguage && !hasAiAction) {
      setError('Please provide a modification instruction, select a target language, or choose an AI action.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // NEW BEHAVIOR: If both AI action and modification instruction are selected but NO target language
      if (hasAiAction && hasModificationInstruction && !hasTargetLanguage) {
        // 1. First apply the modification instruction to the original code
        const modResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: instruction,
          target_language: ''
        });
        const modifiedCode = modResult.modified_code || modResult.converted_code || modResult.original_code || '';
        
        // 2. Then apply the AI action to the modified code
        const actionPromptMap: Record<string, string> = {
          "Optimize Performance": `Optimize the following code for performance without changing its functionality, return only the updated code:\n\n${modifiedCode}`,
          "Generate Documentation": `Generate inline documentation and function-level comments for the following code, return only the updated code by commenting the each line of the code.:\n\n${modifiedCode}`,
          "Refactor Structure": `Refactor the following code to improve structure, readability, and modularity, return only the updated code:\n\n${modifiedCode}`,
          "Identify dead code": `Analyze the following code for any unsued code or dead code, return only the updated code by removing the dead code:\n\n${modifiedCode}`,
          "Add Logging Statements": `Add appropriate logging statements to the following code for better traceability and debugging. Return only the updated code:\n\n${modifiedCode}`,
        };
        const prompt = actionPromptMap[aiAction];
        if (!prompt) {
          setAiActionOutput('');
          setIsProcessing(false);
          return;
        }
        const actionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: prompt
        });
        const finalOutput = actionResult.modified_code || actionResult.converted_code || actionResult.original_code || 'AI action completed successfully.';
        
        // 3. Return one combined AI result
        setAiActionOutput(finalOutput);
        setModificationOutput('');
        setConversionOutput('');
        
        // Add to instruction history
        setInstructionHistory(prev => [{ instruction, output: finalOutput }, ...prev]);
        setCurrentInstructionHistoryIndex(0);
        
        setProcessedCode('');
        return;
      }

      // If all three are selected: target language -> modification -> AI action
      if (hasTargetLanguage && hasModificationInstruction && hasAiAction) {
        // 1. Convert code to target language
        const conversionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: '',
          target_language: targetLanguage
        });
        const convertedCode = conversionResult.converted_code || conversionResult.modified_code || conversionResult.original_code || '';
        // 2. Apply modification instruction to converted code
        const modResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: `${instruction}\n\n${convertedCode}`,
          target_language: '',
        });
        const modifiedCode = modResult.modified_code || modResult.converted_code || modResult.original_code || '';
        // 3. Apply AI action to modified code
        const actionPromptMap: Record<string, string> = {
          "Optimize Performance": `Optimize the following code for performance without changing its functionality, return only the updated code:\n\n${modifiedCode}`,
          "Generate Documentation": `Generate inline documentation and function-level comments for the following code, return only the updated code by commenting the each line of the code.:\n\n${modifiedCode}`,
          "Refactor Structure": `Refactor the following code to improve structure, readability, and modularity, return only the updated code:\n\n${modifiedCode}`,
          "Identify dead code": `Analyze the following code for any unsued code or dead code, return only the updated code by removing the dead code:\n\n${modifiedCode}`,
          "Add Logging Statements": `Add appropriate logging statements to the following code for better traceability and debugging. Return only the updated code:\n\n${modifiedCode}`,
        };
        const prompt = actionPromptMap[aiAction];
        if (!prompt) {
          setAiActionOutput('');
          setIsProcessing(false);
          return;
        }
        const actionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: prompt
        });
        const finalOutput = actionResult.modified_code || actionResult.converted_code || actionResult.original_code || 'AI action completed successfully.';
        setAiActionOutput(finalOutput);
        
        // Add to instruction history if modification instruction was used
        if (hasModificationInstruction) {
          setInstructionHistory(prev => [{ instruction, output: finalOutput }, ...prev]);
          setCurrentInstructionHistoryIndex(0);
        }
        
        setProcessedCode('');
        return;
      }

      // If modification instruction and target language are selected (but not AI action): target language -> modification
      if (hasTargetLanguage && hasModificationInstruction && !hasAiAction) {
        // 1. Convert code to target language
        const conversionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: '',
          target_language: targetLanguage
        });
        const convertedCode = conversionResult.converted_code || conversionResult.modified_code || conversionResult.original_code || '';
        // 2. Apply modification instruction to converted code
        const modResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: `${instruction}\n\n${convertedCode}`,
          target_language: '',
        });
        const finalOutput = modResult.modified_code || modResult.converted_code || modResult.original_code || 'Modification completed successfully.';
        setModificationOutput(finalOutput);
        
        // Add to instruction history
        setInstructionHistory(prev => [{ instruction, output: finalOutput }, ...prev]);
        setCurrentInstructionHistoryIndex(0);
        
        setConversionOutput('');
        setAiActionOutput('');
        setProcessedCode('');
        return;
      }

      // If both target language and AI action are selected (but not modification): target language -> AI action
      if (hasTargetLanguage && !hasModificationInstruction && hasAiAction) {
        // 1. Convert code to target language
        const conversionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: '',
          target_language: targetLanguage
        });
        const convertedCode = conversionResult.converted_code || conversionResult.modified_code || conversionResult.original_code || '';
        setConversionOutput('');
        setModificationOutput('');
        // 2. Apply AI action to converted code
        const actionPromptMap: Record<string, string> = {
          "Optimize Performance": `Optimize the following code for performance without changing its functionality, return only the updated code:\n\n${convertedCode}`,
          "Generate Documentation": `Generate inline documentation and function-level comments for the following code, return only the updated code by commenting the each line of the code.:\n\n${convertedCode}`,
          "Refactor Structure": `Refactor the following code to improve structure, readability, and modularity, return only the updated code:\n\n${convertedCode}`,
          "Identify dead code": `Analyze the following code for any unsued code or dead code, return only the updated code by removing the dead code:\n\n${convertedCode}`,
          "Add Logging Statements": `Add appropriate logging statements to the following code for better traceability and debugging. Return only the updated code:\n\n${convertedCode}`,
        };
        const prompt = actionPromptMap[aiAction];
        if (!prompt) {
          setAiActionOutput('');
          setIsProcessing(false);
          return;
        }
        const actionResult = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: prompt
        });
        const finalOutput = actionResult.modified_code || actionResult.converted_code || actionResult.original_code || 'AI action completed successfully.';
        setAiActionOutput(finalOutput);
        setProcessedCode('');
        return;
      }

      // If only AI action is selected
      if (hasAiAction) {
        await runAiAction();
      }

      // If only modification instruction or target language is selected, process with API
      if (hasModificationInstruction || hasTargetLanguage) {
        const result = await apiService.codeAssistant({
          space_key: selectedSpace,
          page_title: selectedPage,
          instruction: instruction,
          target_language: targetLanguage || undefined
        });
        // Show converted code if target language is selected
        if (hasTargetLanguage && result.converted_code) {
          setConversionOutput(result.converted_code);
        } else {
          setConversionOutput('');
        }
        // Show modified code if modification instruction is used
        if (hasModificationInstruction && result.modified_code) {
          const finalOutput = result.modified_code;
          setModificationOutput(finalOutput);
          
          // Add to instruction history
          setInstructionHistory(prev => [{ instruction, output: finalOutput }, ...prev]);
          setCurrentInstructionHistoryIndex(0);
        } else {
          setModificationOutput('');
        }
        // Fallback for legacy processedCode
        if (!hasTargetLanguage && !hasModificationInstruction && result.original_code) {
          setProcessedCode(result.original_code);
        }
      }
    } catch (err) {
      setError('Failed to process code. Please try again.');
      console.error('Error processing code:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add runAiAction helper
  const runAiAction = async () => {
    if (!aiAction || aiAction === 'Select action...' || !detectedCode) {
      return;
    }

    const actionPromptMap: Record<string, string> = {
      "Optimize Performance": `Optimize the following code for performance without changing its functionality, return only the updated code:\n\n${detectedCode}`,
      "Generate Documentation": `Generate inline documentation and function-level comments for the following code, return only the updated code by commenting the each line of the code.:\n\n${detectedCode}`,
      "Refactor Structure": `Refactor the following code to improve structure, readability, and modularity, return only the updated code:\n\n${detectedCode}`,
      "Identify dead code": `Analyze the following code for any unsued code or dead code, return only the updated code by removing the dead code:\n\n${detectedCode}`,
      "Add Logging Statements": `Add appropriate logging statements to the following code for better traceability and debugging. Return only the updated code:\n\n${detectedCode}`,
    };

    try {
      const prompt = actionPromptMap[aiAction];
      if (!prompt) return;

      // For now, we'll use the same API service but with a special instruction
      const result = await apiService.codeAssistant({
        space_key: selectedSpace,
        page_title: selectedPage,
        instruction: prompt
      });

      setAiActionOutput(result.modified_code || result.converted_code || result.original_code || 'AI action completed successfully.');
    } catch (err) {
      setError(`Failed to run AI action: ${err}`);
      console.error('Error running AI action:', err);
    }
  };

  // Update exportCode to export any output
  const exportCode = async (format: string) => {
    const content = modificationOutput || conversionOutput || aiActionOutput || processedCode || detectedCode;
    if (!content) return;

    try {
      const blob = await apiService.exportContent({
        content: content,
        format: format,
        filename: fileName || 'code'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName || 'code'}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export file. Please try again.');
      console.error('Error exporting:', err);
    }
  };

  // Add analyze impact function
  const analyzeImpact = async () => {
    if (!detectedCode) {
      setError('No original code available for analysis.');
      return;
    }

    const newCode = aiActionOutput || modificationOutput || conversionOutput || processedCode;
    if (!newCode) {
      setError('No AI result available for analysis.');
      return;
    }

    setIsAnalyzingImpact(true);
    setError('');

    try {
      // Use the new direct code impact analyzer
      const result = await apiService.directCodeImpactAnalyzer({
        old_code: detectedCode,
        new_code: newCode,
        question: 'Analyze the impact of changes between the original code and the AI-modified code.'
      });

      setImpactAnalysis(result);
    } catch (err) {
      setError('Failed to analyze impact. Please try again.');
      console.error('Error analyzing impact:', err);
    } finally {
      setIsAnalyzingImpact(false);
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

  // When currentInstructionHistoryIndex changes, update displayed instruction
  useEffect(() => {
    if (currentInstructionHistoryIndex !== null && instructionHistory[currentInstructionHistoryIndex]) {
      const historyItem = instructionHistory[currentInstructionHistoryIndex];
      setInstruction(historyItem.instruction);
    }
  }, [currentInstructionHistoryIndex]);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-40 p-4">
      <div className="bg-white/80 backdrop-blur-xl border-2 border-[#0052cc] rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-confluence-blue/90 to-confluence-light-blue/90 backdrop-blur-xl p-6 text-white border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Code className="w-8 h-8" />
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
                  const isActive = feature.id === 'code';
                  
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Configuration
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
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Page Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Code Page
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPageDropdownOpen(!isPageDropdownOpen)}
                      disabled={!selectedSpace}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm text-left flex items-center justify-between disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <span className={selectedPage === '' ? 'text-gray-500' : 'text-gray-700'}>
                        {selectedPage === '' ? 'Choose a page...' : selectedPage}
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
                        {/* Search Input */}
                        <div className="p-3 border-b border-white/20 bg-white/50">
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
                              <button
                                key={page}
                                type="button"
                                onClick={() => { handlePageSelect(page); setIsPageDropdownOpen(false); setPageSearch(''); }}
                                className={`w-full text-left flex items-center space-x-3 p-3 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0 ${selectedPage === page ? 'bg-confluence-blue/10' : ''}`}
                              >
                                <span className="text-sm text-gray-700 flex-1">{page}</span>
                                {selectedPage === page && <Check className="w-4 h-4 text-confluence-blue" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Actions */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    AI Actions
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAiActionDropdownOpen(!isAiActionDropdownOpen)}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm text-left flex items-center justify-between"
                    >
                      <span className={aiAction === '' || aiAction === 'Select action...' ? 'text-gray-500' : 'text-gray-700'}>
                        {aiAction === '' || aiAction === 'Select action...' ? 'Select action...' : aiAction}
                      </span>
                      {isAiActionDropdownOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {isAiActionDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl max-h-48 overflow-hidden">
                        <div className="p-2 border-b border-white/20 bg-white/50">
                          <input
                            type="text"
                            value={aiActionSearch}
                            onChange={e => setAiActionSearch(e.target.value)}
                            placeholder="Search actions..."
                            className="w-full px-2 py-1 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/80 placeholder-gray-400 mb-1"
                          />
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          {aiActions.filter(a => a.toLowerCase().includes(aiActionSearch.toLowerCase())).length === 0 ? (
                            <div className="p-2 text-gray-500 text-sm text-center">No actions found</div>
                          ) : (
                            aiActions.filter(a => a.toLowerCase().includes(aiActionSearch.toLowerCase())).map(a => (
                              <button
                                key={a}
                                type="button"
                                onClick={() => { setAiAction(a); setIsAiActionDropdownOpen(false); setAiActionSearch(''); }}
                                className={`w-full text-left flex items-center space-x-2 p-2 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0 ${aiAction === a ? 'bg-confluence-blue/10' : ''}`}
                              >
                                <span className="text-sm text-gray-700 flex-1">{a}</span>
                                {aiAction === a && <Check className="w-4 h-4 text-confluence-blue" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Instruction Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modification Instruction
                  </label>
                  
                  {/* --- History Dropdown for Instructions --- */}
                  {instructionHistory.length > 0 && (
                    <div className="mb-2 flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Instruction History:</label>
                      <select
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                        value={currentInstructionHistoryIndex ?? 0}
                        onChange={e => setCurrentInstructionHistoryIndex(Number(e.target.value))}
                      >
                        {instructionHistory.map((item, idx) => (
                          <option key={idx} value={idx}>
                            {item.instruction.length > 40 ? item.instruction.slice(0, 40) + '...' : item.instruction}
                          </option>
                        ))}
                      </select>
                      {currentInstructionHistoryIndex !== null && currentInstructionHistoryIndex !== 0 && (
                        <button
                          className="text-xs text-confluence-blue underline ml-2"
                          onClick={() => setCurrentInstructionHistoryIndex(0)}
                        >
                          Go to Latest
                        </button>
                      )}
                    </div>
                  )}
                  {/* --- End History Dropdown --- */}
                  
                  <div className="w-full">
                    <VoiceRecorder
                      value={instruction}
                      onChange={setInstruction}
                      onConfirm={setInstruction}
                      inputPlaceholder="Describe the changes you want to make to the code..."
                    />
                  </div>
                </div>

                {/* Target Language */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Language</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTargetLanguageDropdownOpen(!isTargetLanguageDropdownOpen)}
                      className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm text-left flex items-center justify-between"
                    >
                      <span className={targetLanguage === '' ? 'text-gray-500' : 'text-gray-700'}>
                        {targetLanguage === '' ? 'Select language...' : targetLanguage}
                      </span>
                      {isTargetLanguageDropdownOpen ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {isTargetLanguageDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-white/95 backdrop-blur-xl border border-white/30 rounded-lg shadow-xl max-h-48 overflow-hidden">
                        <div className="p-2 border-b border-white/20 bg-white/50">
                          <input
                            type="text"
                            value={targetLanguageSearch}
                            onChange={e => setTargetLanguageSearch(e.target.value)}
                            placeholder="Search languages..."
                            className="w-full px-2 py-1 border border-white/20 rounded-lg text-sm focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/80 placeholder-gray-400 mb-1"
                          />
                        </div>
                        <div className="max-h-32 overflow-y-auto">
                          {languages.filter(l => l.toLowerCase().includes(targetLanguageSearch.toLowerCase())).length === 0 ? (
                            <div className="p-2 text-gray-500 text-sm text-center">No languages found</div>
                          ) : (
                            languages.filter(l => l.toLowerCase().includes(targetLanguageSearch.toLowerCase())).map(l => (
                              <button
                                key={l}
                                type="button"
                                onClick={() => { setTargetLanguage(l); setIsTargetLanguageDropdownOpen(false); setTargetLanguageSearch(''); }}
                                className={`w-full text-left flex items-center space-x-2 p-2 hover:bg-white/50 cursor-pointer border-b border-white/10 last:border-b-0 ${targetLanguage === l ? 'bg-confluence-blue/10' : ''}`}
                              >
                                <span className="text-sm text-gray-700 flex-1">{l}</span>
                                {targetLanguage === l && <Check className="w-4 h-4 text-confluence-blue" />}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* File Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output File Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="my-component"
                    className="w-full p-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-confluence-blue focus:border-confluence-blue bg-white/70 backdrop-blur-sm"
                  />
                </div>

                {/* Process Button */}
                <button
                  onClick={processCode}
                  disabled={!selectedSpace || !selectedPage || isProcessing}
                  className="w-full bg-confluence-blue/90 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-confluence-blue disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      <span>Process Code</span>
                    </>
                  )}
                </button>

                {/* Analyze Impact Button */}
                {(aiActionOutput || modificationOutput || conversionOutput || processedCode) && (
                  <button
                    onClick={analyzeImpact}
                    disabled={!detectedCode || isAnalyzingImpact}
                    className="w-full bg-green-600/90 backdrop-blur-sm text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors border border-white/10 mt-3"
                  >
                    {isAnalyzingImpact ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Analyzing Impact...</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-5 h-5" />
                        <span>Analyze Impact</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Middle Column - Original Code */}
            <div className="space-y-6">
              <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Original Code</h3>
                {detectedCode ? (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <pre className="text-sm text-gray-300">
                      <code>{detectedCode}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Code className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Select a code page to view content</p>
                  </div>
                )}
              </div>

              {summary && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4">Page Summary</h3>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <p className="text-sm text-gray-700">{summary}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Processed Code */}
            <div className="space-y-6">
              {/* AI Result section: show all outputs */}
              <div ref={aiResultRef} className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">AI Result</h3>
                </div>
                {aiActionOutput && (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <div className="mb-2 text-sm text-gray-400">
                      <strong>AI Action:</strong> {aiAction}
                    </div>
                    <pre className="text-sm text-gray-300">
                      <code>{aiActionOutput}</code>
                    </pre>
                  </div>
                )}
                {conversionOutput && (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <div className="mb-2 text-sm text-gray-400">
                      <strong>Target Language Conversion:</strong> {targetLanguage}
                    </div>
                    <pre className="text-sm text-gray-300">
                      <code>{conversionOutput}</code>
                    </pre>
                  </div>
                )}
                {modificationOutput && (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <div className="mb-2 text-sm text-gray-400">
                      <strong>Modification Instruction:</strong> {instruction}
                    </div>
                    <pre className="text-sm text-gray-300">
                      <code>{modificationOutput}</code>
                    </pre>
                  </div>
                )}
                {/* Fallback: processedCode for legacy support */}
                {!aiActionOutput && !conversionOutput && !modificationOutput && processedCode && (
                  <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 overflow-auto max-h-96 border border-white/10">
                    <pre className="text-sm text-gray-300">
                      <code>{processedCode}</code>
                    </pre>
                  </div>
                )}
                {/* Fallback: empty state */}
                {!aiActionOutput && !conversionOutput && !modificationOutput && !processedCode && (
                  <div className="text-center py-8 text-gray-500">
                    <Zap className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Process code to see AI results</p>
                  </div>
                )}
              </div>

              {/* Impact Analysis Results */}
              {impactAnalysis && (
                <div ref={impactAnalysisRef} className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                    Impact Analysis
                  </h3>
                  
                  {/* Metrics Summary */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="text-sm text-gray-600">Lines Added</div>
                      <div className="text-lg font-semibold text-green-600">{impactAnalysis.lines_added}</div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="text-sm text-gray-600">Lines Removed</div>
                      <div className="text-lg font-semibold text-red-600">{impactAnalysis.lines_removed}</div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="text-sm text-gray-600">Change %</div>
                      <div className="text-lg font-semibold text-blue-600">{impactAnalysis.percentage_change}%</div>
                    </div>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="text-sm text-gray-600">Risk Level</div>
                      <div className={`text-lg font-semibold ${
                        impactAnalysis.risk_level === 'low' ? 'text-green-600' : 
                        impactAnalysis.risk_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {impactAnalysis.risk_level.toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Impact Analysis */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Impact Summary</h4>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{impactAnalysis.impact_analysis}</p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Recommendations</h4>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{impactAnalysis.recommendations}</p>
                    </div>
                  </div>

                  {/* Risk Analysis */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Risk Analysis</h4>
                    <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{impactAnalysis.risk_analysis}</p>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {impactAnalysis.risk_factors && impactAnalysis.risk_factors.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-800 mb-2">Risk Factors</h4>
                      <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                        <ul className="text-sm text-gray-700 space-y-1">
                          {impactAnalysis.risk_factors.map((factor: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span>{factor}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Code Diff */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Code Changes</h4>
                    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 border border-white/10 overflow-auto max-h-48">
                      <pre className="text-xs text-gray-300">
                        <code>{impactAnalysis.diff}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Options */}
              {(processedCode || modificationOutput || conversionOutput || aiActionOutput) && (
                <div className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-white/20 shadow-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Export Options</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Export Format:</label>
                      <select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="px-3 py-1 border border-white/30 rounded text-sm focus:ring-2 focus:ring-confluence-blue bg-white/70 backdrop-blur-sm"
                      >
                        <option value="markdown">Markdown</option>
                        <option value="pdf">PDF</option>
                        <option value="docx">Word Document</option>
                        <option value="txt">Plain Text</option>
                      </select>
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
                        onClick={() => exportCode(exportFormat)}
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
                            const content = modificationOutput || conversionOutput || aiActionOutput || processedCode || '';
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
                              const content = modificationOutput || conversionOutput || aiActionOutput || processedCode || '';
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
                            try {
                              const content = modificationOutput || conversionOutput || aiActionOutput || processedCode || '';
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
                        className="flex items-center space-x-2 px-4 py-2 bg-confluence-blue/90 backdrop-blur-sm text-white rounded-lg hover:bg-confluence-blue transition-colors border border-white/10"
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

export default CodeAssistant;