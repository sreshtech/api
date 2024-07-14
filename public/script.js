document.getElementById('design-button').addEventListener('click', () => {
  const userInput = document.getElementById('design-input').value;
  fetch('/design', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: userInput })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Received design:', data.imageUrl); // Log received image URL
    const imageElement = document.getElementById('design-output');
    imageElement.innerHTML = ''; // Clear previous output
    const img = document.createElement('img');
    img.src = data.imageUrl;
    imageElement.appendChild(img); // Display the generated image
  })
  .catch(error => {
    console.error('Error generating design:', error.message, error.stack); // Log error details
    document.getElementById('design-output').innerText = `Error: ${error.message}`;
  });
});
