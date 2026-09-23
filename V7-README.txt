DH Manager / DH ADS MEDIA — V7 Rebuild
- Full visual redesign across Overview, DH ADS MEDIA, Clients, Packages, Tasks, Finance, Calendar.
- Dark navy / blue intelligence / gold luxury system matching DESIGN-REFERENCE-V7.png.
- DH Vision: up to 4 product images in AI Campaign Builder; images are sent to the OpenAI Responses API for visual analysis.
- Existing OpenAI environment variable remains OPENAI_API_KEY.
- Existing Supabase history remains supported.
- Product image data itself is not stored in ad_ai_history in this version; image filenames are recorded to avoid bloating the database. AI analysis/result is stored.
- Upload limit: 6 MB per image in the browser.
