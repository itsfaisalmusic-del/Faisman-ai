# FAI AI V2.0 — Roman Urdu Setup Guide

Assalam-o-Alaikum Faisal bhai!

Ye FAI AI V2.0 ka fresh starter project hai. Is mein Premium Dark Black + Blue interface, chat history, voice input, image upload aur Gemini AI backend ka setup diya gaya hai.

## Project files
- `index.html` — website ka structure
- `style.css` — design
- `app.js` — chat, history, voice aur image upload
- `worker/index.js` — secure AI backend
- `worker/wrangler.toml` — Cloudflare Worker configuration

## Zaroori baat
Frontend abhi backend URL ke baghair AI jawab nahi dega. Asli AI ke liye Gemini API key chahiye. API key kabhi `app.js`, GitHub repository ya public website mein paste NA karein. Isay Cloudflare Worker secret mein rakhein.

## Android par pehla kaam
1. ZIP extract karein.
2. Files ko check karein. `index.html`, `style.css`, `app.js` aur `worker` folder maujood hone chahiye.
3. Abhi GitHub par upload karne se pehle backend deploy aur test karna baqi hai.
4. Cloudflare Worker banane ke baad uska URL copy karein.
5. `app.js` mein sab se upar `API_URL` ke andar Worker URL paste karein.
6. Phir files dobara test karke GitHub par upload karein.

## Cloudflare Worker deploy
Is project ka backend `worker/index.js` hai. Cloudflare dashboard mein Workers & Pages se naya Worker banayein aur `worker/index.js` ka code paste karein. Settings / Variables and Secrets mein:
- Secret name: `GEMINI_API_KEY`
- Secret value: apni Google AI Studio API key

`GEMINI_MODEL` variable optional hai; default `gemini-2.5-flash` hai.

Deploy ke baad Worker ka URL copy karein. `app.js` mein:
`const API_URL = "";`
ko is tarah update karein:
`const API_URL = "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev";`

Phir website files dobara deploy karein.

## Abhi included features
- Text AI chat (backend connect hone ke baad)
- Local chat history (isi browser/device par)
- Image upload aur AI image question (backend connect hone ke baad)
- Voice input aur jawab ko bol kar sunna (browser support aur microphone/speaker permission par depend)
- Responsive mobile interface

## Abhi included NAHI
- Voice se AI ka bol kar jawab dena (text-to-speech next phase mein add karenge)
- Login / cloud sync
- APK package
- Live domain / SEO setup

## Safety
- API key ko GitHub par upload na karein.
- Public use se pehle Worker par rate limiting aur origin restrictions lagani chahiye.
- Gemini free-tier limits aur availability provider ke rules ke mutabiq badal sakti hain.
