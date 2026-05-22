function renderCards(id, data) {
  const container = document.getElementById(id);
  container.innerHTML = data
    .map((entry) => {
      if (!entry.quote) {
        return `<article class="card"><h3>${entry.label}</h3><p class="meta">Data unavailable</p></article>`;
      }

      return `
        <article class="card">
          <h3>${entry.label}</h3>
          <p class="price">${entry.quote.close.toFixed(2)}</p>
          <p class="meta">O:${entry.quote.open} H:${entry.quote.high} L:${entry.quote.low}</p>
          <p class="meta">Vol: ${entry.quote.volume.toLocaleString()}</p>
          <p class="meta">${entry.quote.date} ${entry.quote.time}</p>
        </article>
      `;
    })
    .join('');
}

function renderNews(news) {
  document.getElementById('bullet-news').innerHTML = news.bulletPoints
    .map((item) => `<li>${item}</li>`)
    .join('');

  document.getElementById('headlines').innerHTML = news.headlines
    .map(
      (h) => `<article class="card"><a href="${h.link}" target="_blank" rel="noopener noreferrer">${h.title}</a><p class="meta">${h.publishedAt}</p></article>`
    )
    .join('');
}

async function refreshAll() {
  try {
    const [quotesResp, newsResp] = await Promise.all([fetch('/api/quotes'), fetch('/api/news')]);
    const quotes = await quotesResp.json();
    const news = await newsResp.json();

    renderCards('nse', quotes.nse || []);
    renderCards('bse', quotes.bse || []);
    renderCards('us', quotes.us || []);
    renderNews(news);

    document.getElementById('updated-at').textContent = `Updated: ${new Date().toLocaleString()}`;
  } catch (error) {
    document.getElementById('updated-at').textContent = 'Could not refresh live data.';
  }
}

refreshAll();
setInterval(refreshAll, 15000);
