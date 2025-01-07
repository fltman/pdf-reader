# PDF Reader with AI Analysis

A React-based PDF reader application that uses OpenAI's API to analyze documents, generate summaries, extract keywords, and create mind maps. Built with React, TypeScript, and Vite.

## Features

- PDF document viewing
- AI-powered document analysis
- Document summarization
- Keyword extraction
- Interactive mind mapping
- Text-to-speech capabilities

## Prerequisites

- Node.js (v18 or higher recommended)
- npm (v9 or higher) or yarn package manager
- OpenAI API key (GPT-4 access required)
- ElevenLabs API key (optional, for text-to-speech features)
- Modern web browser (Chrome, Firefox, Safari, or Edge)

## Supported File Types

- PDF documents (.pdf)
- Maximum file size: 25MB
- Text must be selectable in the PDF (non-scanned documents)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pdf-reader
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your API keys:
```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here  # Optional
```

## Usage

1. Start the application:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

3. Upload a PDF document using the upload button

4. Available features:
   - **Document Viewing**: Navigate through pages using arrow keys or scroll
   - **AI Analysis**: Click the analyze button to generate insights
   - **Summary**: View an AI-generated summary of the document
   - **Keywords**: See key concepts and their definitions
   - **Mind Map**: Explore document concepts in an interactive graph
   - **Text-to-Speech**: Listen to document sections (requires ElevenLabs API key)

## Development

To run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Building for Production

To create a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

## Tech Stack

- React 18
- TypeScript
- Vite
- TailwindCSS
- OpenAI API
- PDF.js
- React Force Graph 2D
- ElevenLabs API (optional)

## Project Structure

```
src/
  ├── components/      # React components
  ├── services/        # API and service integrations
  ├── styles/          # CSS and styling files
  └── main.tsx         # Application entry point
```

## Troubleshooting

Common issues and solutions:

1. **PDF fails to load**: Ensure the PDF is not password-protected and is under 25MB
2. **AI analysis not working**: Verify your OpenAI API key and ensure you have GPT-4 access
3. **Text-to-speech unavailable**: Check your ElevenLabs API key if you want to use this feature

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
