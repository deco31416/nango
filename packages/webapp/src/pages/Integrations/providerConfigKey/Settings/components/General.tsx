import { useState } from 'react';
import type { GetIntegration } from '@nangohq/types';
import { Pencil1Icon } from '@radix-ui/react-icons';
import { formatDateToInternationalFormat } from '../../../../../utils/utils';
import Button from '../../../../../components/ui/button/Button';
import { Input } from '../../../../../components/ui/input/Input';
import { apiPatchIntegration } from '../../../../../hooks/useIntegration';
import { useToast } from '../../../../../hooks/useToast';
import { useStore } from '../../../../../store';
import { useNavigate } from 'react-router-dom';
import { mutate } from 'swr';
import { InfoBloc } from '../../../../../components/InfoBloc';
import { CopyButton } from '../../../../../components/ui/button/CopyButton';
import SecretInput from '../../../../../components/ui/input/SecretInput';
import type { EnvironmentAndAccount } from '@nangohq/server';

export const SettingsGeneral: React.FC<{ data: GetIntegration['Success']['data']; environment: EnvironmentAndAccount['environment'] }> = ({
    data: { integration, meta, template },
    environment
}) => {
    const { toast } = useToast();
    const navigate = useNavigate();

    const env = useStore((state) => state.env);
    const [showEditIntegrationId, setShowEditIntegrationId] = useState(false);
    const [integrationId, setIntegrationId] = useState(integration.unique_key);
    const [loading, setLoading] = useState(false);

    const onSaveIntegrationID = async () => {
        setLoading(true);

        const updated = await apiPatchIntegration(env, integration.unique_key, { integrationId });

        setLoading(false);
        if ('error' in updated.json) {
            toast({ title: updated.json.error.message || 'Failed to update, an error occurred', variant: 'error' });
        } else {
            toast({ title: 'Successfully updated integration id', variant: 'success' });
            setShowEditIntegrationId(false);
            void mutate((key) => typeof key === 'string' && key.startsWith(`/api/v1/integrations`), undefined);
            navigate(`/${env}/integrations/${integrationId}/settings`);
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="flex gap-10">
                <InfoBloc title="API Provider">{integration?.provider}</InfoBloc>
                <InfoBloc title="Integration ID">
                    {showEditIntegrationId ? (
                        <div className="flex flex-col gap-5 grow">
                            <Input
                                value={integrationId}
                                variant={'flat'}
                                onChange={(e) => {
                                    setIntegrationId(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        void onSaveIntegrationID();
                                    }
                                }}
                            />
                            <div className="flex justify-end gap-2 items-center">
                                <Button
                                    size={'xs'}
                                    variant={'emptyFaded'}
                                    onClick={() => {
                                        setIntegrationId(integration.unique_key);
                                        setShowEditIntegrationId(false);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button size={'xs'} variant={'primary'} onClick={() => onSaveIntegrationID()} isLoading={loading}>
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center text-white text-sm">
                            <div className="mr-2">{integration.unique_key}</div>
                            <Button variant={'icon'} onClick={() => setShowEditIntegrationId(true)} size={'xs'}>
                                <Pencil1Icon />
                            </Button>
                        </div>
                    )}
                </InfoBloc>
            </div>
            <div className="flex gap-10">
                <InfoBloc title="Creation Date">{formatDateToInternationalFormat(integration.created_at)}</InfoBloc>
                <InfoBloc title="Auth Type">{template.auth_mode}</InfoBloc>
            </div>

            {template.webhook_routing_script && (
                <>
                    <InfoBloc
                        title="Webhook Url"
                        help={<p>Register this webhook URL on the developer portal of the Integration Provider to receive incoming webhooks</p>}
                    >
                        <div>{`${environment.webhook_receive_url}/${integration.unique_key}`}</div>
                        <CopyButton text={`${environment.webhook_receive_url}/${integration.unique_key}`} />
                    </InfoBloc>

                    {meta.webhookSecret && (
                        <InfoBloc
                            title="Webhook Secret"
                            help={<p>Input this secret into the &quot;Webhook secret (optional)&quot; field in the Webhook section</p>}
                        >
                            <div>{meta.webhookSecret}</div>
                            <CopyButton text={meta.webhookSecret} />
                        </InfoBloc>
                    )}

                    {template.webhook_user_defined_secret && (
                        <InfoBloc title="Webhook Secret" help={<p>Obtain the Webhook Secret from on the developer portal of the Integration Provider</p>}>
                            <SecretInput
                                copy={true}
                                id="incoming_webhook_secret"
                                name="incoming_webhook_secret"
                                autoComplete="one-time-code"
                                defaultValue={integration ? integration.custom?.webhookSecret : ''}
                                additionalClass={`w-full`}
                                required
                            />
                        </InfoBloc>
                    )}
                </>
            )}
        </div>
    );
};
