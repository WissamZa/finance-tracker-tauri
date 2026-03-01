
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getR2FileUrl, isR2Configured } from '@/lib/r2-upload';

interface FileDownloadProps {
    fileKey: string;
    label?: string;
}

export function FileDownload({ fileKey, label = 'Download File' }: FileDownloadProps) {
    const handleDownload = () => {
        if (!fileKey) return;

        // If it's already a full URL, open directly
        if (fileKey.startsWith('http') || fileKey.startsWith('data:') || fileKey.startsWith('blob:')) {
            window.open(fileKey, '_blank');
            return;
        }

        // Use R2 worker URL for file keys
        if (isR2Configured()) {
            const url = getR2FileUrl(fileKey);
            window.open(url, '_blank');
        } else {
            // Fallback - just show the key
            console.warn('R2 not configured, cannot download file:', fileKey);
        }
    };

    return (
        <Button
            variant="outline"
            onClick={handleDownload}
            className="flex items-center gap-2"
        >
            <Download className="h-4 w-4" />
            {label}
        </Button>
    );
}
