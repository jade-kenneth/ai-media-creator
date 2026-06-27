'use client';

import { Send } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { PageHeader, RichTextField } from '@/components/core';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RegisterTestPushTokenMutationVariables } from '@/react-query/push-notifications/push-notifications-operations';
import {
  useRegisterTestPushTokenMutation,
  useSendTestPushNotificationMutation,
} from '@/react-query/push-notifications/push-notifications-operations';
import { getPlainTextFromRichTextHtml } from '@/utils/rich-text';

const PUSH_PLATFORM_OPTIONS: Array<{
  label: string;
  value: RegisterTestPushTokenMutationVariables['input']['platform'];
}> = [
  { label: 'Android', value: 'ANDROID' },
  { label: 'iOS', value: 'IOS' },
  { label: 'Web', value: 'WEB' },
];

function isPushPlatform(
  value: string,
): value is RegisterTestPushTokenMutationVariables['input']['platform'] {
  return PUSH_PLATFORM_OPTIONS.some((option) => option.value === value);
}

export function PushTesterPageView() {
  const [title, setTitle] = useState('Test Notification');
  const [body, setBody] = useState('This is a test push notification.');
  const [userId, setUserId] = useState('');
  const [testToken, setTestToken] = useState('');
  const [testPlatform, setTestPlatform] =
    useState<RegisterTestPushTokenMutationVariables['input']['platform']>(
      'ANDROID',
    );

  const registerTestPushToken = useRegisterTestPushTokenMutation({
    onSuccess(data) {
      if (!data.registerTestPushToken) {
        toast.error('Push token registration failed');
        return;
      }

      toast.success('Test push token registered', {
        description:
          'You can now target this device when sending test notifications.',
      });
      setTestToken('');
    },
    onError(error) {
      toast.error('Failed to register test push token', {
        description: error.message,
      });
    },
  });

  const sendTestPush = useSendTestPushNotificationMutation({
    onSuccess(data) {
      const count = data.sendTestPushNotification.tokenCount;

      if (count === 0) {
        toast.warning('No registered devices found', {
          description: userId
            ? 'This user has no registered push tokens.'
            : 'No members have registered push tokens yet.',
        });
      } else {
        toast.success(
          `Push notification sent to ${count} device${count === 1 ? '' : 's'}`,
          {
            description: 'The notification should arrive within a few seconds.',
          },
        );
      }
    },
    onError(error) {
      toast.error('Failed to send test push notification', {
        description: error.message,
      });
    },
  });

  function handleSend() {
    const trimmedTitle = title.trim();
    const trimmedBody = getPlainTextFromRichTextHtml(body);

    if (!trimmedTitle) {
      toast.error('Title is required');
      return;
    }

    if (!trimmedBody) {
      toast.error('Body is required');
      return;
    }

    sendTestPush.mutate({
      input: {
        title: trimmedTitle,
        body: trimmedBody,
        userId: userId.trim() || null,
      },
    });
  }

  function handleRegisterTestToken() {
    const trimmedToken = testToken.trim();

    if (!trimmedToken) {
      toast.error('Push token is required');
      return;
    }

    registerTestPushToken.mutate({
      input: {
        token: trimmedToken,
        platform: testPlatform,
      },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Push Notification Tester"
        description="Send test push notifications to registered mobile devices for debugging and verification."
      />

      <div className="px-4 sm:px-6">
        <div className="mx-auto grid max-w-3xl gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Register Test Push Token</CardTitle>
              <CardDescription>
                Register a device token for the currently logged-in admin user
                so you can validate push delivery quickly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegisterTestToken();
                }}
              >
                <div className="space-y-2">
                  <label
                    htmlFor="register-test-push-token"
                    className="text-sm font-medium leading-none"
                  >
                    Expo Push Token
                  </label>
                  <Input
                    id="register-test-push-token"
                    placeholder="ExponentPushToken[...]"
                    value={testToken}
                    onChange={(e) => setTestToken(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="register-test-platform"
                    className="text-sm font-medium leading-none"
                  >
                    Platform
                  </label>
                  <Select
                    value={testPlatform}
                    onValueChange={(value) => {
                      if (isPushPlatform(value)) {
                        setTestPlatform(value);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="register-test-platform"
                      className="w-full"
                    >
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {PUSH_PLATFORM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={registerTestPushToken.isPending}
                >
                  {registerTestPushToken.isPending
                    ? 'Registering…'
                    : 'Register Test Token'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Test Notification</CardTitle>
              <CardDescription>
                Configure and send a test push notification. Leave the user ID
                empty to send to all registered devices.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <div className="space-y-2">
                  <label
                    htmlFor="push-title"
                    className="text-sm font-medium leading-none"
                  >
                    Title
                  </label>
                  <Input
                    id="push-title"
                    placeholder="Notification title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <RichTextField
                  id="push-body"
                  label="Body"
                  value={body}
                  onChange={setBody}
                  enableImageUpload={false}
                  placeholder="Notification body message"
                  limit={500}
                  helperText="Plain text only is sent in the notification payload."
                />

                <div className="space-y-2">
                  <label
                    htmlFor="push-user-id"
                    className="text-sm font-medium leading-none"
                  >
                    User ID{' '}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <Input
                    id="push-user-id"
                    placeholder="Leave empty to send to all devices"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Specify a user ID to target a single member, or leave
                    blank to broadcast to every registered device.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full sm:w-auto"
                  disabled={sendTestPush.isPending}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sendTestPush.isPending
                    ? 'Sending…'
                    : 'Send Test Notification'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-2 text-sm text-muted-foreground">
                <li>
                  Test notifications bypass the{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    EXPO_PUSH_ENABLED
                  </code>{' '}
                  environment variable so they always send.
                </li>
                <li>
                  Notifications are sent via the Expo Push API to all registered
                  iOS and Android devices.
                </li>
                <li>
                  Invalid tokens (e.g. uninstalled apps) are automatically
                  cleaned up after each send.
                </li>
                <li>
                  The push payload includes{' '}
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {"{ type: 'test' }"}
                  </code>{' '}
                  in the data field.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
