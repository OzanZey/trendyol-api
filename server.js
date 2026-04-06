const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// DİKKAT: AŞAĞIDAKİ TIRNAK İÇİNE KENDİ SCRAPER API KEY'İNİZİ YAPIŞTIRMAYI UNUTMAYIN!
const SCRAPER_API_KEY = '382c4985172c85f5193eec70b25ff887'; 

app.get('/api/get-image', async (req, res) => {
  const searchQuery = req.query.q;
  if (!searchQuery) return res.status(400).json({ error: 'Arama kelimesi gerekli' });

  if (SCRAPER_API_KEY === 'BURAYA_YAPISTIRIN') {
    return res.status(401).json({ error: 'Lütfen server.js içine ScraperAPI anahtarınızı ekleyin!' });
  }

  try {
    const targetUrl = `https://www.trendyol.com/sr?q=${encodeURIComponent(searchQuery)}`;
    const scraperUrl = `http://api.scraperapi.com?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(targetUrl)}&premium=true&device_type=desktop`;
    
    const response = await axios.get(scraperUrl, { timeout: 25000 }); 
    const html = response.data;
    const $ = cheerio.load(html);
    
    let imageUrl, brand, productUrl;

    // YÖNTEM 1: Trendyol'un gizli React verisini (JSON) bulup okumak (En kesin yöntem)
    const scriptTags = $('script').toArray();
    for (let script of scriptTags) {
        const scriptContent = $(script).html();
        if (scriptContent && scriptContent.includes('__SEARCH_APP_INITIAL_STATE__')) {
            try {
                const jsonStringMatch = scriptContent.match(/window\.__SEARCH_APP_INITIAL_STATE__\s*=\s*({.*?});/);
                if (jsonStringMatch && jsonStringMatch[1]) {
                    const state = JSON.parse(jsonStringMatch[1]);
                    const products = state.products || (state.searchResult && state.searchResult.products);
                    
                    if (products && products.length > 0) {
                        const p = products[0];
                        if (p.images && p.images.length > 0) {
                            imageUrl = p.images[0].startsWith('http') ? p.images[0] : 'https://cdn.dsmcdn.com/' + p.images[0];
                        }
                        brand = p.brand ? p.brand.name : undefined;
                        productUrl = p.url ? 'https://www.trendyol.com' + p.url : undefined;
                        break; 
                    }
                }
            } catch (e) {
                console.log("JSON okuma hatası:", e.message);
            }
        }
    }

    // YÖNTEM 2: Eğer JSON yöntemi çalışmazsa, klasik HTML etiketlerine bak
    if (!imageUrl) {
        const firstProduct = $('.p-card-wrppr').first();
        if (firstProduct.length > 0) {
            imageUrl = firstProduct.find('img').attr('src') || firstProduct.find('img').attr('data-src');
            brand = firstProduct.find('.prdct-desc-cntnr-ttl').text().trim() || firstProduct.find('.brand-name').text().trim();
            productUrl = firstProduct.find('a').attr('href');
        }
    }

    // YÖNTEM 3: Kaba kuvvet (Regex ile sayfadaki ilk Trendyol ürün görselini bul)
    if (!imageUrl || imageUrl.includes('data:image')) {
         const imgMatch = html.match(/(https:\/\/cdn\.dsmcdn\.com\/ty\d+\/product\/media\/images\/[^"'\s]+)/i) || 
                          html.match(/(https:\/\/cdn\.dsmcdn\.com\/[^"'\s]+\.jpg)/i);
         if (imgMatch) imageUrl = imgMatch[1];
    }

    // Link düzeltmeleri
    if (productUrl && !productUrl.startsWith('http')) {
        productUrl = 'https://www.trendyol.com' + productUrl;
    }

    if (imageUrl && !imageUrl.includes('data:image')) {
      res.json({ imageUrl, brand, productUrl });
    } else {
      console.log("Görsel bulunamadı. HTML Boyutu:", html.length);
      res.status(404).json({ error: 'Görsel bulunamadı.' });
    }

  } catch (error) {
    console.error("Hata detayı:", error.message);
    res.status(500).json({ error: 'Sunucu hatası: ' + error.message });
  }
});

app.listen(3001, () => console.log('Scraper API 3001 portunda çalışıyor'));
