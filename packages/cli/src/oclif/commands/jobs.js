const BaseCommand = require('../ZapierBaseCommand');

const { listMigrations } = require('../../utils/api');
const { chain } = require('lodash');

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
      .map((migration) => {
        const stepTotals = {
          finished: 0,
          estimating: 0,
          skipped: 0,
        };
        for (const step of migration.progress.steps) {
          if (step.status === 'success') {
            stepTotals.finished++;
          } else if (step.status === 'in_progress') {
            stepTotals.estimating++;
          } else if (step.status === 'skipped') {
            stepTotals.skipped++;
          }
        }
        return {
          app_title: migration.app_title,
          job_id: migration.job_id,
          job_kind: migration.job_kind,
          version_from: getVersion(migration.from_selected_api),
          version_to: getVersion(migration.to_selected_api),
          current_step: migration.progress.current_step.name,
          current_progress: `${stepTotals.finished} finished, ${stepTotals.estimating} skipped, ${stepTotals.skipped} estimated`,
          current_step_status: migration.progress.current_step.status,
          overall_progress:
            parseFloat(migration.progress.overall_progress * 100).toFixed(2) +
            '%',
          updated_at: migration.updated_at,
        };
      })
      .sortBy((migration) => migration.updated_at, 'asc')
      .value();

    this.logTable({
      rows: jobs,
      headers: [
        ['App Title', 'app_title'],
        ['Job Id', 'job_id'],
        ['Job Kind', 'job_kind'],
        ['From', 'version_from'],
        ['To', 'version_to'],
        ['Current Step', 'current_step'],
        ['Current Progress', 'current_progress'],
        ['Current Step Status', 'current_step_status'],
        ['Progress', 'overall_progress'],
        ['Last Updated', 'updated_at'],
      ],
      emptyMessage: 'No recent migration or promotion jobs found',
      formatOverride: 'row',
    });
  }
}

JobsCommand.examples = ['zapier jobs'];
JobsCommand.description =
  'Lists apps that have ongoing migration or promotion jobs.';

module.exports = JobsCommand;
