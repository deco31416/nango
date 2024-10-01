import tracer from 'dd-trace';

tracer.init({
    service: 'nango-scheduler'
});
tracer.use('pg', {
    service: (params: { database: string }) => `postgres-${params.database}`
});
tracer.use('dns', {
    enabled: false
});
