

import { useState } from 'react';
import { Database, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { TranslationKey } from '@/lib/i18n';
import { DatabaseSource } from '@/lib/store';

interface DatabaseSettingsDialogProps {
  t: (key: TranslationKey) => string;
  language: string;
  databaseSource: DatabaseSource;
  setDatabaseSource: (source: DatabaseSource) => void;
  isSupabaseConnected: boolean;
  setIsSupabaseConnected: (connected: boolean) => void;
  setSupabaseConfig: (config: any) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSync: () => void;
  onConnect: (url: string, key: string) => void;
  isConnecting: boolean;
  isSyncing: boolean;
}

export function DatabaseSettingsDialog({
  t,
  language,
  databaseSource,
  setDatabaseSource,
  isSupabaseConnected,
  setIsSupabaseConnected,
  setSupabaseConfig,
  isOpen,
  onOpenChange,
  onSync,
  onConnect,
  isConnecting,
  isSyncing,
}: DatabaseSettingsDialogProps) {
  const [url, setUrl] = useState(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
  const [key, setKey] = useState(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('databaseSettings')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('databaseSettings')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-base font-semibold">{t('databaseSource')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={databaseSource === 'local' ? 'default' : 'outline'}
                className={databaseSource === 'local' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                onClick={() => setDatabaseSource('local')}
              >
                <CloudOff className="mr-2 h-4 w-4" />
                {t('localDatabase')}
              </Button>
              <Button
                type="button"
                variant={databaseSource === 'supabase' ? 'default' : 'outline'}
                className={databaseSource === 'supabase' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                onClick={() => setDatabaseSource('supabase')}
              >
                <Database className="mr-2 h-4 w-4" />
                Supabase
              </Button>
            </div>
          </div>

          {databaseSource === 'local' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CloudOff className="h-4 w-4" />
                  {t('localDatabase')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {language === 'ar' 
                    ? 'البيانات مخزنة في متصفحك وتعمل بدون اتصال' 
                    : 'Data is stored in your browser and works offline'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-emerald-600">
                    {language === 'ar' ? 'نشط' : 'Active'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {databaseSource === 'supabase' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Supabase
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isSupabaseConnected ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm text-emerald-600">{t('connected')}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setIsSupabaseConnected(false);
                          setSupabaseConfig(null);
                        }}
                      >
                        {t('disconnect')}
                      </Button>
                      <Button 
                        variant="default"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        onClick={onSync}
                        disabled={isSyncing}
                      >
                        {isSyncing ? t('syncing') : t('sync')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t('connectToSupabase')}
                    </p>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={() => onConnect(url, key)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? t('connecting') : t('connect')}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
