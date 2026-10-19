'use client';

import { useEffect, useState } from 'react';
import apiClient from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ReferralCard() {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [count, setCount] = useState(0);
  const [earned, setEarned] = useState(0);
  const [copied, setCopied] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    apiClient.get('/referrals/mine').then((r) => {
      setCode(r.data.data.code);
      setCount(r.data.data.referredCount);
      setEarned(r.data.data.pointsEarned);
    }).catch((e) => {
      // Endpoint missing / backend unreachable — hide card instead of erroring
      if (e.response?.status === 404) setSupported(false);
    });
  }, []);

  const link = typeof window !== 'undefined' && code ? `${window.location.origin}/register?ref=${code}` : '';

  if (!supported) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: 'Copy this link', description: link });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Refer & Earn
        </CardTitle>
        <CardDescription>Give friends ₹2 off (200 pts), earn 500 pts per signup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <code className="flex-1 text-center font-black tracking-widest bg-muted rounded-lg py-2">{code || '…'}</code>
          <Button size="sm" variant="outline" onClick={copy} disabled={!code}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {count} friend(s) joined · {earned} pts earned
        </div>
        <Button size="sm" className="w-full" disabled={!link} onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Shop Mentoos menswear with my link ${link} — you get ₹2 off!`)}`, '_blank')}>
          Share on WhatsApp
        </Button>
      </CardContent>
    </Card>
  );
}
