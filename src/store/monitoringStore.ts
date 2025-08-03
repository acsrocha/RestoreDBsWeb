import { create } from 'zustand';

export interface ProcessingStage {
  status: 'pending' | 'processing' | 'complete' | 'failed';
  details?: string;
  progress?: number;
  startTime?: string;
  endTime?: string;
  steps?: Array<{
    id: string;
    timestamp: string;
    status: string;
    message: string;
    details?: string;
    duration?: number;
  }>;
}

export interface MonitoringJob {
  id: string;
  fileId: string;
  fileName: string;
  status: 'processing' | 'completed' | 'failed' | 'queued';
  startedAt: string;
  completedAt?: string;
  currentStage: string;
  overallProgress: number;
  error?: string;
  stages: {
    download: ProcessingStage;
    validation: ProcessingStage;
    restore: ProcessingStage;
    finalization: ProcessingStage;
  };
}

export interface MonitoringStats {
  total: number;
  processing: number;
  completed: number;
  failed: number;
  queued: number;
}

interface MonitoringState {
  jobs: MonitoringJob[];
  stats: MonitoringStats;
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
  isPaused: boolean;
  refreshInterval: number;
  searchTerm: string;
  selectedView: 'all' | 'processing' | 'completed' | 'failed';
  selectedJobId: string | null;
  
  setJobs: (jobs: MonitoringJob[]) => void;
  setStats: (stats: MonitoringStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPaused: (paused: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  setSearchTerm: (term: string) => void;
  setSelectedView: (view: 'all' | 'processing' | 'completed' | 'failed') => void;
  setSelectedJobId: (id: string | null) => void;
  updateLastUpdated: () => void;
  
  getProcessingJobs: () => MonitoringJob[];
  getCompletedJobs: () => MonitoringJob[];
  getFailedJobs: () => MonitoringJob[];
  getFilteredJobs: () => MonitoringJob[];
  getJobById: (id: string) => MonitoringJob | undefined;
  
  removeJob: (jobId: string) => void;
  updateJob: (jobId: string, updates: Partial<MonitoringJob>) => void;
  reset: () => void;
}

const initialStats: MonitoringStats = {
  total: 0,
  processing: 0,
  completed: 0,
  failed: 0,
  queued: 0
};

export const useMonitoringStore = create<MonitoringState>((set, get) => ({
  jobs: [],
  stats: initialStats,
  lastUpdated: null,
  isLoading: true,
  error: null,
  isPaused: false,
  refreshInterval: 2000,
  searchTerm: '',
  selectedView: 'all',
  selectedJobId: null,
  
  setJobs: (jobs) => set({ jobs, lastUpdated: new Date() }),
  setStats: (stats) => set({ stats }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setPaused: (isPaused) => set({ isPaused }),
  setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSelectedView: (selectedView) => set({ selectedView }),
  setSelectedJobId: (selectedJobId) => set({ selectedJobId }),
  updateLastUpdated: () => set({ lastUpdated: new Date() }),
  
  getProcessingJobs: () => {
    const { jobs } = get();
    return jobs.filter(job => job.status === 'processing' || job.status === 'queued');
  },
  
  getCompletedJobs: () => {
    const { jobs } = get();
    return jobs.filter(job => job.status === 'completed');
  },
  
  getFailedJobs: () => {
    const { jobs } = get();
    return jobs.filter(job => job.status === 'failed');
  },
  
  getFilteredJobs: () => {
    const { jobs, searchTerm, selectedView } = get();
    
    let filtered = jobs;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.fileName.toLowerCase().includes(term) ||
        job.fileId.toLowerCase().includes(term)
      );
    }
    
    if (selectedView !== 'all') {
      filtered = filtered.filter(job => {
        switch (selectedView) {
          case 'processing': return job.status === 'processing' || job.status === 'queued';
          case 'completed': return job.status === 'completed';
          case 'failed': return job.status === 'failed';
          default: return true;
        }
      });
    }
    
    return filtered;
  },
  
  getJobById: (id) => {
    const { jobs } = get();
    return jobs.find(job => job.id === id || job.fileId === id);
  },
  
  removeJob: (jobId) => set((state) => ({
    jobs: state.jobs.filter(job => job.id !== jobId && job.fileId !== jobId)
  })),
  
  updateJob: (jobId, updates) => set((state) => ({
    jobs: state.jobs.map(job => 
      (job.id === jobId || job.fileId === jobId) 
        ? { ...job, ...updates }
        : job
    )
  })),
  
  reset: () => set({
    jobs: [],
    stats: initialStats,
    lastUpdated: null,
    isLoading: true,
    error: null,
    searchTerm: '',
    selectedView: 'all',
    selectedJobId: null
  })
}));