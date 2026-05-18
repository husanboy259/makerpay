'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';

const ROLE_ROUTES: Record<string, string> = {
  admin: '/dashboard/admin',
  manager: '/dashboard/manager',
  support: '/dashboard/support',
  user: '/dashboard/merchant',
};

export default function TelegramLoginButton() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    if (!botUsername) return;

    (window as any).onTelegramAuth = async (tgUser: any) => {
      try {
        const res: any = await authApi.telegramLogin(tgUser);
        setAuth(res.user, res.accessToken);
        router.push(ROLE_ROUTES[res.user.role] || '/dashboard/merchant');
      } catch (e) {
        console.error('Telegram login failed', e);
      }
    };

    const existing = document.getElementById('tg-script');
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.id = 'tg-script';
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.dataset.telegramLogin = botUsername;
    script.dataset.size = 'large';
    script.dataset.radius = '12';
    script.dataset.onauth = 'onTelegramAuth(user)';
    script.dataset.requestAccess = 'write';
    script.async = true;

    document.getElementById('tg-container')?.appendChild(script);

    return () => {
      document.getElementById('tg-script')?.remove();
      delete (window as any).onTelegramAuth;
    };
  }, [botUsername]);

  if (!botUsername) return null;

  return (
    <div className="w-full">
      <div id="tg-container" className="flex justify-center [&_iframe]:!w-full [&_iframe]:!rounded-xl" />
    </div>
  );
}
