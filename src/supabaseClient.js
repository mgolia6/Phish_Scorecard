// Use the configuration from auth-ui.js
const SUPABASE_URL = 'https://hbmnbcvuqhfutehmcezg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhibW5iY3Z1cWhmdXRlaG1jZXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5Mjg2MTMsImV4cCI6MjA2OTUwNDYxM30.4Jq5BWqBftnUK05AzP1y9rSzRKpiRTL3XRcfm7aj_VM';

// Use the global supabase client that's already created in auth-ui.js
const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
