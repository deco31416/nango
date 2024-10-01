import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import type { SyncConfig } from '@nangohq/shared';
import { Orchestrator, seeders, configService, connectionService, DEMO_GITHUB_CONFIG_KEY, DEMO_SYNC_NAME, createSync } from '@nangohq/shared';
import db, { multipleMigrations } from '@nangohq/database';
import { exec } from './autoIdleDemo.js';
import { nanoid } from '@nangohq/utils';
import { TestOrchestratorService } from '@nangohq/nango-orchestrator';
import getPort from 'get-port';
import type { DBEnvironment } from '@nangohq/types';

describe('Auto Idle Demo', async () => {
    let env: DBEnvironment;
    const orchestratorService = new TestOrchestratorService({ port: await getPort() });
    const orchestrator = new Orchestrator(orchestratorService.getClient());

    beforeAll(async () => {
        await multipleMigrations();
        env = await seeders.createEnvironmentSeed(0, 'dev');
        await seeders.createConfigSeeds(env);
        await orchestratorService.start();
    });

    afterAll(async () => {
        await orchestratorService.stop();
        await db.knex.destroy();
    });

    it('should pause schedule', async () => {
        const connName = nanoid();
        const providerConfig = await configService.createProviderConfig({
            unique_key: DEMO_GITHUB_CONFIG_KEY,
            provider: 'github',
            environment_id: env.id,
            oauth_client_id: '',
            oauth_client_secret: '',
            created_at: new Date(),
            updated_at: new Date()
        });
        if (!providerConfig) throw new Error('Config not created');

        const [syncConfig] = await db.knex
            .from<SyncConfig>('_nango_sync_configs')
            .insert({
                created_at: new Date(),
                sync_name: DEMO_SYNC_NAME,
                nango_config_id: providerConfig.id!,
                file_location: '_LOCAL_FILE_',
                version: '1',
                models: ['GithubIssueDemo'],
                active: true,
                runs: 'every 5 minutes',
                input: '',
                model_schema: [],
                environment_id: env.id,
                deleted: false,
                track_deletes: false,
                type: 'sync',
                auto_start: false,
                attributes: {},
                metadata: {},
                pre_built: true,
                is_public: false,
                enabled: true
            })
            .returning('*');
        if (!syncConfig) throw new Error('Sync config not created');

        const conn = await connectionService.upsertConnection({
            connectionId: connName,
            providerConfigKey: DEMO_GITHUB_CONFIG_KEY,
            provider: 'github',
            parsedRawCredentials: {} as any,
            connectionConfig: {},
            environmentId: env.id,
            accountId: 0
        });
        const connection = conn[0]!.connection;
        const now = new Date();
        const sync = await createSync(connection.id!, syncConfig);
        if (!sync) throw new Error('Sync not created');

        const scheduleName = `environment:${env.id}:sync:${sync.id}`;
        await orchestratorService.getClient().recurring({
            name: scheduleName,
            state: 'STARTED',
            startsAt: now,
            frequencyMs: 3_600_000,
            groupKey: 'my-group',
            retry: { max: 0 },
            timeoutSettingsInSecs: {
                createdToStarted: 60,
                startedToCompleted: 60,
                heartbeat: 60
            },
            args: {
                type: 'sync',
                syncId: sync.id,
                syncName: sync.name,
                debug: false,
                connection: {
                    id: connection.id!,
                    environment_id: env.id,
                    connection_id: connection.connection_id,
                    provider_config_key: 'github'
                }
            }
        });
        const scheduleBefore = await orchestratorService.getClient().searchSchedules({ scheduleNames: [scheduleName], limit: 1 });
        expect(scheduleBefore.unwrap()[0]?.state).toBe('STARTED');
        //
        // First execution, the sync is recent, nothing happen
        await exec({ orchestrator });
        const after1 = await orchestratorService.getClient().searchSchedules({ scheduleNames: [scheduleName], limit: 1 });
        expect(after1.unwrap()[0]?.state).toBe('STARTED');
        //
        // sync updated_at is set to 2 days ago
        await db.knex.from('_nango_syncs').update({ updated_at: new Date(Date.now() - 86400 * 2 * 1000) });

        // Next execution, the sync is old, it should be paused
        await exec({ orchestrator });
        const after2 = await orchestratorService.getClient().searchSchedules({ scheduleNames: [scheduleName], limit: 1 });
        expect(after2.unwrap()[0]?.state).toBe('PAUSED');
    });
});
