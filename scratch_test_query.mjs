import fs from 'fs';

const token = 'sbp_e4e0218a2da7d57f60a2859b32722e8f573ed51a';
const ref = 'tipnthruxusbfhldxgtw';

async function testQuery() {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'SELECT current_database();'
      })
    });
    
    if (!res.ok) {
      console.log('Error:', await res.text());
      return;
    }
    const data = await res.json();
    console.log('Success:', data);
  } catch (err) {
    console.error(err);
  }
}

testQuery();
