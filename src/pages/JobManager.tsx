import { Box, Grid } from '@mui/material';
import { ContextPanel } from '../components/dashboard/ContextPanel';
import { JobsList } from '../components/dashboard/JobsList';
import { JobDetails } from '../components/dashboard/JobDetails';
import { ResponseCard } from '../components/dashboard/ResponseCard';
import { CreatePluginModal } from '../components/dashboard/CreatePluginModal';

export default function JobManager({
  sessions,
  plugins,
  jobs,
  pluginId,
  jobId,
  jobDesc,
  pluginInfo,
  schema,
  env,
  result,
  submitting,
  isNewJobMode,
  formData,
  createPluginModalOpen,
  setCreatePluginModalOpen,
  setJobDesc,
  setResult,
  loadSchema,
  handleChangeJob,
  handleChangeSession
}) {
  return (
    <>
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <ContextPanel
              sessions={sessions}
              plugins={plugins}
              ctx={window.ctx}
              pluginId={pluginId}
              onSessionChange={handleChangeSession}
              onPluginChange={loadSchema}
              isLoading={submitting}
            />

            {typeof pluginId === 'number' && (
              <JobsList
                jobs={jobs}
                selectedJobId={jobId}
                pluginPackage={pluginInfo?.package}
                onSelectJob={handleChangeJob}
                isNewJobMode={isNewJobMode}
                disabled={!schema}
              />
            )}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          <JobDetails
            jobId={jobId}
            jobDesc={jobDesc}
            pluginPackage={pluginInfo?.package}
            formData={formData}
            env={env}
            schema={schema}
            onDescChange={setJobDesc}
            isSubmitting={submitting}
          />

          {result && (
            <ResponseCard result={result} onClose={() => setResult(null)} />
          )}
        </Grid>
      </Grid>

      <CreatePluginModal
        open={createPluginModalOpen}
        onClose={() => setCreatePluginModalOpen(false)}
      />
    </>
  );
}
