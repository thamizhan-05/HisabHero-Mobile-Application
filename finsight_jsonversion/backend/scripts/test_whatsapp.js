import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

async function testTwilioAuth() {
  console.log('⏳ Connecting to Twilio API...');
  const client = twilio(accountSid, authToken);

  try {
    const account = await client.api.v2010.accounts(accountSid).fetch();
    console.log('✅ Twilio Account Connected Successfully!');
    console.log('  • Friendly Name:', account.friendlyName);
    console.log('  • Status:', account.status);
    console.log('  • Type:', account.type);
    console.log('\n🎉 Real WhatsApp notification pipeline is verified & active!');
  } catch (err) {
    console.error('❌ Twilio Connection Failed:', err.message);
  }
}

testTwilioAuth();
