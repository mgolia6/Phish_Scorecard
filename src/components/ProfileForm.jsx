import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient'; // adjust path as needed

export default function ProfileForm() {
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    username: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) console.error('Error loading profile:', error);
      else setProfile(data);

      setLoading(false);
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    const updates = {
      ...profile,
      id: user.id,
      updated_at: new Date()
    };

    const { error } = await supabase
      .from('profiles')
      .upsert(updates);

    if (error) console.error('Error saving profile:', error);
    else alert('Profile saved!');

    setLoading(false);
  };

  return (
    <div className="profile-form">
      <h2>🎵 Your Profile</h2>

      <label>First Name</label>
      <input
        name="first_name"
        value={profile.first_name}
        onChange={handleChange}
      />

      <label>Last Name</label>
      <input
        name="last_name"
        value={profile.last_name}
        onChange={handleChange}
      />

      <label>Username (public)</label>
      <input
        name="username"
        value={profile.username}
        disabled
      />

      <label>Avatar URL</label>
      <input
        name="avatar_url"
        value={profile.avatar_url}
        onChange={handleChange}
      />

      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Profile'}
      </button>

      <style jsx>{`
        .profile-form {
          max-width: 400px;
          margin: 2rem auto;
          padding: 1rem;
          background: #fdf6e3;
          border: 2px solid #333;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
        }
        label {
          display: block;
          margin-top: 1rem;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 0.5rem;
          margin-top: 0.25rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          margin-top: 1.5rem;
          padding: 0.75rem 1.5rem;
          background: #333;
          color: #fff;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:disabled {
          background: #999;
        }
      `}</style>
    </div>
  );
}
