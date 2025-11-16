# QuicAudio - Real-time Voice Chat

Random voice chat application with AI-powered matching and real-time communication.

## Features

- 🎤 Real-time voice chat with strangers
- 🤖 AI-powered user matching
- 🔒 Safe and anonymous conversations
- ⚡ WebSocket-based instant connections
- 📊 User tracking and analytics

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS, Wouter
- **Backend**: Express, Socket.IO, Node.js
- **Database**: PostgreSQL (Neon)
- **AI**: OpenAI API
- **Real-time**: WebSockets (Socket.IO)

## Deployment on Render

### Prerequisites

1. **Neon Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy your connection string (use "Pooled connection")

2. **OpenAI API Key**
   - Get your API key from [platform.openai.com](https://platform.openai.com/api-keys)

### Deploy Steps

1. **Connect GitHub Repository**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select the `QuicAudio` repository

2. **Configure Build Settings**
   - Name: `quicaudio`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`

3. **Add Environment Variables**

   Go to the "Environment" tab and add:

   ```
   DATABASE_URL=postgresql://your-neon-connection-string
   OPENAI_API_KEY=sk-your-openai-api-key
   NODE_ENV=production
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for the build to complete
   - Your app will be live at `https://quicaudio.onrender.com`

## Important Notes

⚠️ **Why Vercel Won't Work**: This app uses Socket.IO for real-time WebSocket connections, which Vercel's serverless platform doesn't support. Use Render, Railway, or Fly.io instead.

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/yaseenlenceria/QuicAudio.git
   cd QuicAudio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   DATABASE_URL=your-neon-database-url
   OPENAI_API_KEY=your-openai-api-key
   ```

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:5000](http://localhost:5000)

## Troubleshooting

### "DATABASE_URL must be set" Error

This means you haven't added the `DATABASE_URL` environment variable in Render.

**Solution:**
1. Go to Render Dashboard → Your Service → Environment tab
2. Add `DATABASE_URL` with your Neon connection string
3. Save and redeploy

### "OPENAI_API_KEY is not set" Error

Add your OpenAI API key in Render's Environment variables.

### Free Instance Spins Down

Render's free tier sleeps after inactivity. First request may take 50+ seconds. Consider upgrading to a paid plan for production use.

## License

MIT
