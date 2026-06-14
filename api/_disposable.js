// Disposable / throwaway email domain blocklist.
// Add domains as new providers are spotted. All lowercase.

const BLOCKED_DOMAINS = new Set([
  'mailinator.com', 'mailinator.net', 'mailinator.org',
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
  'guerrillamail.biz', 'guerrillamail.de', 'guerrillamail.info',
  'tempmail.com', 'temp-mail.org', 'temp-mail.io',
  'throwam.com', 'throwaway.email',
  'yopmail.com', 'yopmail.fr', 'cool.fr.nf', 'jetable.fr.nf',
  'sharklasers.com', 'guerrillamailblock.com', 'grr.la', 'spam4.me',
  'trashmail.com', 'trashmail.at', 'trashmail.io',
  'trashmail.me', 'trashmail.net', 'trashmail.org',
  'fakeinbox.com', 'maildrop.cc', 'dispostable.com',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org',
  'mailnull.com', 'spamhereplease.com', 'mailnesia.com',
  'no-spam.ws', 'nospamfor.us',
  'mytemp.email', 'tempinbox.com', 'tempinbox.co.uk',
  'spambox.us', 'spambox.info', 'spambox.org',
  'discard.email', 'discardmail.com', 'discardmail.de',
  'getairmail.com', 'filzmail.com', 'ezztt.com',
  'crazymailing.com', 'tempemail.co', 'tempemail.net',
]);

export function isDisposableEmail(email) {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@').pop().toLowerCase().trim();
  return BLOCKED_DOMAINS.has(domain);
}
