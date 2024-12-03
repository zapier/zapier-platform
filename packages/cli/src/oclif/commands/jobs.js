const { chain } = require('lodash');

const BaseCommand = require('../ZapierBaseCommand');
const { listMigrations } = require('../../utils/api');
const { buildFlags } = require('../buildFlags');

const getVersion = (versionStr) => versionStr.split('@')[1];
const getIsoDate = (unixTs) => (unixTs ? new Date(unixTs).toISOString() : '-');

class JobsCommand extends BaseCommand {
  async perform() {
    /**
     * Migrations and Jobs are used somewhat interchangeably here.
     * Migrations represents the collection of promotion and migration
     * background "jobs" that were recently executed on this app.
     */

    this.startSpinner('Loading jobs');
    const { migrations } = await listMigrations();
    this.stopSpinner();

    const jobs = chain(migrations)
      .filter(
        (migration) =>
          migration.job_kind === 'migrate' || migration.job_kind === 'promote',
      )
      .map((migration) => {
        const job = {
          app_title: migration.app_title,
          job_id: migration.job_id,
          job_kind: migration.job_kind,
          job_stage: migration.job_stage,
          version_from: getVersion(migration.from_selected_api),
          version_to: getVersion(migration.to_selected_api),
          started_at: getIsoDate(migration.started_at),
          updated_at: getIsoDate(migration.updated_at),
        };

        if (migration.progress) {
          job.overall_progress =
            parseFloat(migration.progress.overall_progress * 100).toFixed(2) +
            '%';

          if (migration.progress.current_step) {
            job.current_step = migration.progress.current_step.name;
            job.current_progress = `${migration.progress.current_step.finished_points} finished, ${migration.progress.current_step.skipped_points} skipped, ${migration.progress.current_step.estimated_points} estimated`;
            job.current_step_status = migration.progress.current_step.status;
          }
        }

        if (migration.error) {
          job.error_message = migration.error.message;
        }

        return job;
      })
      .sortBy((migration) => migration.started_at)
      .value();

    this.logTable({
      rows: jobs,
      headers: [
        ['App Title', 'app_title'],
        ['Job Id', 'job_id'],
        ['Job Kind', 'job_kind'],
        ['Job Stage', 'job_stage'],
        ['From', 'version_from'],
        ['To', 'version_to'],
        ['Current Step', 'current_step'],
        ['Current Progress', 'current_progress'],
        ['Current Step Status', 'current_step_status'],
        ['Progress', 'overall_progress'],
        ['Started At', 'started_at'],
        ['Updated At', 'updated_at'],
        ['Errors', 'error_message'],
      ],
      emptyMessage:
        'No recent migration or promotion jobs found. Try `zapier history` if you see older jobs.',
    });
  }
}

JobsCommand.examples = ['zapier jobs'];
JobsCommand.description = `Lists ongoing migration or promotion jobs for the current integration.

A job represents a background process that will be queued up when users execute a "migrate" or "promote" command for the current integration.

Each job will be added to the end of a queue of "promote" and "migration" jobs where the "Job Stage" will then be initialized with "requested".

Job stages will then move to "estimating", "in_progress" and finally one of four "end" stages: "complete", "aborted", "errored" or "paused".

Job times will vary as it depends on the size of the queue and how many users your integration has.

Jobs are returned from oldest to newest.
`;

JobsCommand.flags = buildFlags({ opts: { format: true } });
JobsCommand.skipValidInstallCheck = true;

module.exports = JobsCommand;
