const axios = require('axios');
const fs = require('fs');

const api = axios.create({ baseURL: 'http://localhost:8000/api', headers: { 'Content-Type': 'application/json' } });

async function run() {
  try {
    console.log('1) Signing up test user...');
    const signup = await api.post('/auth/signup', { name: 'Test Driver', email: `test.driver+${Date.now()}@example.com`, password: 'Password123!' });
    console.log('signup:', signup.data.message);
    const user = signup.data.data.user;
    const token = signup.data.data.accessToken;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('2) Calling POST /drivers/register');
    const reg = await api.post('/drivers/register', { vehicleNumber: 'ABC123', licenseNumber: 'LIC123' });
    console.log('register:', reg.data.message);

    console.log('3) GET /drivers/me');
    const me = await api.get('/drivers/me');
    console.log('me:', me.data.data);

    console.log('4) GET /drivers/documents');
    const docs = await api.get('/drivers/documents');
    console.log('documents:', docs.data.data || docs.data);

    console.log('5) GET /rides/history');
    const rides = await api.get('/rides/history?limit=5');
    console.log('rides count:', rides.data.data.rides.length);

    // Try uploading a small text file as multipart if endpoint accepts
    try {
      console.log('6) Attempting document upload (may fail if cloudinary not configured)...');
      const FormData = require('form-data');
      const form = new FormData();
      form.append('document', fs.createReadStream(__filename));
      form.append('type', 'Driver License');
      const upload = await api.post('/drivers/documents', form, { headers: { ...form.getHeaders() } });
      console.log('upload:', upload.data.message);
    } catch (err) {
      console.error('upload failed (expected if Cloudinary not configured):', err.response ? err.response.data : err.message);
    }

    console.log('Done');
  } catch (err) {
    console.error('Error during test flow:', err.response ? err.response.data : err.message);
  }
}

run();
