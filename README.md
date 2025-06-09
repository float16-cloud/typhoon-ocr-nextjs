# Typhoon OCR - Next.js Web Application

A modern web application built with Next.js that provides OCR capabilities powered by Typhoon-7B model. This application can be easily deployed to Float16's serverless GPU infrastructure for scalable document processing.

## Features

- 🖼️ **File Upload**: Drag & drop interface for images and PDF files
- 🔍 **OCR Processing**: Extract text from images using Typhoon-7B OCR model
- 📄 **PDF Support**: Process PDF documents with multiple pages
- 📱 **Responsive Design**: Mobile-friendly interface with modern UI
- ⚡ **Fast Processing**: Serverless GPU-powered backend via Float16

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: FastAPI with Typhoon-7B OCR model
- **Deployment**: Float16 Serverless GPU

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Float16 account for backend deployment

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd typhoon-ocr-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_OCR_API_URL=https://your-float16-deployment-url.com/task/run/function/abcde
   OCR_API_KEY=
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_OCR_API_URL` | URL of your deployed FastAPI backend on Float16 | Yes | `https://api.float16.cloud/your-deployment` |
| `OCR_API_KEY` | API key for authenticating with the OCR backend service | Yes | `your-api-key-here` |

## Backend Setup (Float16 Deployment)

This frontend connects to a FastAPI backend that runs the Typhoon-7B OCR model. 

### Backend Repository
The backend code is available at: https://github.com/float16-cloud/examples/tree/main/official/deploy/fastapi-typhoon-7b-ocr

### Quick Deploy to Float16

1. **Sign up for Float16**
   - Create an account at [Float16](https://float16.cloud)
   - Get your API key from the dashboard

2. **Deploy the backend**
   Follow the deployment guide in the backend repository to deploy the FastAPI OCR service to Float16's serverless GPU infrastructure.


## Usage

1. **Upload Files**: Drag and drop PDF files onto the upload area
2. **Process**: Click "Process" to send files to the OCR backend
3. **View Results**: Extracted text will be displayed in a formatted markdown view

## Supported File Types

- **Documents**: PDF (multi-page support)

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── results/           # Results page
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # UI components (Radix UI)
│   ├── file-uploader.tsx # File upload component
│   └── markdown-display.tsx # Results display
├── lib/                  # Utility functions
└── public/              # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

---

**Note**: Make sure to deploy the backend service to Float16 before using this frontend application. The backend provides the OCR processing capabilities using the Typhoon-7B model.