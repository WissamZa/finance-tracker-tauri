'use client';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface FileDownloadProps {
    fileKey: string;
    label?: string;
}

export function FileDownload({ fileKey, label = 'Download File' }: FileDownloadProps) {
    const handleDownload = () => {
        // Navigate to the sign route which handles auth check and redirect
        const url = `/api/files/sign?key=${encodeURIComponent(fileKey)}`;
        window.open(url, '_blank');
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
