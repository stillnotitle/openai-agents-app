'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveApiKey, validateApiKey } from '@/lib/encryption/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Key } from 'lucide-react';

// APIキー入力フォームのバリデーションスキーマ
const formSchema = z.object({
  apiKey: z
    .string()
    .min(20, { message: 'APIキーは少なくとも20文字以上である必要があります' })
    .refine((val) => val.startsWith('sk-'), {
      message: 'APIキーは「sk-」で始まる必要があります',
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface ApiKeyFormProps {
  onSuccess?: () => void;
}

export function ApiKeyForm({ onSuccess }: ApiKeyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setSaveStatus('idle');

    try {
      // APIキーの基本的な検証
      const isValid = await validateApiKey(values.apiKey);
      
      if (!isValid) {
        setSaveStatus('error');
        return;
      }

      // APIキーの保存
      const saved = await saveApiKey(values.apiKey);
      
      if (saved) {
        setSaveStatus('success');
        form.reset();
        
        // 成功時のコールバックがあれば実行
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('APIキーの保存中にエラーが発生しました:', error);
      setSaveStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          OpenAI APIキーの設定
        </CardTitle>
        <CardDescription>
          OpenAI APIキーを入力して、AIエージェントを作成できるようにします。
          APIキーはブラウザ内で暗号化され、サーバーには送信されません。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>APIキー</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="sk-..."
                      type="password"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    APIキーは<a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAIのダッシュボード</a>から取得できます。
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {saveStatus === 'success' && (
              <Alert variant="success" className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>保存完了</AlertTitle>
                <AlertDescription>
                  APIキーが正常に保存されました。
                </AlertDescription>
              </Alert>
            )}
            
            {saveStatus === 'error' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>エラー</AlertTitle>
                <AlertDescription>
                  APIキーの保存中にエラーが発生しました。有効なAPIキーであることを確認してください。
                </AlertDescription>
              </Alert>
            )}
            
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? '保存中...' : 'APIキーを保存'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-muted-foreground">
        <p>
          セキュリティ情報: APIキーはブラウザ内で暗号化され、ローカルストレージに保存されます。
          サーバーには送信されず、必要な時のみブラウザ内で復号化されます。
        </p>
      </CardFooter>
    </Card>
  );
}
