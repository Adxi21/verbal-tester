import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwbqnhcfzvjldpyjibkk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DznEuP7O-nqK70Fv2FX1fw_MLAa9o06';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let passed = 0;
let failed = 0;

function log(label, success, detail = '') {
  if (success) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label} — ${detail}`);
    failed++;
  }
}

// ── admins ────────────────────────────────────────────────
async function testAdmins() {
  console.log('\n📋 TABLE: admins');

  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('email', 'aditya2732021@gmail.com')
    .single();

  log('Default admin exists', !error && data?.control_type === 'Q', error?.message);
}

// ── event_registrations ───────────────────────────────────
async function testRegistrations() {
  console.log('\n📋 TABLE: event_registrations');

  const testRow = {
    bookers_email: 'test@supabase-check.com',
    bookers_phone: '9999999999',
    event_name: 'test-event',
    name: 'Test User',
    age: 25,
    gender: 'Male',
    origin: 'Pune',
    contact: '9999999999',
    attending_dates: ['19-01-2026', '20-01-2026'],
    travelmode: 'Train',
    departure_from_home: '08:00',
    arrival_at_venue: '12:00',
    accommodation: true,
    cot_required: false,
    difficultyclimbingstairs: false,
    localassistance: false,
    localassistanceperson: '',
    recordings: false,
    recordprograms: '',
    specialrequests: 'Test special request'
  };

  // INSERT
  const { error: insertError } = await supabase.from('event_registrations').insert(testRow);
  log('INSERT', !insertError, insertError?.message);

  // SELECT
  const { data, error: selectError } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('bookers_email', 'test@supabase-check.com');
  log('SELECT', !selectError && data?.length > 0, selectError?.message);

  // UPDATE
  const { error: updateError } = await supabase
    .from('event_registrations')
    .update({ specialrequests: 'Updated request' })
    .eq('bookers_email', 'test@supabase-check.com')
    .eq('name', 'Test User');
  log('UPDATE', !updateError, updateError?.message);

  // DELETE
  const { error: deleteError } = await supabase
    .from('event_registrations')
    .delete()
    .eq('bookers_email', 'test@supabase-check.com')
    .eq('bookers_phone', '9999999999')
    .eq('name', 'Test User');
  log('DELETE', !deleteError, deleteError?.message);
}

// ── event_dates ───────────────────────────────────────────
async function testEventDates() {
  console.log('\n📋 TABLE: event_dates');

  const testRow = {
    email_id: 'test@supabase-check.com',
    contact: '9999999999',
    name: 'Test User',
    date: '19-01-2026',
    morning_tea: 'with',
    morning_coffee: 'no',
    afternoon_tea: 'without',
    afternoon_coffee: 'no',
    breakfast: true,
    lunch: true,
    dinner: false,
    packed_lunch: false,
    packed_dinner: true,
    departuretime: '14:00'
  };

  // INSERT
  const { error: insertError } = await supabase.from('event_dates').insert(testRow);
  log('INSERT', !insertError, insertError?.message);

  // SELECT
  const { data, error: selectError } = await supabase
    .from('event_dates')
    .select('*')
    .eq('email_id', 'test@supabase-check.com');
  log('SELECT', !selectError && data?.length > 0, selectError?.message);

  // UPDATE
  const { error: updateError } = await supabase
    .from('event_dates')
    .update({ morning_tea: 'without' })
    .eq('email_id', 'test@supabase-check.com')
    .eq('name', 'Test User')
    .eq('date', '19-01-2026');
  log('UPDATE', !updateError, updateError?.message);

  // DELETE
  const { error: deleteError } = await supabase
    .from('event_dates')
    .delete()
    .eq('email_id', 'test@supabase-check.com')
    .eq('name', 'Test User');
  log('DELETE', !deleteError, deleteError?.message);
}

// ── shop ──────────────────────────────────────────────────
async function testShop() {
  console.log('\n📋 TABLE: shop');

  const testRow = {
    email_id: 'test@supabase-check.com',
    name: 'Test User',
    contact: '9999999999',
    book_name: 'Lakshyartha Gita',
    language: 'Marathi'
  };

  // INSERT
  const { error: insertError } = await supabase.from('shop').insert(testRow);
  log('INSERT', !insertError, insertError?.message);

  // SELECT
  const { data, error: selectError } = await supabase
    .from('shop')
    .select('*')
    .eq('email_id', 'test@supabase-check.com');
  log('SELECT', !selectError && data?.length > 0, selectError?.message);

  // DELETE
  const { error: deleteError } = await supabase
    .from('shop')
    .delete()
    .eq('email_id', 'test@supabase-check.com')
    .eq('name', 'Test User')
    .eq('contact', '9999999999')
    .eq('book_name', 'Lakshyartha Gita');
  log('DELETE', !deleteError, deleteError?.message);
}

// ── run all ───────────────────────────────────────────────
async function runAll() {
  console.log('🚀 Supabase Connectivity Test');
  console.log('================================');

  await testAdmins();
  await testRegistrations();
  await testEventDates();
  await testShop();

  console.log('\n================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('🎉 All tests passed! Safe to deploy to Vercel.');
  } else {
    console.log('⚠️  Some tests failed. Fix the issues above before deploying.');
  }
}

runAll();
