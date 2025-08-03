# Confluence AI Assistant (C.AIA)

A powerful AI-powered assistant that integrates with Confluence to provide intelligent search, analysis, and automation capabilities. This application helps teams extract insights from their Confluence documentation, analyze code changes, generate test strategies, and automate various documentation tasks.

## Features

### Core AI Features
- **Auto High Level Solution Design (HLSD)**: Automatically generate comprehensive solution design documents from code files with architecture analysis
- **AI-Powered Search**: Hybrid RAG (Retrieval-Augmented Generation) with Google Search integration and Google Chat notifications
- **Video Summarizer**: Extract insights from video content using AssemblyAI transcription with Slack/Jira task integration
- **Code Assistant**: Analyze, modify, and convert code between different programming languages
- **Impact Analyzer**: Assess the impact of code changes with risk analysis, recommendations, and Stack Overflow integration
- **Document Analysis**: Evaluate documentation quality across maintainability, usability, accessibility, and consistency
- **Test Support Tool**: Generate comprehensive test strategies and cross-platform testing plans with GitHub Actions integration

### Export & Integration Features
- **Multi-Format Export**: Export content to PDF, DOCX, PPTX, CSV, JSON, HTML, and TXT formats
- **Confluence Integration**: Save analysis results directly to Confluence pages
- **GitHub Actions Integration**: Automatically generate CI/CD workflows and test configurations
- **Jira & Slack Integration**: Push tasks and notifications to Jira and Slack

### Advanced Features
- **Chart Builder**: Create visual charts from data tables and Excel files using AI
- **Voice Recording**: Voice-to-text input for questions and queries
- **Agent Mode**: Agentic AI implementation for goal-based analysis across multiple Confluence spaces with intelligent tool selection and reasoning

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework for building APIs with automatic OpenAPI documentation
- **Google Gemini AI**: Advanced AI model for natural language processing and content generation
- **Atlassian Python API**: Confluence integration for page management and content retrieval
- **FPDF2**: PDF generation with support for text, tables, and formatting
- **python-docx**: Word document generation with rich formatting capabilities
- **python-pptx**: PowerPoint presentation generation for reports and summaries
- **AssemblyAI**: Video transcription and analysis with speaker detection
- **Matplotlib/Seaborn**: Chart generation and data visualization
- **Pydantic**: Data validation and serialization for API requests/responses
- **Uvicorn**: ASGI server for running FastAPI applications
- **Requests**: HTTP library for external API integrations
- **BeautifulSoup4**: HTML parsing for web content extraction
- **Pillow**: Image processing for chart and image analysis
- **OpenPyXL**: Excel file processing for data import/export
- **python-multipart**: File upload handling for video and document processing

### Frontend
- **React 18**: Modern React with TypeScript
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Chart.js**: Interactive charts and visualizations
- **React Router**: Client-side routing

### Infrastructure
- **Render**: Cloud hosting platform
- **Environment Variables**: Secure configuration management

## Prerequisites

Before running this application, ensure you have:

- **Python 3.8+** installed
- **Node.js 16+** installed
- **Git** for version control
- Access to the following services:
  - Confluence instance (for documentation storage and retrieval)
  - Google Gemini AI API (for AI-powered analysis and insights)
  - AssemblyAI API (for meeting transcription and video analysis)
  - GitHub (for GitHub Actions integration and CI/CD workflows)
  - Jira (optional, for task management and requirement tracking)
  - Slack (optional, for team notifications and collaboration)
  - Google Search API (optional, for enhanced search capabilities)
  - Stack Overflow API (optional, for technical risk assessment)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/confluence-ai-assistant.git
cd confluence-ai-assistant
```

### 2. Backend Setup

```bash
cd UI-main/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
cd UI-main

# Install dependencies
npm install

# Build the application
npm run build
```

### 4. Environment Configuration

Create a `.env` file in the `UI-main/backend` directory:

```env
# Confluence Configuration
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_USER_EMAIL=your-email@domain.com
CONFLUENCE_API_KEY=your-confluence-api-key

# AI Configuration
GENAI_API_KEY_1=your-gemini-api-key-1
GENAI_API_KEY_2=your-gemini-api-key-2

