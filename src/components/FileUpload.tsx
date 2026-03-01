
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Upload, FileText, Image, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToR2, isR2Configured, listR2Files, deleteFromR2, getR2FileUrl } from '@/lib/r2-upload';

interface FileUploadProps {
    onUploadComplete?: (key: string) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

interface R2File {
    key: string;
    size: number;
    uploadedAt?: string;
    contentType?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUpload({ onUploadComplete }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [uploadedKey, setUploadedKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [files, setFiles] = useState<R2File[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load files on mount
    useEffect(() => {
        loadFiles();
    }, []);

    const loadFiles = async () => {
        if (!isR2Configured()) return;
        
        setIsLoadingFiles(true);
        try {
            const result = await listR2Files();
            if (result.error) {
                console.error('Failed to load files:', result.error);
            } else {
                setFiles(result.files);
            }
        } catch (err) {
            console.error('Failed to load files:', err);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.size > MAX_FILE_SIZE) {
                setError('File size exceeds 50MB limit');
                toast.error('File size exceeds 50MB limit');
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }
            setFile(selectedFile);
            setError(null);
            setUploadedKey(null);
            setStatus('idle');
        }
    };

    const uploadFile = async () => {
        if (!file) return;

        if (!isR2Configured()) {
            setError('R2 upload not configured. Set VITE_R2_WORKER_URL in .env');
            toast.error('R2 upload not configured');
            setStatus('error');
            return;
        }

        setStatus('uploading');
        setError(null);
        setProgress(0);

        try {
            // Simulate progress for user feedback
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 100);

            const result = await uploadToR2(file);

            clearInterval(progressInterval);
            setProgress(100);

            if (result.success && result.key) {
                setStatus('done');
                setUploadedKey(result.key);
                toast.success('File uploaded successfully');
                if (onUploadComplete) onUploadComplete(result.key);
                // Refresh file list
                loadFiles();
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (err: any) {
            console.error('Upload failed:', err);
            setStatus('error');
            setError(err.message || 'Upload failed');
            toast.error(err.message || 'Upload failed');
        }
    };

    const handleDeleteFile = async (key: string) => {
        try {
            const result = await deleteFromR2(key);
            if (result.success) {
                toast.success('File deleted');
                setFiles(prev => prev.filter(f => f.key !== key));
            } else {
                toast.error(result.error || 'Failed to delete');
            }
        } catch (err) {
            toast.error('Failed to delete file');
        }
    };

    const reset = () => {
        setFile(null);
        setStatus('idle');
        setProgress(0);
        setUploadedKey(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getFileIcon = (contentType?: string) => {
        if (contentType?.startsWith('image/')) return Image;
        return FileText;
    };

    if (!isR2Configured()) {
        return (
            <div className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-medium">R2 Not Configured</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Set <code className="px-1 py-0.5 bg-muted rounded text-xs">VITE_R2_WORKER_URL</code> in your .env file to enable file uploads.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-medium">File Upload</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={loadFiles} disabled={isLoadingFiles}>
                    <RefreshCw className={`h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {!uploadedKey ? (
                <div className="space-y-4">
                    <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        disabled={status !== 'idle' && status !== 'error'}
                        ref={fileInputRef}
                        className="cursor-pointer"
                    />

                    {file && (
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </div>
                    )}

                    {status === 'uploading' && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span>Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Button
                            onClick={uploadFile}
                            disabled={!file || status === 'uploading'}
                            className="flex-1"
                        >
                            {status === 'uploading' ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload File'
                            )}
                        </Button>
                        {(file || status !== 'idle') && (
                            <Button variant="outline" onClick={reset} disabled={status === 'uploading'}>
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-4 py-2">
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 className="h-5 w-5" />
                        Upload Complete!
                    </div>
                    <div className="bg-muted p-2 rounded text-xs break-all font-mono">
                        {uploadedKey}
                    </div>
                    <Button variant="outline" onClick={reset} className="w-full">
                        Upload Another
                    </Button>
                </div>
            )}

            {/* Files List */}
            <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium mb-3">Uploaded Files ({files.length})</h4>
                {isLoadingFiles ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : files.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {files.map((file) => {
                            const FileIcon = getFileIcon(file.contentType);
                            return (
                                <div
                                    key={file.key}
                                    className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg group"
                                >
                                    <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{file.key}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatBytes(file.size)}
                                            {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7"
                                            onClick={() => window.open(getR2FileUrl(file.key), '_blank')}
                                        >
                                            <Upload className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                            onClick={() => handleDeleteFile(file.key)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No files uploaded yet
                    </p>
                )}
            </div>
        </div>
    );
}
