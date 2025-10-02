# 🚀 Oryn Alert Hub - Vercel Deployment Guide

## Prerequisites
- [Vercel Account](https://vercel.com) (free tier available)
- [GitHub Account](https://github.com) (to connect your repository)
- Your project code pushed to GitHub

## Deployment Steps

### 1. Push to GitHub
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit - Oryn Alert Hub"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/oryn-alert-hub.git
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project directory
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name: oryn-alert-hub
# - Directory: ./
# - Override settings? No
```

#### Option B: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure settings (auto-detected for Next.js)
5. Click "Deploy"

### 3. Environment Variables Setup

In your Vercel dashboard, go to Project Settings → Environment Variables and add:

#### Required for Basic Functionality:
```
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Optional (for full features):
```
# Discord Integration
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_secret
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_PUBLIC_KEY=your_discord_public_key

# Payment Processing
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

# Stock Data APIs
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
OPENAI_API_KEY=your_openai_key

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
```

### 4. Database Setup (Supabase)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL migrations from `supabase/migrations/`
4. Copy the URL and anon key to Vercel environment variables

### 5. Domain Configuration (Optional)

1. In Vercel dashboard, go to Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_BASE_URL` environment variable

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All features tested

## Troubleshooting

### Build Errors
- Check Node.js version (should be 18+)
- Verify all dependencies in package.json
- Check for TypeScript errors: `npm run build`

### Runtime Errors
- Check environment variables are set correctly
- Verify database connection
- Check API endpoints are working

### Performance Issues
- Enable Vercel Analytics
- Check bundle size with `npm run build`
- Optimize images and assets

## Support

For deployment issues:
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)

## Features Available After Deployment

✅ **Portfolio Tracker** - Add and track stocks
✅ **Stock Suggestions** - Real-time stock search
✅ **AI Analysis** - Portfolio insights and recommendations
✅ **Analytics Dashboard** - Performance metrics
✅ **Watchlist** - Monitor favorite stocks
✅ **Responsive Design** - Works on all devices
✅ **Authentication** - User login system
✅ **Subscription Management** - Pro features

## Next Steps

1. Set up monitoring with Vercel Analytics
2. Configure custom domain
3. Set up automated deployments from GitHub
4. Add monitoring and error tracking
5. Implement CI/CD pipeline

---

**Your Oryn Alert Hub is now live! 🎉**