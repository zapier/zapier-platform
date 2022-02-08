const { chain } = require('lodash');

const BaseCommand = require('../ZapierBaseCommand');
const { listMigrations } = require('../../utils/api');
const { buildFlags } = require('../buildFlags');

const getVersion = (versionStr) => versionStr.split('@')[1];

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
          migration.job_kind === 'migrate' || migration.job_kind === 'promote'
      )
      .map((migration) => ({
        app_title: migration.app_title,
        job_id: migration.job_id,
        job_kind: migration.job_kind,
        job_stage: migration.job_stage,
        version_from: getVersion(migration.from_selected_api),
        version_to: getVersion(migration.to_selected_api),
        current_step: migration.progress.current_step.name,
        current_progress: `${migration.progress.current_step.finished_points} finished, ${migration.progress.current_step.skipped_points} skipped, ${migration.progress.current_step.estimated_points} estimated`,
        current_step_status: migration.progress.current_step.status,
        overall_progress:
          parseFloat(migration.progress.overall_progress * 100).toFixed(2) +
          '%',
        updated_at: migration.updated_at,
        error_message: migration.error ? migration.error.message : '-',
      }))
      .sortBy((migration) => migration.updated_at, 'asc')
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
        ['Last Updated', 'updated_at'],
        ['Errors', 'error_message'],
      ],
      emptyMessage: 'No recent migration or promotion jobs found',
    });
  }
}

JobsCommand.examples = ['zapier jobs'];
JobsCommand.description = `Lists ongoing migration or promotion jobs for the current integration.

A job represents a background process that will be queued up when users execute a "migrate" or "promote" command for the current integration.

Each job will be added to the end of a queue of "promote" and "migration" jobs where the "Job Stage" will then be initialized with "requested". 

Job stages will then move to "estimating", "in_progress" and finally one of four "end" stages: "complete", "aborted", "errored" or "paused".

Job times will vary as it depends on the size of the queue.

Jobs are returned from oldest to newest.
`;

JobsCommand.flags = buildFlags({ opts: { format: true } });
module.exports = JobsCommand;
