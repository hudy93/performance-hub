/**
 * Script creates a prs.json file
 * How to run?
 * node prs.js githubUsername fromDate toDate
 * example:
 * node prs.js slaven3kopic 2024-04-01 2024-07-01
 * node prs.js Simonerus 2026-01-01 2026-02-28
 */

const {execSync} = require("child_process");
const {writeFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync} = require("fs");
const {resolve} = require("path");


class Performance {
  teamMember = process.argv[2];
  startDatetime = new Date(process.argv[3]);
  endDatetime = new Date(process.argv[4]);
  dist = `./reports/${this.teamMember}`;

  data = {
    teamMember: this.teamMember,
    repositoriesCount: 0,
    repositories: [],
    pullRequests: [],
    pullRequestsCount: 0,
    reviewsCount: 0,
    reviewedPullRequests: []
  };

  constructor() {
    this.generateDataForTimePeriod();
    this.updateProgress();
  }

  getPullRequests(option) {
    const pulls = [];
    let pullsLog;
    try {
      const searchQuery = `is:merged is:pr user:collaborationFactory merged:${this.startDatetime.toISOString()}..${this.endDatetime.toISOString()} ${option}:${this.teamMember}`;
      console.log(`Search query:`, searchQuery);
      pullsLog = execSync(`gh search prs --limit 500 --json repository,url ${searchQuery}`);
    } catch (e) {
      console.log(`No PRs in time frame`);
    }

    if (pullsLog && pullsLog.toString()) {
      pulls.push(...JSON.parse(pullsLog.toString()));
    }
    return pulls;
  }

  generateDataForTimePeriod() {

    console.log(`Creating logs for ${this.teamMember}`);
    console.log(`Period between months: ${this.startDatetime.getMonth() + 1}. and ${this.endDatetime.getMonth() + 1}.`);

    const assignedPullRequests = this.getPullRequests('assignee');
    const reviewedPullRequests = this.getPullRequests('reviewed-by');

    const reposList = assignedPullRequests.reduce((acc, pr) => {
      if (!acc.includes(pr.repository.name)) {
        acc.push(pr.repository.name);
      }
      return acc;
    }, []);

    this.data.repositories = reposList;
    this.data.repositoriesCount = reposList.length;
    this.data.pullRequests = assignedPullRequests.map(pr => pr.url);
    this.data.pullRequestsCount = assignedPullRequests.length;
    this.data.reviewsCount = reviewedPullRequests.length;
    this.data.reviewedPullRequests = reviewedPullRequests.map(pr => pr.url);

    const timePeriod = `${this.startDatetime.getMonth() + 1}-${this.startDatetime.getFullYear()}-to-${this.endDatetime.getMonth() + 1}-${this.endDatetime.getFullYear()}`;

    if (!existsSync(this.dist)) {
      mkdirSync(this.dist);
    }

    writeFileSync(`${this.dist}/${timePeriod}.json`, JSON.stringify(this.data, null, 2));
  }

  updateProgress() {
    console.log('Updating progress data...');

    const files = readdirSync(this.dist);
    const progressFile = resolve(`${this.dist}/progress.json`);

    let progress = [];

    if (existsSync(progressFile)) {
      rmSync(progressFile, { recursive: true })
    }

    files.forEach(file => {
      if (!file.includes('progress')) {
        const dataFile = resolve(this.dist, file);
        const data = JSON.parse(readFileSync(dataFile, { encoding: 'utf8'}));
        const timePeriod = file.split('.json')[0];
        const timePeriodSplit = timePeriod.split('-to-');
        const timePeriodStart = timePeriodSplit[0];
        const timePeriodEnd = timePeriodSplit[1];
        const timePeriodStartSplit = timePeriodStart.split('-');
        const timePeriodEndSplit = timePeriodEnd.split('-');
        const startMonth = timePeriodStartSplit[0];
        const startYear = timePeriodStartSplit[1];
        const endMonth = timePeriodEndSplit[0];
        const endYear = timePeriodEndSplit[1];
        if (!progress.some(item => item.timePeriod === timePeriod)) {
          progress.push({
            timePeriod: timePeriod,
            startDate: new Date(startYear, startMonth, 0),
            endDate: new Date(endYear, endMonth, 0),
            pullRequestsCount: data.pullRequestsCount,
            reviewsCount: data.reviewsCount,
            repositoriesCount: data.repositoriesCount,
          });
        }
      }

    });

    progress.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

    writeFileSync(progressFile, JSON.stringify(progress, null, 2));
  }
}

new Performance();


