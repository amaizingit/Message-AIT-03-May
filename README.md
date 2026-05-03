<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2c7d0125-a7f5-429b-a894-7a937beaa7f5

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

1. **Push to GitHub**: Upload this project to your GitHub repository.
2. **Connect to Vercel**: 
   - Go to [Vercel](https://vercel.com) and click **"Add New"** > **"Project"**.
   - Import your GitHub repository.
3. **Configure Settings**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - Under the **Environment Variables** section, add your `GEMINI_API_KEY`.
5. **Deploy**: Click "Deploy" and your app will be live!
