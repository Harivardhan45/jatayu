# Confluence AI Assistant

A modern React-based web application that integrates with Confluence and provides AI-powered tools for content analysis, code assistance, impact analysis, and more.

## Features

- **AI Powered Search**: Search and analyze Confluence pages using AI
- **Code Assistant**: Modify and convert code from Confluence pages
- **Impact Analyzer**: Analyze code changes and their impact with Stack Overflow Risk Checker
- **Test Support Tool**: Generate test strategies and analyze test data
- **Video Summarizer**: Summarize video content (coming soon)

### Stack Overflow Risk Checker

The Impact Analyzer now includes an integrated Stack Overflow Risk Checker that:

- **Scans recent changes** for usage of outdated methods and deprecated features
- **Queries real Stack Overflow API** to identify risky code practices
- **Suggests alternatives** based on best practices from Stack Overflow discussions
- **Flags deprecation warnings** and provides modern alternatives
- **Provides risk assessment** with high, medium, and low risk levels
- **Links to actual Stack Overflow discussions** for further reading

**Supported Risk Patterns:**
- `eval()` function usage (High Risk)
- Direct `innerHTML` assignment (Medium Risk)
- `document.write()` usage (High Risk)
- `setTimeout(..., 0)` patterns (Low Risk)
- `console.log()` in production code (Low Risk)
- `var` declarations (Medium Risk)
- `var` in for loops (Medium Risk)

**API Integration:**
- **Real Stack Overflow API**: Queries actual Stack Overflow discussions
- **Smart Search**: Uses optimized search terms for each risk pattern
- **Fallback Support**: Works without API key (limited rate)
- **Rate Limiting**: Respects Stack Overflow API limits
- **Separate Button**: Dedicated "Stack Overflow Risk Check" button for independent execution

## Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- Confluence instance with API access
- Gemini API key
- Stack Overflow API key (optional but recommended)

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
CONFLUENCE_BASE_URL=https://your-domain.atlassian.net
CONFLUENCE_USER_EMAIL=your-email@domain.com
CONFLUENCE_API_KEY=your-confluence-api-key
GENAI_API_KEY_1=your-gemini-api-key
GENAI_API_KEY_2=your-backup-gemini-api-key
ASSEMBLYAI_API_KEY=your-assemblyai-api-key
STACK_OVERFLOW_API_KEY=your-stack-overflow-api-key
```

### Getting API Keys

**Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file

**Stack Overflow API Key (Optional):**
1. Visit [Stack Exchange API](https://api.stackexchange.com/docs/authentication)
2. Register for a free API key
3. Add it to your `.env` file as `STACK_OVERFLOW_API_KEY`
4. Without this key, the system will still work but with limited rate limits

## Installation

1. **Install Frontend Dependencies**:
   ```bash
   npm install
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

## Running the Application

### Option 1: Run Both Frontend and Backend Together
```bash
npm run dev:full
```

### Option 2: Run Separately

**Frontend (React)**:
```bash
npm run dev
```

**Backend (FastAPI)**:
```bash
npm run backend
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Usage

1. **Start the application** using one of the methods above
2. **Enter your Gemini API key** in the application
3. **Select a Confluence space** from the dropdown
4. **Choose pages** to analyze or work with
5. **Use the AI features** to:
   - Search and analyze content
   - Modify and convert code
   - Analyze code changes
   - Generate test strategies

## API Endpoints

The backend provides the following API endpoints:

- `GET /spaces` - Get all Confluence spaces
- `GET /pages/{space_key}` - Get pages from a specific space
- `POST /search` - AI-powered search functionality
- `POST /code-assistant` - Code modification and conversion
- `POST /impact-analyzer` - Code change impact analysis with Stack Overflow risk checking
- `POST /test-support` - Test strategy generation
- `POST /export` - Export content in various formats

## Project Structure

```
UI-main/
├── src/
│   ├── components/          # React components
│   │   ├── AIPoweredSearch.tsx
│   │   ├── CodeAssistant.tsx
│   │   ├── ImpactAnalyzer.tsx
│   │   ├── TestSupportTool.tsx
│   │   └── VideoSummarizer.tsx
│   ├── services/
│   │   └── api.ts          # API service layer
│   ├── App.tsx             # Main application component
│   └── main.tsx            # Application entry point
├── backend/
│   ├── main.py             # FastAPI backend server
│   └── requirements.txt    # Python dependencies
├── package.json            # Node.js dependencies and scripts
└── README.md              # This file
```

## Development

### Frontend Development
- Built with React 18, TypeScript, and Vite
- Uses Tailwind CSS for styling
- Lucide React for icons

### Backend Development
- Built with FastAPI
- Integrates with Confluence API
- Uses Google Gemini AI for content processing
- Supports multiple export formats (PDF, DOCX, CSV, etc.)

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the backend is running on port 8000 and the frontend is configured to connect to it.

2. **API Key Issues**: Verify your Gemini API key is valid and has sufficient quota.

3. **Confluence Connection**: Ensure your Confluence credentials are correct and the instance is accessible.

4. **Python Dependencies**: If you encounter Python import errors, make sure all dependencies are installed:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Getting Help

If you encounter issues:
1. Check the browser console for frontend errors
2. Check the terminal running the backend for Python errors
3. Verify all environment variables are set correctly
4. Ensure both frontend and backend are running

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
