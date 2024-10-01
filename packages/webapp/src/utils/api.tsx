import { toast } from 'react-toastify';
import { useSignout } from './user';
import type { RunSyncCommand } from '../types';
import type { PostSignup } from '@nangohq/types';

export async function apiFetch(input: string | URL | Request, init?: RequestInit | undefined) {
    return await fetch(input, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
        credentials: 'include' // For cookies
    });
}

export async function fetcher(...args: Parameters<typeof fetch>) {
    const response = await apiFetch(...args);
    return response.json();
}

export interface SWRError<TError> {
    json: TError;
    status: number;
}
/**
 * Default SWR fetcher does not throw on HTTP error
 */
export async function swrFetcher<TBody>(url: string, req?: RequestInit | undefined): Promise<TBody> {
    const res = await apiFetch(url, req);

    if (!res.ok) {
        throw { json: await res.json(), status: res.status };
    }

    return await res.json();
}

export function requestErrorToast() {
    toast.error('Request error...', { position: toast.POSITION.BOTTOM_CENTER });
}

function serverErrorToast() {
    toast.error('Server error...', { position: toast.POSITION.BOTTOM_CENTER });
}

export function useLogoutAPI() {
    return async () => {
        const options = {
            method: 'POST'
        };

        await apiFetch('/api/v1/account/logout', options);
    };
}

export function useSignupAPI() {
    return async (body: PostSignup['Body']) => {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify(body)
            };

            return apiFetch('/api/v1/account/signup', options);
        } catch {
            requestErrorToast();
        }
    };
}

export function useSigninAPI() {
    return async (email: string, password: string) => {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ email: email, password: password })
            };

            const res = await apiFetch('/api/v1/account/signin', options);

            if (res.status !== 200 && res.status !== 401 && res.status !== 400) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useHostedSigninAPI() {
    return async () => {
        try {
            const res = await apiFetch('/api/v1/basic');

            if (res.status !== 200 && res.status !== 401) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useEditCallbackUrlAPI(env: string) {
    const signout = useSignout();

    return async (callbackUrl: string) => {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ callback_url: callbackUrl })
            };

            const res = await apiFetch(`/api/v1/environment/callback?env=${env}`, options);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useEditHmacEnabledAPI(env: string) {
    const signout = useSignout();

    return async (hmacEnabled: boolean) => {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ hmac_enabled: hmacEnabled })
            };

            const res = await apiFetch(`/api/v1/environment/hmac-enabled?env=${env}`, options);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useEditAlwaysSendWebhookAPI(env: string) {
    const signout = useSignout();

    return async (alwaysSendWebhook: boolean) => {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ always_send_webhook: alwaysSendWebhook })
            };

            const res = await apiFetch(`/api/v1/environment/webhook-send?env=${env}`, options);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useEditSendAuthWebhookAPI(env: string) {
    const signout = useSignout();

    return async (sendAuthWebhook: boolean) => {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ send_auth_webhook: sendAuthWebhook })
            };

            const res = await apiFetch(`/api/v1/environment/webhook-auth-send?env=${env}`, options);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useEditHmacKeyAPI(env: string) {
    const signout = useSignout();

    return async (hmacKey: string) => {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify({ hmac_key: hmacKey })
            };

            const res = await apiFetch(`/api/v1/environment/hmac-key?env=${env}`, options);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useEditEnvVariablesAPI(env: string) {
    const signout = useSignout();

    return async (envVariables: Record<string, string>[]) => {
        try {
            const options = {
                method: 'POST',
                body: JSON.stringify(envVariables)
            };

            const res = await apiFetch(`/api/v1/environment/environment-variables?env=${env}`, options);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useEditWebhookUrlAPI(env: string) {
    const signout = useSignout();

    return async (webhookUrl: string) => {
        try {
            const options = {
                method: 'PATCH',
                body: JSON.stringify({ url: webhookUrl })
            };

            const res = await apiFetch(`/api/v1/environment/webhook/primary-url?env=${env}`, options);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useEditWebhookSecondaryUrlAPI(env: string) {
    const signout = useSignout();

    return async (webhookSecondaryUrl: string) => {
        try {
            const options = {
                method: 'PATCH',
                body: JSON.stringify({ url: webhookSecondaryUrl })
            };

            const res = await apiFetch(`/api/v1/environment/webhook/secondary-url?env=${env}`, options);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useGetIntegrationListAPI(env: string) {
    const signout = useSignout();

    return async () => {
        try {
            const res = await apiFetch(`/api/v1/integrations?env=${env}`);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useGetProvidersAPI(env: string) {
    const signout = useSignout();

    return async () => {
        try {
            const res = await apiFetch(`/api/v1/provider?env=${env}`);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useGetConnectionListAPI(env: string) {
    const signout = useSignout();

    return async () => {
        try {
            const res = await apiFetch(`/api/v1/connection?env=${env}`);

            if (res.status === 401) {
                return signout();
            }

            if (res.status !== 200) {
                return serverErrorToast();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useGetConnectionDetailsAPI(env: string) {
    const signout = useSignout();

    return async (connectionId: string, providerConfigKey: string, force_refresh: boolean) => {
        try {
            const res = await apiFetch(
                `/api/v1/connection/${encodeURIComponent(connectionId)}?env=${env}&provider_config_key=${encodeURIComponent(
                    providerConfigKey
                )}&force_refresh=${force_refresh}`
            );

            if (res.status === 401) {
                return signout();
            }

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useRequestPasswordResetAPI() {
    return async (email: string) => {
        try {
            const res = await apiFetch(`/api/v1/account/forgot-password`, {
                method: 'POST',
                body: JSON.stringify({ email: email })
            });

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useResetPasswordAPI() {
    return async (token: string, password: string) => {
        try {
            const res = await apiFetch(`/api/v1/account/reset-password`, {
                method: 'PUT',
                body: JSON.stringify({ password: password, token: token })
            });

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useGetSyncAPI(env: string) {
    return async (connectionId: string, providerConfigKey: string) => {
        try {
            const res = await apiFetch(`/api/v1/sync?env=${env}&connection_id=${connectionId}&provider_config_key=${providerConfigKey}`, {
                method: 'GET'
            });

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useGetHmacAPI(env: string) {
    return async (providerConfigKey: string, connectionId: string) => {
        try {
            const res = await apiFetch(`/api/v1/environment/hmac?env=${env}&connection_id=${connectionId}&provider_config_key=${providerConfigKey}`, {
                method: 'GET'
            });

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useGetAllSyncsAPI(env: string) {
    return async () => {
        try {
            const res = await apiFetch(`/api/v1/syncs?env=${env}`, {
                method: 'GET'
            });

            return res;
        } catch {
            requestErrorToast();
        }
    };
}

export function useRunSyncAPI(env: string) {
    return async (command: RunSyncCommand, schedule_id: string, nango_connection_id: number, sync_id: string, sync_name: string, provider?: string) => {
        try {
            const res = await apiFetch(`/api/v1/sync/command?env=${env}`, {
                method: 'POST',
                body: JSON.stringify({ command, schedule_id, nango_connection_id, sync_id, sync_name, provider })
            });

            return res;
        } catch {
            requestErrorToast();
        }
    };
}