# AssemblyAI (for video features)
ASSEMBLYAI_API_KEY=your-assemblyai-api-key

# Optional: Google Search API (for Hybrid RAG)
GOOGLE_API_KEY=your-google-api-key
SEARCH_ENGINE_ID=your-search-engine-id

# Optional: Stack Overflow API (for Impact Analyzer)
STACK_OVERFLOW_API_KEY=your-stack-overflow-api-key

# Optional: Jira Integration (for Video Summarizer and Task Management)
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@domain.com
JIRA_API_TOKEN=your-jira-api-token

# Optional: Slack Integration (for Video Summarizer and Notifications)
SLACK_TOKEN=your-slack-bot-token

# Optional: Google Chat Integration (for AI-Powered Search)
GOOGLE_CHAT_WEBHOOK_URL=your-google-chat-webhook-url
```

## Running the Application

### Development Mode

#### Backend
```bash
cd UI-main/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd UI-main
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Production Deployment

#### Using Render

1. **Backend Deployment**:
   - Connect your GitHub repository to Render
   - Create a new Web Service
   - Set the build command: `pip install -r requirements.txt`
   - Set the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Add all environment variables from your `.env` file

2. **Frontend Deployment**:
   - Create a new Static Site in Render
   - Set the build command: `npm install && npm run build`
   - Set the publish directory: `dist`
   - Configure environment variables for API endpoints

## Usage Guide

### Getting Started

1. **Configure API Keys**: Set up your environment variables with the required API keys
2. **Connect to Confluence**: The app will automatically detect your Confluence spaces
3. **Select a Tool**: Choose from the available AI-powered tools in the interface
4. **Analyze Content**: Use the tools to extract insights, analyze code, or generate reports
5. **Export Results**: Download results in your preferred format (PDF, DOCX, etc.)


### Available Tools

#### Auto High Level Solution Design (HLSD)
- **Automatic Deployment Integration**: Produces clear, structured HLSD documents every time the backend code is deployed
- **Architecture Analysis**: Automatically analyze Python code files for architecture patterns using Gemini AI
- **Comprehensive Documentation**: Generate detailed solution design documents covering all aspects of the system
- **Component Identification**: Identify main components, API endpoints, and integration points
- **Integration Flow Mapping**: Map and document data flows between different system components
- **Confluence Integration**: Save generated HLSD documents directly to Confluence pages
- **Zero Manual Effort**: Completely automated process requiring no manual intervention
- **Real-time Updates**: HLSD documentation stays current with every code deployment

#### AI-Powered Search
- **Hybrid RAG Implementation**: Combines Confluence content with real-time web search results
- **Google Search Integration**: Enhances responses with current web information
- **Google Chat Notifications**: Send search results and insights directly to Google Chat
- **Context-Aware Responses**: Get intelligent answers based on your documentation and web data
- **Follow-up Questions**: Ask deeper questions for enhanced insights

#### Video Summarizer
- **AssemblyAI Transcription**: High-accuracy video-to-text conversion
- **Automatic Summarization**: AI-generated summaries with key insights
- **Quote Extraction**: Identify and extract important quotes from video content
- **Timestamp Generation**: Create clickable timestamps for key moments
- **Slack/Jira Integration**: Automatically create tasks in Jira and send notifications to Slack
- **Q&A Capability**: Ask specific questions about video content

#### Code Assistant
- Analyze code from Confluence pages
- Modify code based on instructions
- Convert code between programming languages
- Generate code summaries and explanations

#### Impact Analyzer
- **Code Comparison**: Compare different versions of code or documentation
- **Risk Assessment**: Detailed impact analysis with risk scoring and categorization
- **Stack Overflow Integration**: Check for potential issues and best practices using real Stack Overflow data
- **Recommendations Engine**: Receive AI-powered recommendations for improvements
- **Risk Factor Analysis**: Identify specific risk factors with severity levels

#### Test Support Tool
- **Comprehensive Test Strategies**: Generate detailed testing approaches for different scenarios
- **Cross-Platform Testing Plans**: Create platform-specific testing strategies
- **Data Sensitivity Analysis**: Analyze test data for privacy and security considerations
- **GitHub Actions Integration**: Automatically generate CI/CD workflows and test configurations
- **Language Detection**: Automatically detect programming languages and frameworks
- **Test Framework Recommendations**: Suggest appropriate testing tools and frameworks

