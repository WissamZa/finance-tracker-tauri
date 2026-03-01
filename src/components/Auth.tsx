

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { signInWithPassword, signUpWithPassword } from '@/lib/supabase';
import { TranslationKey } from '@/lib/i18n';
import { LogIn, Mail, KeyRound, UserPlus } from 'lucide-react';

interface AuthProps {
  t: (key: TranslationKey) => string;
  language: string;
}

export function Auth({ t, language }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const { error } = await signUpWithPassword(email, password);
      if (error) throw error;
      toast.success(t('accountCreated'), {
        description: t('checkEmailForVerification'),
      });
    } catch (error: any) {
      const isRateLimit = error.status === 429 || error.message?.toLowerCase().includes('rate limit');
      toast.error(t('error'), {
        description: isRateLimit ? t('authRateLimit') : error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;
      // Success is handled by the onAuthStateChange listener in the main page
    } catch (error: any) {
      toast.error(t('error'), { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-500">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <LogIn className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl">{t('login')}</CardTitle>
          </div>
          <CardDescription>
            {language === 'ar'
              ? 'قم بتسجيل الدخول أو إنشاء حساب جديد للوصول إلى بياناتك.'
              : 'Sign in or create a new account to access your data.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{language === 'ar' ? 'كلمة المرور' : 'Password'}</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button onClick={handleSignIn} className="w-full h-11 bg-blue-600 hover:bg-blue-700" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {t('loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    {t('signIn')}
                  </span>
                )}
              </Button>
              <Button onClick={handleSignUp} variant="outline" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    {t('loading')}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    {t('signUp')}
                  </span>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
