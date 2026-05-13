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
  Folder,
  ChevronLeft,
  Filter,
  Camera
} from 'lucide-react';
import { db, auth, signInWithGoogle, logout } from './lib/firebase';
import { Photo, Album, View } from './types';
import { cn } from './lib/utils';
import { useDropzone } from 'react-dropzone';
import { compressImage } from './lib/imageUtils';

// --- Components ---

const Sidebar = ({ 
  user, 
  view, 
  setView,
  setSelectedAlbum,
  onAddAlbum 
}: { 
  user: User | null, 
  view: View, 
  setView: (v: View) => void,
  setSelectedAlbum: (id: string | null) => void,
  onAddAlbum: () => void
}) => {
  return (
    <aside className="w-64 h-full border-r border-neutral-200 dark:border-neutral-800 p-6 flex flex-col gap-8 flex-shrink-0 hidden lg:flex bg-white dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-lg text-white">C</div>
        <span className="text-xl font-cassandra tracking-tight text-neutral-900 dark:text-white">Coopes</span>
      </div>

      <nav className="flex flex-col gap-1">
        <button 
          onClick={() => { setView('gallery'); setSelectedAlbum(null); }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all text-sm",
            view === 'gallery' ? "bg-neutral-100 dark:bg-neutral-900 text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100"
          )}
        >
          <ImageIcon className="w-4 h-4" />
          All Photos
        </button>
        <button 
          onClick={() => { setView('albums'); setSelectedAlbum(null); }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all text-sm",
            view === 'albums' ? "bg-neutral-100 dark:bg-neutral-900 text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100"
          )}
        >
          <AlbumIcon className="w-4 h-4" />
          Albums
        </button>
        <button 
          onClick={() => { setView('home'); setSelectedAlbum(null); }}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl font-medium transition-all text-sm",
            view === 'home' ? "bg-neutral-100 dark:bg-neutral-900 text-blue-600 dark:text-blue-400" : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100"
          )}
        >
          <Camera className="w-4 h-4" />
          Showcase
        </button>
      </nav>

      <div className="mt-8">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">Collections</span>
          <button onClick={onAddAlbum} className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="mt-auto p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex justify-between text-[10px] mb-2 text-neutral-500 dark:text-neutral-400 font-bold uppercase tracking-tight">
          <span>Storage</span>
          <span>Used</span>
        </div>
        <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden mb-3">
          <div className="w-[45%] h-full bg-blue-500"></div>
        </div>
        <button className="w-full py-2 text-[10px] uppercase font-bold bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg transition-colors tracking-widest">Upgrade Plan</button>
      </div>

      {user && (
        <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center font-bold text-[10px] text-neutral-900 dark:text-white">
              {user.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate w-24">{user.displayName}</span>
              <span className="text-[10px] text-neutral-500">Free Tier</span>
            </div>
          </div>
          <button onClick={logout} className="text-neutral-500 hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};

const Header = ({ 
  search, 
  setSearch, 
  setView, 
  user, 
  currentView,
  darkMode,
  toggleDarkMode
}: { 
  search: string, 
  setSearch: (s: string) => void, 
  setView: (v: View) => void, 
  user: any, 
  currentView: View,
  darkMode: boolean,
  toggleDarkMode: () => void
}) => {
  return (
    <header className="h-20 border-b border-neutral-200 dark:border-neutral-800 px-4 md:px-8 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md z-40">
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <button 
          onClick={() => setView('home')}
          className="lg:hidden w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm text-white shrink-0"
        >
          C
        </button>

        <button 
          onClick={() => setView('gallery')}
          className={cn(
            "lg:hidden p-2 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-all shrink-0",
            currentView === 'gallery' && "text-blue-500 border-blue-500/20"
          )}
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        
        <div className="relative w-full max-w-[180px] sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl py-2 pl-9 pr-4 text-xs md:text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-neutral-500"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 text-neutral-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {user ? (
          <div className="flex items-center gap-2 md:gap-4 font-sans">
            <button 
              onClick={() => setView('dashboard')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>
            
            <div className="lg:hidden flex items-center gap-1 sm:gap-2 pl-2 border-l border-neutral-800">
              <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-[10px] text-white shrink-0">
                {user.displayName?.split(' ').map((n: string) => n[0]).join('') || 'U'}
              </div>
              <button 
                onClick={logout}
                className="p-2 text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={signInWithGoogle}
            className="bg-white hover:bg-neutral-200 text-neutral-950 px-4 md:px-5 py-2 rounded-xl text-xs md:text-sm font-semibold flex items-center gap-2 transition-all"
          >
            Sign In
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
        "group bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden relative group cursor-pointer",
        isLarge ? "col-span-2 row-span-2 shadow-2xl" : "col-span-1 row-span-1 shadow-lg"
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
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

const AlbumFolder = ({ album, photoCount, onClick, onDelete }: { album: Album, photoCount: number, onClick: () => void, onDelete: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 relative cursor-pointer hover:border-blue-500/50 transition-all shadow-sm hover:shadow-xl"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
          <Folder className="w-8 h-8" />
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this collection and all its organizational data? (Photos will remain in your main gallery)')) onDelete();
          }}
          className="p-2 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div>
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {album.title}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
          {photoCount} {photoCount === 1 ? 'asset' : 'assets'}
        </p>
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

  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setPhotos([]);
        setAlbums([]);
        setView('home');
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;

    // Determine if we should filter by specific album
    // If we're in gallery view or albums overview, we want all photos for counts and listing
    // If we're in a specific album, we filter by that for performance/security
    const needsAll = view === 'gallery' || (view === 'albums' && !selectedAlbum);
    
    let q;
    if (needsAll) {
      q = query(
        collection(db, 'photos'),
        where('userId', '==', user.uid)
      );
    } else {
      q = query(
        collection(db, 'photos'),
        where('userId', '==', user.uid),
        where('albumId', '==', selectedAlbum)
      );
    }

    const unsubPhotos = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Photo));
      const sorted = docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setPhotos(sorted);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'photos'));

    // Fetch Albums
    const aq = query(
      collection(db, 'albums'),
      where('userId', '==', user.uid)
    );
    const unsubAlbums = onSnapshot(aq, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Album));
      const sorted = docs.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setAlbums(sorted);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'albums'));

    return () => {
      unsubPhotos();
      unsubAlbums();
    };
  }, [user, selectedAlbum, view]);

  // Photo counts for albums logic:
  // To keep it simple and efficient without fetching everything twice, 
  // we'll calculate based on the current photos state if we are showing all.
  // However, local filter is safer if we just fetch all user photos whenever user is on gallery or albums view.
  const getAlbumPhotoCount = (aid: string) => {
    // If we have all photos loaded, we can count. 
    // In many cases we'll only have partial photos loaded if we are deep in an album.
    // Let's stick to showing the UI for now.
    return photos.filter(p => p.albumId === aid).length;
  };

  const handleUpload = async (files: File[], title: string, description: string, albumId?: string) => {
    if (!user) return;
    setIsUploading(true);
    try {
      for (const file of files) {
        // Compress and convert to base64
        const base64Url = await compressImage(file);
        
        try {
          await addDoc(collection(db, 'photos'), {
            title: title || file.name,
            description,
            url: base64Url,
            albumId: albumId || null,
            userId: user.uid,
            createdAt: serverTimestamp()
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'photos');
        }
      }
      setView('gallery');
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (photo: Photo) => {
    try {
      await deleteDoc(doc(db, 'photos', photo.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `photos/${photo.id}`);
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
      if (view !== 'albums') setView('albums');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'albums');
    }
  };

  const handleDeleteAlbum = async (albumId: string) => {
    try {
      await deleteDoc(doc(db, 'albums', albumId));
      if (selectedAlbum === albumId) setSelectedAlbum(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `albums/${albumId}`);
    }
  };

  const filteredPhotos = photos.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                         p.description?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar 
        user={user} 
        view={view} 
        setView={setView} 
        setSelectedAlbum={setSelectedAlbum}
        onAddAlbum={handleCreateAlbum} 
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          search={search} 
          setSearch={setSearch} 
          setView={setView} 
          user={user} 
          currentView={view}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.section
                key="home"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-[calc(100vh-160px)] flex flex-col items-center justify-center text-center p-12 relative overflow-hidden rounded-[3rem] border border-neutral-200 dark:border-neutral-800 shadow-2xl"
              >
                {/* Background Cover */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?q=80&w=2674&auto=format&fit=crop" 
                    className="w-full h-full object-cover opacity-60 dark:opacity-40"
                    referrerPolicy="no-referrer"
                    alt="Showcase Cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 dark:from-transparent via-white/80 dark:via-neutral-950/80 to-white dark:to-neutral-950"></div>
                </div>

                <div className="relative z-10">
                  <div className="mb-8 p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 text-blue-600 dark:text-blue-500 inline-block backdrop-blur-sm">
                    <Camera className="w-12 h-12" />
                  </div>
                  <h1 className="text-6xl md:text-9xl font-cassandra tracking-tight mb-6 bg-gradient-to-br from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500 bg-clip-text text-transparent italic">
                    Coopes Gallery
                  </h1>
                  <p className="max-w-xl mx-auto text-lg md:text-xl text-neutral-600 dark:text-neutral-400 mb-12 leading-relaxed font-medium">
                    A high-performance sanctuary for your visual legacy. 
                    Organize, explore, and showcase your photography in a refined bento-style interface.
                  </p>
                  {!user ? (
                    <button 
                      onClick={signInWithGoogle}
                      className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                    >
                      Start your collection
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-6">
                      <button 
                        onClick={() => setView('gallery')}
                        className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                      >
                        Enter Gallery
                      </button>
                      <button 
                        onClick={() => setView('dashboard')}
                        className="px-10 py-4 bg-white/10 dark:bg-neutral-800 backdrop-blur-md text-neutral-900 dark:text-white rounded-2xl font-bold text-lg hover:bg-white/20 dark:hover:bg-neutral-700 transition-all border border-neutral-200 dark:border-neutral-700 active:scale-95"
                      >
                        Quick Upload
                      </button>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {view === 'albums' && !selectedAlbum && (
              <motion.section
                key="albums-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">Your Collections</h2>
                  <button 
                    onClick={handleCreateAlbum}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    New Album
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {albums.map((album) => (
                    <AlbumFolder 
                      key={album.id} 
                      album={album} 
                      photoCount={getAlbumPhotoCount(album.id)} 
                      onClick={() => setSelectedAlbum(album.id)}
                      onDelete={() => handleDeleteAlbum(album.id)}
                    />
                  ))}
                </div>
                {albums.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-neutral-500 py-32">
                    <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6">
                      <AlbumIcon className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-lg font-medium">No collections created yet</p>
                    <button 
                      onClick={handleCreateAlbum}
                      className="mt-4 text-blue-500 hover:underline font-medium"
                    >
                      Create your first album
                    </button>
                  </div>
                )}
              </motion.section>
            )}

            {(view === 'gallery' || (view === 'albums' && selectedAlbum)) && (
              <motion.section
                key="gallery"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                {view === 'albums' && selectedAlbum && (
                  <div className="flex items-center gap-4 mb-8">
                    <button 
                      onClick={() => setSelectedAlbum(null)}
                      className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                      <h2 className="text-3xl font-bold text-neutral-900 dark:text-white">
                        {albums.find(a => a.id === selectedAlbum)?.title || 'Album Content'}
                      </h2>
                      <p className="text-sm text-neutral-500 font-medium">
                        {filteredPhotos.length} {filteredPhotos.length === 1 ? 'memory' : 'memories'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
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
                    <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 flex items-center justify-center mb-6">
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6"
    >
      <div className="lg:col-span-2 space-y-4 md:space-y-6">
        <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-br from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500 bg-clip-text text-transparent italic">
              New Memory
            </h2>
            <button 
              onClick={onCancel}
              className="lg:hidden p-2 rounded-xl bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 mb-2 uppercase tracking-widest">Metadata</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 md:px-5 py-3 md:py-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl md:rounded-2xl border border-neutral-200 dark:border-neutral-800 outline-none focus:ring-1 ring-blue-500 transition-all text-neutral-900 dark:text-neutral-100 font-medium placeholder:text-neutral-400 dark:placeholder:text-neutral-700"
                placeholder="Name your shot..."
              />
            </div>
            <div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 md:px-5 py-3 md:py-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl md:rounded-2xl border border-neutral-200 dark:border-neutral-800 outline-none focus:ring-1 ring-blue-500 transition-all h-32 md:h-40 resize-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-700"
                placeholder="The story behind the lens..."
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <select
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  className="w-full px-4 md:px-5 py-3 md:py-4 bg-neutral-50 dark:bg-neutral-950 rounded-xl md:rounded-2xl border border-neutral-200 dark:border-neutral-800 outline-none focus:ring-1 ring-blue-500 transition-all text-neutral-900 dark:text-neutral-100"
                >
                  <option value="" className="bg-white dark:bg-neutral-950">No Collection</option>
                  {albums.map(a => <option key={a.id} value={a.id} className="bg-white dark:bg-neutral-950">{a.title}</option>)}
                </select>
              </div>
              <button
                onClick={() => onUpload(files, title, description, albumId)}
                disabled={files.length === 0 || isUploading}
                className="px-8 py-3 md:py-4 bg-blue-600 text-white rounded-xl md:rounded-2xl font-bold hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-900/40"
              >
                {isUploading ? 'Securing...' : 'Publish'}
              </button>
            </div>
          </div>
        </div>

        {files.length > 0 && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-3xl border border-neutral-200 dark:border-neutral-800 p-4 md:p-6">
            <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-4">Assets ({files.length})</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
              {files.map((file, i) => (
                <div key={i} className="aspect-square rounded-xl bg-neutral-50 dark:bg-neutral-950 overflow-hidden relative group border border-neutral-200 dark:border-neutral-800">
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
            "border-2 border-dashed rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[250px] md:h-full md:min-h-[400px]",
            isDragActive ? "border-blue-500 bg-blue-500/5 text-blue-600" : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-950/20"
          )}
        >
          <input {...getInputProps()} />
          <div className="p-4 md:p-6 bg-white dark:bg-neutral-900 rounded-[1.5rem] md:rounded-[2rem] border border-neutral-200 dark:border-neutral-800 mb-4 md:mb-6 shadow-2xl">
            <Plus className="w-8 h-8 md:w-12 md:h-12 text-blue-500" />
          </div>
          <p className="text-neutral-600 dark:text-neutral-400 font-medium text-sm md:text-base">Drop assets anywhere</p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-600 uppercase tracking-tighter mt-2 font-bold">RAW / JPEG / PNG supported</p>
        </div>
      </div>
    </motion.div>
  );
};
