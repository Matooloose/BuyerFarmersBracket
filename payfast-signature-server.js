import express from 'express';
import crypto from 'crypto';
import cors from 'cors';
const app = express();
app.use(express.json());
app.use(cors());

function generateSignature(data, passPhrase) {
  let pfOutput = '';
  Object.keys(data).forEach(key => {
    if (data[key] !== '') {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim())}&`;
    }
  });
  let getString = pfOutput.slice(0, -1);
  if (passPhrase) {
    getString += `&passphrase=${encodeURIComponent(passPhrase.trim())}`;
  }
  return crypto.createHash('md5').update(getString).digest('hex');
}

app.post('/api/payfast-signature', (req, res) => {
  const passPhrase = 'jt7NOE43FZPn'; // Keep this secret!
  const signature = generateSignature(req.body, passPhrase);
  res.json({ signature });
});

app.listen(3001, () => console.log('PayFast signature server running on port 3001'));
