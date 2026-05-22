const express = require('express');
const axios = require('axios');
const Parser = require('rss-parser');

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

const MARKETS = {
  nse: [
    { label: 'RELIANCE (NSE)', symbol: 'reliance.in' },
    { label: 'TCS (NSE)', symbol: 'tcs.in' },
    { label: 'INFY (NSE)', symbol: 'infy.in' }
  ],
  bse: [
    { label: 'SENSEX (BSE)', symbol: '^snx' },
    { label: 'HDFCBANK (BSE)', symbol: 'hdfcbank.in' },
    { label: 'SBIN (BSE)', symbol: 'sbin.in' }
  ],
  us: [
    { label: 'AAPL (NASDAQ)', symbol: 'aapl.us' },
    { label: 'MSFT (NASDAQ)', symbol: 'msft.us' },
    { label: 'TSLA (NASDAQ)', symbol: 'tsla.us' }
  ]
};

async function fetchQuote(symbol) {
  const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcvn&h&e=csv`;
  const { data } = await axios.get(url, { timeout: 8000 });
  const [header, row] = data.trim().split('\n');

  if (!row || row.includes('N/D')) {
    return null;
  }

  const [sym, date, time, open, high, low, close, volume, name] = row.split(',');

  return {
    symbol: sym,
    date,
    time,
    open: Number(open),
    high: Number(high),
    low: Number(low),
    close: Number(close),
    volume: Number(volume),
    name
  };
}

async function fetchMarket(group) {
  const items = await Promise.all(
    MARKETS[group].map(async (entry) => {
      try {
        const quote = await fetchQuote(entry.symbol);
        return {
          ...entry,
          quote
        };
      } catch (error) {
        return {
          ...entry,
          quote: null,
          error: 'Data unavailable right now'
        };
      }
    })
  );

  return items;
}

app.get('/api/quotes', async (_req, res) => {
  try {
    const [nse, bse, us] = await Promise.all([
      fetchMarket('nse'),
      fetchMarket('bse'),
      fetchMarket('us')
    ]);

    res.json({
      updatedAt: new Date().toISOString(),
      nse,
      bse,
      us
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch market data at the moment.' });
  }
});

app.get('/api/news', async (_req, res) => {
  try {
    const feed = await parser.parseURL('https://news.google.com/rss/search?q=stock%20market&hl=en-US&gl=US&ceid=US:en');

    const headlines = (feed.items || []).slice(0, 12).map((item) => ({
      title: item.title,
      source: item.creator || item.source || 'Market News',
      link: item.link,
      publishedAt: item.pubDate
    }));

    res.json({
      updatedAt: new Date().toISOString(),
      headlines,
      bulletPoints: headlines.slice(0, 5).map((h) => h.title)
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to fetch news right now.' });
  }
});

app.listen(PORT, () => {
  console.log(`Market tracker running on http://localhost:${PORT}`);
});
