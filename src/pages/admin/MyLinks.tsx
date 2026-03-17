import React, { useState, useEffect } from 'react';
import { Twitter, Instagram, Linkedin, Github, Youtube } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppState, useAppDispatch, useToast } from '../../context/AppContext';
import { LinkItem, Folder } from '../../types';

const isValidUrl = (urlString: string) => {
  if (!urlString) return false;
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/;
  return urlPattern.test(urlString);
};

function SortableLinkItem({ link, onEdit, onDelete }: { link: LinkItem, onEdit: (link: LinkItem) => void, onDelete: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`group flex items-center gap-4 bg-white dark:bg-primary/5 border ${isDragging ? 'border-primary shadow-lg scale-[1.02]' : 'border-slate-200 dark:border-primary/20'} p-4 rounded-2xl hover:border-primary transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 relative`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="flex items-center text-slate-400 cursor-grab active:cursor-grabbing p-2 -ml-2 hover:text-slate-600 dark:hover:text-slate-300 outline-none touch-none"
      >
        <span className="material-symbols-outlined">drag_indicator</span>
      </div>
      <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary">
        <span className="material-symbols-outlined">{link.icon}</span>
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <h3 className="text-slate-900 dark:text-slate-100 font-bold truncate">{link.title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm truncate">{link.url}</p>
      </div>
      <div className="flex flex-col items-end px-4 border-r border-slate-200 dark:border-primary/20">
        <span className="text-slate-900 dark:text-slate-100 font-bold">{link.clicks}</span>
        <span className="text-slate-500 dark:text-slate-400 text-xs">clicks</span>
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onEdit(link)}
          className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
          title="Edit Link"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
        <button 
          onClick={() => onDelete(link.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" 
          title="Delete Link"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
}

const predefinedIcons = [
  'link', 'article', 'palette', 'share', 'mail', 'language', 
  'code', 'shopping_cart', 'video_library', 'image', 'music_note', 
  'smart_display', 'public', 'work', 'person', 'group'
];

function PhoneMockup({ links, folders, user }: { links: LinkItem[], folders: Folder[], user: ReturnType<typeof import('../../context/AppContext').useAppState>['user'] }) {
  return (
    <div className="relative w-[320px] h-[650px] bg-slate-900 rounded-[3rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden flex flex-col items-center">
      {/* Notch */}
      <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-3xl w-40 mx-auto z-20"></div>
      
      {/* Screen Content */}
      <div className="w-full h-full bg-white dark:bg-[#0f172a] overflow-y-auto no-scrollbar pb-10">
        {/* Profile Header */}
        <div className="flex p-4 flex-col items-center text-center gap-4 pt-12">
          <div
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-24 w-24 ring-4 ring-primary/20"
            style={{ backgroundImage: `url("${user.avatarUrl}")` }}
          ></div>
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">{user.displayName}</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-1">{user.title}</p>
            <p className="text-slate-500 dark:text-slate-500 text-xs mt-2 max-w-sm px-2">{user.bio}</p>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-1">
            <a href="#" className="p-2 rounded-full bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95" aria-label="Twitter">
              <Twitter className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95" aria-label="Instagram">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95" aria-label="LinkedIn">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95" aria-label="GitHub">
              <Github className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 rounded-full bg-slate-100 dark:bg-primary/10 text-slate-600 dark:text-slate-400 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-all active:scale-95" aria-label="YouTube">
              <Youtube className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-4 px-4 py-4">
          {folders.map(folder => {
            const folderLinks = links.filter(l => l.folderId === folder.id && l.isActive);
            if (folderLinks.length === 0) return null;
            return (
              <div key={folder.id} className="flex flex-col gap-2">
                <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">{folder.title}</h3>
                <div className="flex flex-col gap-2">
                  {folderLinks.map((link, index) => (
                    <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center rounded-xl h-12 px-4 ${index === 0 && folder.id === folders[0].id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-200 dark:bg-primary/10 text-slate-900 dark:text-slate-100'} text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]`}>
                      <span className="material-symbols-outlined mr-2 text-[18px]">{link.icon}</span>
                      {link.title}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* Uncategorized Links */}
          {links.filter(l => !l.folderId && l.isActive).length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">Other Links</h3>
              <div className="flex flex-col gap-2">
                {links.filter(l => !l.folderId && l.isActive).map((link, index) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className={`flex items-center justify-center rounded-xl h-12 px-4 ${folders.length === 0 && index === 0 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-200 dark:bg-primary/10 text-slate-900 dark:text-slate-100'} text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98]`}>
                    <span className="material-symbols-outlined mr-2 text-[18px]">{link.icon}</span>
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <footer className="mt-4 py-6 flex flex-col items-center border-t border-slate-200 dark:border-primary/10 gap-2">
          <div className="flex items-center gap-1 opacity-50">
            <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
            <p className="text-[9px] font-medium tracking-wide uppercase">Powered by BitMe</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function MyLinks() {
  const { links, folders, user } = useAppState();
  const dispatch = useAppDispatch();
  const addToast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkItem | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('link');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [urlError, setUrlError] = useState('');
  
  // Folder Form State
  const [folderTitle, setFolderTitle] = useState('');

  // Validate URL in real-time
  useEffect(() => {
    if (url.length > 0) {
      if (!isValidUrl(url)) {
        setUrlError('Please enter a valid URL (e.g., example.com or https://example.com)');
      } else {
        setUrlError('');
      }
    } else {
      setUrlError('');
    }
  }, [url]);

  const handleOpenModal = (link?: LinkItem) => {
    if (link) {
      setEditingLink(link);
      setTitle(link.title);
      setUrl(link.url);
      setIcon(link.icon);
      setFolderId(link.folderId);
    } else {
      setEditingLink(null);
      setTitle('');
      setUrl('');
      setIcon('link');
      setFolderId(folders.length > 0 ? folders[0].id : null);
    }
    setUrlError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    setTitle('');
    setUrl('');
    setIcon('link');
    setFolderId(null);
    setUrlError('');
  };

  const handleSave = () => {
    if (!title.trim() || !url.trim() || urlError) return;

    if (editingLink) {
      dispatch({ type: 'UPDATE_LINK', payload: { ...editingLink, title, url, icon, folderId } });
      addToast('Link updated');
    } else {
      const newLink: LinkItem = {
        id: Date.now().toString(),
        title,
        url,
        clicks: 0,
        icon,
        folderId,
        isActive: true,
      };
      dispatch({ type: 'ADD_LINK', payload: newLink });
      addToast('Link added');
    }
    handleCloseModal();
  };

  const handleSaveFolder = () => {
    if (!folderTitle.trim()) return;
    const newFolder: Folder = {
      id: Date.now().toString(),
      title: folderTitle
    };
    dispatch({ type: 'ADD_FOLDER', payload: newFolder });
    addToast('Folder created');
    setIsFolderModalOpen(false);
    setFolderTitle('');
  };

  const handleDeleteFolder = (id: string) => {
    dispatch({ type: 'DELETE_FOLDER', payload: id });
    addToast('Folder deleted');
  };

  const handleDelete = (id: string) => {
    dispatch({ type: 'DELETE_LINK', payload: id });
    addToast('Link deleted');
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = links.findIndex((item) => item.id === active.id);
      const newIndex = links.findIndex((item) => item.id === over.id);
      dispatch({ type: 'REORDER_LINKS', payload: arrayMove(links, oldIndex, newIndex) });
    }
  };

  const maxClicks = Math.max(...links.map(d => d.clicks), 1);
  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
  const topLink = links.length > 0 ? [...links].sort((a, b) => b.clicks - a.clicks)[0] : null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto w-full items-start">
      <div className="flex-1 flex flex-col gap-6 w-full max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight">My Links</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Manage and organize your public profile links.</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsFolderModalOpen(true)}
              className="hidden sm:flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
            >
              <span className="material-symbols-outlined">create_new_folder</span>
              <span>New Folder</span>
            </button>
            <button 
              onClick={() => setIsPreviewModalOpen(true)}
              className="lg:hidden flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
            >
              <span className="material-symbols-outlined">visibility</span>
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/25"
            >
              <span className="material-symbols-outlined">add</span>
              <span className="hidden sm:inline">Add Link</span>
            </button>
          </div>
        </div>

        {/* Sortable Link List */}
      <div className="flex flex-col gap-6">
        {links.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 rounded-2xl text-slate-500">
            No links found. Add your first link above!
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {folders.map(folder => {
              const folderLinks = links.filter(l => l.folderId === folder.id);
              return (
                <div key={folder.id} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between pl-2 pr-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400">folder</span>
                      {folder.title}
                    </h3>
                    <button onClick={() => handleDeleteFolder(folder.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete Folder">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                  {folderLinks.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                      Empty folder
                    </div>
                  ) : (
                    <SortableContext
                      items={folderLinks}
                      strategy={verticalListSortingStrategy}
                    >
                      {folderLinks.map((link) => (
                        <SortableLinkItem 
                          key={link.id} 
                          link={link} 
                          onEdit={handleOpenModal}
                          onDelete={handleDelete}
                        />
                      ))}
                    </SortableContext>
                  )}
                </div>
              );
            })}

            {/* Uncategorized Links */}
            {links.filter(l => !l.folderId).length > 0 && (
              <div className="flex flex-col gap-3 mt-4">
                <div className="flex items-center justify-between pl-2 pr-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">folder_open</span>
                    Uncategorized
                  </h3>
                </div>
                <SortableContext
                  items={links.filter(l => !l.folderId)}
                  strategy={verticalListSortingStrategy}
                >
                  {links.filter(l => !l.folderId).map((link) => (
                    <SortableLinkItem 
                      key={link.id} 
                      link={link} 
                      onEdit={handleOpenModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </div>
            )}
          </DndContext>
        )}
      </div>

      {/* Analytics Summary Card */}
      <div className="mt-8 flex flex-col gap-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Analytics Overview</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 flex flex-col gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Clicks</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">{totalClicks.toLocaleString()}</span>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">trending_up</span> +12% this week</span>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 flex flex-col gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Top Link</span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate mt-1">{topLink ? topLink.title : 'N/A'}</span>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-auto">{topLink ? topLink.clicks : 0} clicks</span>
          </div>
          <div className="p-6 rounded-2xl bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20 flex flex-col gap-2">
            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">CTR</span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">4.2%</span>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">trending_up</span> +0.5% this week</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-primary/5 border border-slate-200 dark:border-primary/20">
          <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6">Clicks per Link</h4>
          <div className="flex flex-col gap-4 w-full">
            {links.map((data, index) => (
              <div key={data.id} className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{data.title}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{data.clicks}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${index === 0 ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                    style={{ width: `${(data.clicks / maxClicks) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

      {/* Desktop Preview */}
      <div className="hidden lg:flex flex-col w-[350px] shrink-0 sticky top-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <h3 className="font-bold text-slate-900 dark:text-white">Live Preview</h3>
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Auto-updating
          </span>
        </div>
        <PhoneMockup links={links} folders={folders} user={user} />
      </div>

      {/* Mobile Preview Modal */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm lg:hidden">
           <div className="relative">
             <button 
               onClick={() => setIsPreviewModalOpen(false)} 
               className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
             >
               <span className="material-symbols-outlined text-3xl">close</span>
             </button>
             <PhoneMockup links={links} folders={folders} user={user} />
           </div>
        </div>
      )}

      {/* Modal for Add/Edit Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingLink ? 'Edit Link' : 'Add New Link'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Link Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Portfolio"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">URL</label>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="e.g. https://example.com"
                  className={`w-full px-4 py-3 rounded-xl border ${urlError ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-primary/50 focus:border-primary'} bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 outline-none transition-all dark:text-white`}
                />
                {urlError && (
                  <span className="text-xs font-medium text-red-500">{urlError}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Folder</label>
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value || null)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white appearance-none"
                >
                  <option value="">Uncategorized</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {predefinedIcons.map((iconName) => (
                    <button
                      key={iconName}
                      onClick={() => setIcon(iconName)}
                      className={`flex items-center justify-center size-10 rounded-xl transition-all ${
                        icon === iconName 
                          ? 'bg-primary text-white shadow-md shadow-primary/20' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title={iconName}
                    >
                      <span className="material-symbols-outlined text-[20px]">{iconName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button 
                onClick={handleCloseModal}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!title.trim() || !url.trim() || !!urlError}
                className="px-5 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingLink ? 'Save Changes' : 'Add Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">New Folder</h3>
              <button onClick={() => setIsFolderModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Folder Name</label>
              <input
                type="text"
                value={folderTitle}
                onChange={e => setFolderTitle(e.target.value)}
                placeholder="e.g. Social Media"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all dark:text-white"
                onKeyDown={e => e.key === 'Enter' && handleSaveFolder()}
              />
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/50">
              <button onClick={() => setIsFolderModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              <button onClick={handleSaveFolder} disabled={!folderTitle.trim()} className="px-5 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}