// api/telegram.js
// Vercel Serverless Function — bot token stays server-side, never in browser

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, type, tmdbId, requestedAt, season, episode } = req.body;

  if (!title || !type || !tmdbId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Missing Telegram env vars');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const isEpisode = season != null && episode != null;
  const typeEmoji = type === 'movie' ? '🎬' : '📺';
  const typeLabel = isEpisode
    ? `TV Episode`
    : type === 'movie' ? 'Movie' : 'TV Series';
  const tmdbUrl = type === 'movie'
    ? `https://www.themoviedb.org/movie/${tmdbId}`
    : `https://www.themoviedb.org/tv/${tmdbId}`;

  const lines = [
    `🔔 *New ${typeLabel} Request*`,
    ``,
    `${typeEmoji} *Title:* ${title}`,
    isEpisode ? `🎞 *Episode:* Season ${season} · Episode ${episode}` : null,
    `🆔 *TMDb ID:* \`${tmdbId}\``,
    `🔗 [View on TMDb](${tmdbUrl})`,
    `⏰ *Requested:* ${new Date(requestedAt).toUTCString()}`,
  ].filter(Boolean);

  const message = lines.join('\n');

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id:                 CHAT_ID,
          text:                    message,
          parse_mode:              'Markdown',
          disable_web_page_preview: false,
        }),
      }
    );

    const data = await telegramRes.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return res.status(502).json({ error: 'Telegram delivery failed', detail: data.description });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Telegram fetch error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
