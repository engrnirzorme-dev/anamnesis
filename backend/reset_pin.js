const { setPin } = require('./src/services/auth-session');
try {
  setPin('123456', 1);
  console.log('PIN successfully updated to 123456 for patient 1');
} catch(err) {
  console.error('Failed to set PIN:', err);
}