#### Document Analysis
- **Quality Assessment**: Evaluate documentation across four key dimensions
- **Maintainability Analysis**: Assess how easy it is to update and maintain documentation
- **Usability Evaluation**: Check how user-friendly and understandable the content is
- **Accessibility Review**: Ensure documentation meets accessibility standards
- **Consistency Check**: Verify consistent structure, terminology, and formatting
- **Actionable Recommendations**: Get specific, implementable improvement suggestions

#### Chart Builder
- **AI-Powered Visualization**: Create visual charts from data tables and Excel files using AI
- **Multiple Chart Types**: Generate bar charts, line charts, pie charts, and scatter plots
- **Data Analysis**: AI automatically analyzes data patterns and suggests appropriate chart types
- **Export Capabilities**: Download charts in various formats (PNG, PDF, SVG)
- **Confluence Integration**: Save charts directly to Confluence pages
- **Real-time Generation**: Instant chart creation from uploaded data files

#### Agent Mode
- **Agentic AI Implementation**: Goal-based analysis across multiple Confluence spaces
- **Intelligent Tool Selection**: AI automatically selects the most appropriate tools for your goal
- **Multi-Space Analysis**: Analyze content across different Confluence spaces simultaneously
- **Reasoning Engine**: AI provides step-by-step reasoning for its analysis approach
- **Comprehensive Planning**: Creates detailed execution plans before performing analysis
- **Cross-Tool Integration**: Combines multiple AI tools for comprehensive insights
- **Goal-Oriented Results**: Focuses analysis on achieving specific business objectives

## API Endpoints

### Core Endpoints
- `GET /spaces` - Get available Confluence spaces
- `GET /pages/{space_key}` - Get pages from a specific space
- `POST /search` - AI-powered search across pages
- `POST /export` - Export content in various formats

### Feature-Specific Endpoints
- `POST /video-summarizer` - Video analysis and summarization
- `POST /code-assistant` - Code analysis and modification
- `POST /impact-analyzer` - Change impact analysis
- `POST /test-support` - Test strategy generation
- `POST /analyze-document` - Document quality analysis
- `POST /github-actions-integration` - GitHub Actions workflow generation

### Integration Endpoints
- `POST /save-to-confluence` - Save content to Confluence
- `POST /push-to-jira-confluence-slack` - Push tasks to Jira and Slack
- `POST /create-chart` - Generate charts from data
- `POST /image-summary` - Analyze images with AI
- `POST /send-to-google-chat` - Send notifications to Google Chat

## Project Structure

```
confluence-ai-assistant/
├── UI-main/
│   ├── backend/
│   │   ├── main.py              # FastAPI application
│   │   ├── requirements.txt     # Python dependencies
│   │   ├── runtime.txt          # Python runtime version
│   │   └── render.yaml          # Render deployment config
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── AIPoweredSearch.tsx
│   │   │   ├── CodeAssistant.tsx
│   │   │   ├── ImpactAnalyzer.tsx
│   │   │   ├── VideoSummarizer.tsx
│   │   │   └── ...
│   │   ├── services/
│   │   │   └── api.ts           # API service layer
│   │   ├── utils/               # Utility functions
│   │   └── App.tsx              # Main application component
│   ├── package.json             # Node.js dependencies
│   ├── vite.config.ts           # Vite configuration
│   └── tailwind.config.js       # Tailwind CSS configuration
├── README.md                    # This file
└── .gitignore                   # Git ignore rules
```

## Security Considerations

- **API Keys**: Never commit API keys to version control
- **Environment Variables**: Use environment variables for all sensitive configuration
- **CORS**: Configure CORS settings appropriately for your deployment
- **Rate Limiting**: Implement rate limiting for production deployments
- **Input Validation**: All user inputs are validated and sanitized

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Note**: This application requires valid API keys and access to the respective services. Make sure to review the pricing and usage limits for each service before deploying to production.

---

**Developed by Team Work Wizards** 