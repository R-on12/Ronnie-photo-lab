export interface Photo {
  id: string;
  title: string;
  description?: string;
  url: string;
  storagePath: string;
  albumId?: string;
  userId: string;
  createdAt: any;
}

export interface Album {
  id: string;
  title: string;
  description?: string;
  userId: string;
  createdAt: any;
}

export type View = 'home' | 'gallery' | 'albums' | 'dashboard';
