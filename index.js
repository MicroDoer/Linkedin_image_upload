const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'LinkedIn Image Upload Service' });
});

app.post('/upload', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ success: false, error: 'imageUrl is required' });
  }

  const linkedinToken = process.env.LINKEDIN_ACCESS_TOKEN;
  const linkedinPersonUrn = process.env.LINKEDIN_PERSON_URN || 'urn:li:person:M0VX3z0Uc4';

  if (!linkedinToken) {
    return res.status(500).json({ success: false, error: 'LinkedIn access token not configured' });
  }

  try {
    console.log('📥 Downloading image:', imageUrl);
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    console.log('✅ Image downloaded, size:', imageResponse.data.length);

    const initResponse = await axios.post(
      'https://api.linkedin.com/rest/images?action=initializeUpload',
      { initializeUploadRequest: { owner: linkedinPersonUrn } },
      {
        headers: {
          'Authorization': `Bearer ${linkedinToken}`,
          'LinkedIn-Version': '202504',
          'X-Restli-Protocol-Version': '2.0.0',
          'Content-Type': 'application/json'
        }
      }
    );

    const uploadUrl = initResponse.data.value.uploadUrl;
    const imageUrn = initResponse.data.value.image;
    console.log('✅ LinkedIn upload initialized, URN:', imageUrn);

    await axios.put(uploadUrl, imageResponse.data, {
      headers: { 'Content-Type': 'application/octet-stream' }
    });
    console.log('✅ Image uploaded successfully');

    res.json({ success: true, imageUrn: imageUrn });
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log('🚀 LinkedIn Image Upload Service running on port', PORT);
});
