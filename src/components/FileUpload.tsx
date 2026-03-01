
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToR2, isR2Configured } from '@/lib/r2-upload';

interface FileUploadProps {
    onUploadComplete?: (key: string) => void;
}

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function FileUpload({ onUploadComplete }: FileUploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [progress, setProgress] = useState(0);
    const [uploadedKey, setUploadedKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const reset = () => {
        setFile(null);
        setStatus('idle');
        setProgress(0);
        setUploadedKey(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-medium">File Upload</h3>
            </div>

            {!uploadedKey ? (
                <div className="space-y-4">
                    <Input
                        type="file"
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
                            {status === 'idle' || status === 'error' ? 'Upload File' : 'Uploading...'}
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
        </div>
    );
}
