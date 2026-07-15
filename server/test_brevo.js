import sendEmail from './src/utils/mailer.js';
async function run() {
  try {
    const res = await sendEmail({ to: 'test@example.com', subject: 'Test', html: '<p>Test</p>' });
    console.log("Success", res);
  } catch (err) {
    console.error("Error", err.message);
  }
}
run();
