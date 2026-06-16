const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
console.log('SUPABASE URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const { data: catData, error: catError } = await supabase
      .from('Category')
      .select('*');
    console.log('Categories Error:', catError?.message || catError);
    console.log('Categories Count:', catData?.length);

    const { data: locData, error: locError } = await supabase
      .from('Location')
      .select('*');
    console.log('Locations Error:', locError?.message || locError);
    console.log('Locations Count:', locData?.length);
    console.log('Location Example:', locData?.[0]);

    const { data: lockData, error: lockError } = await supabase
      .from('Locker')
      .select('*, Location(location_name)');
    console.log('Lockers Error:', lockError?.message || lockError);
    console.log('Lockers Count:', lockData?.length);
    console.log('Locker Example:', lockData?.[0]);
  } catch (err) {
    console.error(err);
  }
}

test();
