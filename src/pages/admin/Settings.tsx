import React, { useState, useRef } from 'react';
import { useAppState, useAppDispatch, useToast } from '../../context/AppContext';
import { seedData } from '../../data/seedData';
import { Twitter, Instagram, Linkedin, Github, Youtube } from 'lucide-react';
import { themes } from '../../data/themes';
import { storage, functions, httpsCallable } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useSearchParams } from 'react-router-dom';

export default function Settings() {
  const { user, authUser } = useAppState();
  const dispatch = useAppDispatch();
  const addToast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(user.displayName);
  const [title, setTitle] = useState(user.title);
  const [bio, setBio] = useState(user.bio);
  const [username, setUsername] = useState(user.username);
  const [primaryColor, setPrimaryColor] = useState(user.themePrefs.primaryColor);
  const [selectedThemeId, setSelectedThemeId] = useState(user.themePrefs.themeId);
  const [socialLinks, setSocialLinks] = useState({ ...user.socialLinks });
  const [isUploading, setIsUploading] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  React.useEffect(() => {
    const integration = searchParams.get('integration');
    if (integration === 'google_success') {
      addToast('Google Calendar connected successfully!');
      setSearchParams({}); // Clear params
    } else if (integration === 'outlook_success') {
      addToast('Outlook Calendar connected successfully!');
      setSearchParams({});
    }
  }, [searchParams]);

  const socialPlatforms = [
    { key: 'twitter', label: 'X / Twitter', icon: Twitter, placeholder: 'https://x.com/username' },
    { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
    { key: 'github', label: 'GitHub', icon: Github, placeholder: 'https://github.com/username' },
    { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@channel' },
  ];

  const handleSaveProfile = () => {
    dispatch({ type: 'UPDATE_USER', payload: { displayName, title, bio, username, socialLinks } });
    addToast('Profile updated');
  };

  const handleResetProfile = () => {
    if (window.confirm('Are you sure you want to reset your profile to defaults? This will overwrite your current name, bio, and social links with the preset template.')) {
      const { displayName: d, title: t, bio: b, socialLinks: s } = seedData.user;
      setDisplayName(d);
      setTitle(t);
      setBio(b);
      setSocialLinks({ ...s });
      dispatch({ type: 'UPDATE_USER', payload: { displayName: d, title: t, bio: b, socialLinks: s } });
      addToast('Profile reset to defaults');
    }
  };

  const handleSaveTheme = () => {
    const theme = themes.find(t => t.id === selectedThemeId);
    dispatch({ type: 'UPDATE_THEME', payload: { themeId: selectedThemeId, primaryColor: theme?.colors.primary || primaryColor } });
    addToast('Theme updated');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser?.uid) return;

    try {
      setIsUploading(true);
      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `avatars/${authUser.uid}/profile.${fileExtension}`);
      
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      
      dispatch({ type: 'UPDATE_USER', payload: { avatarUrl: downloadUrl } });
      addToast('Profile picture updated successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Upload failed: ${errorMessage}`);
      addToast(`Failed to upload image: ${errorMessage}`, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col">
        <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">Settings</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your account and profile preferences.</p>
      </div>

      <div className="flex flex-col gap-8">
        {/* Profile Settings */}
        <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Profile Information</h3>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              <div 
                className={`size-32 rounded-full border-4 border-slate-100 dark:border-primary/20 overflow-hidden bg-slate-100 dark:bg-background-dark relative group cursor-pointer ${isUploading ? 'opacity-50' : ''}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <img className="w-full h-full object-cover" alt="User profile avatar" src={user.avatarUrl} />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploading ? (
                    <span className="material-symbols-outlined text-white text-3xl animate-spin">sync</span>
                  ) : (
                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                  )}
                </div>
              </div>
              <button 
                className="text-sm font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Change Photo'}
              </button>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="form-input bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Professional Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="form-input bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Bio</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="form-textarea bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary text-slate-900 dark:text-slate-100 resize-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <button 
              onClick={handleResetProfile} 
              className="text-slate-500 hover:text-red-500 text-sm font-medium transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              Reset to Defaults
            </button>
            <button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20">
              Save Profile
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Social Links</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Add your social profiles — they'll appear as icons on your public page. Leave blank to hide.</p>
          <div className="flex flex-col gap-4">
            {socialPlatforms.map(({ key, label, icon: Icon, placeholder }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="flex items-center justify-center size-10 rounded-lg bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-400 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <input
                  type="url"
                  value={socialLinks[key] || ''}
                  onChange={e => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="form-input flex-1 bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-primary/50 focus:border-primary text-slate-900 dark:text-slate-100 text-sm"
                />
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Social links are saved together with your profile above.</p>
        </div>

        {/* Theme Gallery */}
        <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Profile Theme</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Choose a theme for your public profile page. Each includes curated colors and font pairings.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => setSelectedThemeId(theme.id)}
                className={`relative text-left rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                  selectedThemeId === theme.id
                    ? 'border-primary ring-2 ring-primary/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Mini preview */}
                <div className="h-20 flex items-end p-3 gap-1.5" style={{ backgroundColor: theme.colors.background }}>
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: theme.colors.primary }} />
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: theme.colors.secondary }} />
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.accent }} />
                  <div className="ml-auto flex flex-col items-end gap-0.5">
                    <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: theme.colors.text }} />
                    <div className="h-1 w-8 rounded-full" style={{ backgroundColor: theme.colors.textMuted }} />
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{theme.name}</p>
                    {selectedThemeId === theme.id && (
                      <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{theme.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{theme.fonts.heading}</span>
                    <span className="text-[10px] text-slate-400">+</span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{theme.fonts.body}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveTheme} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20">
              Apply Theme
            </button>
          </div>
        </div>

        {/* Calendar Integrations */}
        <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Calendar Integrations</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Connect your calendar to automatically block out booking availability during busy events.</p>
          <div className="flex flex-col gap-4">
            
            {/* Google Calendar */}
            <div className={`flex items-center justify-between p-4 border rounded-xl transition-all ${user.integrations?.google ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-10 rounded-lg bg-white dark:bg-slate-800 shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                  <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Google Calendar</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.integrations?.google ? 'Connected — Syncing busy blocks' : 'Not connected'}
                  </p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  if (user.integrations?.google) {
                    dispatch({ type: 'TOGGLE_INTEGRATION', payload: 'google' });
                    addToast('Google Calendar disconnected');
                  } else {
                    try {
                      const getUrl = httpsCallable(functions, 'getGoogleAuthUrl');
                      const result: any = await getUrl();
                      window.location.href = result.data.url;
                    } catch (err) {
                      console.error(err);
                      addToast('Failed to start Google Auth', 'error');
                    }
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${user.integrations?.google ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
              >
                {user.integrations?.google ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            {/* Outlook Calendar */}
            <div className={`flex items-center justify-between p-4 border rounded-xl transition-all ${user.integrations?.outlook ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-10 rounded-lg bg-[#0078D4] shrink-0 shadow-sm border border-[#0078D4]">
                  <span className="material-symbols-outlined text-white">calendar_month</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Outlook Calendar</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.integrations?.outlook ? 'Connected — Syncing busy blocks' : 'Not connected'}
                  </p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  if (user.integrations?.outlook) {
                    dispatch({ type: 'TOGGLE_INTEGRATION', payload: 'outlook' });
                    addToast('Outlook Calendar disconnected');
                  } else {
                    try {
                      const getUrl = httpsCallable(functions, 'getOutlookAuthUrl');
                      const result: any = await getUrl();
                      window.location.href = result.data.url;
                    } catch (err) {
                      console.error(err);
                      addToast('Failed to start Outlook Auth', 'error');
                    }
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${user.integrations?.outlook ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
              >
                {user.integrations?.outlook ? 'Disconnect' : 'Connect'}
              </button>
            </div>

          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-6">Account Settings</h3>
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Address</label>
              <div className="flex gap-4">
                <input type="email" defaultValue={authUser?.email || user.email} disabled className="form-input flex-1 bg-slate-100 dark:bg-background-dark/50 border border-slate-200 dark:border-primary/20 rounded-lg px-4 py-2.5 text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                <button className="px-4 py-2.5 border border-slate-200 dark:border-primary/20 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-primary/10 transition-colors">Change</button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Profile URL</label>
              <div className="flex items-center bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-primary/20 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all">
                <span className="px-4 py-2.5 text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-primary/10 border-r border-slate-200 dark:border-primary/20 text-sm">teamtonic.space/</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="form-input flex-1 bg-transparent border-none px-4 py-2.5 focus:ring-0 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button onClick={handleSaveProfile} className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-lg shadow-primary/20">
              Save Account
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-xl p-6">
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-500/80 dark:text-red-400/80 mb-6">Irreversible and destructive actions.</p>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100">Delete Account</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Permanently delete your account and all data.</p>
            </div>
            <button className="px-4 py-2.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 rounded-lg text-sm font-bold transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
