import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RefreshCw, Trash2, Plus, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BackgroundJob {
  id: string;
  job_type: string;
  job_data: any;
  status: string;
  priority: number;
  attempts: number;
  max_attempts: number;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  created_at: string;
}

export const BackgroundJobManager = () => {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [newJobType, setNewJobType] = useState('');
  const [newJobData, setNewJobData] = useState('{}');
  const [newJobPriority, setNewJobPriority] = useState(5);
  const { toast } = useToast();

  const loadJobs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('background_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      setJobs(data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load background jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const processJobs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('process-background-jobs');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Processed ${data.processed} jobs`,
      });
      
      loadJobs();
    } catch (error) {
      console.error('Error processing jobs:', error);
      toast({
        title: "Error",
        description: "Failed to process jobs",
        variant: "destructive"
      });
    }
  };

  const createJob = async () => {
    try {
      let jobData;
      try {
        jobData = JSON.parse(newJobData);
      } catch {
        throw new Error('Invalid JSON in job data');
      }

      const { error } = await supabase
        .from('background_jobs')
        .insert({
          job_type: newJobType,
          job_data: jobData,
          priority: newJobPriority
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job created successfully",
      });

      setNewJobType('');
      setNewJobData('{}');
      setNewJobPriority(5);
      loadJobs();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create job",
        variant: "destructive"
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('background_jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job deleted successfully",
      });

      loadJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive"
      });
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('background_jobs')
        .update({
          status: 'pending',
          attempts: 0,
          error_message: null,
          scheduled_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job queued for retry",
      });

      loadJobs();
    } catch (error) {
      console.error('Error retrying job:', error);
      toast({
        title: "Error",
        description: "Failed to retry job",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadJobs();
  }, [filter]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Background Job Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Button onClick={processJobs}>
              <Play className="w-4 h-4 mr-2" />
              Process Jobs
            </Button>
            
            <Button onClick={loadJobs} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Create New Job */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Job Type"
              value={newJobType}
              onChange={(e) => setNewJobType(e.target.value)}
            />
            <Input
              placeholder="Job Data (JSON)"
              value={newJobData}
              onChange={(e) => setNewJobData(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Priority (1-10)"
              value={newJobPriority}
              onChange={(e) => setNewJobPriority(parseInt(e.target.value) || 5)}
              min={1}
              max={10}
            />
            <Button onClick={createJob} disabled={!newJobType}>
              <Plus className="w-4 h-4 mr-2" />
              Create Job
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs ({jobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No jobs found
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">{job.job_type}</span>
                      <Badge variant={getStatusColor(job.status) as any}>
                        {job.status}
                      </Badge>
                      <Badge variant="outline">
                        Priority: {job.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.status === 'failed' && (
                        <Button size="sm" onClick={() => retryJob(job.id)}>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => deleteJob(job.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Created: {new Date(job.created_at).toLocaleString()}</p>
                    {job.scheduled_at && (
                      <p>Scheduled: {new Date(job.scheduled_at).toLocaleString()}</p>
                    )}
                    {job.started_at && (
                      <p>Started: {new Date(job.started_at).toLocaleString()}</p>
                    )}
                    {job.completed_at && (
                      <p>Completed: {new Date(job.completed_at).toLocaleString()}</p>
                    )}
                    {job.error_message && (
                      <p className="text-red-600">Error: {job.error_message}</p>
                    )}
                    <p>Attempts: {job.attempts}/{job.max_attempts}</p>
                  </div>
                  
                  {Object.keys(job.job_data).length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">
                        Job Data
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                        {JSON.stringify(job.job_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};