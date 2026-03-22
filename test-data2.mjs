import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    const { data: signData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'genilsonsantos4568@gmail.com',
        password: 'password123' // Fake pass just to see if it works, wait I don't know the password
    });
    console.log("Sign In", signInError || signData.user?.id);
}
test();
