import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
const PORT = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.static('public'));

// Function to wait for a given number of milliseconds
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to fetch data with retry logic
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      console.log(`Response status: ${response.status}`); // Log status
      if (response.ok) {
        return response;
      }
      if (response.status === 429 && attempt < retries - 1) {
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await wait(delay);
        delay *= 2; // Exponential backoff
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error.message);
      if (attempt === retries - 1) {
        throw error;
      }
      await wait(delay);
      delay *= 2; // Exponential backoff
    }
  }
};

app.post('/design', async (req, res) => {
  const userInput = req.body.input;
  if (!userInput) {
    return res.status(400).json({ error: 'Missing input' });
  }

  try {
    const apiResponse = await fetchWithRetry('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer sk-QeYX7tNOpp364RdQxfYUozZVVaHnZW2vCvppEE0gq7nnkSg2` // Replace with your actual API key
      },
      body: JSON.stringify({
        "steps": 40,
        "width": 1024,
        "height": 1024,
        "seed": 0,
        "cfg_scale": 5,
        "samples": 1,
        "text_prompts": [
          {"text": `Generate an image of a ${userInput}`, "weight": 1},
          {"text": "blurry, dark", "weight": -1}
        ]
      })
    });

    console.log(`API response status: ${apiResponse.status}`);

    const apiData = await apiResponse.json();
    console.log(`API response data:`, apiData); // Add console log here

    if (!apiData || !Array.isArray(apiData.artifacts) || !apiData.artifacts[0].base64) {
      throw new Error('Invalid response structure');
    }

    const imageUrl = `data:image/png;base64,${apiData.artifacts[0].base64}`;
    console.log(`Generated image URL: ${imageUrl}`);

    res.json({ imageUrl });
  } catch (error) {
    console.error('Error fetching design:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to fetch design from API' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});