import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  orderBy,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Maximize2, 
  Album as AlbumIcon, 
  Image as ImageIcon,
  LogOut,
  Moon,
  Sun,
  LayoutGrid,
  Filter,
  Camera
} from 'lucide-react';
import { db, auth, storage, signInWithGoogle, logout } from './lib/firebase';
import { Photo, Album, View } from './types';
import { cn } from './lib/utils';
import { useDropzone } from 'react-dropzone';

// --- Components ---

const Sidebar = ({ 
  user, 
  view, 
  setView,
  onAddAlbum 
}: { 
  user: User | null, 
  view: View, 
  setView: (v: View) => void,
  onAddAlbum: () => void
}) => {
  return (
    <aside className="w-64 h-full border-r border-neutral-800 p-6 flex flex-col gap-8 flex-shrink-0 hidden lg:flex">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">C</div>
        <span className="text-xl font-semibold tracking-tight text-white font-sans uppercase">Coope</span>
      </div>

      <nav className="flex flex-col gap-1">
        <button 
          onClick={() => setView('gallery')}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all text-sm",
            view === 'gallery' ? "bg-neutral-900 text-blue-400" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
          )}
        >
          <ImageIcon className="w-4 h-4" />
          All Photos
        </button>
        <button 
          onClick={() => setView('albums')}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all text-sm",
            view === 'albums' ? "bg-neutral-900 text-blue-400" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
          )}
        >
          <AlbumIcon className="w-4 h-4" />
          Albums
        </button>
        <button 
          onClick={() => setView('home')}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all text-sm",
            view === 'home' ? "bg-neutral-900 text-blue-400" : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100"
          )}
        >
          <Camera className="w-4 h-4" />
          Showcase
        </button>
      </nav>

      <div className="mt-8">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Collections</span>
          <button onClick={onAddAlbum} className="text-neutral-500 hover:text-white transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {/* We can list albums here if needed, but for now we'll keep it simple */}
      </div>

      <div className="mt-auto p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800">
        <div className="flex justify-between text-[10px] mb-2 text-neutral-400 font-bold uppercase tracking-tight">
          <span>Storage</span>
          <span>Used</span>
        </div>
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden mb-3">
          <div className="w-[45%] h-full bg-blue-500"></div>
        </div>
        <button className="w-full py-2 text-[10px] uppercase font-bold bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors tracking-widest">Upgrade Plan</button>
      </div>

      {user && (
        <div className="pt-6 border-t border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-[10px] text-white">
              {user.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white truncate w-24">{user.displayName}</span>
              <span className="text-[10px] text-neutral-500">Free Tier</span>
            </div>
          </div>
          <button onClick={logout} className="text-neutral-500 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};

const Header = ({ search, setSearch, setView, user }: { search: string, setSearch: (s: string) => void, setView: (v: View) => void, user: any }) => {
  return (
    <header className="h-20 border-b border-neutral-800 px-8 flex items-center justify-between sticky top-0 bg-neutral-950/80 backdrop-blur-md z-40">
      <div className="relative w-96 max-w-[50%] md:max-w-none">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
        <input 
          type="text" 
          placeholder="Search your memories..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-2 pl-10 pr-4 text-sm text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-600"
        />
      </div>
      <div className="flex items-center gap-4">
        {user ? (
          <button 
            onClick={() => setView('dashboard')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            <Plus className="w-4 h-4" />
            Upload Image
          </button>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="bg-white hover:bg-neutral-200 text-neutral-950 px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
          >
            Get Started
          </button>
        )}
      </div>
    </header>
  );
};

const PhotoCard = ({ photo, onClick, onDelete, isLarge }: { photo: Photo, onClick: () => void, onDelete: () => void, isLarge?: boolean }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "group bg-neutral-900 rounded-3xl border border-neutral-800 overflow-hidden relative group cursor-pointer",
        isLarge ? "col-span-2 row-span-2 shadow-2xl" : "col-span-1 row-span-1 shadow-lg"
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <img
        src={photo.url}
        alt={photo.title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
      />
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
          {photo.albumId ? 'Collection' : 'Gallery'}
        </p>
        <h3 className={cn("font-bold text-white leading-tight mb-2", isLarge ? "text-2xl" : "text-lg")}>
          {photo.title}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-xs text-neutral-400 font-medium truncate pr-4">
            {photo.description || 'No description provided'}
          </p>
          <div className="flex gap-2 shrink-0">
             <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete permanently?')) onDelete();
              }}
              className="p-2 bg-neutral-800 text-neutral-500 hover:text-red-500 hover:bg-neutral-700 rounded-xl transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Lightbox = ({ photo, onClose }: { photo: Photo, onClose: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-12"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-8 right-8 p-3 text-white/50 hover:text-white transition-colors"
      >
        <X className="w-8 h-8" />
      </button>
      
      <div className="flex flex-col md:flex-row gap-8 max-w-7xl w-full h-full items-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex-1 h-full flex items-center justify-center overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={photo.url}
            alt={photo.title}
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
          />
        </motion.div>
        
        <div className="w-full md:w-80 flex flex-col gap-4 text-white" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-3xl font-serif font-bold">{photo.title}</h2>
          <p className="text-zinc-400 leading-relaxed">{photo.description}</p>
          <div className="mt-8 pt-8 border-t border-zinc-800 flex flex-col gap-2">
            <span className="text-xs uppercase tracking-widest text-zinc-500">Metadata</span>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Date</span>
              <span>{photo.createdAt?.toDate ? photo.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('home');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [search, setSearch] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        // Fetch Photos
        const q = query(
          collection(db, 'photos'),
          where('userId', '==', u.uid),
          orderBy('createdAt', 'desc')
        );
        onSnapshot(q, (snapshot) => {
          setPhotos(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Photo)));
        });

        // Fetch Albums
        const aq = query(
          collection(db, 'albums'),
          where('userId', '==', u.uid),
          orderBy('createdAt', 'desc')
        );
        onSnapshot(aq, (snapshot) => {
          setAlbums(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Album)));
        });
      } else {
        setPhotos([]);
        setAlbums([]);
        setView('home');
      }
    });
    return unsub;
  }, []);

  const handleUpload = async (files: File[], title: string, description: string, albumId?: string) => {
    if (!user) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        const storagePath = `photos/${user.uid}/${Date.now()}-${file.name}`;
        const imageRef = ref(storage, storagePath);
        await uploadBytes(imageRef, file);
        const url = await getDownloadURL(imageRef);
        
        await addDoc(collection(db, 'photos'), {
          title: title || file.name,
          description,
          url,
          storagePath,
          albumId: albumId || null,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }
      setView('gallery');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    try {
      await deleteDoc(doc(db, 'photos', photo.id));
      const imageRef = ref(storage, photo.storagePath);
      await deleteObject(imageRef);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const handleCreateAlbum = async () => {
    if (!user) return;
    const title = prompt('Enter album name:');
    if (!title) return;
    try {
      await addDoc(collection(db, 'albums'), {
        title,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPhotos = photos.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                         p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesAlbum = !selectedAlbum || p.albumId === selectedAlbum;
    return matchesSearch && matchesAlbum;
  });

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      <Sidebar 
        user={user} 
        view={view} 
        setView={setView} 
        onAddAlbum={handleCreateAlbum} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          search={search} 
          setSearch={setSearch} 
          setView={setView} 
          user={user} 
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.section
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col items-center justify-center text-center p-12 bg-neutral-900/20 rounded-[3rem] border border-neutral-800/50"
              >
                <div className="mb-8 p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                  <Camera className="w-12 h-12 text-blue-500" />
                </div>
                <h1 className="text-5xl md:text-7xl font-sans font-bold tracking-tighter mb-6 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
                  Coopes Gallery
                </h1>
                <p className="max-w-xl mx-auto text-lg text-neutral-400 mb-12 leading-relaxed">
                  A high-performance sanctuary for your visual legacy. 
                  Organize, explore, and showcase your photography in a refined bento-style interface.
                </p>
                {!user ? (
                  <button 
                    onClick={signInWithGoogle}
                    className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-900/20"
                  >
                    Start your collection
                  </button>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => setView('gallery')}
                      className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all"
                    >
                      Enter Gallery
                    </button>
                    <button 
                      onClick={() => setView('dashboard')}
                      className="px-10 py-4 bg-neutral-800 text-white rounded-2xl font-bold text-lg hover:bg-neutral-700 transition-all border border-neutral-700"
                    >
                      Quick Upload
                    </button>
                  </div>
                )}
              </motion.section>
            )}

            {(view === 'gallery' || view === 'albums') && (
              <motion.section
                key="gallery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-fr">
                  {filteredPhotos.map((photo, index) => (
                    <PhotoCard 
                      key={photo.id} 
                      photo={photo} 
                      onClick={() => setSelectedPhoto(photo)} 
                      onDelete={() => handleDelete(photo)}
                      isLarge={index % 5 === 0}
                    />
                  ))}
                </div>

                {filteredPhotos.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-32">
                    <div className="w-20 h-20 bg-neutral-900 rounded-3xl border border-neutral-800 flex items-center justify-center mb-6">
                      <ImageIcon className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-lg font-medium">No results matched your search</p>
                    <button 
                      onClick={() => { setSearch(''); setSelectedAlbum(null); }}
                      className="mt-4 text-blue-500 hover:underline font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </motion.section>
            )}

            {view === 'dashboard' && (
              <UploadDashboard 
                onUpload={handleUpload} 
                isUploading={isUploading} 
                albums={albums}
                onCancel={() => setView('gallery')}
              />
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox 
            photo={selectedPhoto} 
            onClose={() => setSelectedPhoto(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const UploadDashboard = ({ 
  onUpload, 
  isUploading, 
  albums, 
  onCancel 
}: { 
  onUpload: (files: File[], title: string, description: string, albumId?: string) => void,
  isUploading: boolean,
  albums: Album[],
  onCancel: () => void
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [albumId, setAlbumId] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => setFiles(prev => [...prev, ...acceptedFiles]),
    accept: { 'image/*': [] }
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent italic">
              New Memory
            </h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Metadata</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-5 py-4 bg-neutral-950 rounded-2xl border border-neutral-800 outline-none focus:ring-1 ring-blue-500 transition-all text-neutral-100 font-medium placeholder:text-neutral-700"
                placeholder="Name your shot..."
              />
            </div>
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-5 py-4 bg-neutral-950 rounded-2xl border border-neutral-800 outline-none focus:ring-1 ring-blue-500 transition-all h-40 resize-none text-neutral-100 placeholder:text-neutral-700"
                placeholder="The story behind the lens..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <select
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  className="w-full px-5 py-4 bg-neutral-950 rounded-2xl border border-neutral-800 outline-none focus:ring-1 ring-blue-500 transition-all text-neutral-100"
                >
                  <option value="">No Collection</option>
                  {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                </select>
              </div>
              <button
                onClick={() => onUpload(files, title, description, albumId)}
                disabled={files.length === 0 || isUploading}
                className="bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/40"
              >
                {isUploading ? 'Securing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="bg-neutral-900 rounded-3xl border border-neutral-800 p-6">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Assets ({files.length})</h3>
            <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
              {files.map((file, i) => (
                <div key={i} className="aspect-square rounded-xl bg-neutral-950 overflow-hidden relative group border border-neutral-800">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="absolute inset-0 bg-red-600/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-[3rem] p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center h-full min-h-[400px]",
            isDragActive ? "border-blue-500 bg-blue-500/5" : "border-neutral-800 hover:border-neutral-600 bg-neutral-950/20"
          )}
        >
          <input {...getInputProps()} />
          <div className="p-6 bg-neutral-900 rounded-[2rem] border border-neutral-800 mb-6 shadow-2xl">
            <Plus className="w-12 h-12 text-blue-500" />
          </div>
          <p className="text-neutral-400 font-medium">Drop assets anywhere</p>
          <p className="text-[10px] text-neutral-600 uppercase tracking-tighter mt-2 font-bold">RAW / JPEG / PNG supported</p>
        </div>
      </div>
    </motion.div>
  );
};
